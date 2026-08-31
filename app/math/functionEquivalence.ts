import type { MathNode } from "./grading.ts";

// Bounded symbolic arithmetic, not a numerical spot-check acceptance test.
// Function calls are atoms with normalized arguments; rational arithmetic can
// distribute, collect and cancel them on the prompt's stated real domain.
// This is expression equivalence, not a certification of all domain restrictions.
type P = Map<string, number>;
type R = { n: P; d: P };
type Factors = [string, number][];
const constant = (v: number): P => {
  if (!Number.isFinite(v)) throw Error("The expression is not finite.");
  return new Map(v === 0 ? [] : [["[]", v]]);
};
const one = (): R => ({ n: constant(1), d: constant(1) });
const atom = (name: string, exponent = 1): R => ({ n: new Map([[JSON.stringify([[name, exponent]]), 1]]), d: constant(1) });
function plus(a: P, b: P, sign = 1): P {
  const out = new Map(a);
  for (const [k, v] of b) { const sum = (out.get(k) ?? 0) + sign * v; if (!Number.isFinite(sum)) throw Error("Expression is too large."); if (sum === 0) out.delete(k); else out.set(k, sum); }
  if (out.size > 256) throw Error("This expression is beyond the symbolic checker's size limit.");
  return out;
}
function times(a: P, b: P): P {
  if (a.size * b.size > 4096) throw Error("This expression is beyond the symbolic checker's size limit.");
  let out: P = new Map();
  for (const [ka, va] of a) for (const [kb, vb] of b) {
    const factors = new Map<string, number>(JSON.parse(ka));
    for (const [name, power] of JSON.parse(kb) as Factors) factors.set(name, (factors.get(name) ?? 0) + power);
    const entries = [...factors].filter(([, p]) => p !== 0).sort(([a], [b]) => a.localeCompare(b));
    out = plus(out, new Map([[JSON.stringify(entries), va * vb]]));
  }
  return out;
}
function operation(a: R, b: R, op: string): R {
  if (!a.d.size || !b.d.size || (op === "/" && !b.n.size)) throw Error("An expression cannot divide by zero.");
  if (op === "+" || op === "-") return { n: plus(times(a.n,b.d),times(b.n,a.d),op === "+" ? 1 : -1), d: times(a.d,b.d) };
  return op === "*" ? {n:times(a.n,b.n),d:times(a.d,b.d)} : {n:times(a.n,b.d),d:times(a.d,b.n)};
}
function serialize(r: R) {
  if (!r.d.size) throw Error("An expression cannot divide by zero.");
  const divisor = [...r.d].sort(([a],[b])=>a.localeCompare(b))[0][1];
  const encode = (p: P) => [...p].filter(([,v])=>v!==0).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,Number((v/divisor).toPrecision(14))]);
  return JSON.stringify([encode(r.n),encode(r.d)]);
}
function scalar(r: R): number | undefined {
  if ([...r.n.keys(),...r.d.keys()].some(k=>k!=="[]")) return;
  const d=r.d.get("[]")??0;if(!d)throw Error("An expression cannot divide by zero.");
  return (r.n.get("[]")??0)/d;
}
function power(r: R, p: number): R {
  if (!Number.isFinite(p) || Math.abs(p)>16) throw Error("Use powers between -16 and 16 in symbolic answers.");
  const c=scalar(r);
  if(c!==undefined)return {n:constant(c**p),d:constant(1)};
  if(p<0)return operation(one(),power(r,-p),"/");
  // Distribute integer powers; keep the fractional part as a shared root atom.
  const integer=Math.floor(p),fraction=p-integer;
  let out=one();for(let i=0;i<integer;i++)out=operation(out,r,"*");
  if(fraction) {
    // Extract only a positive constant from a radical. This accepts e.g.
    // 2sqrt(1-x²/4) and sqrt(4-x²) without assuming sqrt(x²)=x.
    let root=r,scale=1;
    if(r.d.size===1&&r.d.has("[]")) {
      const denominator=r.d.get("[]")!;
      const normalized=[...r.n].map(([k,v])=>[k,v/denominator] as const).sort(([a],[b])=>a.localeCompare(b));
      scale=Math.abs(normalized[0][1]);
      root={n:new Map(normalized.map(([k,v])=>[k,v/scale])),d:constant(1)};
    }
    const isX=root.d.size===1&&root.d.get("[]")===1&&root.n.size===1&&root.n.get('[["x",1]]')===1;
    const radical=operation({n:constant(scale**fraction),d:constant(1)},atom(isX?"x":`power:${serialize(root)}`,fraction),"*");
    out=operation(out,radical,"*");
  }
  return out;
}
// Multiplying two copies of the same square root recovers its radicand.
// The converse sqrt(u²)=u is intentionally NOT applied (it would lose |u|).
function rootReduce(p:P,depth=0):P {
  if(depth>32)throw Error("This expression exceeds the symbolic nesting limit.");
  let out:P=new Map();
  for(const [key,value] of p) {
    const factors=JSON.parse(key) as Factors;
    const target=factors.find(([name,power])=>name.startsWith("power:")&&power>=1);
    if(!target){out=plus(out,new Map([[key,value]]));continue;}
    const [numerator,denominator]=JSON.parse(target[0].slice(6)) as [Array<[string,number]>,Array<[string,number]>];
    if(denominator.length!==1||denominator[0][0]!=="[]"||denominator[0][1]!==1){out=plus(out,new Map([[key,value]]));continue;}
    const rest=new Map(factors);rest.set(target[0],target[1]-1);
    const remainder=new Map([[JSON.stringify([...rest].filter(([,p])=>p!==0)),value]]);
    out=plus(out,rootReduce(times(remainder,new Map(numerator)),depth+1));
  }
  return out;
}
function trig(name:string,arg:R):R {
  const signCoefficient=[...arg.n].sort(([a],[b])=>a.localeCompare(b))[0]?.[1]??0;
  if(signCoefficient<0) {
    const positive=operation({n:constant(-1),d:constant(1)},arg,"*");
    return operation({n:constant(name==="sin"?-1:1),d:constant(1)},trig(name,positive),"*");
  }
  // Normalize the common double-angle identity only for bounded even-integer
  // polynomial inputs. This cannot recurse indefinitely on arbitrary fractions.
  if(arg.d.size===1&&arg.d.get("[]")===1&&arg.n.size&&[...arg.n.values()].every(v=>Number.isInteger(v)&&v%2===0&&Math.abs(v)<=16)) {
    const half={n:new Map([...arg.n].map(([k,v])=>[k,v/2])),d:constant(1)};
    const sin=trig("sin",half),cos=trig("cos",half);
    return name==="sin"?operation({n:constant(2),d:constant(1)},operation(sin,cos,"*"),"*"):operation(operation({n:constant(2),d:constant(1)},operation(cos,cos,"*"),"*"),one(),"-");
  }
  return atom(`${name}:${serialize(arg)}`);
}
// Reduce the common Pythagorean identity without numerical guesses.
function trigReduce(p: P): P {
  let out: P=new Map();
  for(const [key,value] of p) {
    const factors=JSON.parse(key) as Factors;
    const target=factors.find(([name,power])=>name.startsWith("sin:")&&power>=2);
    if(!target) {out=plus(out,new Map([[key,value]]));continue;}
    const rest=new Map(factors);rest.set(target[0],target[1]-2);
    const remainder=new Map([[JSON.stringify([...rest].filter(([,p])=>p!==0)),value]]);
    const cos=atom(`cos:${target[0].slice(4)}`,2).n;
    out=plus(out,trigReduce(plus(remainder,times(remainder,cos),-1)));
  }
  return out;
}
export function equivalentFunctions(a: MathNode,b: MathNode,evaluate:(node:MathNode,x?:number)=>number): boolean | null {
  const walk=(node:MathNode):R=>{
    if(node.kind==="number")return {n:constant(node.value),d:constant(1)};
    if(node.kind==="variable")return atom("x");
    if(node.kind==="unary")return operation({n:constant(node.op==="-"?-1:1),d:constant(1)},walk(node.value),"*");
    if(node.kind==="binary") {
      if(node.op!=="^")return operation(walk(node.left),walk(node.right),node.op);
      const exponent=walk(node.right),value=scalar(exponent);
      if(value!==undefined)return power(walk(node.left),value);
      const base=scalar(walk(node.left));
      if(base===Math.E)return atom(`exp:${serialize(exponent)}`);
      if(base!==undefined&&base>0)return atom(`exp:${serialize(operation({n:constant(Math.log(base)),d:constant(1)},exponent,"*"))}`);
      throw Error("Variable-base variable-exponent answers are not supported by this symbolic checker.");
    }
    const arg=walk(node.value),value=scalar(arg);
    if(value!==undefined)return {n:constant(evaluate(node)),d:constant(1)};
    if(node.name==="sqrt")return power(arg,0.5);
    const key=serialize(arg);
    if(node.name==="sin"||node.name==="cos")return trig(node.name,arg);
    if(node.name==="sec")return operation(one(),trig("cos",arg),"/");
    if(node.name==="csc")return operation(one(),trig("sin",arg),"/");
    if(node.name==="tan")return operation(trig("sin",arg),trig("cos",arg),"/");
    if(node.name==="cot")return operation(trig("cos",arg),trig("sin",arg),"/");
    return atom(`${node.name}:${key}`);
  };
  const x=walk(a),y=walk(b);
  if(!trigReduce(rootReduce(x.d)).size||!trigReduce(rootReduce(y.d)).size)throw Error("An expression cannot divide by zero.");
  const left=trigReduce(rootReduce(times(x.n,y.d))),right=trigReduce(rootReduce(times(y.n,x.d)));
  const keys=new Set([...left.keys(),...right.keys()]);
  if([...keys].every(k=>Math.abs((left.get(k)??0)-(right.get(k)??0))<=1e-10*Math.max(1,Math.abs(left.get(k)??0),Math.abs(right.get(k)??0))))return true;
  // A differing numerical value can disprove equality, never prove it.
  for(const input of [-3.17,-1.31,-0.43,0.23,0.71,1.37,2.19,4.61]) {
    try {const av=evaluate(a,input),bv=evaluate(b,input);if(Number.isFinite(av)&&Number.isFinite(bv)&&Math.abs(av-bv)>1e-7*Math.max(1,Math.abs(av),Math.abs(bv)))return false;}catch{/* outside a real domain */}
  }
  return null;
}

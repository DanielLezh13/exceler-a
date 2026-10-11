import { javaLanguage } from "@codemirror/lang-java";

type Node = ReturnType<typeof javaLanguage.parser.parse>["topNode"];
type Primitive = "int" | "double" | "long" | "char" | "boolean" | "String";
type Kind = Primitive | "File" | "Scanner" | "PrintWriter" | "void";
type Reader = { kind: "reader"; input: string; position: number; closed: boolean; file: boolean };
type Writer = { kind: "writer"; path: string; closed: boolean };
type Value = { type: Kind; value: number | boolean | string | Reader | Writer; constant?: boolean; reference?: number };
export type ClassroomSample = {
  input?: string; files?: Record<string, string>; random?: number[];
  values?: Record<string, number | string | boolean>;
  output?: string; outputFiles?: Record<string, string>; result?: number | string | boolean;
};
export type ClassroomSpec = {
  className?: string; types?: Record<string, Primitive>; resultVariable?: string;
  numericOutput?: boolean; numericTolerance?: number; requireClose?: boolean; requiredCalls?: string[];
};
function fail(): never { throw Error("Outside the supported classroom Java subset"); }
const children = (node: Node): Node[] => {
  const result: Node[] = [];
  for (let c = node.firstChild; c; c = c.nextSibling) if (!["LineComment", "BlockComment"].includes(c.name)) result.push(c);
  return result;
};
const near = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) <= 1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const decode = (literal: string) => literal.slice(1,-1).replace(/\\u([0-9a-fA-F]{4})|\\([btnrf'"\\])/g, (_,hex,escape) => hex ? String.fromCharCode(parseInt(hex,16)) : ({b:"\b",t:"\t",n:"\n",r:"\r",f:"\f","'":"'",'"':'"',"\\":"\\"} as Record<string,string>)[escape]);
const trimJava=(value:string)=>{let from=0,to=value.length;while(from<to&&value.charCodeAt(from)<=32)from++;while(to>from&&value.charCodeAt(to-1)<=32)to--;return value.slice(from,to);};

/** A bounded interpreter for the taught, loop-free classroom tools.
 * Files and random values are fixtures, never real browser/host resources.
 * No eval, network, filesystem access, user-defined methods, or loops.
 */
export function validateClassroomJava(answer: string, spec: ClassroomSpec, samples: ClassroomSample[]): boolean {
  if (!answer.trim() || answer.length>16000 || !samples.length) return false;
  try {
    let source=answer, block: Node | null=null;
    if (spec.className) {
      const tree=javaLanguage.parser.parse(source);
      tree.iterate({enter:n=>{if(n.type.isError)fail();}});
      const top=children(tree.topNode),classes=top.filter(n=>n.name==="ClassDeclaration");
      if(classes.length!==1||top.some(n=>!["ClassDeclaration","ImportDeclaration"].includes(n.name)))return false;
      const cls=classes[0],body=cls.getChild("ClassBody"),methods=body?.getChildren("MethodDeclaration")??[];
      if(!new RegExp(`^\\s*public\\s+class\\s+${spec.className}\\b`).test(source.slice(cls.from,cls.to))||methods.length!==1)return false;
      const method=methods[0];block=method.getChild("Block");
      const header=source.slice(method.from,block?.from??method.to);
      if(!/^\s*public\s+static\s+void\s+main\s*\(\s*String\s*(?:\[\s*\]\s*[A-Za-z_$][\w$]*|[A-Za-z_$][\w$]*\s*\[\s*\])\s*\)/.test(header))return false;
      if(!body||children(body).some(n=>!["{","}","MethodDeclaration"].includes(n.name)))return false;
      const imports=top.filter(n=>n.name==="ImportDeclaration").map(n=>source.slice(n.from,n.to));
      const imported=(name:string,pkg:string)=>imports.some(s=>new RegExp(`^import\\s+${pkg.replace(/\./g,"\\.")}\\.(?:${name}|\\*)\\s*;$`).test(s.trim()));
      const typeNames=new Set<string>();tree.iterate({enter:n=>{if(n.name==="TypeName")typeNames.add(source.slice(n.from,n.to));}});
      if(typeNames.has("Scanner")&&!imported("Scanner","java.util"))return false;
      if(typeNames.has("File")&&!imported("File","java.io"))return false;
      if(typeNames.has("PrintWriter")&&!imported("PrintWriter","java.io"))return false;
      if(/new\s+(?:java\.io\.)?(?:File|PrintWriter)\s*\(/.test(source)&&(!/throws\s+(?:java\.io\.)?(?:FileNotFoundException|IOException|Exception)\b/.test(header)||(/\bFileNotFoundException\b/.test(header)&&!imported("FileNotFoundException","java.io"))))return false;
    } else {
      source=`class Check { void run() {${answer}}}`;
      const tree=javaLanguage.parser.parse(source);
      tree.iterate({enter:n=>{if(n.type.isError)fail();}});
      block=tree.topNode.getChild("ClassDeclaration")?.getChild("ClassBody")?.getChild("MethodDeclaration")?.getChild("Block")??null;
    }
    if(!block)return false;
    const statements=children(block).slice(1,-1);
    const forbidden=new Set(["ForStatement","EnhancedForStatement","WhileStatement","DoStatement","TryStatement","SwitchStatement","LambdaExpression","ArrayCreationExpression","ThrowStatement"]);
    const text=(n:Node)=>source.slice(n.from,n.to);
    const calls=new Set<string>();
    const checkNodes=(n:Node)=>{if(forbidden.has(n.name))fail();if(n.name==="MethodInvocation"){const p=children(n);calls.add(`${text(p[0])}.${text(n.getChild("MethodName")??fail())}`);}for(const c of children(n))checkNodes(c);};checkNodes(block);
    if(spec.requiredCalls?.some(call=>!calls.has(call)))return false;
    for(const sample of samples){
      let steps=0,nextReference=1,randomIndex=0,returned=false,clock=0,lastKeyboardRead=0;
      const vars=new Map<string,{type:Kind;value:Value|null}>(),literals=new Map<string,number>();
      const files={...sample.files},readers:Reader[]=[],writers:Writer[]=[],writes:Array<{text:string;at:number}>=[];
      const string=(value:string,constant=false,reference?:number):Value=>{
        if(reference===undefined){if(constant){if(!literals.has(value))literals.set(value,nextReference++);reference=literals.get(value);}else reference=nextReference++;}
        return {type:"String",value,constant,reference};
      };
      const num=(v:Value)=>["int","long","double","char"].includes(v.type)&&typeof v.value==="number"?v.value:fail();
      const bool=(v:Value)=>v.type==="boolean"&&typeof v.value==="boolean"?v.value:fail();
      const str=(v:Value)=>v.type==="String"&&typeof v.value==="string"?v.value:fail();
      const printed=(v:Value)=>v.type==="char"?String.fromCharCode(num(v)):v.type==="double"&&Number.isInteger(v.value)?`${v.value}.0`:typeof v.value!=="object"?String(v.value):fail();
      const convert=(v:Value,type:Kind,cast=false):Value=>{
        if(v.type===type)return {...v,constant:false};
        if(type==="double"&&["int","long","char"].includes(v.type))return {type,value:num(v)};
        if(type==="long"&&["int","char"].includes(v.type))return {type,value:num(v)};
        if(type==="int"&&v.type==="char")return {type,value:num(v)};
        if(cast&&type==="int")return {type,value:Math.max(-2147483648,Math.min(2147483647,Math.trunc(num(v))))};
        if(type==="char"&&(cast||(v.type==="int"&&v.constant&&num(v)>=0&&num(v)<=65535)))return {type,value:((Math.trunc(num(v))%65536)+65536)%65536};
        return fail();
      };
      for(const [name,type] of Object.entries(spec.types??{})){
        const raw=sample.values?.[name];if(raw===undefined)fail();
        const value=type==="String"?string(String(raw)):type==="char"?{type,value:typeof raw==="string"?raw.charCodeAt(0):Number(raw)}:{type,value:raw};
        vars.set(name,{type,value:value as Value});
      }
      const argsOf=(n:Node)=>children(n.getChild("ArgumentList")??fail()).slice(1,-1).filter(c=>text(c)!==",");
      const numericType=(a:Value,b:Value):Primitive=>a.type==="double"||b.type==="double"?"double":a.type==="long"||b.type==="long"?"long":"int";
      const binary=(a:Value,op:string,b:Value):Value=>{
        if(op==="^"&&a.type==="boolean"&&b.type==="boolean")return {type:"boolean",value:bool(a)!==bool(b)};
        if(op==="=="||op==="!="){
          if(a.type!==b.type&&!(["int","double","long","char"].includes(a.type)&&["int","double","long","char"].includes(b.type)))fail();
          const same=a.type==="String"?a.reference===b.reference:a.value===b.value;
          return {type:"boolean",value:op==="=="?same:!same};
        }
        if(["<",">","<=",">="].includes(op)){const x=num(a),y=num(b);return {type:"boolean",value:op==="<"?x<y:op===">"?x>y:op==="<="?x<=y:x>=y};}
        if(op==="+"&&(a.type==="String"||b.type==="String"))return string(printed(a)+printed(b),Boolean(a.constant&&b.constant));
        if(!["+","-","*","/","%"].includes(op))fail();
        const type=numericType(a,b),x=num(a),y=num(b);
        if(type!=="double"&&["/","%"].includes(op)&&y===0)fail();
        let value=op==="+"?x+y:op==="-"?x-y:op==="*"?x*y:op==="/"?x/y:x%y;
        if(type==="int")value=Math.trunc(value)|0;
        return {type,value,constant:Boolean(a.constant&&b.constant)};
      };
      const format=(fmt:string,values:Value[])=>{
        let i=0;
        const result=fmt.replace(/%(?:(\d{1,2}))?(?:\.(\d{1,2}))?([sdfcn%])/g,(_,width,precision,kind)=>{
          if(kind==="%")return "%";if(kind==="n")return "\n";
          const v=values[i++];if(!v)fail();
          let out=kind==="s"?printed(v):kind==="c"?v.type==="char"?printed(v):String.fromCharCode(num(v)):kind==="d"?["int","long"].includes(v.type)?String(num(v)):fail():v.type==="double"?num(v).toFixed(precision===undefined?6:Number(precision)):fail();
          if(Number(width)>40||Number(precision)>10)fail();
          if(width)out=out.padStart(Number(width));return out;
        });if(i!==values.length||/%[^%]/.test(result)&&fmt===result)fail();return result;
      };
      const evaluate=(n:Node,depth=0):Value=>{
        if(++steps>1800||depth>70)fail();const p=children(n),next=(c:Node)=>evaluate(c,depth+1);
        if(n.name==="Identifier")return {...(vars.get(text(n))?.value??fail()),constant:false};
        if(n.name==="StringLiteral")return string(decode(text(n)),true);
        if(n.name==="CharacterLiteral"){const value=decode(text(n));if(value.length!==1)fail();return {type:"char",value:value.charCodeAt(0),constant:true};}
        if(n.name==="BooleanLiteral")return {type:"boolean",value:text(n)==="true",constant:true};
        if(["IntegerLiteral","FloatingPointLiteral"].includes(n.name)){
          const raw=text(n).replace(/_/g,"");if(!/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[dDlL]?$/.test(raw))fail();
          const type=/[lL]$/.test(raw)?"long":n.name==="FloatingPointLiteral"||/[dD]$/.test(raw)?"double":"int";
          const value=Number(raw.replace(/[dDlL]$/,""));if(!Number.isFinite(value)||(type==="int"&&value>2147483647))fail();return {type,value,constant:true};
        }
        if(n.name==="ParenthesizedExpression")return next(p[1]);
        if(n.name==="FieldAccess"&&text(p[0])==="Math"&&["PI","E"].includes(text(p[2])))return {type:"double",value:text(p[2])==="PI"?Math.PI:Math.E,constant:true};
        if(n.name==="CastExpression")return convert(next(p[3]),text(p[1]) as Kind,true);
        if(n.name==="UnaryExpression"){
          const op=text(p[0]),v=next(p[1]);if(op==="!")return {type:"boolean",value:!bool(v)};
          if(!["+","-"].includes(op))fail();const type=v.type==="char"?"int":v.type;return {type,value:op==="-"?-num(v):num(v),constant:v.constant};
        }
        if(n.name==="UpdateExpression"){
          const target=p.find(c=>c.name==="Identifier"),name=target?text(target):fail(),v=vars.get(name);if(!v?.value)fail();
          const old=v.value,delta=text(n).includes("++")?1:-1;v.value=convert({type:old.type,value:num(old)+delta},v.type);
          return p[0].name==="Identifier"?old:v.value;
        }
        if(n.name==="BinaryExpression"){
          // Lezer places % below +/-. Reconstruct every unparenthesized
          // binary group with Java precedence before evaluating it.
          const operands:Node[]=[],operators:string[]=[];
          const flatten=(node:Node)=>{const parts=children(node);if(node.name==="BinaryExpression"){flatten(parts[0]);operators.push(text(parts[1]));flatten(parts[2]);}else operands.push(node);};flatten(n);
          const precedence:Record<string,number>={"||":1,"&&":2,"^":4,"==":6,"!=":6,"<":7,">":7,"<=":7,">=":7,"+":9,"-":9,"*":10,"/":10,"%":10};
          let at=0;
          const parse=(minimum:number):(()=>Value)=>{
            const operand=operands[at++];let expression=()=>next(operand);
            while(at<=operators.length){const op=operators[at-1],rank=precedence[op];if(rank===undefined)fail();if(rank<minimum)break;const left=expression,right=parse(rank+1);
              expression=()=>{const a=left();if(op==="&&")return {type:"boolean",value:bool(a)&&bool(right())};if(op==="||")return {type:"boolean",value:bool(a)||bool(right())};return binary(a,op,right());};
            }return expression;
          };
          return parse(0)();
        }
        if(n.name==="TernaryExpression")return next(bool(next(p[0]))?p[2]:p[4]);
        if(n.name==="AssignmentExpression"){
          const v=vars.get(text(p[0]));if(p[0].name!=="Identifier"||!v)fail();const right=next(p[2]),op=text(p[1]);
          if(op==="=")v.value=convert(right,v.type);
          else {if(!["+=","-=","*=","/=","%="].includes(op)||!v.value)fail();const result=binary(v.value,op[0],right);v.value=v.type==="int"&&result.type==="double"?convert(result,"int",true):convert(result,v.type);}
          return v.value;
        }
        if(n.name==="ObjectCreationExpression"){
          const type=text(n.getChild("TypeName")??fail()).split(".").at(-1),argumentNodes=argsOf(n);
          const keyboard=type==="Scanner"&&argumentNodes.length===1&&text(argumentNodes[0])==="System.in";
          const args=keyboard?[]:argumentNodes.map(next);
          if(type==="File"&&args.length===1)return {type:"File",value:str(args[0])};
          if(type==="String"&&args.length===1)return string(str(args[0]));
          if(type==="PrintWriter"&&args.length===1){const path=args[0].type==="File"?String(args[0].value):str(args[0]);files[path]="";const writer:Writer={kind:"writer",path,closed:false};writers.push(writer);return {type:"PrintWriter",value:writer};}
          if(type==="Scanner"){
            let input:string,file=false;
            if(argumentNodes.length===1&&text(argumentNodes[0])==="System.in")input=sample.input??"";
            else if(args.length===1&&args[0].type==="File"){file=true;input=files[String(args[0].value)]??fail();}else return fail();
            const reader:Reader={kind:"reader",input,position:0,closed:false,file};readers.push(reader);return {type:"Scanner",value:reader};
          }return fail();
        }
        if(n.name==="MethodInvocation"){
          const receiver=p[0],method=text(n.getChild("MethodName")??fail()),argNodes=argsOf(n);
          const special=["Math","Character","System.out"].includes(text(receiver));
          const object=special?null:next(receiver),args=argNodes.map(next);
          if(text(receiver)==="Math"){
            if(method==="random"&&args.length===0){const value=sample.random?.[randomIndex++]??0.37;if(value<0||value>=1)fail();return {type:"double",value};}
            if(["min","max","pow"].includes(method)&&args.length===2){const x=num(args[0]),y=num(args[1]);return {type:method==="pow"?"double":numericType(args[0],args[1]),value:method==="pow"?Math.pow(x,y):method==="min"?Math.min(x,y):Math.max(x,y)};}
            if(args.length!==1)fail();const x=num(args[0]);
            const methods:Record<string,(x:number)=>number>={sqrt:Math.sqrt,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:x=>Math.floor(x+0.5),sin:Math.sin,cos:Math.cos,tan:Math.tan,acos:Math.acos,asin:Math.asin,atan:Math.atan,toDegrees:x=>x*180/Math.PI,toRadians:x=>x*Math.PI/180};
            if(!methods[method])fail();return {type:method==="abs"?args[0].type==="char"?"int":args[0].type:method==="round"?"long":"double",value:methods[method](x)};
          }
          if(text(receiver)==="Character"&&args.length===1){const c=String.fromCharCode(num(args[0]));if(method==="toUpperCase"||method==="toLowerCase")return {type:"char",value:(method==="toUpperCase"?c.toUpperCase():c.toLowerCase()).charCodeAt(0)};const checks:Record<string,boolean>={isDigit:/^[0-9]$/.test(c),isLetter:/^\p{L}$/u.test(c),isLetterOrDigit:/^[\p{L}\p{N}]$/u.test(c),isUpperCase:c.toUpperCase()===c&&c.toLowerCase()!==c,isLowerCase:c.toLowerCase()===c&&c.toUpperCase()!==c};if(!Object.hasOwn(checks,method))fail();return {type:"boolean",value:checks[method]};}
          if(text(receiver)==="System.out"){
            let output:string;if(method==="printf")output=format(str(args[0]),args.slice(1));else if(["print","println"].includes(method)&&args.length<=1)output=(args.length?printed(args[0]):"")+(method==="println"?"\n":"");else return fail();
            writes.push({text:output,at:++clock});return {type:"void",value:0};
          }
          if(!object)fail();
          if(object.type==="String"){
            const s=str(object);
            if(method==="length"&&!args.length)return {type:"int",value:s.length};
            if(["equals","equalsIgnoreCase","compareTo","concat"].includes(method)&&args.length===1){
              const other=str(args[0]);if(method==="equals"||method==="equalsIgnoreCase")return {type:"boolean",value:method==="equals"?s===other:s.toLowerCase()===other.toLowerCase()};
              if(method==="concat")return other?string(s+other):object;
              let value=0;for(let i=0;i<Math.min(s.length,other.length);i++){value=s.charCodeAt(i)-other.charCodeAt(i);if(value)break;}return {type:"int",value:value||s.length-other.length};
            }
            if(["trim","toLowerCase","toUpperCase"].includes(method)&&!args.length){const value=method==="trim"?trimJava(s):method==="toLowerCase"?s.toLowerCase():s.toUpperCase();return value===s?object:string(value);}
            if(method==="charAt"&&args.length===1){const i=num(args[0]);if(!Number.isInteger(i)||i<0||i>=s.length)fail();return {type:"char",value:s.charCodeAt(i)};}
            if(method==="substring"&&(args.length===1||args.length===2)){const start=num(args[0]),end=args[1]?num(args[1]):s.length;if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>s.length)fail();return start===0&&end===s.length?object:string(s.slice(start,end));}
            return fail();
          }
          if(typeof object.value!=="object")return fail();
          if(object.value.kind==="reader"){
            const r=object.value;if(method==="close"&&!args.length){r.closed=true;return {type:"void",value:0};}if(r.closed||args.length)fail();
            let token:string;
            if(method==="nextLine"){if(r.position>=r.input.length)fail();const end=r.input.indexOf("\n",r.position);token=r.input.slice(r.position,end<0?r.input.length:end).replace(/\r$/,"");r.position=end<0?r.input.length:end+1;}
            else if(["next","nextInt","nextDouble"].includes(method)){const match=r.input.slice(r.position).match(/^\s*(\S+)/);if(!match)fail();token=match[1];r.position+=match[0].length;}else return fail();
            if(!r.file)lastKeyboardRead=++clock;
            if(method==="next"||method==="nextLine")return string(token);
            const value=Number(token);if(!Number.isFinite(value)||(method==="nextInt"&&(!/^[+-]?\d+$/.test(token)||value<-2147483648||value>2147483647)))fail();return {type:method==="nextInt"?"int":"double",value};
          }
          const w=object.value;if(method==="close"&&!args.length){w.closed=true;return {type:"void",value:0};}if(w.closed)fail();
          if(method==="printf")files[w.path]+=format(str(args[0]),args.slice(1));
          else if(["print","println"].includes(method)&&args.length<=1)files[w.path]+=(args.length?printed(args[0]):"")+(method==="println"?"\n":"");else return fail();return {type:"void",value:0};
        }
        return fail();
      };
      const run=(n:Node,depth=0):void=>{
        if(returned)return;if(++steps>1800||depth>50)fail();const p=children(n);
        if(n.name==="Block"){const before=new Set(vars.keys());for(const child of p.slice(1,-1))run(child,depth+1);for(const name of vars.keys())if(!before.has(name))vars.delete(name);return;}
        if(n.name==="IfStatement"){if(bool(evaluate(p[1])))run(p[2],depth+1);else if(p.length===5)run(p[4],depth+1);return;}
        if(n.name==="ReturnStatement"){if(p.length!==2)fail();returned=true;return;}
        if(n.name==="LocalVariableDeclaration"){
          const type=text(p[0]).split(".").at(-1) as Kind;if(!["int","double","long","char","boolean","String","Scanner","File","PrintWriter"].includes(type))fail();
          for(const declaration of p.filter(c=>c.name==="VariableDeclarator")){const fields=children(declaration),name=text(fields[0]);if(vars.has(name)||![1,3].includes(fields.length))fail();vars.set(name,{type,value:fields.length===3?convert(evaluate(fields[2]),type):null});}return;
        }
        if(n.name==="ExpressionStatement"){evaluate(p[0]);return;}
        if(n.name===";"||n.name==="EmptyStatement")return;fail();
      };
      for(const statement of statements)run(statement);
      if(spec.requireClose&&(readers.some(r=>r.file&&!r.closed)||writers.some(w=>!w.closed)))return false;
      const normalize=(s:string)=>s.replace(/\r/g,"").replace(/\n$/,"");
      const actual=normalize(writes.filter(w=>!lastKeyboardRead||w.at>lastKeyboardRead).map(w=>w.text).join(""));
      if(sample.output!==undefined){
        const expected=normalize(sample.output);
        if(spec.numericOutput){const a=actual.split("\n"),b=expected.split("\n");if(a.length!==b.length||a.some((s,i)=>!s.trim()||!(near(Number(s),Number(b[i]))||(spec.numericTolerance!==undefined&&Number.isFinite(Number(s))&&Math.abs(Number(s)-Number(b[i]))<=spec.numericTolerance))))return false;}
        else if(actual!==expected)return false;
      }
      for(const [path,expected] of Object.entries(sample.outputFiles??{}))if(files[path]===undefined||normalize(files[path])!==normalize(expected))return false;
      if(spec.resultVariable){const value=vars.get(spec.resultVariable)?.value;if(!value)return false;if(typeof sample.result==="number"?!near(num(value),sample.result):value.value!==sample.result)return false;}
    }
    return true;
  }catch{return false;}
}

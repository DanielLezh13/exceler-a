// Deliberately bounded teaching ISA, not native assembly or JavaScript execution.
export type MachineCase = { registers: number[]; memory?: number[]; output: number[]; finalMemory?: number[] };
export type MachineSpec = { allowed: string[]; cases: MachineCase[] };
const arities: Record<string, number> = { MOV:2, ADD:3, SUB:3, MUL:3, AND:3, OR:3, XOR:3, SHL:3, SHR:3, LOAD:2, STORE:2, BEQ:3, BLT:3, JMP:1, OUT:1, HALT:0, CALL:1, RET:0, PUSH:1, POP:1 };
const integer = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= -2147483648 && v <= 2147483647;
export function readMachineSpec(value: unknown): MachineSpec | undefined {
  if (!value || typeof value !== "object") return;
  const v = value as MachineSpec;
  if (!Array.isArray(v.allowed) || !v.allowed.length || !v.allowed.every(op => typeof op === "string" && Object.hasOwn(arities,op)) || !Array.isArray(v.cases) || !v.cases.length || v.cases.length > 256) return;
  const cases: MachineCase[] = [];
  for (const c of v.cases) {
    if (!c || !Array.isArray(c.registers) || c.registers.length > 8 || !c.registers.every(integer) || !Array.isArray(c.output) || c.output.length > 256 || !c.output.every(integer)) return;
    if (c.memory !== undefined && (!Array.isArray(c.memory) || c.memory.length > 256 || !c.memory.every(integer))) return;
    if (c.finalMemory !== undefined && (!Array.isArray(c.finalMemory) || c.finalMemory.length > 256 || !c.finalMemory.every(integer))) return;
    cases.push({registers:[...c.registers],output:[...c.output],...(c.memory ? {memory:[...c.memory]} : {}),...(c.finalMemory ? {finalMemory:[...c.finalMemory]} : {})});
  }
  return {allowed:[...v.allowed],cases};
}
export function runTeachingMachine(source: string, initial: MachineCase, allowed = Object.keys(arities)) {
  if (!source.trim() || source.length > 4000) throw Error("Write a program of 1–4000 characters.");
  const labels = new Map<string, number>(), instructions: {op:string; args:string[]}[] = [];
  for (const raw of source.split(/\r?\n/)) {
    let line = raw.replace(/;.*$/, "").trim();
    const match = line.match(/^([A-Za-z_]\w*):/);
    if (match) { if(labels.has(match[1])) throw Error("Use each label only once."); labels.set(match[1],instructions.length); line=line.slice(match[0].length).trim(); }
    if(!line) continue;
    const [op,...args]=line.replace(/,/g," ").split(/\s+/); const upper=op.toUpperCase();
    if(!Object.hasOwn(arities,upper) || !allowed.includes(upper)) throw Error(`Instruction ${op} is not available in this exercise.`);
    if(args.length!==arities[upper]) throw Error(`${upper} needs ${arities[upper]} operands.`);
    instructions.push({op:upper,args});
    if(instructions.length>256) throw Error("Use at most 256 instructions.");
  }
  const registers=Array.from({length:8},(_,i)=>initial.registers[i]??0), memory=Array.from({length:256},(_,i)=>initial.memory?.[i]??0), output:number[]=[], stack:number[]=[], calls:number[]=[];
  const reg=(s:string) => { if(!/^R[0-7]$/i.test(s)) throw Error(`Expected R0 through R7, received ${s}.`); return Number(s[1]); };
  const val=(s:string) => { if(/^R[0-7]$/i.test(s)) return registers[reg(s)]; if(!/^-?\d+$/.test(s)||!integer(Number(s))) throw Error(`Expected a register or signed 32-bit decimal integer, received ${s}.`); return Number(s); };
  const address=(s:string) => { const a=val(s); if(a<0||a>=256) throw Error("Memory address must be a word index from 0 through 255."); return a; };
  const target=(s:string) => { const p=labels.get(s); if(p===undefined) throw Error(`Unknown label ${s}.`); return p; };
  // Validate even unreachable instructions so invalid programs cannot pass accidentally.
  for(const {op,args:a} of instructions) {
    if(["MOV","LOAD","POP","ADD","SUB","MUL","AND","OR","XOR","SHL","SHR"].includes(op)) reg(a[0]);
    if(["JMP","CALL"].includes(op)) target(a[0]);
    else if(["BEQ","BLT"].includes(op)) {val(a[0]);val(a[1]);target(a[2]);}
    else if(["OUT","PUSH","STORE"].includes(op)) a.forEach(val);
    else if(a.length>1) a.slice(1).forEach(val);
  }
  let pc=0,steps=0;
  while(pc<instructions.length) {
    if(++steps>4000) throw Error("Execution exceeded 4000 steps. Check loop progress and termination.");
    const {op,args:a}=instructions[pc++];
    switch(op) {
      case "MOV": registers[reg(a[0])]=val(a[1]); break;
      case "ADD": registers[reg(a[0])]=(val(a[1])+val(a[2]))|0; break;
      case "SUB": registers[reg(a[0])]=(val(a[1])-val(a[2]))|0; break;
      case "MUL": registers[reg(a[0])]=Math.imul(val(a[1]),val(a[2])); break;
      case "AND": registers[reg(a[0])]=val(a[1])&val(a[2]); break;
      case "OR": registers[reg(a[0])]=val(a[1])|val(a[2]); break;
      case "XOR": registers[reg(a[0])]=val(a[1])^val(a[2]); break;
      case "SHL": case "SHR": {const shift=val(a[2]); if(shift<0||shift>31)throw Error("Shift counts must be 0 through 31."); registers[reg(a[0])]=op==="SHL"?val(a[1])<<shift:(val(a[1])>>>shift)|0; break;}
      case "LOAD": registers[reg(a[0])]=memory[address(a[1])]; break;
      case "STORE": memory[address(a[1])]=val(a[0]); break;
      case "BEQ": if(val(a[0])===val(a[1]))pc=target(a[2]); break;
      case "BLT": if(val(a[0])<val(a[1]))pc=target(a[2]); break;
      case "JMP": pc=target(a[0]); break;
      case "OUT": output.push(val(a[0])); if(output.length>256)throw Error("Too many output values."); break;
      case "CALL": calls.push(pc);pc=target(a[0]);break;
      case "RET": {const ret=calls.pop();if(ret===undefined)throw Error("RET has no matching CALL.");pc=ret;break;}
      case "PUSH": stack.push(val(a[0])); if(stack.length>256)throw Error("Data stack is full.");break;
      case "POP": {const item=stack.pop();if(item===undefined)throw Error("Cannot POP an empty data stack.");registers[reg(a[0])]=item;break;}
      case "HALT": return {registers,memory,output,steps};
    }
  }
  return {registers,memory,output,steps};
}
export function gradeMachine(source:string,spec:MachineSpec) {
  const checked=readMachineSpec(spec); if(!checked)throw Error("This exercise's execution checks are unavailable.");
  for(const c of checked.cases) {
    const result=runTeachingMachine(source,c,checked.allowed);
    if(result.output.length!==c.output.length||result.output.some((v,i)=>v!==c.output[i])) return {passed:false,feedback:`For initial registers [${c.registers.join(", ")}]${c.memory?` and memory [${c.memory.join(", ")}]`:""}, expected output [${c.output.join(", ")}]; your program produced [${result.output.join(", ")}].`};
    if(c.finalMemory?.some((v,i)=>result.memory[i]!==v)) return {passed:false,feedback:`The output matches, but the required stored memory does not. Starting with registers [${c.registers.join(", ")}] and memory [${c.memory?.join(", ")??""}], expected final cells [${c.finalMemory.join(", ")}]; received [${result.memory.slice(0,c.finalMemory.length).join(", ")}].`};
  }
  return {passed:true,feedback:`Accepted: required outputs and any specified memory results match in all ${checked.cases.length} checked cases. Different register choices and equivalent instruction sequences are allowed.`};
}

import { chapter, field, q, section, unit } from "../math/authoring.ts";
import type { MathChapter, MathField, MathQuestion, MathSection } from "../math/types.ts";
import type { MachineCase } from "../math/teachingMachine.ts";

export const num=(prompt:string,answer:number|string,hint:string,...steps:string[])=>q("",prompt,[field("Answer",String(answer))],hint,steps);
export const bits=(prompt:string,answer:string,hint:string,...steps:string[])=>q("",prompt,[field("Bits",answer,"bits")],hint,steps);
export const logic=(prompt:string,answer:string,hint:string,...steps:string[])=>q("",prompt,[field("Boolean expression",answer,"logic")],hint,steps);
export const seq=(prompt:string,answer:number[],hint:string,...steps:string[])=>q("",prompt,[field("Values in the requested order",answer.join(", "),"sequence")],hint,steps);
export const parts=(prompt:string,values:[string,number|string][],hint:string,...steps:string[])=>q("",prompt,values.map(([label,a])=>field(label,String(a))),hint,steps);
export const choose=(prompt:string,answer:string,options:string[],hint:string,...steps:string[])=>q("",prompt,[{label:"Your answer",answer,kind:"choice",options}],hint,steps);
export const baseOps=["MOV","ADD","SUB","MUL","OUT","HALT"];
export const memoryOps=[...baseOps,"LOAD","STORE"];
export const branchOps=[...memoryOps,"BEQ","BLT","JMP"];
export const callOps=[...branchOps,"CALL","RET","PUSH","POP"];
export const asm=(prompt:string,answer:string,cases:MachineCase[],allowed:string[],hint:string,...steps:string[]):MathQuestion=>q("",`${prompt}\nUse the course's teaching ISA, one instruction per line. Other registers start at zero; unlisted memory starts at zero. Allowed instructions: ${allowed.join(", ")}.`,[{label:"Assembly program",answer,kind:"code",language:"text",machine:{allowed,cases}} satisfies MathField],hint,steps);
export const samples=(values:number[],solve:(n:number)=>number[])=>values.map(n=>({registers:[n],output:solve(n)}));
export const grid=(values:number[],solve:(a:number,b:number)=>number[])=>values.flatMap(a=>values.map(b=>({registers:[a,b],output:solve(a,b)})));
const identify=(prefix:string,questions:MathQuestion[])=>questions.map((question,i)=>({...question,id:`${prefix}-${i+1}`}));
export function lessonChapter(prefix:string,slug:string,title:string,description:string,requires:string[],teaches:string[],paragraphs:string[],rules:string[],examples:MathSection["examples"],misconception:string,practice:MathQuestion[],review:MathQuestion[]):MathChapter {
  const id=`${prefix}-${slug}`;
  return chapter(id,title,description,[section({id:`${id}-lesson`,title,requires,teaches,paragraphs,rules,examples,misconception,questions:identify(`${id}-p`,practice)})],identify(`${id}-r`,review));
}
export const hardwareUnit=(prefix:string,index:number,title:string,chapters:MathChapter[],questions:MathQuestion[])=>unit(`${prefix}-unit${index}`,title,chapters,identify(`${prefix}-u${index}`,questions));

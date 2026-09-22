import assert from "node:assert/strict";
import test from "node:test";
import { courseQuestions } from "../app/math/courses.ts";
import { cisc3310 } from "../app/data/cisc3310.ts";
import { cisc3305 } from "../app/data/cisc3305.ts";
import { gradeField, gradeMath } from "../app/math/grading.ts";
import { gradeMachine, readMachineSpec, runTeachingMachine } from "../app/math/teachingMachine.ts";
import { beginMathAttempt, emptyMathProgress, mathTutorContext, readMathRecords, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";
const courses=[cisc3310,cisc3305];
const questions=courses.flatMap(courseQuestions);
const byId=Object.fromEntries(questions.map(q=>[q.id,q]));
const matches=(id,...values)=>gradeMath(byId[id],{values:values.map(String),working:""}).passed;

test("hardware tracks have distinct identities, graduated practice and no copied chapter questions in their tests",()=>{
 const ids=questions.map(q=>q.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const course of courses){
  const sections=course.units.flatMap(u=>u.chapters.flatMap(c=>c.sections));
  assert.ok(new Set(sections.map(s=>s.questions.length)).size>=3,"Practice count follows the skill, not a fixed template");
  assert.ok(sections.every(s=>s.questions.length>=8));
  for(const unit of course.units){
   const practicePrompts=new Set(unit.chapters.flatMap(c=>[...c.sections.flatMap(s=>s.questions),...c.review]).map(q=>q.prompt));
   assert.ok(unit.assessment.questions.every(q=>!practicePrompts.has(q.prompt)),unit.id);
  }
 }
 assert.ok(courseQuestions(cisc3310).filter(q=>q.fields.some(f=>f.machine)).length>=25);
 assert.ok(courseQuestions(cisc3305).some(q=>q.fields.some(f=>f.kind==="logic")));
 assert.match(cisc3305.description,/does not replace that credit/);
});

test("teaching machine executes arithmetic, addressing, calls and register preservation independently of course references",()=>{
 assert.deepEqual(runTeachingMachine("ADD R1,R0,1\nOUT R1",{registers:[2147483647],output:[]}).output,[-2147483648]);
 assert.deepEqual(runTeachingMachine("MUL R1,R0,R0\nOUT R1",{registers:[2147483647],output:[]}).output,[1]);
 const stored=runTeachingMachine("LOAD R1,R0\nADD R1,R1,4\nSTORE R1,R0\nOUT R1",{registers:[2],memory:[0,0,9],output:[]});
 assert.equal(stored.memory[2],13);assert.equal(stored.registers[0],2);assert.deepEqual(stored.output,[13]);
 const nested="CALL outer\nOUT 4\nHALT\nouter: OUT 1\nCALL inner\nOUT 3\nRET\ninner: OUT 2\nRET";
 assert.deepEqual(runTeachingMachine(nested,{registers:[],output:[]}).output,[1,2,3,4]);
 assert.deepEqual(runTeachingMachine("PUSH 7\nPUSH -2\nPOP R0\nPOP R1\nOUT R0\nOUT R1",{registers:[],output:[]}).output,[-2,7]);
 assert.deepEqual(runTeachingMachine("SHR R1,R0,1\nOUT R1\nAND R2,R0,15\nOUT R2",{registers:[-1],output:[]}).output,[2147483647,15]);
 assert.deepEqual(runTeachingMachine("mov r7, -3 ; comment\nadd r6 r7 5\nout r6\nhalt",{registers:[],output:[]}).output,[2]);
});

test("machine rejects invalid syntax, nonexistent labels, bad addresses, stack errors and nontermination",()=>{
 for(const source of ["MOV R8,1","ADD R0,1","JMP absent","HALT\nMOV R9,1","x: OUT 1\nx: HALT","LOAD R0,-1","STORE 1,256","POP R0","RET","SHL R0,1,32","MOV R0,2147483648","process.exit()"]){
  assert.throws(()=>runTeachingMachine(source,{registers:[],output:[]}),undefined,source);
 }
 assert.throws(()=>runTeachingMachine("again: JMP again",{registers:[],output:[]}),/4000 steps/);
 assert.throws(()=>runTeachingMachine("OUT 1",{registers:[],output:[]},["HALT"]),/not available/);
 assert.equal(readMachineSpec({allowed:["__proto__"],cases:[{registers:[],output:[]}]}),undefined);
 assert.equal(readMachineSpec({allowed:["OUT"],cases:[{registers:[],output:[],finalMemory:[Infinity]}]}),undefined);
 assert.equal(readMachineSpec({allowed:["OUT"],cases:Array.from({length:257},()=>({registers:[],output:[]}))}),undefined);
});

test("production checks accept equivalent constructions and reject output-only hardcoding or missing memory writes",()=>{
 const price=byId["cisc3310-execution-p-4"].fields[0];
 assert.ok(gradeField(price,"ADD R7,R0,R0\nADD R7,R7,R7\nADD R7,R7,R0\nADD R7,R7,8\nOUT R7").passed);
 assert.ok(!gradeField(price,"OUT 8").passed);
 const change=byId["cisc3310-execution-p-10"].fields[0];
 assert.ok(!gradeField(change,"LOAD R1,R0\nADD R1,R1,7\nOUT R1").passed,"Correct output cannot substitute for required stored state");
 assert.ok(gradeField(change,"LOAD R7,R0\nADD R7,7,R7\nSTORE R7,R0\nOUT R7").passed);
 for(const q of questions)for(const f of q.fields.filter(f=>f.machine)){
  assert.ok(f.machine.cases.length>=4,q.id);
  assert.ok(gradeField(f,f.answer).passed,q.id);
  assert.ok(!gradeField(f,f.answer.replace(/^OUT\s+.+$/gm,"OUT 2147483647")).passed,`${q.id}: wrong results must fail`);
 }
});

test("independent oracles verify representation, circuits, state, cache and system models",()=>{
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++){
  const total=a+b+c;
  const carry=(a&b)|(a&c)|(b&c),sum=a^b^c;
  assert.equal(total,2*carry+sum);
 }
 assert.ok(matches("cisc3310-representation-p-5",-11));
 assert.ok(matches("cisc3310-representation-p-11",-1,-6));
 assert.ok(matches("cisc3310-state-p-2", "3,5,8"));
 assert.ok(matches("cisc3310-arithmetic-p-4",0,1));
 assert.ok(!matches("cisc3310-arithmetic-p-4",1,0));
 assert.ok(matches("cisc3310-encoding-p-2",7/4));
 assert.ok(matches("cisc3310-encoding-p-10",3));
 const trace=(addresses,blockBytes,lines)=>{
  const resident=new Map();return addresses.map(address=>{const block=Math.floor(address/blockBytes),line=block%lines;const hit=resident.get(line)===block;resident.set(line,block);return Number(hit);});
 };
 assert.ok(matches("cisc3310-memory-p-4",trace([0,1,8,0,4,5],4,2).join(",")));
 assert.ok(matches("cisc3310-u6-2",trace([2,3,6,2,0,1],2,2).join(",")));
 assert.ok(matches("cisc3310-performance-p-9",1/(.5+.5/4)));
 assert.ok(matches("cisc3305-storage-p-2",2,4,8));
 assert.ok(matches("cisc3305-reliability-p-3",.028));
 assert.ok(matches("cisc3305-organization-p-4",7));
 assert.ok(matches("cisc3305-organization-p-5",8));
 assert.ok(matches("cisc3305-organization-p-8",3));
 assert.ok(gradeField(byId["cisc3310-logic-p-3"].fields[0],"(p and k) or (p and o)").passed);
 assert.ok(!gradeField(byId["cisc3310-logic-p-3"].fields[0],"(p and k) or o").passed);
});

test("behavioral graders survive saved assessment snapshots and retries without leaking checks to active tutor context",()=>{
 const assessment=cisc3310.units[3].assessment;
 let progress=emptyMathProgress();
 for(const q of assessment.questions)progress=updateMathResponse(progress,q.id,{values:q.fields.map(f=>f.answer),working:"traced the boundary cases"});
 const active=mathTutorContext(cisc3310,progress,assessment.id);
 assert.doesNotMatch(JSON.stringify(active.masteryAssessment),/"machine"|"cases"|"finalMemory"/);
 assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null));
 progress=submitMathAttempt(progress,assessment,"machine-test");
 progress=readMathRecords(JSON.parse(JSON.stringify({cisc3310:progress}))).cisc3310;
 const attempt=progress.history[assessment.id][0];
 assert.equal(attempt.score,assessment.questions.length);
 assert.ok(attempt.results[0].question.fields[0].machine);
 progress=beginMathAttempt(progress,assessment,attempt,[assessment.questions[0].id]);
 const q=assessment.questions[0];
 progress=updateMathResponse(progress,q.id,{values:["OUT 2"],working:"incorrect constant"});
 progress=submitMathAttempt(progress,assessment,"machine-retry");
 assert.equal(progress.history[assessment.id][1].score,assessment.questions.length-1);
 assert.equal(attempt.score,assessment.questions.length,"Original result remains immutable");
 const spec=byId["cisc3305-execution-p-10"].fields[0].machine;
 assert.deepEqual(readMachineSpec(JSON.parse(JSON.stringify(spec))),spec);
 assert.ok(gradeMachine(byId["cisc3305-execution-p-10"].fields[0].answer,spec).passed);
});

import assert from "node:assert/strict";
import test from "node:test";
import { cisc2210 as course } from "../app/data/cisc2210.ts";
import { courseChapters, courseQuestions } from "../app/math/courses.ts";
import { compareLogic } from "../app/math/discreteGrading.ts";
import { evaluateMath, gradeField, gradeMath, mathGradeStatus } from "../app/math/grading.ts";
import { mathInputHelp } from "../app/math/inputHelp.ts";
import { beginMathAttempt, checkMathQuestion, emptyMathProgress, mathCourseProgress, mathTutorContext, readMathRecords, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";

const all=courseQuestions(course), byId=Object.fromEntries(all.map(q=>[q.id,q]));
const canonical=q=>({values:q.fields.map(f=>f.answer),working:""});
const answer=(id,...values)=>gradeMath(byId[id],{values:values.map(String),working:""});
const fieldGrade=(kind,expected,actual)=>gradeField({label:"Result",kind,answer:expected},actual);
const assertAnswer=(id,...values)=>assert.ok(answer(id,...values).passed,`${id}: ${JSON.stringify(answer(id,...values))}`);
const permutations=items=>items.length?items.flatMap((x,i)=>permutations(items.filter((_,j)=>i!==j)).map(t=>[x,...t])):[[]];
const subsets=items=>items.reduce((sets,x)=>[...sets,...sets.map(s=>[...s,x])],[[]]);
const pairsText=pairs=>pairs.map(p=>`(${p.join(",")})`).join(",")||"none";

test("Discrete Structures is a complete original course with production and honest proof scope",()=>{
  assert.equal(courseChapters(course).length,12);
  assert.equal(courseChapters(course).flatMap(c=>c.sections).length,29);
  assert.equal(all.length,254);
  assert.ok(all.filter(q=>q.fields.some(f=>f.kind!=="choice")).length>190);
  assert.deepEqual(course.units.map(u=>u.assessment.questions.length),[7,7,7,7,7,7]);
  assert.ok(all.every(q=>q.id.startsWith("d-")));
  assert.match(JSON.stringify(course),/not automatic verification of a free-form written proof/);
  assert.ok(!course.prerequisites.some(p=>/calculus|derivative|integral/.test(p)));
  assert.ok(all.every(q=>q.fields.every(f=>f.kind!=="function")),"no untaught calculus parser required");
});

test("logic accepts equivalent notation and compares all truth assignments, not a sample",()=>{
  for(const [a,b] of [
    ["p and not q","¬q ∧ p"],["(p or q) and not r","!r && (q || p)"],
    ["p -> q","not p or q"],["p -> q","not q -> not p"],
    ["p <-> q","(p and q) or (not p and not q)"],
    ["not(p or q)","not p and not q"],["p xor q","(p|q)&!(p&q)"],
    ["p","p or (p and q)"],["0","p and not p"],["1","p or not p"],
    ["p -> q -> r","p -> (q -> r)"],["p or q and r","p or (q and r)"],
    ["p","p and (s or not s)"],["p iff q","p <=> q"],
  ])assert.ok(compareLogic(a,b).passed,`${a} / ${b}`);
  // Independent truth-table construction: all 256 functions of three input bits.
  const names=["p","q","r"];
  const rows=Array.from({length:8},(_,i)=>names.map((_,j)=>Boolean(i&(1<<j))));
  for(let mask=0;mask<256;mask++){
    const dnf=rows.flatMap((row,i)=>(mask&(1<<i))?[`(${names.map((v,j)=>row[j]?v:`not ${v}`).join(" and ")})`]:[]).join(" or ")||"0";
    const cnf=rows.flatMap((row,i)=>(mask&(1<<i))?[]:[`(${names.map((v,j)=>row[j]?`not ${v}`:v).join(" or ")})`]).join(" and ")||"1";
    assert.ok(compareLogic(dnf,cnf).passed,`truth function ${mask}`);
    rows.forEach((row,i)=>{
      const evaluated=dnf.replace(/\b[pqr]\b/g,v=>row[names.indexOf(v)]?"1":"0");
      assert.ok(compareLogic(evaluated,(mask&(1<<i))?"1":"0").passed);
    });
  }
  const failure=compareLogic("(p or q) and not r","p or (q and not r)");
  assert.equal(failure.passed,false);assert.match(failure.feedback,/p=true.*r=true/);
  for(const [a,b] of [["p->q","q->p"],["p xor q","p or q"],["not(p and q)","not p and not q"],["p","q"]])assert.ok(!compareLogic(a,b).passed);
});

test("discrete parsers are bounded and do not execute learner input",()=>{
  for(const value of ["globalThis.process.exit()","p;alert(1)","p &&","p q","p + q","2","constructor.constructor('return 1')()","(".repeat(70)+"p"+")".repeat(70),Array(9).fill(0).map((_,i)=>String.fromCharCode(97+i)).join(" or ")]){
    const result=fieldGrade("logic","p",value);assert.equal(result.passed,false,value);
  }
  assert.equal(mathGradeStatus({passed:false,fields:[fieldGrade("logic","p","p + q")]}),"unverified");
  for(const kind of ["logic","pairs","bits","sequence"]){
    const result=fieldGrade(kind,"1","1".repeat(601));assert.equal(result.passed,false);assert.match(result.feedback,/not supported/);
  }
  for(const [kind,expected,bad] of [["pairs","(1,2)","(1,2);process.exit()"],["pairs","(1,2)","(1,2,3)"],["sequence","1,2","1,2;alert(1)"],["bits","01","0x1"]])assert.equal(fieldGrade(kind,expected,bad).passed,false);
});

test("pair sets ignore listing order, sequences retain order, bits retain required width",()=>{
  for(const [kind,a,b] of [
    ["pairs","(1,2),(2,3)","{ (2, 6/2); (1, 2); (1,2) }"],
    ["pairs","none","{}"],["pairs","none","∅"],
    ["sequence","1,2,3","[2/2; 1+1; sqrt(9)]"],
    ["bits","001101","00 11 01"],["bits","001101","00_1101"],
  ])assert.ok(fieldGrade(kind,a,b).passed,b);
  for(const [kind,a,b] of [["pairs","(1,2)","(2,1)"],["pairs","(1,2),(2,3)","(1,2)"],["sequence","1,2,3","3,2,1"],["sequence","1,2,3","1,2,3,3"],["bits","001101","1101"],["bits","001101","001111"]])assert.equal(fieldGrade(kind,a,b).passed,false,b);
  assertAnswer("d-u1-4","!(r) && (q || p)");
  assertAnswer("d-u3-7","{(2,2),(1,1)}");
  assert.ok(!answer("d-u4-1","(p or q) and r").passed);
  assert.ok(!answer("d-u6-1","1,2,6,3,4,5").passed,"DFS is not the specified BFS");
  assert.doesNotMatch(mathInputHelp(byId["d-logic-4"],byId["d-logic-4"].fields[0]),/implies|if and only if/);
  assert.match(mathInputHelp(byId["d-imp-2"],byId["d-imp-2"].fields[0]),/implies/);
});

test("independent finite enumeration verifies sets, counterexamples, functions and closures",()=>{
  const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  for(const [id,domain,predicate] of [
    ["d-set-3",range(-4,4),x=>x>=-2&&x<3],
    ["d-quant-1",range(-2,2),x=>x*x===1],
    ["d-quant-2",range(-2,2),x=>!(x*x>x)],
    ["d-log-r3",range(0,3),x=>x*x!==x],
    ["d-proof-4",range(0,4),x=>x%2===0&&x%4!==0],
    ["d-proof-r3",range(-2,2),x=>x*x>0&&!(x>0)],
    ["d-num-5",range(0,8),x=>(2*x-2)%6===0],
    ["d-u1-6",range(-2,3),x=>!(x*x>=x+2)],
    ["d-u2-2",range(-3,3),x=>x*x===4&&x!==2],
    ["d-u3-5",range(0,9),x=>x%4===2],
  ])assertAnswer(id,domain.filter(predicate).join(",")||"none");
  assertAnswer("d-op-5",pairsText([1,2].flatMap(a=>[3,4].map(b=>[a,b]))));
  assertAnswer("d-u1-2",pairsText([0,2].flatMap(a=>[1,3].map(b=>[a,b]))));
  const f={1:4,2:5,3:6},g={4:3,5:1,6:2};
  assertAnswer("d-u3-1",pairsText(Object.keys(f).map(x=>[Number(x),g[f[x]]])));
  const closure=(vertices,edges)=>{
    const reach=new Set(edges.map(p=>p.join(",")));
    for(const k of vertices)for(const i of vertices)for(const j of vertices)if(reach.has(`${i},${k}`)&&reach.has(`${k},${j}`))reach.add(`${i},${j}`);
    return [...reach].map(p=>p.split(",").map(Number));
  };
  assertAnswer("d-rel-4",pairsText(closure([1,2,3,4],[[1,2],[2,3],[3,4]])));
  assertAnswer("d-u3-4",pairsText(closure([1,2,3],[[1,2],[2,3],[3,1]])));
});

test("independent enumeration checks combinatorial counts instead of restating formulas",()=>{
  const arrangements=permutations([0,1,2,3,4,5]);
  assertAnswer("d-u4-3",new Set(arrangements.filter(p=>p[0]!==0).map(p=>p.slice(0,4).join(""))).size);
  assertAnswer("d-count-6",permutations([0,1,2,3,4]).filter(p=>Math.abs(p.indexOf(0)-p.indexOf(1))===1).length);
  assertAnswer("d-comb-2",new Set(permutations(["L","E","V","E","L"]).map(p=>p.join(""))).size);
  assertAnswer("d-u4-5",new Set(permutations(["B","A","N","A","N","A"]).map(p=>p.join(""))).size);
  assertAnswer("d-u4-4",subsets([0,1,2,3,4,5,6]).filter(s=>s.length===3).length);
  assertAnswer("d-count-r1",subsets([0,1,2,3,4,5]).filter(s=>s.length===2).length);
  let distributions=0;
  for(let a=0;a<=4;a++)for(let b=0;b<=4;b++)for(let c=0;c<=4;c++)if(a+b+c===4)distributions++;
  assertAnswer("d-comb-4",distributions);assertAnswer("d-comb-7",distributions);
  assertAnswer("d-inc-2",Array.from({length:30},(_,i)=>i+1).filter(x=>x%2===0||x%3===0).length);
  assertAnswer("d-prob-2",Array.from({length:6},(_,i)=>i+1).flatMap(a=>Array.from({length:6},(_,j)=>[a,j+1])).filter(([a,b])=>a+b===4).length/36);
  const selections=subsets([0,1,2,3,4,5]).filter(s=>s.length===2);
  assertAnswer("d-u5-1",selections.filter(([a,b])=>(a<3)!==(b<3)).length/selections.length);
});

test("independent graph algorithms verify degrees, traversal, shortest paths and spanning trees",()=>{
  const edges=[[1,2],[1,4],[2,3],[2,5],[4,6]];
  const neighbors=(u,edges)=>edges.flatMap(([a,b])=>a===u?[b]:b===u?[a]:[]).sort((a,b)=>a-b);
  const bfs=edges=>{const order=[1],seen=new Set([1]);for(let i=0;i<order.length;i++)for(const v of neighbors(order[i],edges))if(!seen.has(v)){seen.add(v);order.push(v);}return order;};
  const dfs=edges=>{const order=[],visit=u=>{order.push(u);for(const v of neighbors(u,edges))if(!order.includes(v))visit(v);};visit(1);return order;};
  assertAnswer("d-search-1",bfs(edges).join(","));assertAnswer("d-search-2",dfs(edges).join(","));
  assertAnswer("d-u6-1",bfs([[1,3],[1,2],[2,6],[3,4],[4,5]]).join(","));
  const degrees=edges=>[1,2,3,4,5].map(u=>neighbors(u,edges).length);
  const graph=[[1,2],[2,3],[3,1],[3,4],[4,5]],deg=degrees(graph);
  assertAnswer("d-u5-4",deg.join(","));assertAnswer("d-u5-5",deg.flatMap((d,i)=>d%2?[i+1]:[]).join(","));
  // Floyd-Warshall independently checks the shortest-path results authored for Dijkstra.
  const shortest=edges=>{const d=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>i===j?0:Infinity));for(const [a,b,w] of edges)d[a-1][b-1]=d[b-1][a-1]=w;for(let k=0;k<4;k++)for(let i=0;i<4;i++)for(let j=0;j<4;j++)d[i][j]=Math.min(d[i][j],d[i][k]+d[k][j]);return d[0];};
  const weighted=[[1,2,4],[1,3,1],[3,2,1],[2,4,2],[3,4,7]];
  assertAnswer("d-weight-1",shortest(weighted)[3]);assertAnswer("d-weight-2",shortest(weighted).join(","));
  assertAnswer("d-u6-2",shortest([[1,2,6],[1,3,2],[3,2,2],[2,4,1],[3,4,8]])[3]);
  // Enumerate every candidate spanning tree; no Kruskal implementation in this oracle.
  const mst=edges=>Math.min(...subsets(edges).filter(s=>s.length===3&&bfs(s).length===4).map(s=>s.reduce((sum,e)=>sum+e[2],0)));
  assertAnswer("d-weight-3",mst([[1,2,2],[2,3,3],[1,3,6],[3,4,4],[2,4,8]]));
  assertAnswer("d-u6-3",mst([[1,2,1],[2,3,3],[1,3,4],[3,4,5],[2,4,8]]));
});

test("proof steps, operation counts, encodings and errors have independent numerical checks",()=>{
  for(const [id,expected] of [
    ["d-proof-1",x=>((2*x+1)**2-1)/2],["d-proof-5",x=>(3*x+3*(x+2))/3],
    ["d-u2-1",x=>((2*x)**2+2*x)/2],["d-u2-3",x=>x*(x+1)+2*(x+1)],
    ["d-cost-3",x=>Array.from({length:x},(_,i)=>i+1).reduce((a,b)=>a+b,0)],
    ["d-u6-4",x=>Array.from({length:x},(_,i)=>i+1).reduce((a,b)=>a+b,0)+x],
  ])for(const x of [1,2,3,5,10])assert.equal(evaluateMath(byId[id].fields[0].answer,x),expected(x),id);
  assertAnswer("d-u2-6",(26).toString(2).padStart(6,"0"));
  assertAnswer("d-int-r2",(19).toString(2).padStart(6,"0"));
  const parity=data=>data+[...data].filter(x=>x==="1").length%2;
  for(const [id,data] of [["d-err-3","1101"],["d-analysis-r3","1001"],["d-u6-7","10110"]])assertAnswer(id,parity(data));
  assertAnswer("d-err-4",[..."101101"].filter((b,i)=>b!=="100011"[i]).length);
  const cost=n=>n===1?0:2*cost(n/2)+n;
  assertAnswer("d-rec-2",cost(16));assertAnswer("d-u6-5",cost(32));
  assertAnswer("d-u6-6",3*0.02+0.01);
  for(const [id,...bad] of [["d-u1-6","-1,0,1"],["d-num-2","-4"],["d-u4-3","360"],["d-u4-4","210"],["d-u4-7","16"],["d-u5-1","1/2"],["d-u6-4","x^2+x"],["d-u6-5","32"],["d-err-5","3","2"]])assert.ok(!answer(id,...bad).passed,id);
});

test("all six discrete tests preserve typed fields, exact submissions, choices and retries across reload",()=>{
  let p=emptyMathProgress();
  for(const assessment of course.units.map(u=>u.assessment)){
    p.position=assessment.id;
    for(const q of assessment.questions)p=updateMathResponse(p,q.id,canonical(q));
    const first=assessment.questions[0];
    p=updateMathResponse(p,first.id,{values:["wrong first answer"],working:"legacy scratch stays"});
    const active=mathTutorContext(course,p,assessment.id);
    assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null&&q.graderFeedback===null));
    p=submitMathAttempt(p,assessment,`${assessment.id}-first`,"2026-08-31T05:00:00Z");
    assert.equal(p.history[assessment.id][0].score,6);
    const original=JSON.stringify(p.history[assessment.id][0]);
    p=readMathRecords(JSON.parse(JSON.stringify({cisc2210:p}))).cisc2210;
    assert.equal(JSON.stringify(p.history[assessment.id][0]),original,"new kinds must not discard snapshots");
    p=beginMathAttempt(p,assessment,p.history[assessment.id][0],[first.id]);
    p=updateMathResponse(p,first.id,canonical(first));
    p=readMathRecords(JSON.parse(JSON.stringify({cisc2210:p}))).cisc2210;
    assert.deepEqual(p.drafts[assessment.id].questionIds,[first.id]);
    p=submitMathAttempt(p,assessment,`${assessment.id}-retry`,"2026-08-31T05:05:00Z");
    assert.equal(p.history[assessment.id][1].score,7);
    assert.equal(JSON.stringify(p.history[assessment.id][0]),original);
    const context=mathTutorContext(course,p,assessment.id);
    assert.equal(context.courseCode,"CISC 2210");
    assert.ok(context.masteryAssessment.questions.every(q=>q.referenceSolution));
    assert.ok(JSON.stringify(context).length<48000);
  }
  const chapter=courseChapters(course)[0];
  for(const q of [...chapter.sections.flatMap(s=>s.questions),...chapter.review]){p=updateMathResponse(p,q.id,canonical(q));p=checkMathQuestion(p,q);}
  const choice=byId["d-set-1"],context=mathTutorContext(course,p,"d-membership",choice.id);
  assert.equal(mathCourseProgress(course,p).chaptersCleared,1);
  assert.ok(JSON.stringify(context).includes("Yes"));
});

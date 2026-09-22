import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { auditMathCourses, chapterQuestions, courseChapters, courseQuestions, mathCourses } from "../app/math/courses.ts";
import { evaluateMath, gradeField, gradeMath } from "../app/math/grading.ts";
import { beginMathAttempt, checkMathQuestion, emptyMathProgress, mathCourseProgress, mathTutorContext, readMathRecords, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";

const byId=Object.fromEntries(mathCourses.flatMap(courseQuestions).map(q=>[q.id,q]));
const answer=(id,...values)=>gradeMath(byId[id],{values,working:""});
const canonical=q=>({values:q.fields.map(f=>f.answer),working:"My exact working\nSecond line"});

test("all math courses have a complete, reachable, forward-only sequence",()=>{
  assert.deepEqual(auditMathCourses(),[]);
  assert.deepEqual(mathCourses.map(c=>[c.code,courseChapters(c).length,courseQuestions(c).length]),[["MATH 1006",12,210],["MATH 1011",16,260],["MATH 1201",12,270],["MATH 1206",8,140],["CISC 2210",12,254],["CISC 3115",14,142],["CISC 3130",13,134],["CISC 3140",13,134],["CISC 3310",12,207],["CISC 3305",12,203]]);
  const sectionIds=new Set();
  for(const course of mathCourses) {
    assert.equal(course.units.length,6);
    assert.ok(courseQuestions(course).some(q=>q.fields.some(f=>f.kind!=="choice")),`${course.id} needs constructed-response practice`);
    if(["cisc3115","cisc3130","cisc3140"].includes(course.id)) assert.ok(courseQuestions(course).filter(q=>q.fields.some(f=>f.kind==="code")).length>=10,`${course.id} needs repeated code production`);
    for(const unit of course.units) {
      for(const chapter of unit.chapters) for(const section of chapter.sections) {
        assert.ok(!sectionIds.has(section.id));sectionIds.add(section.id);
        assert.ok(section.paragraphs.join(" ").length>400,section.id);
        assert.ok(section.examples.length>=2,section.id);
        if(["math1006","math1011","math1201","cisc2210"].includes(course.id)) assert.ok(section.questions.some(q=>q.fields.some(f=>f.kind!=="choice")),section.id);
        assert.doesNotMatch(section.paragraphs.join(" "),/TODO|coming soon|placeholder/i);
      }
    }
  }
});

test("every math reference passes while blank and unparseable responses fail",()=>{
  for(const course of mathCourses) for(const q of courseQuestions(course)) {
    assert.ok(gradeMath(q,canonical(q)).passed,q.id);
    assert.ok(!gradeMath(q,{values:[],working:q.solution.join("\n")}).passed,q.id);
    assert.ok(!gradeMath(q,{values:q.fields.map(()=>"arbitrary wrong answer"),working:""}).passed,q.id);
    q.fields.filter(f=>f.kind==="choice").forEach(f=>{
      assert.equal(new Set(f.options).size,f.options.length,q.id);
      assert.ok(f.options.includes(f.answer),q.id);
      f.options.filter(o=>o!==f.answer).forEach(o=>assert.ok(!gradeField(f,o).passed,q.id));
    });
  }
});

test("parser follows mathematical precedence and never executes code",()=>{
  for(const [input,expected] of [["-4^2",-16],["(-4)^2",16],["2^3^2",512],["2^-3",0.125],["2(3+4)",14],["2π/π",2],["3/4+1/6",11/12],["25%",0.25],["2sqrt(9)",6],["2×3−1",5],["3²",9]]) assert.equal(evaluateMath(input),expected,input);
  for(const input of ["globalThis.process.exit()","constructor.constructor('return 1')()","1;alert(1)","1/0","sqrt(-1)","2 garbage","Infinity","NaN","x","2++"]) assert.throws(()=>evaluateMath(input),undefined,input);
  assert.equal(evaluateMath("x^2+2*x",3),15);
});

test("algebra graders accept equivalent expressions but enforce requested mathematical form",()=>{
  assert.ok(answer("a-dist-3","-6x + 13").passed);
  assert.ok(answer("a-line-1","y = 3x+4").passed);
  assert.ok(answer("a-line-1","f(x) = 4+3*x").passed);
  assert.ok(answer("a-rat-3","5/(2*x)+3/x").passed);
  assert.ok(answer("a-factor-4","(3-2x)^2").passed);
  assert.ok(answer("a-factor-5","(x+3)*(2x)*(x-3)").passed);
  assert.ok(!answer("a-factor-5","2x*(x^2-9)").passed,"incomplete factoring is not the requested result");
  assert.match(answer("a-factor-5","2x^3-18x").fields[0].feedback,/equivalent.*factoring/i);
  assert.ok(answer("a-special-4","25 + 20x + 4x^2").passed);
  assert.ok(!answer("a-special-4","(2x+5)^2").passed,"expansion cannot be skipped");
  assert.ok(!answer("a-dist-3","13-3*x").passed);
  assert.ok(!answer("a-dist-3","0/(x-x)").passed);
  assert.ok(!answer("a-dist-3","x+1/(x-x)").passed);
});

test("solution sets, intervals, exclusions, and domain boundaries are graded as sets",()=>{
  assert.ok(answer("a-quad-4","-2 + sqrt(5), -2-sqrt(5)").passed);
  assert.ok(answer("a-quad-4","-2±sqrt(5)").passed);
  assert.ok(answer("a-abs-2","x=-1 or x=7").passed);
  assert.ok(answer("a-root-e4","∅").passed);
  assert.ok(answer("a-ineq-3","(-4,0] U (0,inf)").passed);
  assert.ok(answer("a-abs-6","(2,inf) ∪ (-inf,-4)").passed);
  assert.ok(!answer("a-ineq-3","[-4,inf)").passed);
  assert.ok(!answer("a-ineq-2","(-10,4]").passed,"a finite endpoint must not compare equal to infinity");
  assert.ok(!answer("a-ineq-2","[-inf,4]").passed);
  assert.ok(!answer("a-fun-4","(-3,inf)").passed);
  assert.ok(!answer("a-rat-1","x+4","none").passed,"cancellation must retain original exclusions");
  assert.ok(!answer("a-root-e5","3sqrt(2)").passed,"both roots are required");
  assert.ok(!answer("a-quad-7","-1,2").passed,"extraneous roots rejected");
});

test("independent mathematical checks cover every major course domain",()=>{
  const correct=[
    ["a-sign-6","-3"],["a-frac-7","1.875"],["a-exp-3","1.25"],["a-lin-4","6"],["a-model-5","68"],
    ["a-ineq-4","[-2,4)"],["a-poly-r3","6","13","-5"],["a-factor-1","4,3"],
    ["a-rat-e2","7"],["a-root-6","(1+sqrt(5))/2"],["a-line-2","3-2x"],["a-fun-1","6"],
    ["a-parabola-3","4","-13"],["a-mix-2","6","4"],
    ["p-trans-4","2","-1"],["p-rate-1","4"],["p-comp-1","27"],["p-inv-4","-5"],
    ["p-cx-4","1","2"],["p-croot-2","-3","2"],["p-div-4","3,-1,2"],
    ["p-pgraph-5","(2,inf) U (-1,0)"],["p-rgraph-4","1+x"],["p-nlin-2","3","9"],
    ["p-growth-5","1061.68"],["p-log-r1","1.5"],["p-laws-4","40"],["p-eq-5","ln(3),ln(2)"],
    ["p-angle-5","12*pi"],["p-circle-7","-0.8","4/3"],["p-tri-4","1/7"],["p-sgraph-1","4","2*pi/3","2"],
    ["p-tgraph-4","2*pi,0,pi"],["p-angleid-5","sqrt((1-sqrt(2)/2)/2)"],
    ["p-invtrig-4","pi/3"],["p-trigeq-4","7*pi/4,pi/4,5*pi/4,3*pi/4"],
    ["p-conic-4","1","1"],["p-ellipse-2","0.6"],["p-hyp-3","-2","4"],["p-bin-r1","216"],["p-limit-r3","6"]
  ];
  for(const [id,...values] of correct) assert.ok(answer(id,...values).passed,id);
  const wrong=[
    ["a-sign-2","19"],["a-frac-1","3/7"],["a-exp-1","16"],["a-lin-3","4"],["a-model-3","81.9"],
    ["a-abs-2","7"],["a-poly-3","2x^2-3x+6"],["a-rat-e3","1"],["a-root-4","-7"],["a-line-4","2x+3"],
    ["a-quad-2","6"],["a-parabola-5","20","400"],["a-sys-3","2","3"],
    ["p-trans-4","32","-1"],["p-comp-1","17"],["p-inv-4","5"],["p-cx-3","1","5"],
    ["p-div-2","0"],["p-rgraph-5","[-1,2]"],["p-growth-1","540"],["p-growth-5","1061.67"],
    ["p-log-2","2"],["p-eq-3","-1,3"],["p-angle-4","360"],["p-circle-2","sqrt(2)/2"],
    ["p-tri-2","sqrt(49)"],["p-sgraph-3","pi"],["p-tgraph-1","pi/2"],["p-angleid-4","1/9"],
    ["p-invtrig-4","2*pi/3"],["p-trigeq-6","0,pi"],["p-conic-3","3","-1","16"],
    ["p-ellipse-2","4/5"],["p-hyp-2","2/5"],["p-bin-5","32"],["p-limit-2","0"],["p-dq-4","8"]
  ];
  for(const [id,...values] of wrong) assert.ok(!answer(id,...values).passed,id);
});

test("practice persistence, completion, and mathematical feedback survive JSON round trips",()=>{
  const course=mathCourses[0],chapter=courseChapters(course)[0];
  let progress=emptyMathProgress();
  for(const q of chapterQuestions(chapter)) { progress=updateMathResponse(progress,q.id,canonical(q));progress=checkMathQuestion(progress,q); }
  assert.equal(mathCourseProgress(course,progress).chaptersCleared,1,"unit test does not gate its last chapter");
  const restored=readMathRecords(JSON.parse(JSON.stringify({[course.id]:progress})))[course.id];
  assert.deepEqual(restored.responses,progress.responses);
  assert.deepEqual(restored.passed,progress.passed);
  const q=chapterQuestions(chapter)[0];
  const changed=updateMathResponse(restored,q.id,{values:["wrong"],working:"reworking"});
  assert.ok(!changed.passed.includes(q.id));assert.ok(!changed.checked[q.id]);
  assert.equal(mathCourseProgress(course,changed).chaptersCleared,0);
  assert.deepEqual(readMathRecords(null),{});
});

test("whole test, immutable snapshots, one-question retry, cancellation, and history",()=>{
  const course=mathCourses[0], assessment=course.units[0].assessment;
  let progress=emptyMathProgress();
  for(const q of assessment.questions)progress=updateMathResponse(progress,q.id,canonical(q));
  const first=assessment.questions[0];
  progress=updateMathResponse(progress,first.id,{values:["999"],working:"original exact work"});
  progress=submitMathAttempt(progress,assessment,"attempt-1","2026-08-30T12:00:00Z");
  const attempt=progress.history[assessment.id][0],snapshot=JSON.stringify(attempt);
  assert.equal(attempt.score,5);
  assert.equal(submitMathAttempt(progress,assessment),progress,"double submission ignored");
  progress=beginMathAttempt(progress,assessment,attempt,[first.id]);
  assert.deepEqual(progress.drafts[assessment.id].questionIds,[first.id]);
  progress=updateMathResponse(progress,first.id,canonical(first));
  progress=submitMathAttempt(progress,assessment,"attempt-2","2026-08-30T13:00:00Z");
  assert.equal(progress.history[assessment.id][1].score,6);
  assert.equal(progress.history[assessment.id][1].kind,"retry");
  assert.equal(JSON.stringify(progress.history[assessment.id][0]),snapshot);
  assert.deepEqual(progress.history[assessment.id][1].results.slice(1),attempt.results.slice(1));
  assert.equal(progress.drafts[assessment.id],undefined);
  const restored=readMathRecords(JSON.parse(JSON.stringify({[course.id]:progress})))[course.id];
  assert.equal(restored.history[assessment.id][0].results[0].response.working,"original exact work");
  assert.equal(restored.history[assessment.id][1].score,6);
  progress=beginMathAttempt(progress,assessment);
  assert.equal(progress.history[assessment.id][0].score,5);
  assert.deepEqual(progress.responses[first.id],{values:[],working:""});
  assert.equal(progress.history[assessment.id].length,2);
});

test("tutor sees labeled options, actual math responses, working and reviewed snapshots without active-test solutions",()=>{
  const course=mathCourses[0],section=courseChapters(course)[0].sections[0],question=section.questions.find(q=>q.fields[0].options);
  let p=emptyMathProgress();p=updateMathResponse(p,question.id,canonical(question));p=checkMathQuestion(p,question);
  const context=mathTutorContext(course,p,section.id,question.id);
  assert.equal(context.courseCode,"MATH 1006");
  assert.ok(context.activePractice.options.length>0);
  assert.equal(context.activePractice.options[0].label,"A");
  assert.equal(context.activePractice.working,"My exact working\nSecond line");
  assert.equal(context.activePractice.status,"passed");
  assert.equal(context.activePractice.shownAnswer,null);
  assert.ok(mathTutorContext(course,p,section.id,question.id,undefined,true).activePractice.shownAnswer);
  const t=course.units[0].assessment;
  p=updateMathResponse(p,t.questions[0].id,canonical(t.questions[0]));
  const active=mathTutorContext(course,p,t.id);
  assert.equal(active.masteryAssessment.mode,"active_test");
  assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null&&q.graderFeedback===null));
  assert.equal(active.masteryAssessment.questions[0].learnerAnswer,t.questions[0].fields[0].answer);
  p=submitMathAttempt(p,t,"one");
  p=updateMathResponse(p,t.questions[0].id,{values:["changed draft"],working:"changed work"});
  const review=mathTutorContext(course,p,t.id);
  assert.equal(review.masteryAssessment.mode,"results_review");
  assert.equal(review.masteryAssessment.questions[0].learnerAnswer,t.questions[0].fields[0].answer,"review uses submitted snapshot, not edited draft");
  assert.ok(review.masteryAssessment.questions[0].referenceSolution);
  assert.ok(JSON.stringify(review).length<48000,"fits existing tutor context limit");
});

test("historical questions and retry context survive changes to the current question set",()=>{
  const course=mathCourses[0],current=course.units[0].assessment;
  const historical={...current,questions:[{...structuredClone(current.questions[0]),id:"retired-question",prompt:"The original prompt, preserved exactly."}]};
  let p=emptyMathProgress();p=updateMathResponse(p,"retired-question",canonical(historical.questions[0]));
  p=submitMathAttempt(p,historical,"old");
  p=readMathRecords(JSON.parse(JSON.stringify({[course.id]:p})))[course.id];
  assert.equal(p.history[current.id][0].results[0].question.prompt,"The original prompt, preserved exactly.");
  p=beginMathAttempt(p,current,p.history[current.id][0],["retired-question"]);
  p=updateMathResponse(p,"retired-question",{values:["42"],working:"retry in progress"});
  p=readMathRecords(JSON.parse(JSON.stringify({[course.id]:p})))[course.id];
  const context=mathTutorContext(course,p,current.id);
  assert.equal(context.masteryAssessment.questions[0].prompt,"The original prompt, preserved exactly.");
  assert.equal(context.masteryAssessment.questions[0].learnerAnswer,"42");
  assert.equal(context.masteryAssessment.questions[0].referenceSolution,null);
});

test("course integration preserves Java storage and includes math in backup/navigation",async()=>{
  const source=await readFile(new URL("../app/CommandCenter.tsx",import.meta.url),"utf8");
  assert.match(source,/math: readMathRecords|readMathRecords\(data.math\)/);
  assert.match(source,/setMath\(readMathRecords\(restored.math\)\)/);
  assert.match(source,/progress=\{\{ completed, practice, math, degreeRecords, auditSnapshot \}\}/);
  assert.match(source,/<MathCourseView/);
  assert.match(source,/activeLesson\?\.courseCode/);
  assert.match(source,/PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(source,/PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
});

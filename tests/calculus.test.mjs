import assert from "node:assert/strict";
import test from "node:test";
import { math1201 } from "../app/data/math1201.ts";
import { courseQuestions, courseChapters } from "../app/math/courses.ts";
import { evaluateMath, gradeField, gradeMath } from "../app/math/grading.ts";
import { beginMathAttempt, checkMathQuestion, emptyMathProgress, mathCourseProgress, mathTutorContext, readMathRecords, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";

const questions=Object.fromEntries(courseQuestions(math1201).map(q=>[q.id,q]));
const response=q=>({values:q.fields.map(f=>f.answer),working:""});
const answer=(id,...values)=>gradeMath(questions[id],{values,working:""});
const functionGrade=(expected,actual)=>gradeField({label:"Derivative",answer:expected,kind:"function"},actual);

test("Calculus I is full, sequenced, and primarily typed practice",()=>{
  assert.equal(courseChapters(math1201).length,12);
  assert.equal(courseChapters(math1201).flatMap(c=>c.sections).length,28);
  assert.equal(courseQuestions(math1201).length,270);
  assert.ok(courseQuestions(math1201).filter(q=>q.fields.some(f=>f.kind!=="choice")).length>220);
  assert.deepEqual(math1201.units.map(u=>u.assessment.questions.length),[7,7,7,7,7,7]);
  assert.equal(new Set(courseQuestions(math1201).map(q=>q.id)).size,270);
});

test("symbolic calculus grading accepts taught equivalent forms, not only canonical spelling",()=>{
  const equivalents=[
    ["c-power-5","0.5*x^(-0.5)"], ["c-power-6","(3/2)x^(1/2)"],
    ["c-chain-1","4*(3x+1)^3*3"], ["c-chain-3","2/(2*(2x+1)^(1/2))"],
    ["c-chain-5","(x^2+1)^2*(7x^2+1)"],
    ["c-trigd-4","sin(2*x)"], ["c-trigd-5","2/cos(2x)^2"],
    ["c-trigd-6","sin(x)/cos(x)^2-cos(x)/sin(x)^2"],
    ["c-explog-1","-2e^(-2x)"], ["c-explog-2","ln(5)*exp(x*ln(5))"],
    ["c-explog-5","f'(x) = (1+x)e^x"],
    ["c-invd-2","1/sqrt(4-x^2)"], ["c-invd-4","2x/(x^4+1)"],
    ["c-u3-1","cos(2x)+x*(-sin(2x))*2"],
    ["c-ftcd-5","2x^3+x-1"], ["c-sub-4","ln(5+x*x)"],
    ["c-sub-5","(x^2+1)^(1/2)"], ["c-sub-7","(1/2)*ln(x)*ln(x)"],
    ["c-u6-1","cos(x*x*x)*(3*x*x)"], ["c-u6-3","e^(x^3)"]
  ];
  for(const [id,value] of equivalents) assert.ok(answer(id,value).passed,`${id}: ${value}: ${JSON.stringify(answer(id,value))}`);
  for(const [expected,actual] of [["1","sin(x)^2+cos(x)^2"],["sec(x)^2","1+tan(x)^2"],["x^2+1","sqrt(x^2+1)*sqrt(x^2+1)"],["cos(x)","cos(-x)"],["-sin(x)","sin(-x)"]]) assert.ok(functionGrade(expected,actual).passed,actual);
});

test("wrong signs, missing chain factors, bad endpoints and sample-fitting answers fail",()=>{
  for(const [id,...values] of [
    ["c-law-4","0"],["c-power-5","sqrt(x)/2"],["c-chain-1","4*(3*x+1)^3"],
    ["c-trigd-2","5*sin(5*x)"],["c-trigd-3","cos(x^2)"],["c-trigd-4","2*cos(x)"],
    ["c-explog-2","x*5^(x-1)"],["c-explog-3","1/(3*x+2)"],
    ["c-invd-3","1/sqrt(1-x^2)"],["c-invd-4","2*x/(1+x^2)"],
    ["c-impl-3","-2/3"],["c-rate-3","3/2"],["c-ext-2","3","3"],
    ["c-shape-1","[2,inf)"],["c-opt-2","40","20"],["c-motion-4","0"],
    ["c-sum-4","10"],["c-intprop-3","11","5"],
    ["c-ftcd-2","2*x*exp(x^2)"],["c-ftcd-3","sin(3*x)"],["c-ftcd-4","x^2"],
    ["c-ftce-5","8/3"],["c-ftce-6","4"],["c-sub-2","exp(4*x)"],
    ["c-sub-3","cos(2*x)/2"],["c-dsub-7","2*ln(2)"],["c-u6-7","3/2"]
  ]) assert.ok(!answer(id,...values).passed,id);
  const sampleProduct=[-3.17,-1.31,-0.43,0.23,0.71,1.37,2.19,4.61].map(x=>`(x-(${x}))`).join("*");
  assert.ok(!functionGrade("cos(x)",`cos(x)+${sampleProduct}`).passed,"matching sampled points never proves equivalence");
  for(const value of ["0/(x-x)","0/(sin(x)^2+cos(x)^2-1)","sqrt(-1)","x^1000000","globalThis.process.exit()","1;alert(1)"]) assert.ok(!functionGrade("0",value).passed,value);
  assert.ok(!functionGrade("x","sqrt(x^2)").passed,"do not erase absolute-value behavior");
  const unconfirmed=functionGrade("exp(2*x)","exp(x)^2");
  assert.equal(unconfirmed.passed,false);
  assert.match(unconfirmed.feedback,/not a confirmed mathematical error/i);
});

test("independent numerical differentiation checks authored derivative references",()=>{
  // Test oracle only: these finite differences never participate in learner grading.
  const originals={
    "c-power-1":"x^5","c-power-2":"3*x^4-2*x^2+7*x-9","c-power-4":"1/x^3","c-power-5":"sqrt(x)","c-power-6":"x^(3/2)",
    "c-prod-1":"x*(x^2+4)","c-prod-2":"(x^2-1)*(x^2+1)","c-prod-3":"(2*x+1)*(x^2-3*x)","c-prod-4":"(x+2)/(x-2)","c-prod-5":"x/(x^2+1)",
    "c-chain-1":"(3*x+1)^4","c-chain-2":"(x^2-2)^5","c-chain-3":"sqrt(2*x+1)","c-chain-4":"1/(x^2+1)","c-chain-5":"x*(x^2+1)^3","c-chain-7":"((x^2+1)^2+3)^2",
    "c-trigd-1":"3*sin(x)-2*cos(x)","c-trigd-2":"cos(5*x)","c-trigd-3":"sin(x^2)","c-trigd-4":"sin(x)^2","c-trigd-5":"tan(2*x)","c-trigd-6":"sec(x)+csc(x)","c-trigd-7":"x^2*sin(x)",
    "c-explog-1":"exp(-2*x)","c-explog-2":"5^x","c-explog-3":"ln(3*x+2)","c-explog-4":"log(x)","c-explog-5":"x*exp(x)","c-explog-6":"ln(sqrt(x))",
    "c-invd-2":"asin(x/2)","c-invd-3":"acos(x)","c-invd-4":"atan(x^2)",
    "c-trans-r1":"exp(x)*sin(x)","c-trans-r2":"ln(1+x^2)+atan(x)",
    "c-rules-r1":"(x^2+3)^4","c-rules-r2":"(x^2+1)/(x+1)",
    "c-u2-3":"(x^2+2)*(3*x-1)","c-u2-4":"(2*x-1)/(x+3)","c-u2-5":"sqrt(3*x+4)",
    "c-u3-1":"x*cos(2*x)","c-u3-2":"ln(4+x^2)+exp(-x)","c-u3-3":"atan(2*x)"
  };
  for(const [id,original] of Object.entries(originals)) for(const x of [0.19,0.43,0.67]) {
    const h=1e-6,estimate=(evaluateMath(original,x+h)-evaluateMath(original,x-h))/(2*h),actual=evaluateMath(questions[id].fields[0].answer,x);
    assert.ok(Math.abs(actual-estimate)<2e-5*Math.max(1,Math.abs(actual)),`${id} at ${x}: ${actual} vs ${estimate}`);
  }
});

test("independent differentiation verifies antiderivatives and integration constants",()=>{
  const integrands={"c-anti-1":"4*x^3","c-anti-2":"3*x^2-2*x+5","c-anti-3":"x^(-2)","c-anti-4":"1/x","c-anti-5":"2*exp(x)+3*sin(x)","c-anti-6":"3*x^2","c-anti-7":"cos(x)","c-anti-r1":"exp(x)+2*x","c-anti-r3":"cos(x)+1/(1+x^2)","c-sub-1":"6*x*(x^2+2)^2","c-sub-2":"exp(4*x)","c-sub-3":"sin(2*x)","c-sub-4":"2*x/(x^2+5)","c-sub-5":"x/sqrt(x^2+1)","c-sub-6":"cos(x)/(1+sin(x)^2)","c-sub-7":"ln(x)/x","c-sub-8":"x*exp(x^2)","c-sub-r2":"cos(x)*exp(sin(x))","c-u5-1":"4*x^3-2","c-u5-2":"exp(x)-2*sin(x)","c-u6-3":"3*x^2*exp(x^3)"};
  for(const [id,integrand] of Object.entries(integrands)) for(const x of [0.31,0.73,1.29]) {
    const f=questions[id].fields[0].answer,h=1e-6,derivative=(evaluateMath(f,x+h)-evaluateMath(f,x-h))/(2*h),expected=evaluateMath(integrand,x);
    assert.ok(Math.abs(derivative-expected)<2e-5*Math.max(1,Math.abs(expected)),id);
  }
  for(const [id,x,y] of [["c-anti-6",2,10],["c-anti-7",0,-2],["c-anti-r1",0,4],["c-u5-1",1,6]]) assert.equal(evaluateMath(questions[id].fields[0].answer,x),y,id);
});

test("independent results span limits, geometry, optimization, sums, FTC, and substitution",()=>{
  for(const [id,...values] of [
    ["c-u1-1","11"],["c-u1-3","1/6"],["c-u1-4","4","5"],
    ["c-prod-6","8"],["c-prod-7","4/3"],["c-u3-4","-2.5"],
    ["c-rate-4","1"],["c-rate-5","2"],["c-rate-6","-18*pi"],
    ["c-lin-2","3.01"],["c-lin-5","0.4*pi"],["c-mvt-5","e-1"],
    ["c-shape-5","2","-16"],["c-opt-5","15"],["c-opt-7","2"],
    ["c-u4-6","525"],["c-motion-2","17"],["c-anti-r2","5"],
    ["c-sum-8","1/3"],["c-intprop-5","-12"],["c-acc-r2","-5"],
    ["c-ftce-3","2"],["c-ftce-7","2.5"],["c-ftc-r2","5"],
    ["c-dsub-1","12"],["c-dsub-3","0.5"],["c-dsub-4","ln(2)/2"],
    ["c-dsub-5","26/3"],["c-sub-r1","7.5"],["c-u6-4","2*ln(2)"]
  ]) assert.ok(answer(id,...values).passed,id);
});

test("Calculus attempts and individual retries preserve function fields, exact answers and tutor context",()=>{
  const assessment=math1201.units[5].assessment,first=assessment.questions[0];
  let p=emptyMathProgress();p.position=assessment.id;
  for(const q of assessment.questions)p=updateMathResponse(p,q.id,response(q));
  p=updateMathResponse(p,first.id,{values:["cos(x^2)"],working:"old scratch remains"});
  const active=mathTutorContext(math1201,p,assessment.id);
  assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null&&q.graderFeedback===null));
  p=submitMathAttempt(p,assessment,"calc-first","2026-08-31T03:00:00Z");
  assert.equal(p.history[assessment.id][0].score,6);
  const original=JSON.stringify(p.history[assessment.id][0]);
  p=readMathRecords(JSON.parse(JSON.stringify({math1201:p}))).math1201;
  assert.equal(p.history[assessment.id][0].results[0].question.fields[0].kind,"function");
  assert.equal(JSON.stringify(p.history[assessment.id][0]),original);
  p=beginMathAttempt(p,assessment,p.history[assessment.id][0],[first.id]);
  p=readMathRecords(JSON.parse(JSON.stringify({math1201:p}))).math1201;
  assert.deepEqual(p.drafts[assessment.id].questionIds,[first.id]);
  p=updateMathResponse(p,first.id,{values:["cos(x*x*x)*(3*x*x)"],working:""});
  p=submitMathAttempt(p,assessment,"calc-retry","2026-08-31T04:00:00Z");
  assert.equal(p.history[assessment.id][1].score,7);
  assert.equal(JSON.stringify(p.history[assessment.id][0]),original);
  assert.deepEqual(p.history[assessment.id][1].results.slice(1),p.history[assessment.id][0].results.slice(1));
  const review=mathTutorContext(math1201,p,assessment.id);
  assert.equal(review.courseCode,"MATH 1201");
  assert.equal(review.masteryAssessment.questions[0].learnerAnswer,"cos(x*x*x)*(3*x*x)");
  assert.ok(review.masteryAssessment.questions[0].referenceSolution);
  assert.ok(JSON.stringify(review).length<48000);
  const chapter=courseChapters(math1201)[0];
  for(const q of [...chapter.sections.flatMap(s=>s.questions),...chapter.review]){p=updateMathResponse(p,q.id,response(q));p=checkMathQuestion(p,q);}
  assert.equal(mathCourseProgress(math1201,p).chaptersCleared,1,"unit mastery does not gate chapter completion");
});

test("unconfirmed equivalent test answers keep that distinction in saved review context",()=>{
  const assessment=math1201.units[5].assessment;
  let p=emptyMathProgress();
  for(const q of assessment.questions)p=updateMathResponse(p,q.id,response(q));
  p=updateMathResponse(p,"c-u6-3",{values:["exp(x^3/2)^2"],working:""});
  p=submitMathAttempt(p,assessment,"unconfirmed");
  p=readMathRecords(JSON.parse(JSON.stringify({math1201:p}))).math1201;
  const context=mathTutorContext(math1201,p,assessment.id);
  const result=context.masteryAssessment.questions.find(q=>q.questionId==="c-u6-3");
  assert.equal(result.result,"unverified");
  assert.equal(result.learnerAnswer,"exp(x^3/2)^2");
  assert.match(result.graderFeedback[0].feedback,/not a confirmed mathematical error/);
  assert.equal(p.history[assessment.id][0].score,6);
});

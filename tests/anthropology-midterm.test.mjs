import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { anth1200, anth1200MidtermCoverage } from "../app/data/anth1200.ts";
import { auditMathCourses, chapterQuestions, courseQuestions } from "../app/math/courses.ts";
import { gradeMath } from "../app/math/grading.ts";
import { beginMathAttempt, checkMathQuestion, emptyMathProgress, mathCourseProgress, mathTutorContext, readMathRecords, resetAnthropologyReviews, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";

const originalUnits = anth1200.units.slice(0,3), midterm = anth1200.units[3], extra = anth1200.units[4];
const all = Object.fromEntries(courseQuestions(anth1200).map(q=>[q.id,q]));
const canonical = q=>({values:q.fields.map(f=>f.answer),working:"My saved explanation"});
const complete = (state,q)=>checkMathQuestion(updateMathResponse(state,q.id,canonical(q)),q);

test("midterm appends guide-aligned practice without changing any existing Exam 1 curriculum or question IDs",()=>{
  assert.equal(createHash("sha256").update(JSON.stringify(originalUnits)).digest("hex"),"16a3252c2e2a6bb1883e4fef462884ac1f8823f995a757828ac12e93d4dbb25e");
  assert.equal(midterm.id,"anth-unit-4");assert.equal(extra.id,"anth-unit-5");
  assert.equal(midterm.chapters.length,4);assert.equal(extra.chapters.length,1);
  assert.equal(midterm.chapters.flatMap(chapterQuestions).length,134);
  assert.equal(midterm.assessment.questions.length,32);
  assert.equal(extra.chapters.flatMap(chapterQuestions).length,24);
  assert.equal(extra.assessment.questions.length,10);
  assert.deepEqual(auditMathCourses(),[]);
  assert.match(extra.chapters[0].description,/not explicitly named/);
  assert.match(anth1200.description,/not explicitly listed/);
  assert.match(midterm.assessment.title,/Primatology Midterm/);
});

test("each new guide definition, comparison and essay topic reaches taught practice in the main midterm unit",()=>{
  assert.equal(anth1200MidtermCoverage.length,37);
  assert.equal(new Set(anth1200MidtermCoverage.map(x=>x.guidePrompt)).size,37);
  const ids=new Set([...midterm.chapters.flatMap(chapterQuestions),...midterm.assessment.questions].map(q=>q.id));
  for(const item of anth1200MidtermCoverage)assert.ok(ids.has(item.questionId),item.guidePrompt);
  assert.ok(anth1200MidtermCoverage.some(x=>x.guidePrompt.includes("adaptation and evolutionary")));
  assert.ok(anth1200MidtermCoverage.some(x=>x.guidePrompt.includes("after cyclone")));
  for(const chapter of midterm.chapters)for(const q of chapter.review){
    assert.equal(q.fields.length,1);assert.equal(q.fields[0].kind,"choice");
  }
});

test("existing saved completions, notes and historical attempts remain intact when new units are present",()=>{
  let state=emptyMathProgress();
  for(const chapter of originalUnits.flatMap(u=>u.chapters))for(const q of chapterQuestions(chapter))state=complete(state,q);
  const oldTest=originalUnits[2].assessment;
  for(const q of oldTest.questions)state=updateMathResponse(state,q.id,canonical(q));
  state=submitMathAttempt(state,oldTest,"exam1-before-extension","2026-11-04T18:00:00Z");
  state.position="anth-dna-structure";state.questions={[state.position]:"anth-dna-3"};
  const before=structuredClone(state);
  const restored=readMathRecords(JSON.parse(JSON.stringify({anth1200:state}))).anth1200;
  for(const key of ["responses","checked","passed","drafts","position","questions"])assert.deepEqual(restored[key],before[key],key);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.history[oldTest.id])),JSON.parse(JSON.stringify(before.history[oldTest.id])));
  assert.deepEqual(restored.history[midterm.assessment.id],[]);
  assert.equal(mathCourseProgress(anth1200,restored).chaptersCleared,6);
  assert.equal(mathCourseProgress(anth1200,restored).chapterCount,11);
  assert.equal(restored.history[oldTest.id][0].score,46);
  assert.ok(!restored.passed.some(id=>id.startsWith("anth-pm-")));
});

test("new reviews reset as complete chapter reviews without erasing other reviews, lessons or test history",()=>{
  const [first,second]=midterm.chapters;let state=emptyMathProgress();
  for(const q of [...first.review,...second.review,...first.sections[0].questions])state=complete(state,q);
  state.position=`${first.id}-review`;state.questions={[state.position]:first.review.at(-1).id};
  for(const q of midterm.assessment.questions)state=updateMathResponse(state,q.id,canonical(q));
  state=submitMathAttempt(state,midterm.assessment,"new-test","2026-11-05T18:00:00Z");
  const reset=readMathRecords({anth1200:resetAnthropologyReviews(state,anth1200,first.id)}).anth1200;
  assert.ok(first.review.every(q=>!reset.passed.includes(q.id)));
  assert.ok(second.review.every(q=>reset.passed.includes(q.id)));
  assert.ok(first.sections[0].questions.every(q=>reset.passed.includes(q.id)));
  assert.deepEqual(JSON.parse(JSON.stringify(reset.history[midterm.assessment.id])),JSON.parse(JSON.stringify(state.history[midterm.assessment.id])));
  assert.equal(reset.questions[state.position],first.review[0].id);
});

test("grader distinguishes the new guide's most consequential misconceptions",()=>{
  for(const [id,wrong] of [
    ["forces-6","Selection for that allele"],
    ["species-5","They necessarily interbreed routinely in nature"],
    ["mammals-5","Yes; all mammals must give live birth"],
    ["tarsiers-3","Strepsirrhini"],
    ["platyrrhines-4","Every species has a prehensile tail"],
    ["catarrhines-8","Every catarrhine lacks a tail"],
    ["identify-6","Definitely Madagascar from those clues alone"],
    ["social-7","A multi-generation tradition is proved"]
  ]){
    const q=all[`anth-pm-${id}`];assert.ok(q,id);
    assert.ok(q.fields[0].options.includes(wrong),id);
    assert.ok(!gradeMath(q,{values:[wrong],working:""}).passed,id);
    assert.ok(gradeMath(q,canonical(q)).passed,id);
  }
});

test("tutor respects new lesson order and withholds reference solutions during the midterm test",()=>{
  const state=emptyMathProgress();
  const early=mathTutorContext(anth1200,state,"anth-pm-forces","anth-pm-forces-1");
  assert.ok(early.lessonReference.availableConcepts.includes("anth-pm-force-retrieval"));
  assert.ok(!early.lessonReference.availableConcepts.includes("anth-pm-tarsier"));
  const later=mathTutorContext(anth1200,state,"anth-pm-identify","anth-pm-identify-1");
  assert.ok(later.lessonReference.availableConcepts.includes("anth-pm-tarsier"));
  assert.ok(!later.lessonReference.availableConcepts.includes("anth-pm-culture"));
  const active=mathTutorContext(anth1200,beginMathAttempt(state,midterm.assessment),midterm.assessment.id);
  assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null));
});

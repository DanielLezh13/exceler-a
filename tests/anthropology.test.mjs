import assert from "node:assert/strict";
import test from "node:test";
import { anth1200, anth1200GuideCoverage } from "../app/data/anth1200.ts";
import { auditMathCourses, courseChapters, courseQuestions, mathCourses } from "../app/math/courses.ts";
import { gradeField, gradeMath } from "../app/math/grading.ts";
import { beginMathAttempt, checkMathQuestion, emptyMathProgress, mathCourseProgress, mathTutorContext, readMathRecords, submitMathAttempt, updateMathResponse } from "../app/math/progress.ts";

const questions = courseQuestions(anth1200), byId = Object.fromEntries(questions.map(q=>[q.id,q]));
const canonical = q => ({values:q.fields.map(f=>f.answer),working:"My definition and example."});

test("old completed chapter reviews carry all individual answers, aliases and notes into the split choices",()=>{
  const reviews=courseChapters(anth1200).flatMap(c=>c.review),groups=new Map();
  for(const q of reviews)if(q.legacyReviewField){
    const old=q.legacyReviewField;
    if(!groups.has(old.questionId))groups.set(old.questionId,{...q,id:old.questionId,fields:[]});
    groups.get(old.questionId).fields[old.index]=old.field;
  }
  let state=emptyMathProgress();
  for(const q of courseChapters(anth1200).flatMap(c=>c.sections.flatMap(s=>s.questions))) {
    state=updateMathResponse(state,q.id,canonical(q));state=checkMathQuestion(state,q);
  }
  for(const q of [...groups.values(),...reviews.filter(q=>!q.legacyReviewField)]){
    const values=q.fields.map(f=>f.kind==="number"&&f.answer==="0.25"?"25%":f.acceptedAnswers?.[0]??f.answer);
    state=updateMathResponse(state,q.id,{values,working:`Saved explanation for ${q.id}`});state=checkMathQuestion(state,q);
    assert.ok(state.passed.includes(q.id),q.id);
  }
  const assessment=anth1200.units[0].assessment;
  for(const q of assessment.questions)state=updateMathResponse(state,q.id,canonical(q));
  state=submitMathAttempt(state,assessment,"old-test","2026-10-06T12:00:00Z");
  state.position="anth-division-review";state.questions={[state.position]:"anth-division-review-1"};
  const original=JSON.stringify(state),other=emptyMathProgress(),restored=readMathRecords({anth1200:state,math1006:other});
  assert.equal(JSON.stringify(state),original,"reading must not mutate the old saved record");
  assert.equal(mathCourseProgress(anth1200,restored.anth1200).chaptersCleared,6);
  for(const q of reviews){
    assert.ok(restored.anth1200.passed.includes(q.id),q.id);
    assert.deepEqual(restored.anth1200.responses[q.id].values,[q.fields[0].answer]);
    assert.equal(restored.anth1200.responses[q.id].working,`Saved explanation for ${q.legacyReviewField?.questionId??q.id}`);
  }
  for(const unit of anth1200.units) assert.deepEqual(JSON.parse(JSON.stringify(restored.anth1200.history[unit.assessment.id])),JSON.parse(JSON.stringify(state.history[unit.assessment.id]??[])));
  assert.equal(restored.anth1200.position,state.position);assert.deepEqual(restored.anth1200.questions,state.questions);
  assert.deepEqual(restored.math1006.responses,other.responses);
  assert.deepEqual(readMathRecords(JSON.parse(JSON.stringify(restored))).anth1200,restored.anth1200,"migration must be idempotent");
});

test("split reviews retain checked partial credit, keep unchecked answers unchecked, and respect genotype case",()=>{
  const first=byId["anth-division-review-1"],second=byId["anth-division-review-1-part-2"];
  const old={...first,fields:[first.legacyReviewField.field,second.legacyReviewField.field]};
  let state=updateMathResponse(emptyMathProgress(),old.id,{values:["homologs","nucleotide"],working:"My saved note"});
  state=checkMathQuestion(state,old);
  let restored=readMathRecords({anth1200:state}).anth1200;
  assert.ok(restored.passed.includes(first.id));assert.ok(!restored.passed.includes(second.id));
  assert.equal(restored.responses[second.id].values[0],"nucleotide");
  restored=updateMathResponse(restored,second.id,{values:[second.fields[0].answer],working:"New note"});restored=checkMathQuestion(restored,second);
  restored=readMathRecords({anth1200:restored}).anth1200;
  assert.ok(restored.passed.includes(second.id));assert.equal(restored.responses[second.id].working,"New note");
  const unchecked=updateMathResponse(emptyMathProgress(),old.id,{values:["homologs","sister chromatid"],working:""});
  assert.deepEqual(readMathRecords({anth1200:unchecked}).anth1200.passed,[]);
  const genotype=byId["anth-inherit-review-3-part-3"].fields[0];
  assert.ok(gradeField(genotype,"aa").passed);assert.ok(!gradeField(genotype,"AA").passed);assert.ok(!gradeField(genotype,"Aa").passed);
});

test("Anthropology maps every guide prompt to reachable, taught practice",()=>{
  assert.equal(mathCourses.find(c=>c.id==="anth1200"),anth1200);
  assert.deepEqual(auditMathCourses(),[]);
  assert.equal(anth1200GuideCoverage.length,65);
  assert.equal(new Set(anth1200GuideCoverage.map(item=>item.guidePrompt)).size,65);
  for(const item of anth1200GuideCoverage) assert.ok(byId[item.questionId],item.guidePrompt);
  assert.equal(courseChapters(anth1200).length,6);
  assert.equal(courseChapters(anth1200).flatMap(c=>c.sections).length,17);
  assert.equal(questions.length,322);
  for(const chapter of courseChapters(anth1200)) for(const section of chapter.sections) {
    assert.ok(section.questions.some(q=>q.fields.some(f=>f.kind==="text")),section.id);
    assert.ok(section.questions.some(q=>q.fields.some(f=>f.kind==="choice")),section.id);
  }
  assert.deepEqual(anth1200.units.map(u=>u.assessment.questions.length),[12,20,46]);
  assert.deepEqual(courseChapters(anth1200).map(c=>c.review.length),[10,19,15,14,11,12]);
  for(const chapter of courseChapters(anth1200)) for(const q of chapter.review) {
    assert.equal(q.fields.length,1,q.id);assert.equal(q.fields[0].kind,"choice",q.id);
    for(const option of q.fields[0].options) assert.equal(gradeField(q.fields[0],option).passed,option===q.fields[0].answer,`${q.id}: ${option}`);
  }
  assert.doesNotMatch(questions.map(q=>q.prompt).join(" "),/Lucy|Australopithecus|Homo erectus|Hardy.Weinberg|dihybrid|codominance|nondisjunction/i);
});

test("recall checker accepts every authored synonym but rejects blanks, unrelated terms and answer-containing sentences",()=>{
  for(const q of questions) for(const field of q.fields) {
    assert.ok(gradeField(field,field.answer).passed,q.id);
    assert.ok(!gradeField(field,"").passed,q.id);
    if(field.kind!=="text")continue;
    for(const alias of field.acceptedAnswers??[]) assert.ok(gradeField(field,alias).passed,`${q.id}: ${alias}`);
    assert.ok(gradeField(field,`  ${field.answer} . `).passed,q.id);
    if(!field.caseSensitive) assert.ok(gradeField(field,field.answer.toUpperCase()).passed,q.id);
    assert.ok(!gradeField(field,`not ${field.answer}`).passed,q.id);
    assert.ok(!gradeField(field,`${field.answer} or some other thing`).passed,q.id);
  }
  assert.ok(gradeField(byId["anth-history-4"].fields[0],"AL JAHIZ").passed);
  assert.ok(gradeField(byId["anth-shuffle-2"].fields[0],"Prophase 1.").passed);
  assert.ok(!gradeField(byId["anth-shuffle-2"].fields[0],"meiosis II").passed);
  assert.ok(!gradeField(byId["anth-dominance-4"].fields[0],"AA").passed);
  assert.ok(!gradeField(byId["anth-dominance-4"].fields[0],"Aa").passed);
  assert.ok(gradeField(byId["anth-punnett-6"].fields[0],"aA").passed);
  for(const value of ["25%","1/4","0.25"]) assert.ok(gradeField(byId["anth-punnett-2"].fields[0],value).passed,value);
  assert.ok(!gradeField(byId["anth-punnett-2"].fields[0],"25").passed);
});

test("Anthropology restoration preserves another course and saves explanation, position and partial answers",()=>{
  const otherCourse=mathCourses[0],otherQ=courseQuestions(otherCourse)[0];
  let other=emptyMathProgress();other=updateMathResponse(other,otherQ.id,canonical(otherQ));other=checkMathQuestion(other,otherQ);
  const q=byId["anth-dna-3"];let state=emptyMathProgress();state.position="anth-dna-structure";state.questions={[state.position]:q.id};
  state=updateMathResponse(state,q.id,{values:["sugar","phosphate","nitrogenous base"],working:"A nucleotide includes a base, not an amino acid."});state=checkMathQuestion(state,q);
  state=updateMathResponse(state,q.id,{...state.responses[q.id],working:"A nucleotide includes a base, not an amino acid. DNA contains nucleotides."});
  assert.ok(state.passed.includes(q.id),"editing an ungraded explanation must preserve a passed answer");
  const restored=readMathRecords(JSON.parse(JSON.stringify({[otherCourse.id]:other,anth1200:state})));
  assert.deepEqual(restored[otherCourse.id].responses,other.responses);assert.deepEqual(restored[otherCourse.id].passed,other.passed);
  assert.deepEqual(restored.anth1200.responses,state.responses);assert.deepEqual(restored.anth1200.passed,state.passed);
  assert.equal(restored.anth1200.position,state.position);assert.deepEqual(restored.anth1200.questions,state.questions);
  const context=mathTutorContext(anth1200,restored.anth1200,state.position,q.id);
  assert.equal(context.courseCode,"ANTH 1200");assert.match(context.activePractice.kind,/Anthropology/);
  assert.equal(context.activePractice.working,state.responses[q.id].working);
  assert.ok(context.lessonReference.availableConcepts.includes("anth-nucleotide"));
  assert.ok(!context.lessonReference.availableConcepts.includes("anth-speciation"));
  assert.equal(context.activePractice.shownAnswer,null);
  const earlyReview=mathTutorContext(anth1200,state,"anth-thought-review");
  assert.ok(earlyReview.lessonReference.availableConcepts.includes("anth-selection"));
  assert.ok(!earlyReview.lessonReference.availableConcepts.includes("anth-speciation"));
});

test("mixed-test attempts and text synonyms survive reload and a single-question retry",()=>{
  const testDefinition=anth1200.units[2].assessment;let state=beginMathAttempt(emptyMathProgress(),testDefinition);
  for(const q of testDefinition.questions) state=updateMathResponse(state,q.id,canonical(q));
  state=updateMathResponse(state,"anth-exam-10",{values:["ribose","ribose","T","U"],working:"I mixed up the sugars."});
  state=submitMathAttempt(state,testDefinition,"attempt-1","2026-10-04T12:00:00Z");
  assert.equal(state.history[testDefinition.id][0].score,45);
  const original=structuredClone(state.history[testDefinition.id][0]);
  state=readMathRecords(JSON.parse(JSON.stringify({anth1200:state}))).anth1200;
  const field=state.history[testDefinition.id][0].results.find(r=>r.question.id==="anth-exam-25").question.fields[1];
  assert.ok(gradeField(field,"prophase 1 of meiosis").passed,"synonyms must remain in stored test snapshots");
  state=beginMathAttempt(state,testDefinition,state.history[testDefinition.id][0],["anth-exam-10"]);
  const q=byId["anth-exam-10"];state=updateMathResponse(state,q.id,canonical(q));
  state=readMathRecords(JSON.parse(JSON.stringify({anth1200:state}))).anth1200;
  state=submitMathAttempt(state,testDefinition,"attempt-2","2026-10-04T12:05:00Z");
  assert.equal(state.history[testDefinition.id][1].score,46);
  assert.deepEqual(JSON.parse(JSON.stringify(state.history[testDefinition.id][0])),JSON.parse(JSON.stringify(original)));
  const active=mathTutorContext(anth1200,beginMathAttempt(state,testDefinition),testDefinition.id);
  assert.equal(active.masteryAssessment.answerRevealPolicy,"withhold_reference_solutions");
  assert.ok(active.masteryAssessment.questions.every(q=>q.referenceSolution===null));
});

test("study-guide misconceptions receive distinct answers rather than blanket acceptance",()=>{
  for(const [id,wrong] of [["protein-1","translation"],["protein-3","transcription"],["shuffle-3","crossing over"],["force-2","gene flow"],["drift-1","natural selection"],["speciation-2","sympatric"],["allele-2","phenotype"],["allele-3","genotype"]]) {
    const q=byId[`anth-${id}`];assert.ok(!gradeMath(q,{values:[wrong],working:""}).passed,id);
  }
});

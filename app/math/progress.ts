import { chapterQuestions, courseChapters, courseQuestions, mathCourses } from "./courses.ts";
import { gradeMath, mathGradeStatus } from "./grading.ts";
import { readMachineSpec } from "./teachingMachine.ts";
import type { MathAttempt, MathCourse, MathGrade, MathProgress, MathQuestion, MathRecords, MathResponse, MathTutorContext, MathUnit } from "./types.ts";

export const emptyMathProgress = (): MathProgress => ({ responses: {}, checked: {}, passed: [], history: {}, drafts: {} });
export const emptyResponse = (): MathResponse => ({ values: [], working: "" });
export function mathCourseProgress(course: MathCourse, progress: MathProgress) {
  const practicePassed = new Set(progress.passed);
  const mastered = new Set(course.units.flatMap(u => progress.history[u.assessment.id]?.at(-1)?.results.filter(r => r.grade.passed).map(r => r.question.id) ?? []));
  const all = courseQuestions(course);
  const passed = all.filter(q => practicePassed.has(q.id) || mastered.has(q.id)).length;
  const chapters = courseChapters(course);
  return { passed, total: all.length, percent: Math.floor(100 * passed / all.length), chaptersCleared: chapters.filter(c => chapterQuestions(c).every(q => practicePassed.has(q.id))).length, chapterCount: chapters.length };
}
export function updateMathResponse(progress: MathProgress, id: string, response: MathResponse): MathProgress {
  const previous = progress.responses[id];
  if (previous && previous.values.length === response.values.length && previous.values.every((value, i) => value === response.values[i])) {
    return { ...progress, responses: { ...progress.responses, [id]: response } };
  }
  const checked = { ...progress.checked };
  delete checked[id];
  return { ...progress, responses: { ...progress.responses, [id]: response }, checked, passed: progress.passed.filter(item => item !== id) };
}
export function checkMathQuestion(progress: MathProgress, question: MathQuestion): MathProgress {
  const grade = gradeMath(question, progress.responses[question.id] ?? emptyResponse());
  return { ...progress, checked: { ...progress.checked, [question.id]: grade }, passed: [...progress.passed.filter(id => id !== question.id), ...(grade.passed ? [question.id] : [])] };
}
export function beginMathAttempt(progress: MathProgress, test: MathUnit["assessment"], source?: MathAttempt, retryIds?: string[]): MathProgress {
  const questionIds = retryIds ?? test.questions.map(q => q.id);
  const responses = { ...progress.responses };
  questionIds.forEach(id => { responses[id] = source ? structuredClone(source.results.find(r => r.question.id === id)?.response ?? emptyResponse()) : emptyResponse(); });
  return { ...progress, responses, drafts: { ...progress.drafts, [test.id]: { sourceId: source?.id, questionIds } } };
}
export function submitMathAttempt(progress: MathProgress, test: MathUnit["assessment"], id = crypto.randomUUID(), submittedAt = new Date().toISOString()): MathProgress {
  const history = progress.history[test.id] ?? [];
  const draft = progress.drafts[test.id];
  // A completed result cannot be overwritten or double-submitted without a new draft.
  if (history.length && !draft) return progress;
  const source = history.find(a => a.id === draft?.sourceId);
  const questions = source?.results.map(r => r.question) ?? test.questions;
  const results = questions.map(question => {
    const old = source?.results.find(r => r.question.id === question.id);
    if (old && draft && !draft.questionIds.includes(question.id)) return structuredClone(old);
    const response = structuredClone(progress.responses[question.id] ?? emptyResponse());
    return { question: structuredClone(question), response, grade: gradeMath(question, response) };
  });
  const attempt: MathAttempt = { id, submittedAt, kind: source ? "retry" : "full", sourceId: source?.id, results, score: results.filter(r => r.grade.passed).length };
  const drafts = { ...progress.drafts }; delete drafts[test.id];
  return { ...progress, drafts, history: { ...progress.history, [test.id]: [...history, attempt] } };
}
const object = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const readResponse = (value: unknown): MathResponse => {
  const r = object(value);
  return { values: Array.isArray(r?.values) ? r.values.slice(0, 12).map(v => typeof v === "string" ? v.slice(0, 4000) : "") : [], working: typeof r?.working === "string" ? r.working.slice(0, 6000) : "" };
};
function readGrade(value: unknown, fields: number): MathGrade | null {
  const g = object(value);
  if (!Array.isArray(g?.fields) || g.fields.length !== fields) return null;
  const items = g.fields.map(f => { const r = object(f); return r && typeof r.passed === "boolean" && typeof r.feedback === "string" ? { passed: r.passed, feedback: r.feedback.slice(0, 1500) } : null; });
  if (items.some(r => !r)) return null;
  const parts = items as MathGrade["fields"];
  return { passed: parts.every(f => f.passed), fields: parts };
}
export function readMathRecords(value: unknown): MathRecords {
  const root = object(value); const records: MathRecords = {};
  for (const course of mathCourses) {
    const raw = object(root?.[course.id]); if (!raw) continue;
    const state = emptyMathProgress();
    const all = courseQuestions(course);
    const rawResponses = object(raw.responses), rawChecked = object(raw.checked);
    for (const question of all) {
      if (rawResponses?.[question.id]) state.responses[question.id] = readResponse(rawResponses[question.id]);
      if (rawChecked?.[question.id]) state.checked[question.id] = gradeMath(question, state.responses[question.id] ?? emptyResponse());
    }
    const practiceIds = new Set(courseChapters(course).flatMap(chapterQuestions).map(q => q.id));
    state.passed = Object.entries(state.checked).filter(([id,g]) => practiceIds.has(id) && g.passed).map(([id]) => id);
    const rawHistory = object(raw.history), rawDrafts = object(raw.drafts);
    course.units.forEach(unit => {
      const attempts = rawHistory?.[unit.assessment.id];
      state.history[unit.assessment.id] = Array.isArray(attempts) ? attempts.flatMap(value => {
        const a = object(value);
        if (!a || typeof a.id !== "string" || typeof a.submittedAt !== "string" || !Array.isArray(a.results) || !a.results.length || a.results.length > 200) return [];
        const results: MathAttempt["results"] = [];
        for (const result of a.results) {
          const r = object(result), snapshot = object(r?.question);
          // Whitelist the snapshot structure; never execute imported validators or HTML.
          if (!snapshot || typeof snapshot.id !== "string" || results.some(r=>r.question.id===snapshot.id) || typeof snapshot.prompt !== "string" || !Array.isArray(snapshot.fields) || !Array.isArray(snapshot.solution)) return [];
          const fields = snapshot.fields.flatMap(value => { const f = object(value); return f && typeof f.label === "string" && typeof f.answer === "string" && ["number","expression","function","set","interval","choice","logic","pairs","sequence","bits","code","text"].includes(String(f.kind)) ? [{ label:f.label,answer:f.answer,kind:f.kind,acceptedAnswers:Array.isArray(f.acceptedAnswers)?f.acceptedAnswers.filter(v=>typeof v==="string").slice(0,30):undefined,caseSensitive:typeof f.caseSensitive==="boolean"?f.caseSensitive:undefined,machine:readMachineSpec(f.machine),options:Array.isArray(f.options)?f.options.filter(v=>typeof v==="string"):undefined,tolerance:typeof f.tolerance==="number"&&f.tolerance>0&&f.tolerance<0.1?f.tolerance:undefined,form:f.form==="factored"||f.form==="expanded"?f.form:undefined,language:["java","javascript","html","css","sql","text"].includes(String(f.language))?f.language:undefined }] : []; });
          if (fields.length !== snapshot.fields.length || !fields.length) return [];
          const question = { id:snapshot.id,prompt:snapshot.prompt,fields,hint:typeof snapshot.hint==="string"?snapshot.hint:"",solution:snapshot.solution.filter(v=>typeof v==="string"),requires:Array.isArray(snapshot.requires)?snapshot.requires.filter(v=>typeof v==="string"):[] } as MathQuestion;
          const grade=readGrade(r?.grade,fields.length); if (!grade) return [];
          results.push({question,response:readResponse(r?.response),grade});
        }
        return [{id:a.id,submittedAt:a.submittedAt,kind:a.kind==="retry"?"retry" as const:"full" as const,sourceId:typeof a.sourceId==="string"?a.sourceId:undefined,results,score:results.filter(r=>r.grade.passed).length}];
      }) : [];
      const draft=object(rawDrafts?.[unit.assessment.id]);
      if (draft && Array.isArray(draft.questionIds)) {
        const sourceId=typeof draft.sourceId==="string"&&state.history[unit.assessment.id].some(a=>a.id===draft.sourceId)?draft.sourceId:undefined;
        const definitions=state.history[unit.assessment.id].find(a=>a.id===sourceId)?.results.map(r=>r.question)??unit.assessment.questions;
        const questionIds=draft.questionIds.filter((id): id is string=>typeof id==="string"&&definitions.some(q=>q.id===id));
        questionIds.forEach(id=>{if(rawResponses?.[id])state.responses[id]=readResponse(rawResponses[id]);});
        if (questionIds.length && (!draft.sourceId||sourceId)) state.drafts[unit.assessment.id]={questionIds:[...new Set(questionIds)],sourceId};
      }
    });
    if (typeof raw.position === "string") state.position = raw.position;
    const selections=object(raw.questions);
    state.questions={};
    courseChapters(course).forEach(chapter=>{
      [...chapter.sections,{id:`${chapter.id}-review`,questions:chapter.review}].forEach(section=>{
        const selected=selections?.[section.id];
        if(typeof selected==="string"&&section.questions.some(q=>q.id===selected))state.questions![section.id]=selected;
      });
    });
    records[course.id]=state;
  }
  return records;
}

export function mathTutorContext(course: MathCourse, progress: MathProgress, locationId: string, activeQuestionId?: string, reviewedId?: string, shownAnswer = false): MathTutorContext {
  const chapter = courseChapters(course).find(c => c.id === locationId || c.sections.some(s => s.id === locationId) || `${c.id}-review` === locationId);
  const section = chapter?.sections.find(s => s.id === locationId);
  const test = course.units.map(u=>u.assessment).find(t=>t.id===locationId);
  const history = test ? progress.history[test.id] ?? [] : [];
  const attempt = history.find(a=>a.id===reviewedId) ?? history.at(-1);
  const active = test && (!history.length || Boolean(progress.drafts[test.id]));
  const activeDefinitions=history.find(a=>a.id===(test?progress.drafts[test.id]?.sourceId:undefined))?.results.map(r=>r.question)??test?.questions??[];
  const questions = section?.questions ?? chapter?.review ?? [];
  const question=questions.find(q=>q.id===activeQuestionId);
  const response=question?progress.responses[question.id]??emptyResponse():null;
  const grade=question?progress.checked[question.id]:null;
  const availableReviewSections = chapter
    ? courseChapters(course).slice(0, courseChapters(course).indexOf(chapter) + 1).flatMap(c => c.sections)
    : course.units.slice(0, course.units.findIndex(u => u.assessment.id === locationId) + 1).flatMap(u => u.chapters.flatMap(c => c.sections));
  return {
    courseCode:course.code,courseTitle:course.title,courseProgress:mathCourseProgress(course,progress).percent,
    chapterTitle:chapter?.title??test?.title??course.title,sectionTitle:section?.title??test?.title??"Chapter Review",
    lessonReference:section?{title:section.title,paragraphs:section.paragraphs,rules:section.rules,examples:section.examples,plot:section.plot,availableConcepts:[...course.prerequisites,...courseChapters(course).flatMap(c=>c.sections).slice(0,courseChapters(course).flatMap(c=>c.sections).findIndex(s=>s.id===section.id)+1).flatMap(s=>s.teaches)]}:course.code.startsWith("ANTH")?{scope:course.description,availableConcepts:[...course.prerequisites,...availableReviewSections.flatMap(s=>s.teaches)],note:"Exam 1 review. Short answer fields are checked; personal explanations in scratch work need tutor review."}:"Cumulative written mathematics. Final answer fields are checked; scratch work is saved but not automatically graded as a proof.",
    activePractice:question?{questionId:question.id,prompt:question.prompt,kind:course.code.startsWith("ANTH")?"Anthropology recall and application":"Written mathematics",fields:question.fields.map((f,i)=>({label:f.label,kind:f.kind,studentAnswer:response?.values[i]??"",options:f.options?.map((text,j)=>({label:String.fromCharCode(65+j),text,selected:response?.values[i]===text}))??[],feedback:grade?.fields[i]?.feedback??null})),studentAnswer:response?.values.join("; ")??"",working:response?.working,options:question.fields.flatMap((f,i)=>f.options?.map((text,j)=>({label:String.fromCharCode(65+j),text,selected:response?.values[i]===text}))??[]),status:grade?mathGradeStatus(grade):"not_checked",answerShown:shownAnswer,shownAnswer:shownAnswer?{fields:question.fields,steps:question.solution}:null}:null,
    masteryAssessment:test?{assessmentId:test.id,assessmentTitle:test.title,mode:active?(progress.drafts[test.id]?.sourceId?"question_retry":"active_test"):"results_review",answerRevealPolicy:active?"withhold_reference_solutions":"submitted_attempt_review",retryQuestionIds:progress.drafts[test.id]?.questionIds,reviewedAttempt:active?null:attempt?{id:attempt.id,submittedAt:attempt.submittedAt,score:attempt.score,total:attempt.results.length,kind:attempt.kind,sourceAttemptId:attempt.sourceId}:null,questions:(active?activeDefinitions:attempt?.results.map(r=>r.question)??[]).filter(q=>!active||!progress.drafts[test.id]||progress.drafts[test.id].questionIds.includes(q.id)).map(q=>{const result=attempt?.results.find(r=>r.question.id===q.id);const response=active?progress.responses[q.id]??emptyResponse():result?.response??emptyResponse();return {questionId:q.id,prompt:q.prompt,fields:q.fields.map((f,i)=>({label:f.label,options:f.options?.map((text,j)=>({label:String.fromCharCode(65+j),text,selected:response.values[i]===text}))??[],learnerAnswer:response.values[i]??""})),learnerAnswer:response.values.join("; "),working:response.working,result:active?"not_submitted":result?.grade.passed?"correct":result?mathGradeStatus(result.grade):"incorrect",graderFeedback:active?null:result?.grade.fields,referenceSolution:active?null:{fields:q.fields,steps:q.solution}};})}:null,
  };
}

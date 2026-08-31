import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";
import * as courses from "../app/math/courses.ts";
import * as grading from "../app/math/grading.ts";
import * as inputHelp from "../app/math/inputHelp.ts";
import * as progressTools from "../app/math/progress.ts";

// Real component JSX and handlers with deterministic hooks. No browser or live AI call.
const source=await readFile(new URL("../app/math/MathCourseView.tsx",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(course,initial=progressTools.emptyMathProgress()) {
  let progress=structuredClone(initial),context,index=0,effects=[];
  const states=[];
  const hooks={...React,useMemo:factory=>factory(),useState:initial=>{const i=index++;if(!(i in states))states[i]=initial;return [states[i],update=>{states[i]=typeof update==="function"?update(states[i]):update;}];},useRef:()=>({current:null}),useEffect:effect=>effects.push(effect)};
  const modules={"react":hooks,"react/jsx-runtime":jsxRuntime,"lucide-react":icons,"./courses":courses,"./grading":grading,"./inputHelp":inputHelp,"./progress":progressTools};
  const exports={};new Function("require","exports",compiled)(name=>{assert.ok(modules[name],name);return modules[name];},exports);
  return {get progress(){return progress;},get context(){return context;},render(){index=0;effects=[];const tree=exports.default({course,progress,setProgress:update=>{progress=typeof update==="function"?update(progress):update;},onTutorContextChange:value=>{context=value;},onBack:()=>{}});effects.forEach(effect=>effect());return tree;}};
}
function elements(node) {
  if(Array.isArray(node))return node.flatMap(elements);
  if(!node||typeof node!=="object"||!node.props)return [];
  if(typeof node.type==="function"&&["AnswerInputs","WorkedSolution","InputGuide","MathGraph"].includes(node.type.name))return [node,...elements(node.type(node.props))];
  return [node,...elements(node.props.children)];
}
function text(node){if(Array.isArray(node))return node.map(text).join("");if(typeof node==="string"||typeof node==="number")return String(node);return node?.props?text(node.props.children):"";}
function button(tree,label){const node=elements(tree).find(n=>n.type==="button"&&(text(n).trim()===label||n.props["aria-label"]===label));assert.ok(node,`Missing ${label}`);return node;}
function input(tree,id){const node=elements(tree).find(n=>n.type==="input"&&n.props.id===id);assert.ok(node,`Missing input ${id}`);return node;}

test("math practice: type, check, edit, switch question, and restore without stale tutor answers",()=>{
  const course=courses.mathCourses[0],h=harness(course);
  let tree=h.render();
  assert.match(text(tree),/Numbers, Signs & Order/);
  input(tree,"a-sign-1-part-0").props.onChange({target:{value:"5"}});
  tree=h.render();button(tree,"Check Answer").props.onClick();tree=h.render();
  assert.ok(h.progress.passed.includes("a-sign-1"));
  assert.equal(h.context.activePractice.studentAnswer,"5");
  assert.equal(h.context.activePractice.status,"passed");
  input(tree,"a-sign-1-part-0").props.onChange({target:{value:"6"}});tree=h.render();
  assert.equal(h.context.activePractice.status,"not_checked");
  assert.ok(!h.progress.passed.includes("a-sign-1"));
  button(tree,"Next question").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.questionId,"a-sign-2");
  assert.equal(h.context.activePractice.studentAnswer,"");
  const reloaded=harness(course,progressTools.readMathRecords({math1006:h.progress}).math1006);tree=reloaded.render();
  assert.equal(reloaded.context.activePractice.questionId,"a-sign-2");
  button(tree,"Previous question").props.onClick();tree=reloaded.render();
  assert.equal(input(tree,"a-sign-1-part-0").props.value,"6");
});

test("math test UI saves full results and retries just one question across reload",()=>{
  const course=courses.mathCourses[0],testDefinition=course.units[0].assessment;
  const p=progressTools.emptyMathProgress();p.position=testDefinition.id;
  let h=harness(course,p),tree=h.render();
  assert.equal(elements(tree).filter(n=>n.type==="input"&&n.props.type!=="radio").length,6);
  for(const [i,q] of testDefinition.questions.entries()) {input(tree,`${q.id}-part-0`).props.onChange({target:{value:i===0?"999":q.fields[0].answer}});tree=h.render();}
  button(tree,"Submit Test").props.onClick();tree=h.render();
  assert.match(text(tree),/Results · 5\/6/);
  assert.match(text(tree),/Your exact submitted answer/);
  assert.equal(h.context.masteryAssessment.mode,"results_review");
  const original=structuredClone(h.progress.history[testDefinition.id][0]);
  button(tree,"Retry this question").props.onClick();tree=h.render();
  assert.equal(elements(tree).filter(n=>n.type==="input"&&n.props.type!=="radio").length,1);
  assert.equal(h.context.masteryAssessment.mode,"question_retry");
  input(tree,`${testDefinition.questions[0].id}-part-0`).props.onChange({target:{value:"-13"}});
  h=harness(course,progressTools.readMathRecords(JSON.parse(JSON.stringify({math1006:h.progress}))).math1006);tree=h.render();
  assert.equal(input(tree,`${testDefinition.questions[0].id}-part-0`).props.value,"-13");
  button(tree,"Submit retry").props.onClick();tree=h.render();
  assert.match(text(tree),/Results · 6\/6/);
  assert.deepEqual(JSON.parse(JSON.stringify(h.progress.history[testDefinition.id][0].results)),JSON.parse(JSON.stringify(original.results)));
  assert.equal(h.progress.history[testDefinition.id].length,2);
  button(tree,"Attempt 1 · 5/6").props.onClick();tree=h.render();
  assert.equal(h.context.masteryAssessment.questions[0].learnerAnswer,"999");
  button(tree,"Retake whole test").props.onClick();tree=h.render();
  assert.equal(elements(tree).filter(n=>n.type==="input"&&n.props.type!=="radio").length,6);
  button(tree,"Cancel and return to results").props.onClick();tree=h.render();
  assert.equal(h.progress.history[testDefinition.id].length,2);
});

test("every math lesson, review, and unit test produces a complete component tree",()=>{
  for(const course of courses.mathCourses) for(const unit of course.units) {
    const locations=[...unit.chapters.flatMap(c=>[...c.sections.map(s=>s.id),`${c.id}-review`]),unit.assessment.id];
    for(const location of locations) {
      const p=progressTools.emptyMathProgress();p.position=location;
      const h=harness(course,p),tree=h.render(),nodes=elements(tree);
      assert.ok(nodes.some(n=>n.type==="h1"),location);
      assert.ok(nodes.some(n=>n.type==="input"||n.props.role==="radiogroup"),location);
      assert.equal(h.context.courseCode,course.code);
      for(const path of nodes.filter(n=>n.type==="path")) assert.doesNotMatch(path.props.d??"",/NaN|Infinity/);
      if(location!==unit.assessment.id) {button(tree,"Show Answer").props.onClick();h.render();assert.ok(h.context.activePractice.shownAnswer,location);}
    }
  }
});

test("math uses the CS section-check structure, skips passed questions, and keeps solutions in review",async()=>{
  const course=courses.mathCourses[0],section=course.units[0].chapters[0].sections[0];
  let p=progressTools.emptyMathProgress();
  for(const q of section.questions.slice(1,-1)) {
    p=progressTools.updateMathResponse(p,q.id,{values:q.fields.map(f=>f.answer),working:""});
    p=progressTools.checkMathQuestion(p,q);
  }
  const h=harness(course,p);let tree=h.render();
  const hasClass=name=>elements(tree).some(n=>n.props.className?.split(" ").includes(name));
  for(const name of ["practice-session","section-practice","practice-header","practice-score","question-route","practice-workspace","practice-response-row","practice-pagination"])assert.ok(hasClass(name),name);
  assert.match(text(tree),/Section Check/);
  assert.equal(button(tree,"Previous question").props.disabled,true);
  assert.equal(button(tree,"Check Answer").props.disabled,true);
  assert.ok(!elements(tree).some(n=>n.type==="textarea"));
  assert.ok(!hasClass("math-entry-help"),"ordinary signed arithmetic needs no notation tutorial");
  const first=section.questions[0],last=section.questions.at(-1);
  input(tree,`${first.id}-part-0`).props.onChange({target:{value:first.fields[0].answer}});tree=h.render();
  input(tree,`${first.id}-part-0`).props.onKeyDown({key:"Enter",nativeEvent:{isComposing:false},preventDefault(){}});tree=h.render();
  assert.equal(h.context.activePractice.status,"passed");
  assert.deepEqual(h.context.activePractice.shownAnswer.steps,first.solution);
  assert.ok(hasClass("math-practice-solution"));
  button(tree,"Next Question").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.questionId,last.id,"next primary action skips passed questions");
  assert.equal(button(tree,"Next question").props.disabled,true);
  assert.equal(h.context.activePractice.shownAnswer,null,"no solution leaks from the previous question");
  const lastField=last.fields[0];
  if(lastField.options) {
    const selected=elements(tree).find(n=>n.props.role==="radio"&&text(n).endsWith(lastField.answer));
    selected.props.onClick();
  } else input(tree,`${last.id}-part-0`).props.onChange({target:{value:lastField.answer}});
  tree=h.render();
  button(tree,"Check Answer").props.onClick();tree=h.render();
  assert.match(text(tree),/Section Check Complete/);
  assert.ok(hasClass("math-practice-solution"),"the final check must not hide the worked steps");
  assert.equal(button(tree,"All Questions Passed").props.disabled,true);
  assert.equal(button(tree,"Open question 1, passed").props.className.trim(),"passed");
  button(tree,"Open question 1, passed").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.questionId,first.id);
  assert.equal(input(tree,`${first.id}-part-0`).props.value,first.fields[0].answer);
  const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");
  assert.match(css,/\.lesson-section > \.section-practice, \.math-practice\.section-practice\s*\{/);
  assert.doesNotMatch(css,/\.math-question-nav/);
});

test("math answers stay simple and old working is preserved without an editable work box",()=>{
  const course=courses.mathCourses[0],q=course.units[0].chapters[0].sections[0].questions[0];
  const p=progressTools.emptyMathProgress();p.responses[q.id]={values:["4"],working:"My original scratch work\nDo not erase this."};
  const h=harness(course,p);let tree=h.render();
  assert.ok(!elements(tree).some(n=>n.type==="textarea"));
  const saved=elements(tree).find(n=>n.props.className==="math-working-snapshot");
  assert.match(text(saved),/My original scratch work/);
  button(tree,"Show Answer").props.onClick();tree=h.render();
  assert.equal(h.progress.responses[q.id].values[0],"4","revealing does not replace the submitted value");
  assert.equal(h.progress.passed.length,0,"revealing never passes the question");
  input(tree,`${q.id}-part-0`).props.onChange({target:{value:"5"}});tree=h.render();
  assert.equal(h.context.activePractice.working,p.responses[q.id].working);
  assert.equal(h.context.activePractice.shownAnswer,null);
  button(tree,"Check Answer").props.onClick();tree=h.render();
  button(tree,"Hide worked solution").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.shownAnswer,null);
  assert.ok(h.progress.passed.includes(q.id));
  const restored=progressTools.readMathRecords({[course.id]:h.progress})[course.id];
  assert.equal(restored.responses[q.id].working,p.responses[q.id].working);
});

test("math choice cards match CS option labels and support keyboard selection and tutor context",()=>{
  for(const course of courses.mathCourses) {
    const section=courses.courseChapters(course).flatMap(c=>c.sections).find(s=>s.questions.some(q=>q.fields.some(f=>f.options)));
    const q=section.questions.find(q=>q.fields.some(f=>f.options)),field=q.fields.find(f=>f.options);
    const p=progressTools.emptyMathProgress();p.position=section.id;p.questions={[section.id]:q.id};
    const h=harness(course,p);let tree=h.render();
    const radios=()=>elements(tree).filter(n=>n.props.role==="radio");
    assert.equal(radios().length,field.options.length);
    assert.equal(radios()[0].props.tabIndex,0);
    assert.equal(text(radios()[0]),`A${field.options[0]}`);
    assert.ok(elements(tree).some(n=>n.props.className==="practice-options"));
    let focused=-1;
    radios()[0].props.onKeyDown({key:"ArrowRight",preventDefault(){},currentTarget:{parentElement:{querySelectorAll:()=>field.options.map((_,i)=>({focus(){focused=i;}}))}}});tree=h.render();
    assert.equal(focused,1);
    assert.equal(radios()[1].props["aria-checked"],true);
    assert.equal(h.context.activePractice.options[1].label,"B");
    assert.equal(h.context.activePractice.options[1].selected,true);
    assert.equal(h.context.activePractice.studentAnswer,field.options[1]);
  }
});

test("typing help is specific to the field and never depends on the expected answer",()=>{
  const questions=courses.mathCourses.flatMap(courses.courseQuestions);
  const get=id=>questions.find(q=>q.id===id);
  assert.equal(inputHelp.mathInputHelp(get("a-sign-1"),get("a-sign-1").fields[0]),undefined);
  const expression=get("a-dist-3"),interval=get("a-ineq-3"),roots=get("a-quad-4"),trig=get("p-trigeq-4");
  assert.match(inputHelp.mathInputHelp(expression,expression.fields[0]),/x\^2/);
  assert.match(inputHelp.mathInputHelp(interval,interval.fields[0]),/-inf/);
  assert.match(inputHelp.mathInputHelp(roots,roots.fields[0]),/commas.*sqrt\(2\)/);
  assert.match(inputHelp.mathInputHelp(trig,trig.fields[0]),/pi\/4/);
  for(const q of questions) for(const f of q.fields) {
    assert.equal(inputHelp.mathInputHelp(q,f),inputHelp.mathInputHelp({...q,solution:["Secret"]},{...f,answer:"Secret"}));
  }
});

test("multi-part final answers retain correct parts and show worked steps after an incorrect check",()=>{
  const course=courses.mathCourses[0];
  const section=courses.courseChapters(course).flatMap(c=>c.sections).find(s=>s.questions.some(q=>q.fields.length>1&&q.fields.every(f=>f.kind==="number")));
  const q=section.questions.find(q=>q.fields.length>1&&q.fields.every(f=>f.kind==="number"));
  const p=progressTools.emptyMathProgress();p.position=section.id;p.questions={[section.id]:q.id};
  const h=harness(course,p);let tree=h.render();
  for(const [i,f] of q.fields.entries()) {input(tree,`${q.id}-part-${i}`).props.onChange({target:{value:i===0?"999999":f.answer}});tree=h.render();}
  button(tree,"Check Answer").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.status,"incorrect");
  assert.equal(h.progress.checked[q.id].fields[0].passed,false);
  assert.equal(h.progress.checked[q.id].fields[1].passed,true);
  assert.deepEqual(h.context.activePractice.shownAnswer.steps,q.solution);
  input(tree,`${q.id}-part-0`).props.onChange({target:{value:q.fields[0].answer}});tree=h.render();
  assert.equal(h.context.activePractice.status,"not_checked");
  assert.equal(h.context.activePractice.shownAnswer,null);
  assert.equal(input(tree,`${q.id}-part-1`).props.value,q.fields[1].answer);
  button(tree,"Check Answer").props.onClick();h.render();
  assert.equal(h.context.activePractice.status,"passed");
});

test("unsupported calculus equivalence is not called incorrect in practice or tutor context",()=>{
  const course=courses.mathCourses.find(c=>c.id==="math1201"),p=progressTools.emptyMathProgress();
  p.position="c-indefinite-sub";p.questions={[p.position]:"c-sub-2"};
  const h=harness(course,p);let tree=h.render();
  input(tree,"c-sub-2-part-0").props.onChange({target:{value:"exp(2*x)^2/4"}});tree=h.render();
  button(tree,"Check Answer").props.onClick();tree=h.render();
  assert.match(text(tree),/Not verified/);
  assert.match(text(tree),/not a confirmed mathematical error/);
  assert.equal(h.context.activePractice.status,"unverified");
  assert.ok(!h.progress.passed.includes("c-sub-2"));
  const reloaded=harness(course,progressTools.readMathRecords({math1201:h.progress}).math1201);
  reloaded.render();assert.equal(reloaded.context.activePractice.status,"unverified");
});

test("Discrete Structures uses the same question route, exact typed submissions and retry UI",()=>{
  const course=courses.mathCourses.find(c=>c.id==="cisc2210"),p=progressTools.emptyMathProgress();
  p.position="d-connectives";p.questions={"d-connectives":"d-logic-4"};
  let h=harness(course,p),tree=h.render();
  assert.ok(elements(tree).some(n=>n.props.className==="question-route"));
  input(tree,"d-logic-4-part-0").props.onChange({target:{value:"¬q ∧ p"}});
  tree=h.render();button(tree,"Check Answer").props.onClick();tree=h.render();
  assert.equal(h.context.activePractice.studentAnswer,"¬q ∧ p");
  assert.equal(h.context.activePractice.status,"passed");
  assert.ok(elements(tree).some(n=>n.props["aria-label"]==="Worked solution"));
  button(tree,"Hide worked solution").props.onClick();tree=h.render();
  button(tree,"Show worked solution").props.onClick();tree=h.render();
  h=harness(course,progressTools.readMathRecords({cisc2210:h.progress}).cisc2210);tree=h.render();
  assert.equal(input(tree,"d-logic-4-part-0").props.value,"¬q ∧ p");

  const assessment=course.units[1].assessment,initial=progressTools.emptyMathProgress();initial.position=assessment.id;
  h=harness(course,initial);tree=h.render();
  for(const q of assessment.questions)for(const [i,f] of q.fields.entries()){
    input(tree,`${q.id}-part-${i}`).props.onChange({target:{value:q.id==="d-u2-6"?"11010":f.answer}});tree=h.render();
  }
  assert.equal(h.context.masteryAssessment.questions.find(q=>q.questionId==="d-u2-6").learnerAnswer,"11010");
  button(tree,"Submit Test").props.onClick();tree=h.render();
  assert.match(text(tree),/Results · 6\/7/);assert.match(text(tree),/leading zeros/);
  const original=JSON.stringify(h.progress.history[assessment.id][0]);
  button(tree,"Retry only these questions").props.onClick();tree=h.render();
  assert.equal(elements(tree).filter(n=>n.type==="input").length,1);
  input(tree,"d-u2-6-part-0").props.onChange({target:{value:"01 1010"}});
  h=harness(course,progressTools.readMathRecords({cisc2210:h.progress}).cisc2210);tree=h.render();
  assert.equal(input(tree,"d-u2-6-part-0").props.value,"01 1010");
  button(tree,"Submit retry").props.onClick();tree=h.render();
  assert.match(text(tree),/Results · 7\/7/);
  assert.equal(JSON.stringify(h.progress.history[assessment.id][0]),original);
  assert.equal(h.context.masteryAssessment.questions.find(q=>q.questionId==="d-u2-6").learnerAnswer,"01 1010");
});

test("course library places Discrete Structures with computing and reuses existing cards",async()=>{
  const command=await readFile(new URL("../app/CommandCenter.tsx",import.meta.url),"utf8");
  const body=command.slice(command.indexOf("function CoursesView("),command.indexOf("function tutorLessonReference("));
  const unit=ts.transpileModule(`export ${body}`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={};
  new Function("require","exports","learningProgress","mathCourses","mathCourseProgress","emptyMathProgress","courseChapters","ProgressBar","ArrowRight","learningChapters","titleCase",unit)(()=>jsxRuntime,mod,()=>({percent:0,completedChapters:0}),courses.mathCourses,progressTools.mathCourseProgress,progressTools.emptyMathProgress,courses.courseChapters,()=>null,icons.ArrowRight,Array(24).fill({}),x=>x);
  let opened;
  const tree=mod.CoursesView({completed:[],practice:{},math:{},onOpenCourse(){},onOpenMath:id=>{opened=id;}});
  const groups=elements(tree).filter(n=>n.props.className==="course-library-group");
  assert.match(text(groups[0]),/3 courses/);assert.doesNotMatch(text(groups[0]),/CISC 2210/);
  assert.match(text(groups[1]),/2 courses/);assert.match(text(groups[1]),/CISC 1115/);assert.match(text(groups[1]),/CISC 2210/);
  const card=elements(groups[1]).find(n=>n.type==="button"&&text(n).includes("CISC 2210"));
  card.props.onClick();assert.equal(opened,"cisc2210");
});

test("all written-course entry routes server-render their actual lesson and metadata",async()=>{
  const {default:worker}=await import(new URL(`../dist/server/index.js?math-render=${Date.now()}`,import.meta.url));
  for(const course of courses.mathCourses) {
    const response=await worker.fetch(new Request(`https://exceler-a.example/${course.id}`,{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Missing",{status:404})}},{waitUntil(){},passThroughOnException(){}});
    assert.equal(response.status,200,course.code);
    const html=await response.text();
    assert.ok(html.includes(course.code));
    const title={math1006:"College Algebra",math1011:"Precalculus",math1201:"Calculus I",cisc2210:"Discrete Structures"}[course.id];
    assert.ok(html.includes(`<title>${title} · ${course.code}`),course.code);
    assert.ok(html.includes(course.units[0].chapters[0].sections[0].title.replaceAll("&","&amp;")));
    assert.ok(html.includes("Check Answer"));
    assert.doesNotMatch(html,/sk-proj-|OPENAI_API_KEY/);
  }
});

"use client";

import { Fragment, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, GraduationCap, RotateCcw, X } from "lucide-react";
import { chapterQuestions, courseChapters } from "./courses";
import { evaluateMath, mathGradeStatus } from "./grading";
import { mathInputHelp } from "./inputHelp";
import { beginMathAttempt, checkMathQuestion, emptyResponse, mathCourseProgress, mathTutorContext, submitMathAttempt, updateMathResponse } from "./progress";
import type { MathCourse, MathGrade, MathPlot, MathProgress, MathQuestion, MathResponse, MathTutorContext } from "./types";
import JavaEditor from "../JavaEditor";

export function MathGraph({ plot }: { plot: MathPlot }) {
  const [x0,x1]=plot.xRange, [y0,y1]=plot.yRange;
  const scale=Math.min(440/(x1-x0),280/(y1-y0));
  const w=(x1-x0)*scale,h=(y1-y0)*scale,left=(520-w)/2,top=(340-h)/2;
  const px=(x:number)=>left+(x-x0)*scale, py=(y:number)=>top+(y1-y)*scale;
  const paths=plot.curves?.map(curve=>{
    let previous:number|null=null;
    return Array.from({length:401},(_,i)=>{
      const x=x0+(x1-x0)*i/400;
      try {const y=evaluateMath(curve.expression,x);if(y<y0||y>y1){previous=null;return "";}const command=previous===null||Math.abs(y-previous)*scale>55?"M":"L";previous=y;return `${command}${px(x).toFixed(2)},${py(y).toFixed(2)}`;}catch{previous=null;return "";}
    }).join(" ");
  });
  return <figure className="math-graph"><svg viewBox="0 0 520 340" role="img" aria-label={plot.label}><title>{plot.label}</title>
    {Array.from({length:6},(_,i)=>{const x=x0+(x1-x0)*i/5,y=y0+(y1-y0)*i/5;return <g key={i}><path d={`M${px(x)},${top}V${top+h} M${left},${py(y)}H${left+w}`} stroke="#28332d"/><text x={px(x)} y={top+h+20} textAnchor="middle">{Number(x.toFixed(2))}</text><text x={left-8} y={py(y)+4} textAnchor="end">{Number(y.toFixed(2))}</text></g>;})}
    {x0<=0&&x1>=0&&<path d={`M${px(0)},${top}V${top+h}`} stroke="#6c7b72"/>}{y0<=0&&y1>=0&&<path d={`M${left},${py(0)}H${left+w}`} stroke="#6c7b72"/>}
    {paths?.map((path,i)=><path key={i} d={path} fill="none" stroke={i%2?"#8bbdff":"#bbeb68"} strokeWidth="2.5" strokeDasharray={i%2?"6 3":undefined}/>)}
    {plot.points?.map((p,i)=><g key={i}><circle cx={px(p.x)} cy={py(p.y)} r="4" fill="#f5d386"/>{p.label&&<text x={px(p.x)+7} y={py(p.y)-8}>{p.label}</text>}</g>)}<text x={left+w+15} y={top+h+20}>x</text><text x={left-8} y={top-12}>y</text>
  </svg><figcaption>{plot.label}</figcaption><div className="math-graph-legend">{plot.curves?.map((c,i)=><span key={c.expression} style={{color:i%2?"#8bbdff":"#bbeb68"}}>{i%2?"– –":"——"} {c.label}</span>)}</div></figure>;
}

function AnswerInputs({question,response,onChange,onSubmit,grade,readOnly=false}:{question:MathQuestion;response:MathResponse;onChange?:(response:MathResponse)=>void;onSubmit?:()=>void;grade?:MathGrade;readOnly?:boolean}) {
  return <div className="math-answer-fields">{question.fields.map((field,index)=>{
    const id=`${question.id}-part-${index}`;
    const help=readOnly?undefined:mathInputHelp(question,field);
    const update=(value:string)=>{const values=[...response.values];values[index]=value;onChange?.({...response,values});};
    const selectedIndex=Math.max(0,field.options?.indexOf(response.values[index])??0);
    return <div className="math-answer-part" key={id}>
      <label id={`${id}-label`} htmlFor={field.options?undefined:id}>{field.label==="Answer"?"Your answer":field.label}</label>
      {readOnly?<div className="math-submitted-value">{response.values[index]||"No answer submitted"}</div>:field.options?<div className="practice-options" id={id} role="radiogroup" aria-labelledby={`${id}-label`}>
        {field.options.map((option,i)=><button type="button" role="radio" aria-checked={response.values[index]===option} tabIndex={i===selectedIndex?0:-1} className={response.values[index]===option?"selected":""} key={option} onClick={()=>update(option)} onKeyDown={event=>{
          const count=field.options!.length;
          const next=event.key==="Home"?0:event.key==="End"?count-1:["ArrowRight","ArrowDown"].includes(event.key)?(i+1)%count:["ArrowLeft","ArrowUp"].includes(event.key)?(i+count-1)%count:undefined;
          if(next===undefined)return;
          event.preventDefault();update(field.options![next]);event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')[next]?.focus();
        }}><span>{String.fromCharCode(65+i)}</span><b>{option}</b></button>)}
      </div>:field.kind==="code"&&field.language==="java"?<div className="practice-answer-field written-answer-field math-code-answer"><JavaEditor id={id} value={response.values[index]??""} onChange={update} placeholder="Write the requested Java code…" multiline onSubmit={onSubmit}/></div>:field.kind==="code"?<div className="practice-answer-field written-answer-field math-code-answer"><textarea id={id} value={response.values[index]??""} maxLength={4000} rows={8} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" aria-describedby={help?`${id}-help`:undefined} placeholder={`Write the requested ${field.machine?"teaching assembly":field.language??""} code…`} onChange={event=>update(event.target.value)}/></div>:<div className="practice-answer-field single written-answer-field"><input id={id} value={response.values[index]??""} maxLength={600} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" aria-describedby={help?`${id}-help`:undefined} placeholder={field.kind==="expression"?"Type your expression…":"Type your answer…"} onChange={event=>update(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.nativeEvent.isComposing&&onSubmit){event.preventDefault();onSubmit();}}}/></div>}
      {help&&<p className="math-entry-help" id={`${id}-help`}>{help}</p>}
      {grade&&(readOnly||question.fields.length>1)&&<p className={`math-feedback ${grade.fields[index]?.passed?"correct":"incorrect"}`} role="status">{grade.fields[index]?.feedback}</p>}
    </div>;
  })}{response.working&&<details className="math-working-snapshot"><summary>Previously saved working</summary><pre>{response.working}</pre></details>}</div>;
}

function WorkedSolution({question}:{question:MathQuestion}) {
  return <div className="math-solution"><dl>{question.fields.map((f,i)=><div key={i}><dt>{f.label}</dt><dd className={f.kind==="code"?"math-code-solution":undefined}>{f.answer}</dd></div>)}</dl><ol>{question.solution.map((step,i)=><li key={i}>{step}</li>)}</ol></div>;
}

export default function MathCourseView({course,progress,setProgress,onTutorContextChange,onBack}:{course:MathCourse;progress:MathProgress;setProgress:Dispatch<SetStateAction<MathProgress>>;onTutorContextChange:(context:MathTutorContext)=>void;onBack:()=>void}) {
  const chapters=courseChapters(course);
  const locations=course.units.flatMap(u=>[...u.chapters.flatMap(c=>[...c.sections.map(s=>s.id),`${c.id}-review`]),u.assessment.id]);
  const location=progress.position&&locations.includes(progress.position)?progress.position:locations[0];
  const chapter=chapters.find(c=>c.id===location||c.sections.some(s=>s.id===location)||`${c.id}-review`===location);
  const section=chapter?.sections.find(s=>s.id===location);
  const test=course.units.map(u=>u.assessment).find(t=>t.id===location);
  const questions=section?.questions??chapter?.review??[];
  const [shown,setShown]=useState<Record<string,boolean>>({});
  const [hints,setHints]=useState<Record<string,boolean>>({});
  const [reviewed,setReviewed]=useState<string>();
  const [mobileContentsOpen,setMobileContentsOpen]=useState(false);
  const reader=useRef<HTMLDivElement>(null);
  const question=questions.find(q=>q.id===progress.questions?.[location])??questions[0];
  const questionIndex=questions.findIndex(q=>q.id===question?.id);
  const history=test?progress.history[test.id]??[]:[];
  const attempt=history.find(a=>a.id===reviewed)??history.at(-1);
  const draft=test?progress.drafts[test.id]:undefined;
  const activeTest=Boolean(test&&(!history.length||draft));
  const activeQuestions=test?(draft?.sourceId?history.find(a=>a.id===draft.sourceId)?.results.map(r=>r.question)??test.questions:test.questions).filter(q=>!draft||draft.questionIds.includes(q.id)):[];
  const totals=mathCourseProgress(course,progress);
  const activeQuestionId=question?.id;
  const currentGrade=progress.checked[activeQuestionId];
  const solutionShown=shown[activeQuestionId]??Boolean(currentGrade);
  const passed=progress.passed.includes(activeQuestionId);
  const passedCount=questions.filter(q=>progress.passed.includes(q.id)).length;
  const nextUnpassed=questions.findIndex((q,i)=>i>questionIndex&&!progress.passed.includes(q.id));
  const nextQuestionIndex=nextUnpassed>=0?nextUnpassed:questions.findIndex(q=>!progress.passed.includes(q.id));
  const canCheck=question?.fields.every((_,i)=>Boolean(progress.responses[question.id]?.values[i]?.trim()));
  useEffect(()=>onTutorContextChange(mathTutorContext(course,progress,location,activeQuestionId,reviewed,solutionShown)),[course,progress,location,activeQuestionId,reviewed,solutionShown,onTutorContextChange]);
  const activeLocationTitle=section?.title??test?.title??chapter?.title??course.title;
  const scrollCourseTop=()=>{setMobileContentsOpen(false);if(typeof window==="undefined"){reader.current?.scrollTo({top:0});return;}window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{if(window.matchMedia("(max-width: 700px)").matches)reader.current?.scrollIntoView({behavior:"smooth",block:"start"});else reader.current?.scrollTo({top:0});}));};
  const navigate=(id:string)=>{setProgress(p=>({...p,position:id}));setReviewed(undefined);scrollCourseTop();};
  const selectQuestion=(index:number)=>{if(questions[index])setProgress(p=>({...p,questions:{...p.questions,[location]:questions[index].id}}));};
  const check=()=>{if(!canCheck)return;setProgress(p=>checkMathQuestion(p,question));setShown(p=>({...p,[question.id]:true}));};
  const updateAnswer=(response:MathResponse)=>{setProgress(p=>updateMathResponse(p,question.id,response));setShown(p=>({...p,[question.id]:false}));};
  const begin=(retryIds?:string[])=>{if(!test)return;setProgress(p=>beginMathAttempt(p,test,retryIds?attempt:undefined,retryIds));setReviewed(undefined);scrollCourseTop();};
  return <main className="course-page continuous-course math-course"><div className="continuous-layout">
    <div className="mobile-course-toolbar"><button aria-expanded={mobileContentsOpen} aria-controls={`${course.id}-course-contents`} onClick={()=>setMobileContentsOpen(open=>!open)}><span><small>{course.code} Contents</small><b>{activeLocationTitle}</b></span><ChevronDown size={18}/></button></div>
    <button className={`mobile-contents-backdrop ${mobileContentsOpen?"visible":""}`} aria-label="Close course contents" onClick={()=>setMobileContentsOpen(false)}/>
    <aside className={`contents-rail ${mobileContentsOpen?"mobile-open":""}`} id={`${course.id}-course-contents`} aria-label="Course contents"><button className="mobile-contents-close" onClick={()=>setMobileContentsOpen(false)}><span>{course.code} Contents</span><X size={18}/></button><button className="math-back" onClick={onBack}><ArrowLeft size={15}/>Courses</button><div className="contents-heading"><p className="eyebrow">{course.code}</p><span>{chapters.length} chapters</span></div>
      {course.units.map(u=><Fragment key={u.id}><p className="course-unit-label">{u.title}</p>{u.chapters.map(c=>{const done=chapterQuestions(c).every(q=>progress.passed.includes(q.id));return <div key={c.id} className={`contents-section ${chapter?.id===c.id?"selected open":""} ${done?"completed":""}`}><button className="contents-section-button" aria-expanded={chapter?.id===c.id} onClick={()=>navigate(c.sections[0].id)}><span className="chapter-number">{String(chapters.indexOf(c)+1).padStart(2,"0")}</span><span className="chapter-copy"><b>{c.title}</b></span>{done?<Check size={16}/>:<ChevronDown size={15}/>}</button>{chapter?.id===c.id&&<div className="part-list">{[...c.sections.map(s=>({id:s.id,title:s.title,questions:s.questions})),{id:`${c.id}-review`,title:"Chapter Review",questions:c.review}].map((s,i)=><button key={s.id} className={`${location===s.id?"active":""} ${s.questions.every(q=>progress.passed.includes(q.id))?"completed":""}`} onClick={()=>navigate(s.id)}><span className="part-index">{i+1}</span><b>{s.title}</b><small>{s.questions.filter(q=>progress.passed.includes(q.id)).length}/{s.questions.length}</small></button>)}</div>}</div>;})}<div className={`contents-section unit-test-root ${test?.id===u.assessment.id?"selected":""} ${progress.history[u.assessment.id]?.at(-1)?.score===u.assessment.questions.length?"completed":""}`}><button className="contents-section-button" onClick={()=>navigate(u.assessment.id)}><span className="chapter-number"><GraduationCap size={16}/></span><span className="chapter-copy"><b>Unit Mastery Test</b><small>{progress.history[u.assessment.id]?.at(-1)?.score??0}/{u.assessment.questions.length} passed</small></span></button></div></Fragment>)}
      <div className="section-progress-card"><div><span>Course Completion</span><b>{totals.percent}%</b></div><progress max={100} value={totals.percent}/><small>{totals.chaptersCleared}/{totals.chapterCount} chapters cleared</small><p>Chapter practice and reviews clear chapters. Mastery tests belong to their units, not the last chapter.</p></div>
    </aside>
    <div className="chapter-reader" ref={reader}><article className="chapter-article math-article"><header className="chapter-cover"><p className="eyebrow">{course.code} · {course.title}</p><h1>{test?.title??chapter?.title}</h1>{chapter&&<p>{chapter.description}</p>}</header>
      {section&&<section className="lesson-section math-lesson"><div className="lesson-section-heading"><p className="eyebrow">{course.units.find(u=>u.chapters.includes(chapter!))?.title} · {chapters.indexOf(chapter!)+1}.{chapter!.sections.indexOf(section)+1}</p><h2>{section.title}</h2></div>{section.paragraphs.map((paragraph,i)=><p key={i}>{paragraph}</p>)}<div className="math-rules"><h3>Rules to use</h3><ul>{section.rules.map(rule=><li key={rule}>{rule}</li>)}</ul></div>{section.plot&&<MathGraph plot={section.plot}/>}<div className="math-examples">{section.examples.map((example,i)=><section key={i}><p className="eyebrow">Worked Example {i+1}</p><h3>{example.problem}</h3><ol>{example.steps.map((step,j)=><li key={j}>{step}</li>)}</ol></section>)}</div><aside className="math-misconception"><b>Watch the distinction</b><p>{section.misconception}</p></aside></section>}
      {!test&&question&&<section className={`practice-session math-practice ${section?"section-practice":""}`} aria-label={section?"Section Check":"Chapter Review"}>
        <div className="practice-header"><div><p className="eyebrow">{section?`Check Your Understanding · ${String(chapter!.sections.indexOf(section)+1).padStart(2,"0")}`:"Cumulative Review"}</p><h2>{section?"Section Check":"Chapter Review"}</h2></div><div className="practice-score"><b>{passedCount}/{questions.length}</b><small>passed</small></div></div>
        {questions.length>1&&<nav className="question-route" aria-label="Practice questions">{questions.map((q,i)=><button key={q.id} className={`${q.id===question.id?"active":""} ${progress.passed.includes(q.id)?"passed":""}`} aria-label={`Open question ${i+1}${progress.passed.includes(q.id)?", passed":""}`} aria-current={q.id===question.id?"step":undefined} onClick={()=>selectQuestion(i)}><span>{progress.passed.includes(q.id)?<Check size={13} strokeWidth={3}/>:i+1}</span></button>)}</nav>}
        <div className="practice-workspace math-practice-workspace" key={question.id}>
          <h3>{question.prompt}</h3>
          <AnswerInputs question={question} response={progress.responses[question.id]??emptyResponse()} grade={currentGrade} onChange={updateAnswer} onSubmit={()=>{if(passed&&nextQuestionIndex>=0)selectQuestion(nextQuestionIndex);else if(!passed)check();}}/>
          <div className="practice-response-row">
            <div className="practice-feedback-slot">{currentGrade&&<div className={`practice-feedback ${passed?"correct":"incorrect"}`} role="status"><span>{passed?<Check size={18} strokeWidth={3}/>:<RotateCcw size={17}/>}</span><p><b>{passed?"Passed":mathGradeStatus(currentGrade)==="unverified"?"Not verified":"Not yet"}</b><small>{passed?"Your answer is correct.":question.fields.length===1?currentGrade.fields[0]?.feedback:"Check the feedback for each part."}</small></p></div>}</div>
            <div className={`practice-actions ${passed?"passed":""}`}>
              {!passed&&<button className="soft-button" onClick={()=>setShown(p=>({...p,[question.id]:!solutionShown}))} aria-pressed={solutionShown}>{solutionShown?<EyeOff size={14}/>:<Eye size={14}/>} {solutionShown?"Hide Answer":"Show Answer"}</button>}
              {passed?(nextQuestionIndex>=0?<button className="primary-button practice-next-button" onClick={()=>selectQuestion(nextQuestionIndex)}>Next Question<ArrowRight size={16}/></button>:<button className="primary-button complete practice-next-button" disabled><Check size={16}/>All Questions Passed</button>):<button className="primary-button" onClick={check} disabled={!canCheck}>Check Answer<ArrowRight size={14}/></button>}
            </div>
          </div>
          <div className="math-practice-support">
            {!passed&&<button className="math-text-button" aria-expanded={Boolean(hints[question.id])} onClick={()=>setHints(p=>({...p,[question.id]:!p[question.id]}))}>{hints[question.id]?"Hide hint":"Need a hint?"}</button>}
            {passed&&<button className="math-text-button" aria-expanded={solutionShown} onClick={()=>setShown(p=>({...p,[question.id]:!solutionShown}))}>{solutionShown?"Hide worked solution":"Show worked solution"}</button>}
          </div>
          {!passed&&hints[question.id]&&<p className="math-hint">{question.hint}</p>}
          {solutionShown&&<section className="math-practice-solution" aria-label="Worked solution"><h4>Worked solution</h4><WorkedSolution question={question}/></section>}
        </div>
        {questions.length>1&&<div className="practice-pagination"><button aria-label="Previous question" title="Previous question" disabled={questionIndex===0} onClick={()=>selectQuestion(questionIndex-1)}><ChevronLeft size={18} strokeWidth={2.4}/></button><span>Question {questionIndex+1} of {questions.length}</span><button aria-label="Next question" title="Next question" disabled={questionIndex===questions.length-1} onClick={()=>selectQuestion(questionIndex+1)}><ChevronRight size={18} strokeWidth={2.4}/></button></div>}
        {passedCount===questions.length&&<div className="chapter-cleared-banner complete"><span><Check size={24} strokeWidth={3}/></span><div><b>{section?"Section Check Complete":"Chapter Review Complete"}</b><small>All {questions.length} questions passed. Your answers are saved.</small></div></div>}
      </section>}
      {test&&activeTest&&<section className="math-assessment">{activeQuestions.map(q=><section className="math-question" key={q.id}><p className="eyebrow">Question {(history.find(a=>a.id===draft?.sourceId)?.results.map(r=>r.question)??test.questions).findIndex(item=>item.id===q.id)+1}</p><h3>{q.prompt}</h3><AnswerInputs question={q} response={progress.responses[q.id]??emptyResponse()} onChange={response=>setProgress(p=>updateMathResponse(p,q.id,response))}/></section>)}<div className="math-actions"><button className="primary-button" onClick={()=>{setProgress(p=>submitMathAttempt(p,test));setReviewed(undefined);scrollCourseTop();}}>{draft?.sourceId?"Submit retry":"Submit Test"}</button>{draft&&history.length>0&&<button className="soft-button" onClick={()=>setProgress(p=>{const drafts={...p.drafts};delete drafts[test.id];return {...p,drafts};})}>Cancel and return to results</button>}</div><p className="math-save-note">Submission saves your exact answers as a new attempt. Unanswered parts receive no credit. Earlier submissions are kept.</p></section>}
      {test&&!activeTest&&attempt&&<section className="math-results"><header className="math-results-heading"><h2>Results · {attempt.score}/{attempt.results.length}</h2><p>{attempt.kind==="retry"?"Question retry · unchanged answers carried forward":"Whole-test submission"} · First submission: {history[0].score}/{history[0].results.length}</p></header><nav className="math-history" aria-label="Attempt history">{history.map((a,i)=><button key={a.id} className={a.id===attempt.id?"selected":""} onClick={()=>setReviewed(a.id)}>Attempt {i+1} · {a.score}/{a.results.length}</button>)}</nav>{attempt.results.some(r=>!r.grade.passed)&&<aside className="math-attention"><h3>What needs attention</h3><ul>{attempt.results.filter(r=>!r.grade.passed).map(r=><li key={r.question.id}>Question {attempt.results.indexOf(r)+1}: {r.grade.fields.filter(f=>!f.passed).map(f=>f.feedback).join(" ")}</li>)}</ul><button className="soft-button" onClick={()=>begin(attempt.results.filter(r=>!r.grade.passed).map(r=>r.question.id))}>Retry only these questions</button></aside>}{attempt.results.map((r,i)=><section className="math-question" key={r.question.id}><p className="eyebrow">Question {i+1} · {r.grade.passed?"Correct":"Needs attention"}</p><h3>{r.question.prompt}</h3><div className="math-result-columns"><div><h4>Your exact submitted answer</h4><AnswerInputs question={r.question} response={r.response} grade={r.grade} readOnly/></div><div><h4>Worked solution</h4><WorkedSolution question={r.question}/></div></div><button className="soft-button" onClick={()=>begin([r.question.id])}>Retry this question</button></section>)}<button className="soft-button" onClick={()=>begin()}>Retake whole test</button></section>}
      <footer className="math-course-footer"><div className="math-actions"><button className="soft-button" disabled={locations.indexOf(location)===0} onClick={()=>navigate(locations[locations.indexOf(location)-1])}><ArrowLeft size={15}/>Previous section</button><button className="primary-button" disabled={locations.indexOf(location)===locations.length-1} onClick={()=>navigate(locations[locations.indexOf(location)+1])}>Next section<ArrowRight size={15}/></button></div><details><summary>Course scope and sources</summary><p>Independently authored self-study lessons aligned to the listed topics, not an official college course or credit award. {course.id === "cisc2210" ? "Proof checks assess specific constructions and reasoning steps, not arbitrary free-form proofs." : course.code.startsWith("CISC") ? "Programming exercises use exact behavioral or structural contracts where automatic checking is available; larger design choices still require human review." : "The math sequence runs from College Algebra and Precalculus through Calculus I and II."}</p>{course.sources.map(source=><p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></p>)}</details></footer>
    </article></div>
  </div></main>;
}

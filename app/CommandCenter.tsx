"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  FileInput,
  GitBranch,
  GraduationCap,
  LockKeyhole,
  Map as MapIcon,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { degreeCourses, type DegreeCourse } from "./data/curriculum";

type View = "dashboard" | "degree" | "course";
type DegreeStatus = "unknown" | "complete" | "in_progress" | "not_started";
type DegreeRecords = Record<string, DegreeStatus>;

type LearningPart = {
  id: string;
  title: string;
  eyebrow: string;
  minutes: number;
  kind: "lesson" | "review";
};

type LearningChapter = {
  id: string;
  unit: string;
  title: string;
  description: string;
  parts: LearningPart[];
};

const learningChapters: LearningChapter[] = [
  {
    id: "variables-data-types",
    unit: "Section 01 · Fundamentals",
    title: "Variables & data types",
    description: "Store information with names and choose types that match what the value means.",
    parts: [
      { id: "what-is-a-variable", title: "What is a variable?", eyebrow: "Core idea", minutes: 12, kind: "lesson" },
      { id: "reading-a-declaration", title: "Reading a declaration", eyebrow: "Anatomy", minutes: 8, kind: "lesson" },
      { id: "java-data-types", title: "Java data types", eyebrow: "Type system", minutes: 14, kind: "lesson" },
      { id: "choosing-a-type", title: "Choosing the right type", eyebrow: "Judgment", minutes: 10, kind: "lesson" },
      { id: "variables-review", title: "Section review", eyebrow: "Checkpoint", minutes: 25, kind: "review" },
    ],
  },
  {
    id: "operators-expressions",
    unit: "Section 02 · Fundamentals",
    title: "Operators & expressions",
    description: "Transform values, control evaluation order, and build meaningful output.",
    parts: [
      { id: "arithmetic-operators", title: "Arithmetic operators", eyebrow: "Core idea", minutes: 14, kind: "lesson" },
      { id: "operator-precedence", title: "Precedence & parentheses", eyebrow: "Evaluation order", minutes: 16, kind: "lesson" },
      { id: "assignment-operators", title: "Assignment shortcuts", eyebrow: "State changes", minutes: 10, kind: "lesson" },
      { id: "string-concatenation", title: "String concatenation", eyebrow: "Text output", minutes: 14, kind: "lesson" },
      { id: "operators-review", title: "Section review", eyebrow: "Checkpoint", minutes: 30, kind: "review" },
    ],
  },
  {
    id: "decisions",
    unit: "Section 03 · Control flow",
    title: "Decisions",
    description: "Turn comparisons into branches that make a program respond to state.",
    parts: [
      { id: "comparisons", title: "Comparisons", eyebrow: "Boolean results", minutes: 15, kind: "lesson" },
      { id: "boolean-logic", title: "Boolean logic", eyebrow: "Combining conditions", minutes: 16, kind: "lesson" },
      { id: "if-else", title: "If / else", eyebrow: "Branching", minutes: 20, kind: "lesson" },
      { id: "decisions-review", title: "Section review", eyebrow: "Checkpoint", minutes: 30, kind: "review" },
    ],
  },
  {
    id: "loops",
    unit: "Section 04 · Control flow",
    title: "Loops",
    description: "Repeat operations deliberately while keeping state and stopping conditions clear.",
    parts: [
      { id: "while-loops", title: "While loops", eyebrow: "Conditional repetition", minutes: 20, kind: "lesson" },
      { id: "for-loops", title: "For loops", eyebrow: "Counted repetition", minutes: 22, kind: "lesson" },
      { id: "tracing-loops", title: "Tracing loop state", eyebrow: "Debugging", minutes: 14, kind: "lesson" },
      { id: "loops-review", title: "Section review", eyebrow: "Checkpoint", minutes: 35, kind: "review" },
    ],
  },
];

const allLearningParts = learningChapters.flatMap((chapter) => chapter.parts);
const totalLearningMinutes = allLearningParts.reduce((sum, part) => sum + part.minutes, 0);
const STORAGE_KEY = "daymark-education-v2";

const degreeStageLabels = [
  ["Placement foundation", "Establish eligibility and math placement."],
  ["First unlocks", "Begin programming, discrete structures, and calculus."],
  ["Core construction", "Build the central programming and data foundation."],
  ["Advanced branches", "Choose systems, applied computing, and electives."],
  ["Finish line", "Complete the writing and capstone choices."],
] as const;

function learningProgress(completed: string[], parts = allLearningParts) {
  const done = parts.filter((part) => completed.includes(part.id)).reduce((sum, part) => sum + part.minutes, 0);
  const total = parts.reduce((sum, part) => sum + part.minutes, 0);
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function requirementKey(course: DegreeCourse) {
  return course.choiceLabel ? `choice:${course.choiceLabel}` : course.code;
}

function verifiedDegreeCredits(records: DegreeRecords) {
  const counted = new Map<string, number>();
  degreeCourses.forEach((course) => {
    if (records[course.code] !== "complete") return;
    const key = requirementKey(course);
    counted.set(key, Math.max(counted.get(key) ?? 0, course.credits));
  });
  return Array.from(counted.values()).reduce((sum, credits) => sum + credits, 0);
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-track"><span className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function StatusMark({ done, active = false }: { done: boolean; active?: boolean }) {
  return <span className={`mission-status ${done ? "done" : active ? "active" : ""}`}>{done ? <Check size={17} strokeWidth={3} /> : active ? <Play size={13} fill="currentColor" /> : <span />}</span>;
}

function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <div><p className="eyebrow">Education campaign</p><h1>{title}</h1></div>
      <div className="top-actions"><span className="focus-pill"><Sparkles size={13} /> Education focus</span><button className="avatar" aria-label="Open profile">D</button></div>
    </header>
  );
}

function Sidebar({ view, setView, completed }: { view: View; setView: (view: View) => void; completed: string[] }) {
  const progress = learningProgress(completed);
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setView("dashboard")}><span className="brand-mark">D/</span><span><b>DAYMARK</b><small>Education campaign</small></span></button>
      <nav className="primary-nav" aria-label="Education navigation">
        <p className="nav-section-label">Campaign</p>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen className="nav-mark" size={17} />Overview</button>
        <button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch className="nav-mark" size={17} />Degree map</button>
        <p className="nav-section-label course-label">Active course</p>
        <button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 className="nav-mark" size={17} />CISC 1115<span className="nav-progress">{progress.percent}%</span></button>
      </nav>
      <div className="sidebar-course">
        <div className="sidebar-course-top"><span className="course-glyph">J</span><span><small>Self-study campaign</small><b>Intro to Java</b></span></div>
        <ProgressBar value={progress.percent} />
        <div className="split-meta"><span>{progress.done} / {progress.total} min</span><span>{progress.percent}%</span></div>
      </div>
      <div className="sidebar-footer"><div className="sync-state"><span />Progress saved on this device</div></div>
    </aside>
  );
}

function MobileNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen size={18} />Overview</button><button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch size={18} />Degree</button><button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 size={18} />Java</button></nav>;
}

function Dashboard({ completed, degreeRecords, setView, onComplete }: { completed: string[]; degreeRecords: DegreeRecords; setView: (view: View) => void; onComplete: (id: string) => void }) {
  const progress = learningProgress(completed);
  const nextPart = allLearningParts.find((part) => !completed.includes(part.id)) ?? allLearningParts[0];
  const nextChapter = learningChapters.find((chapter) => chapter.parts.some((part) => part.id === nextPart.id)) ?? learningChapters[0];
  const planStart = Math.max(0, allLearningParts.findIndex((part) => part.id === nextPart.id) - 1);
  const plan = allLearningParts.slice(planStart, planStart + 5);
  const credits = verifiedDegreeCredits(degreeRecords);
  const knownStatuses = Object.values(degreeRecords).filter((status) => status !== "unknown").length;
  return (
    <main className="page-content education-home">
      <section className="education-hero">
        <div className="hero-copy"><p className="eyebrow accent-text">Continue learning</p><span className="section-chip">{nextChapter.unit}</span><h2>{nextPart.title}</h2><p>{nextChapter.description}</p><div className="hero-actions"><button className="primary-button" onClick={() => setView("course")}><Play size={14} fill="currentColor" />Open lesson · {nextPart.minutes} min</button><button className="soft-button" onClick={() => setView("degree")}>View degree path <ArrowRight size={14} /></button></div></div>
        <div className="hero-progress-card"><div className="progress-orbit" style={{ "--progress": `${progress.percent}%` } as React.CSSProperties}><div><b>{progress.percent}%</b><small>course</small></div></div><div><p className="eyebrow">CISC 1115</p><h3>Introduction to Programming Using Java</h3><span>{progress.done} of {progress.total} weighted minutes cleared</span><ProgressBar value={progress.percent} /></div></div>
      </section>

      <section className="education-dashboard-grid">
        <div className="campaign-card rounded-panel">
          <div className="panel-heading"><div><p className="eyebrow">Current route</p><h3>{nextChapter.title}</h3></div><span className="route-time">{plan.filter((part) => !completed.includes(part.id)).reduce((sum, part) => sum + part.minutes, 0)} min ahead</span></div>
          <div className="mission-list">{plan.map((part) => {
            const done = completed.includes(part.id);
            const active = part.id === nextPart.id;
            return <div key={part.id} className={`mission-row ${done ? "completed" : active ? "current" : ""}`}>
              <StatusMark done={done} active={active} />
              <button onClick={() => setView("course")}><b>{part.title}</b><small>{done ? "Cleared" : part.kind === "review" ? "Section checkpoint" : part.eyebrow}</small></button>
              <time>{part.minutes}m</time>
              {done && <span className="cleared-pill"><Check size={11} /> Cleared</span>}
              {!done && !active && <button className="quick-complete" aria-label={`Mark ${part.title} complete`} onClick={() => onComplete(part.id)}><Check size={13} /></button>}
            </div>;
          })}</div>
          <button className="panel-footer-button" onClick={() => setView("course")}>Open the full section <ArrowRight size={14} /></button>
        </div>

        <div className="degree-brief-card rounded-panel">
          <div className="panel-heading"><div><p className="eyebrow">Actual degree</p><h3>Brooklyn College CS B.S.</h3></div><GraduationCap size={22} /></div>
          <div className="audit-state"><span className={knownStatuses ? "known" : ""}>{knownStatuses ? <Check size={22} /> : <CircleHelp size={22} />}</span><div><b>{knownStatuses ? `${credits} credits verified` : "Completion unknown"}</b><p>{knownStatuses ? `${knownStatuses} course statuses recorded.` : "Daymark will not guess what DegreeWorks says."}</p></div></div>
          <div className="degree-rule-list"><div><span>55–67.5</span><p><b>Major credits</b><small>Varies with placement and choices</small></p></div><div><span>3×</span><p><b>Upper-level electives</b><small>CISC 3000–4899</small></p></div><div><span>C</span><p><b>Minimum grade rule</b><small>Applies to the 24-credit residency block</small></p></div></div>
          <button className="secondary-button wide" onClick={() => setView("degree")}>Open map & import DegreeWorks <ArrowRight size={14} /></button>
        </div>
      </section>
    </main>
  );
}

function CourseView({ completed, onComplete }: { completed: string[]; onComplete: (id: string) => void }) {
  const [selectedChapterId, setSelectedChapterId] = useState(learningChapters[0].id);
  const [activePartId, setActivePartId] = useState(learningChapters[0].parts[0].id);
  const [reviewAnswer, setReviewAnswer] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const readerRef = useRef<HTMLDivElement | null>(null);
  const selectedChapter = learningChapters.find((chapter) => chapter.id === selectedChapterId) ?? learningChapters[0];
  const courseProgress = learningProgress(completed);
  const chapterProgress = learningProgress(completed, selectedChapter.parts);

  useEffect(() => {
    setActivePartId(selectedChapter.parts[0].id);
    setReviewAnswer("");
    setReviewFeedback("idle");
    readerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedChapter.id, selectedChapter.parts]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const update = () => {
      const current = selectedChapter.parts
        .map((part) => {
          const element = document.getElementById(part.id);
          return element ? { id: part.id, top: element.getBoundingClientRect().top - reader.getBoundingClientRect().top } : null;
        })
        .filter((entry): entry is { id: string; top: number } => Boolean(entry))
        .filter((entry) => entry.top <= 125)
        .at(-1);
      if (current) setActivePartId(current.id);
    };
    update();
    reader.addEventListener("scroll", update, { passive: true });
    return () => reader.removeEventListener("scroll", update);
  }, [selectedChapter]);

  const selectChapter = (chapter: LearningChapter) => {
    setSelectedChapterId(chapter.id);
    setActivePartId(chapter.parts[0].id);
  };
  const scrollToPart = (partId: string) => document.getElementById(partId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const reviewExpected = selectedChapter.id === "variables-data-types" ? "3" : selectedChapter.id === "operators-expressions" ? "10" : selectedChapter.id === "decisions" ? "Access granted" : "0 1 2";
  const reviewPart = selectedChapter.parts.at(-1)!;
  const checkReview = () => {
    if (reviewAnswer.trim().toLowerCase() === reviewExpected.toLowerCase()) {
      setReviewFeedback("correct");
      onComplete(reviewPart.id);
    } else setReviewFeedback("incorrect");
  };

  return (
    <main className="course-page continuous-course">
      <div className="course-banner"><div><span className="course-glyph large">J</span><div><p className="eyebrow">CISC 1115 · Self-study</p><h2>Introduction to Programming Using Java</h2></div></div><div className="course-total"><span><b>{courseProgress.percent}%</b><small>{courseProgress.done} / {courseProgress.total} weighted min</small></span><ProgressBar value={courseProgress.percent} /></div></div>
      <div className="continuous-layout">
        <aside className="contents-rail">
          <div className="contents-heading"><p className="eyebrow">Course contents</p><span>{learningChapters.length} sections</span></div>
          {learningChapters.map((chapter, chapterIndex) => {
            const progress = learningProgress(completed, chapter.parts);
            const open = chapter.id === selectedChapter.id;
            return <div className={`contents-section ${open ? "open" : ""}`} key={chapter.id}>
              <button className="contents-section-button" onClick={() => selectChapter(chapter)}><span className={`chapter-completion ${progress.percent === 100 ? "done" : ""}`}>{progress.percent === 100 ? <Check size={14} strokeWidth={3} /> : String(chapterIndex + 1).padStart(2, "0")}</span><span><small>{chapter.unit}</small><b>{chapter.title}</b></span><ChevronDown size={15} /></button>
              {open && <div className="part-list">{chapter.parts.map((part) => {
                const done = completed.includes(part.id);
                return <button key={part.id} className={activePartId === part.id ? "active" : ""} onClick={() => scrollToPart(part.id)}><span className={done ? "done" : ""}>{done ? <Check size={11} strokeWidth={3} /> : <i />}</span><b>{part.title}</b><small>{part.minutes}m</small></button>;
              })}</div>}
            </div>;
          })}
          <div className="section-progress-card"><div><span>Section progress</span><b>{chapterProgress.percent}%</b></div><ProgressBar value={chapterProgress.percent} /><small>{chapterProgress.done} of {chapterProgress.total} weighted minutes cleared</small></div>
        </aside>

        <div className="chapter-reader" ref={readerRef}>
          <article className="chapter-article">
            <header className="chapter-cover"><p className="eyebrow accent-text">{selectedChapter.unit}</p><h1>{selectedChapter.title}</h1><p>{selectedChapter.description}</p><div><span>{selectedChapter.parts.length} parts</span><span>{selectedChapter.parts.reduce((sum, part) => sum + part.minutes, 0)} weighted min</span><span>Review at the end</span></div></header>
            {selectedChapter.parts.map((part, index) => <section className={`learning-part ${part.kind}`} id={part.id} key={part.id}>
              <div className="part-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="part-body"><div className="part-heading"><div><p className="eyebrow">{part.eyebrow}</p><h2>{part.title}</h2></div><span>{part.minutes} min</span></div>
                {part.kind === "lesson" ? <><LessonPartContent partId={part.id} /><div className={`part-completion-bar ${completed.includes(part.id) ? "done" : ""}`}>{completed.includes(part.id) ? <><span><Check size={18} strokeWidth={3} /></span><p><b>Part cleared</b><small>This stays complete without removing it from your route.</small></p></> : <><p><b>Ready to bank this part?</b><small>Mark it complete when the explanation feels usable, not merely familiar.</small></p><button className="complete-part-button" onClick={() => onComplete(part.id)}><Check size={15} /> Complete part</button></>}</div></> : <SectionReview chapterId={selectedChapter.id} answer={reviewAnswer} setAnswer={(value) => { setReviewAnswer(value); setReviewFeedback("idle"); }} expected={reviewExpected} feedback={reviewFeedback} onCheck={checkReview} />}
              </div>
            </section>)}
          </article>
        </div>
      </div>
    </main>
  );
}

function LessonPartContent({ partId }: { partId: string }) {
  if (partId === "what-is-a-variable") return <><p className="lesson-lead">A variable is a named place in memory used to store a value. The name lets the rest of the program refer to that value without knowing where it lives.</p><div className="teaching-code"><div><span>Java</span><small>A first variable</small></div><pre><code><em>int</em> age = <strong>25</strong>;</code></pre></div><aside className="key-idea"><Sparkles size={17} /><p><b>Think of the name as a label, not the box itself.</b><span>The value can change while the name keeps your code understandable.</span></p></aside></>;
  if (partId === "reading-a-declaration") return <><p className="lesson-lead">Read declarations from left to right: what kind of value, what name, then what value should be stored.</p><div className="declaration-grid"><div><code>int</code><b>Type</b><small>Whole numbers</small></div><div><code>age</code><b>Name</b><small>Readable label</small></div><div><code>=</code><b>Assignment</b><small>Stores the value</small></div><div><code>25</code><b>Value</b><small>Actual data</small></div><div><code>;</code><b>End</b><small>Closes the statement</small></div></div></>;
  if (partId === "java-data-types") return <><p className="lesson-lead">A type tells Java which values are legal and which operations make sense.</p><div className="type-grid"><div><code>int</code><p><b>Whole numbers</b><small>int lives = 3;</small></p></div><div><code>double</code><p><b>Decimal numbers</b><small>double speed = 4.5;</small></p></div><div><code>boolean</code><p><b>True or false</b><small>boolean ready = true;</small></p></div><div><code>String</code><p><b>Text</b><small>String name = "Daniel";</small></p></div></div></>;
  if (partId === "choosing-a-type") return <><p className="lesson-lead">Choose a type based on meaning, not appearance. A ZIP code contains digits, but you do not calculate with it—so text may be the more honest type.</p><div className="judgment-cards"><div><span>03</span><p><b>Lives remaining</b><small>Use <code>int</code>; arithmetic is meaningful.</small></p></div><div><span>11201</span><p><b>ZIP code</b><small>Use <code>String</code>; leading zeroes matter.</small></p></div><div><span>YES</span><p><b>Account active</b><small>Use <code>boolean</code>; there are two states.</small></p></div></div></>;
  if (partId === "arithmetic-operators") return <><p className="lesson-lead">Arithmetic operators transform numeric values. The remainder operator is especially useful for cycles, grouping, and even/odd checks.</p><div className="operator-grid"><div><code>+</code><b>Add</b><small>8 + 2 → 10</small></div><div><code>−</code><b>Subtract</b><small>8 - 2 → 6</small></div><div><code>×</code><b>Multiply</b><small>8 * 2 → 16</small></div><div><code>÷</code><b>Divide</b><small>8 / 2 → 4</small></div><div><code>%</code><b>Remainder</b><small>8 % 3 → 2</small></div></div></>;
  if (partId === "operator-precedence") return <><p className="lesson-lead">Java evaluates multiplication, division, and remainder before addition and subtraction. Parentheses make your intended order explicit.</p><div className="comparison-code"><pre><small>DEFAULT ORDER</small><code>4 + 3 * 2</code><b>10</b></pre><pre><small>WITH PARENTHESES</small><code>(4 + 3) * 2</code><b>14</b></pre></div></>;
  if (partId === "assignment-operators") return <><p className="lesson-lead">Assignment shortcuts update an existing value without repeating its name.</p><div className="teaching-code"><div><span>Java</span><small>Same result, clearer intent</small></div><pre><code>score += <strong>10</strong>;  <i>// score = score + 10;</i>{"\n"}lives -= <strong>1</strong>;   <i>// lives = lives - 1;</i></code></pre></div></>;
  if (partId === "string-concatenation") return <><p className="lesson-lead">When either side of <code>+</code> is text, Java joins values instead of adding them.</p><div className="teaching-code"><div><span>Java</span><small>Build output from stored values</small></div><pre><code><em>String</em> name = <strong>"Daniel"</strong>;{"\n"}<em>int</em> lives = <strong>3</strong>;{"\n"}System.out.println(name + <strong>" has "</strong> + lives + <strong>" lives."</strong>);</code></pre></div></>;
  if (partId === "comparisons") return <><p className="lesson-lead">A comparison produces a boolean value: <code>true</code> or <code>false</code>.</p><div className="operator-grid compact"><div><code>==</code><b>Equal</b></div><div><code>!=</code><b>Not equal</b></div><div><code>&gt;</code><b>Greater</b></div><div><code>&lt;</code><b>Less</b></div></div></>;
  if (partId === "boolean-logic") return <><p className="lesson-lead">Use <code>&&</code> when both conditions must be true, <code>||</code> when either may be true, and <code>!</code> to invert a result.</p><aside className="key-idea"><Sparkles size={17} /><p><b>Name complicated conditions before using them.</b><span><code>boolean canEnter = hasKey && !isLocked;</code> reads like a decision.</span></p></aside></>;
  if (partId === "if-else") return <><p className="lesson-lead">An if/else statement chooses exactly one path based on a boolean condition.</p><div className="teaching-code"><div><span>Java</span><small>Branch on access</small></div><pre><code><em>if</em> (hasKey) {`{\n`}  System.out.println(<strong>"Access granted"</strong>);{`\n`} {`}`} <em>else</em> {`{\n`}  System.out.println(<strong>"Access denied"</strong>);{`\n`}{`}`}</code></pre></div></>;
  if (partId === "while-loops") return <><p className="lesson-lead">A while loop repeats as long as its condition remains true. The loop body must eventually change that condition.</p><div className="teaching-code"><div><span>Java</span><small>Countdown</small></div><pre><code><em>while</em> (lives &gt; 0) {`{\n`}  lives--;{`\n`}{`}`}</code></pre></div></>;
  if (partId === "for-loops") return <><p className="lesson-lead">A for loop keeps initialization, stopping condition, and update together—ideal when the number of repetitions is known.</p><div className="teaching-code"><div><span>Java</span><small>Three turns</small></div><pre><code><em>for</em> (int turn = 0; turn &lt; 3; turn++) {`{\n`}  System.out.println(turn);{`\n`}{`}`}</code></pre></div></>;
  return <><p className="lesson-lead">Trace the value that controls the loop after every iteration. Most loop bugs are easier to see on paper than in the final output.</p><div className="trace-table"><div><b>Iteration</b><b>turn before</b><b>Output</b></div><div><span>1</span><span>0</span><code>0</code></div><div><span>2</span><span>1</span><code>1</code></div><div><span>3</span><span>2</span><code>2</code></div></div></>;
}

function SectionReview({ chapterId, answer, setAnswer, expected, feedback, onCheck }: { chapterId: string; answer: string; setAnswer: (value: string) => void; expected: string; feedback: "idle" | "correct" | "incorrect"; onCheck: () => void }) {
  const prompt = chapterId === "variables-data-types" ? "What does this print?" : chapterId === "operators-expressions" ? "Evaluate the expression before running it." : chapterId === "decisions" ? "Which message is printed when hasKey is true?" : "Write the three values printed by the loop.";
  const code = chapterId === "variables-data-types" ? "int lives = 3;\nSystem.out.println(lives);" : chapterId === "operators-expressions" ? "int score = 4 + 3 * 2;\nSystem.out.println(score);" : chapterId === "decisions" ? 'boolean hasKey = true;\nif (hasKey) {\n  System.out.println("Access granted");\n}' : "for (int i = 0; i < 3; i++) {\n  System.out.print(i + \" \" );\n}";
  return <div className="section-review"><div className="review-intro"><span><GraduationCap size={20} /></span><div><p className="eyebrow">End-of-section review</p><h3>Use the idea without a walkthrough.</h3><p>Clearing this review carries more weight than simply reaching the bottom of the page.</p></div></div><div className="review-workspace"><div><h4>{prompt}</h4><pre><code>{code}</code></pre></div><div className="review-answer"><label htmlFor={`answer-${chapterId}`}>Your exact output</label><input id={`answer-${chapterId}`} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" onKeyDown={(event) => { if (event.key === "Enter") onCheck(); }} /><small>Expected format: <code>{expected}</code></small><button className="primary-button" onClick={onCheck}>Check review <ArrowRight size={14} /></button></div></div>{feedback !== "idle" && <div className={`review-feedback ${feedback}`}><span>{feedback === "correct" ? <Check size={19} strokeWidth={3} /> : <RotateCcw size={18} />}</span><p><b>{feedback === "correct" ? "Section cleared" : "Not yet"}</b><small>{feedback === "correct" ? "The review is now part of your completed route." : "Trace the values once more, then submit the exact output."}</small></p></div>}</div>;
}

function DegreeMap({ records, setRecords, onImport }: { records: DegreeRecords; setRecords: (records: DegreeRecords) => void; onImport: () => void }) {
  const [selected, setSelected] = useState<DegreeCourse | null>(null);
  const credits = verifiedDegreeCredits(records);
  const known = degreeCourses.filter((course) => (records[course.code] ?? "unknown") !== "unknown").length;
  const completed = degreeCourses.filter((course) => records[course.code] === "complete").length;
  return <main className="page-content degree-page focused-degree">
    <section className="degree-hero"><div><p className="eyebrow accent-text">Brooklyn College · Actual degree</p><h2>Your CS pathway</h2><p>The map shows the official requirement structure. Your personal completion state stays unknown until you confirm it or import DegreeWorks.</p><div className="hero-actions"><button className="primary-button" onClick={onImport}><FileInput size={15} />Import DegreeWorks</button><span className="honesty-note"><CircleHelp size={14} /> No guessed completions</span></div></div><div className="degree-verification"><div><b>{known ? credits : "—"}</b><small>{known ? "verified credits" : "credits not synced"}</small></div><div><b>{completed || "—"}</b><small>{completed ? "courses complete" : "status unknown"}</small></div><div><b>55–67.5</b><small>official major range</small></div></div></section>
    <section className="degree-rules"><div><span>01</span><p><b>Choices count once</b><small>Either/or requirements remain grouped instead of looking like two obligations.</small></p></div><div><span>02</span><p><b>Placement changes the path</b><small>Some foundational math can be waived by placement.</small></p></div><div><span>03</span><p><b>Residency matters</b><small>24 advanced science/math credits must satisfy Brooklyn College’s residency and grade rule.</small></p></div></section>
    <div className="degree-map-heading"><div><p className="eyebrow">Pathway map</p><h3>Read left to right</h3></div><div className="degree-legend"><span><i className="unknown" />Unknown</span><span><i className="complete" />Complete</span><span><i className="in_progress" />In progress</span><span><i className="not_started" />Not started</span></div></div>
    <section className="degree-tree"><div className="tree-spine" />{degreeStageLabels.map(([title, description], stage) => <div className="tree-stage" key={title}><header><span>{String(stage + 1).padStart(2, "0")}</span><div><b>{title}</b><small>{description}</small></div></header><div className="tree-node-list">{degreeCourses.filter((course) => course.stage === stage).map((course) => {
      const status = records[course.code] ?? "unknown";
      return <button key={course.code} className={`tree-course-node ${status}`} onClick={() => setSelected(course)}><span className="degree-status-icon">{status === "complete" ? <Check size={15} strokeWidth={3} /> : status === "in_progress" ? <Play size={12} fill="currentColor" /> : status === "not_started" ? <LockKeyhole size={13} /> : <CircleHelp size={14} />}</span><span><small>{course.requirement}</small><b>{course.code}</b><em>{course.title}</em>{course.choiceLabel && <i>{course.choiceLabel}</i>}{course.code === "CISC 1115" && <i className="self-study">Self-study course active</i>}</span><strong>{course.credits}<small>cr</small></strong></button>;
    })}{stage === 3 && <div className="tree-course-node elective-node"><span className="degree-status-icon"><MapIcon size={14} /></span><span><small>Elective requirement</small><b>3 × CISC ELECTIVES</b><em>Choose three courses numbered 3000–4899</em></span><strong>9<small>cr</small></strong></div>}</div></div>)}</section>
    <section className="degree-footnotes"><p><b>Additional B.S. rule:</b> at least 60 total credits in science and mathematics, including the required advanced-credit block.</p><p><b>Advisement boundary:</b> this is a planning view, not a replacement for the official audit or department approval.</p></section>
    <DegreeCourseDrawer course={selected} status={selected ? records[selected.code] ?? "unknown" : "unknown"} onClose={() => setSelected(null)} onStatus={(status) => { if (!selected) return; setRecords({ ...records, [selected.code]: status }); }} />
  </main>;
}

function DegreeCourseDrawer({ course, status, onClose, onStatus }: { course: DegreeCourse | null; status: DegreeStatus; onClose: () => void; onStatus: (status: DegreeStatus) => void }) {
  if (!course) return null;
  const options: { status: DegreeStatus; label: string; description: string }[] = [
    { status: "complete", label: "Complete", description: "Credit earned or requirement satisfied" },
    { status: "in_progress", label: "In progress", description: "Currently enrolled or officially underway" },
    { status: "not_started", label: "Not started", description: "Confirmed remaining" },
    { status: "unknown", label: "Unknown", description: "Keep Daymark from assuming" },
  ];
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="degree-drawer" onMouseDown={(event) => event.stopPropagation()}><button className="drawer-close" onClick={onClose}><X size={20} /></button><p className="eyebrow">{course.requirement}</p><h2>{course.code}</h2><h3>{course.title}</h3><div className="drawer-facts"><div><small>CREDITS</small><b>{course.credits}</b></div><div><small>MAP STAGE</small><b>{course.stage + 1}</b></div></div><section><p className="eyebrow">Requirement context</p><p>{course.prerequisiteText}</p>{course.choiceLabel && <div className="choice-callout"><small>CHOICE GROUP</small><b>{course.choiceLabel}</b><p>Only one option is counted toward this requirement.</p></div>}</section><section><p className="eyebrow">Your official status</p><div className="status-options">{options.map((option) => <button className={status === option.status ? "active" : ""} key={option.status} onClick={() => onStatus(option.status)}><i className={option.status} /> <span><b>{option.label}</b><small>{option.description}</small></span>{status === option.status && <Check size={15} />}</button>)}</div></section><small className="source-note">Set this from DegreeWorks or your official record—not from self-study progress.</small></aside></div>;
}

function parseAuditText(text: string) {
  const proposals = new Map<string, DegreeStatus>();
  text.split(/\r?\n/).forEach((line) => {
    const compact = line.toUpperCase().replace(/\s+/g, " ");
    degreeCourses.forEach((course) => {
      const code = course.code.toUpperCase();
      const joined = code.replace(" ", "");
      if (!compact.includes(code) && !compact.replace(/\s/g, "").includes(joined)) return;
      let status: DegreeStatus = "unknown";
      if (/IN PROGRESS|CURRENTLY ENROLLED|\bIP\b/.test(compact)) status = "in_progress";
      else if (/COMPLETE|COMPLETED|SATISFIED|TRANSFER|EARNED|\bCR\b|\bTR\b|✓/.test(compact)) status = "complete";
      else if (/STILL NEEDED|NOT COMPLETE|REMAINING/.test(compact)) status = "not_started";
      proposals.set(course.code, status);
    });
  });
  return Object.fromEntries(proposals) as DegreeRecords;
}

function DegreeWorksImport({ open, records, onClose, onApply }: { open: boolean; records: DegreeRecords; onClose: () => void; onApply: (records: DegreeRecords) => void }) {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<DegreeRecords>({});
  if (!open) return null;
  const detected = degreeCourses.filter((course) => course.code in proposal);
  const analyze = () => setProposal(parseAuditText(text));
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="audit-dialog" onMouseDown={(event) => event.stopPropagation()}><header><span><FileInput size={20} /></span><div><p className="eyebrow">DegreeWorks import</p><h2>Bring in evidence, then review it.</h2></div><button onClick={onClose}><X size={20} /></button></header><div className="audit-guidance"><p><b>Best path:</b> open your DegreeWorks audit, select all, copy, and paste below.</p><p>If you download a PDF instead, attach it in this Codex task and I can extract it carefully before it becomes your saved degree state.</p></div><label className="file-import"><Upload size={16} /><span><b>Load a text or HTML export</b><small>.txt, .html, or .csv</small></span><input type="file" accept=".txt,.html,.htm,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setText(String(reader.result ?? "")); reader.readAsText(file); }} /></label><label className="audit-text-label">Paste DegreeWorks text<textarea value={text} onChange={(event) => { setText(event.target.value); setProposal({}); }} placeholder={'Example:\nCISC 1115 — Complete\nCISC 2210 — In Progress\nCISC 3130 — Still Needed'} /></label><button className="secondary-button analyze-button" disabled={!text.trim()} onClick={analyze}>Analyze pasted audit</button>{proposal && detected.length > 0 && <div className="detected-courses"><div><p className="eyebrow">Review before applying</p><span>{detected.length} courses detected</span></div>{detected.map((course) => <div className="detected-row" key={course.code}><span><b>{course.code}</b><small>{course.title}</small></span><div>{(["complete", "in_progress", "not_started", "unknown"] as DegreeStatus[]).map((status) => <button key={status} className={proposal[course.code] === status ? "active" : ""} onClick={() => setProposal({ ...proposal, [course.code]: status })}>{status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : status === "not_started" ? "Remaining" : "Ignore"}</button>)}</div></div>)}</div>}{text.trim() && Object.keys(proposal).length === 0 && <p className="empty-detection"><CircleHelp size={15} /> Analyze the text to review detected course codes. Nothing is saved automatically.</p>}<footer><span>Existing statuses remain unless a detected course replaces them.</span><button className="primary-button" disabled={!detected.length} onClick={() => { const applied = { ...records }; Object.entries(proposal).forEach(([code, status]) => { if (status === "unknown") return; applied[code] = status; }); onApply(applied); onClose(); }}>Apply reviewed statuses <ArrowRight size={14} /></button></footer></div></div>;
}

export default function CommandCenter() {
  const [view, setView] = useState<View>("dashboard");
  const [completed, setCompleted] = useState<string[]>([]);
  const [degreeRecords, setDegreeRecords] = useState<DegreeRecords>({});
  const [importOpen, setImportOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { completed?: string[]; degreeRecords?: DegreeRecords };
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.degreeRecords) setDegreeRecords(parsed.degreeRecords);
      }
    } catch { /* The focused demo remains usable if browser storage is unavailable. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, degreeRecords }));
  }, [completed, degreeRecords, hydrated]);

  const complete = (id: string) => setCompleted((current) => current.includes(id) ? current : [...current, id]);
  const title = view === "dashboard" ? "Overview" : view === "degree" ? "Degree map" : "Java course";
  return <div className="app-shell focused-shell"><Sidebar view={view} setView={setView} completed={completed} /><div className="app-main"><TopBar title={title} />{view === "dashboard" && <Dashboard completed={completed} degreeRecords={degreeRecords} setView={setView} onComplete={complete} />}{view === "course" && <CourseView completed={completed} onComplete={complete} />}{view === "degree" && <DegreeMap records={degreeRecords} setRecords={setDegreeRecords} onImport={() => setImportOpen(true)} />}</div><MobileNav view={view} setView={setView} /><DegreeWorksImport open={importOpen} records={degreeRecords} onClose={() => setImportOpen(false)} onApply={setDegreeRecords} /></div>;
}

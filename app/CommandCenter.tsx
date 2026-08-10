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
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { degreeCourses, type DegreeCourse } from "./data/curriculum";

type View = "dashboard" | "degree" | "course";
type DegreeStatus = "unknown" | "complete" | "in_progress" | "not_started";
type DegreeRecords = Record<string, DegreeStatus>;

type LearningSection = {
  id: string;
  title: string;
};

type LearningChapter = {
  id: string;
  unit: string;
  title: string;
  description: string;
  sections: LearningSection[];
};

type PracticeRecord = {
  answers: Record<string, string>;
  attempts: Record<string, number>;
  hints: string[];
  passed: string[];
};

type PracticeRecords = Record<string, PracticeRecord>;

type PracticeQuestion = {
  id: string;
  level: "Warm-up" | "Apply" | "Challenge";
  kind: string;
  title: string;
  prompt: string;
  code?: string;
  placeholder: string;
  hint: string;
  success: string;
  multiline?: boolean;
  validate: (answer: string) => boolean;
};

const learningChapters: LearningChapter[] = [
  {
    id: "variables-data-types",
    unit: "Section 01 · Fundamentals",
    title: "Variables & Data Types",
    description: "Store information with names and choose types that match what the value means.",
    sections: [
      { id: "variables-overview", title: "What Is a Variable?" },
      { id: "variables-declaration", title: "Declaration Anatomy" },
      { id: "variables-types", title: "Java Data Types" },
      { id: "variables-naming", title: "Variable Naming" },
      { id: "variables-changing", title: "Changing a Variable" },
      { id: "variables-printing", title: "Printing Output" },
      { id: "variables-concatenation", title: "Concatenation" },
      { id: "variables-program", title: "Full Program" },
      { id: "variables-takeaways", title: "Key Takeaways" },
      { id: "variables-practice", title: "Practice Session" },
    ],
  },
  {
    id: "operators-expressions",
    unit: "Section 02 · Fundamentals",
    title: "Operators & Expressions",
    description: "Transform values, control evaluation order, and build meaningful output.",
    sections: [
      { id: "operators-arithmetic", title: "Arithmetic Operators" },
      { id: "operators-precedence", title: "Precedence & Parentheses" },
      { id: "operators-assignment", title: "Assignment Shortcuts" },
      { id: "operators-concatenation", title: "Text and +" },
      { id: "operators-takeaways", title: "Key Takeaways" },
      { id: "operators-practice", title: "Practice Session" },
    ],
  },
  {
    id: "decisions",
    unit: "Section 03 · Control flow",
    title: "Decisions",
    description: "Turn comparisons into branches that make a program respond to state.",
    sections: [
      { id: "decisions-comparisons", title: "Comparisons" },
      { id: "decisions-logic", title: "Boolean Logic" },
      { id: "decisions-if-else", title: "If / Else" },
      { id: "decisions-takeaways", title: "Key Takeaways" },
      { id: "decisions-practice", title: "Practice Session" },
    ],
  },
  {
    id: "loops",
    unit: "Section 04 · Control flow",
    title: "Loops",
    description: "Repeat operations deliberately while keeping state and stopping conditions clear.",
    sections: [
      { id: "loops-while", title: "While Loops" },
      { id: "loops-for", title: "For Loops" },
      { id: "loops-tracing", title: "Tracing State" },
      { id: "loops-takeaways", title: "Key Takeaways" },
      { id: "loops-practice", title: "Practice Session" },
    ],
  },
];

const STORAGE_KEY = "daymark-education-v4";

const normalizeLines = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");
const compactCode = (value: string) => value.replace(/\s+/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const titleCase = (value: string) => {
  const minorWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "over", "per", "the", "to", "via", "vs"]);
  const preserved = new Map([
    ["b.s", "B.S."], ["b.s.", "B.S."], ["c++", "C++"], ["cisc", "CISC"], ["cs", "CS"], ["degreeworks", "DegreeWorks"],
    ["gpa", "GPA"], ["java", "Java"], ["pdf", "PDF"], ["string", "String"],
  ]);
  const words = value.split(/\s+/);
  return words.map((word, index) => {
    const match = word.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9+?.]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    const punctuation = core.match(/^(.*?)([?.!,;:]*)$/);
    const body = punctuation?.[1] ?? core;
    const ending = punctuation?.[2] ?? "";
    const lower = body.toLowerCase();
    const keep = preserved.get(lower);
    if (keep) return `${prefix}${keep}${ending}${suffix}`;
    if (minorWords.has(lower) && index > 0 && index < words.length - 1) return `${prefix}${lower}${ending}${suffix}`;
    return `${prefix}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${ending}${suffix}`;
  }).join(" ");
};

const practiceQuestions: Record<string, PracticeQuestion[]> = {
  "variables-data-types": [
    { id: "variables-predict", level: "Warm-up", kind: "Predict output", title: "Follow the value", prompt: "What is the exact output?", code: "int lives = 3;\nlives = 2;\nSystem.out.println(lives);", placeholder: "Type the output", hint: "The second assignment replaces the first value.", success: "Right—the name stays lives, but its stored value is now 2.", validate: (answer) => normalizeLines(answer) === "2" },
    { id: "variables-fill", level: "Warm-up", kind: "Fill missing code", title: "Choose the exact type", prompt: "Replace the blank so the declaration is valid Java.", code: "___ grade = 'A';", placeholder: "Type only the missing word", hint: "One character in single quotes has its own primitive type.", success: "Correct. char stores exactly one character and uses single quotes.", validate: (answer) => answer.trim() === "char" },
    { id: "variables-fix", level: "Apply", kind: "Fix the error", title: "Repair the quotes", prompt: "Rewrite the line as valid Java.", code: "String name = 'Daniel';", placeholder: "Rewrite the complete line", hint: "String and char do not use the same quotation marks.", success: "Fixed. String text uses double quotes.", validate: (answer) => compactCode(answer) === 'Stringname="Daniel";' },
    { id: "variables-concat", level: "Apply", kind: "Exact output", title: "Trace concatenation", prompt: "What is printed? Match capitalization, spaces, and punctuation.", code: 'String name = "Daniel";\nint age = 25;\nSystem.out.println("Name: " + name + ", Age: " + age);', placeholder: "Type the exact output", hint: "Read the println from left to right and keep the spaces inside each String.", success: "Exactly. Java joined the text and both variable values into one line.", validate: (answer) => normalizeLines(answer) === "Name: Daniel, Age: 25" },
    { id: "variables-constraints", level: "Apply", kind: "Write code", title: "Build four variables", prompt: "Declare name as Daniel, age as 25, height as 6.2, and hungry as true. Then print each variable on its own line.", placeholder: "Write the declarations and print statements", hint: "You need String, int, double, and boolean—plus four println statements.", success: "All four values are declared with matching types and printed.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && ["name", "age", "height", "hungry"].every((name) => code.includes(`System.out.println(${name});`)); } },
    { id: "variables-challenge", level: "Challenge", kind: "Editor challenge", title: "Create a player profile", prompt: "Create name Daniel, age 25, height 6.2, hungry true, and grade A. Reassign age to 26. Print exactly: Daniel | 26 | 6.2 | true | A", placeholder: "Write Java statements that satisfy every constraint", hint: "Declare five variables, update age without writing int again, then concatenate the values with \" | \".", success: "Chapter challenge cleared. You declared, updated, and combined five correctly typed values.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && /chargrade='A';/.test(code) && /age=26;/.test(code) && /System\.out\.println\(name\+"\|"/.test(code.replace(/" \| "/g, '"|"')) && ["age", "height", "hungry", "grade"].every((name) => code.includes(`+${name}`)); } },
  ],
  "operators-expressions": [
    { id: "operators-predict", level: "Warm-up", kind: "Predict output", title: "Use precedence", prompt: "What prints?", code: "int score = 4 + 3 * 2;\nSystem.out.println(score);", placeholder: "Exact output", hint: "Multiplication happens before addition.", success: "Correct: 3 × 2 happens first, then 4 is added.", validate: (answer) => normalizeLines(answer) === "10" },
    { id: "operators-parentheses", level: "Apply", kind: "Predict output", title: "Change the order", prompt: "What prints now?", code: "int score = (4 + 3) * 2;\nSystem.out.println(score);", placeholder: "Exact output", hint: "Parentheses are evaluated first.", success: "Correct. Parentheses change the result to 14.", validate: (answer) => normalizeLines(answer) === "14" },
    { id: "operators-fill", level: "Apply", kind: "Fill missing code", title: "Update in place", prompt: "Fill the blank so score increases by 5.", code: "score ___ 5;", placeholder: "Missing operator", hint: "Use the addition assignment shortcut.", success: "Correct. += reads as add, then assign.", validate: (answer) => answer.trim() === "+=" },
    { id: "operators-challenge", level: "Challenge", kind: "Exact output", title: "Numbers become text", prompt: "What exact line prints?", code: 'int x = 2;\nint y = 3;\nSystem.out.println("Total: " + x + y);', placeholder: "Exact output", hint: "Once Java starts joining a String, it continues left to right.", success: "Correct. This prints Total: 23, not Total: 5.", validate: (answer) => normalizeLines(answer) === "Total: 23" },
  ],
  decisions: [
    { id: "decisions-compare", level: "Warm-up", kind: "Predict output", title: "Evaluate a comparison", prompt: "What prints?", code: "int age = 20;\nSystem.out.println(age >= 18);", placeholder: "Exact output", hint: "The comparison itself becomes a boolean value.", success: "Correct. 20 is at least 18, so the result is true.", validate: (answer) => normalizeLines(answer) === "true" },
    { id: "decisions-fill", level: "Apply", kind: "Fill missing code", title: "Require both conditions", prompt: "Fill the blank so both conditions must be true.", code: "if (hasKey ___ doorUnlocked) {", placeholder: "Missing operator", hint: "Java's logical AND uses two ampersands.", success: "Correct. && requires both sides to be true.", validate: (answer) => answer.trim() === "&&" },
    { id: "decisions-output", level: "Apply", kind: "Predict output", title: "Choose the branch", prompt: "What prints?", code: 'int score = 8;\nif (score >= 10) {\n  System.out.println("Win");\n} else {\n  System.out.println("Keep going");\n}', placeholder: "Exact output", hint: "Check whether 8 satisfies score >= 10.", success: "Correct. The false condition sends execution to else.", validate: (answer) => normalizeLines(answer) === "Keep going" },
    { id: "decisions-fix", level: "Challenge", kind: "Fix the error", title: "Write a real condition", prompt: "Rewrite the first line so the block runs when score is 10 or higher.", code: "if (score = 10) {", placeholder: "Corrected first line", hint: "Assignment is not comparison. You also need to include values above 10.", success: "Correct. >= expresses 10 or higher.", validate: (answer) => compactCode(answer) === "if(score>=10){" },
  ],
  loops: [
    { id: "loops-predict", level: "Warm-up", kind: "Predict output", title: "Trace a countdown", prompt: "Write the three output lines.", code: "int lives = 3;\nwhile (lives > 0) {\n  System.out.println(lives);\n  lives--;\n}", placeholder: "Exact output, one value per line", hint: "Print first, then subtract one.", success: "Correct. The loop prints 3, 2, and 1 on separate lines.", multiline: true, validate: (answer) => normalizeLines(answer) === "3\n2\n1" },
    { id: "loops-fill", level: "Apply", kind: "Fill missing code", title: "Advance the counter", prompt: "Fill the blank so the loop eventually stops.", code: "for (int i = 0; i < 3; ___) {", placeholder: "Missing update", hint: "Increase i by one after each iteration.", success: "Correct. i++ advances the loop counter.", validate: (answer) => answer.trim().replace(/\s/g, "") === "i++" },
    { id: "loops-trace", level: "Apply", kind: "Exact output", title: "Trace a step of two", prompt: "What prints on one line?", code: 'for (int i = 0; i < 5; i += 2) {\n  System.out.print(i + " ");\n}', placeholder: "Exact values", hint: "Start at 0 and add 2 while i is below 5.", success: "Correct. The visited values are 0, 2, and 4.", validate: (answer) => answer.trim().replace(/\s+/g, " ") === "0 2 4" },
    { id: "loops-challenge", level: "Challenge", kind: "Write code", title: "Produce an exact sequence", prompt: "Write a for loop that prints 5 4 3 2 1 on one line.", placeholder: "Write the complete loop", hint: "Start at 5, continue while the counter is at least 1, and decrement.", success: "Challenge cleared. Your loop has the correct start, condition, update, and output.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /for\(inti=5;i>=1;i--\)/.test(code) && /System\.out\.print\(i\+" "\);/.test(code); } },
  ],
};

type AuditSnapshot = {
  auditDate: string;
  degreeProgress: number;
  appliedCredits: number;
  remainingCredits: number;
  gpa: number;
  majorApplied: number;
  majorRemaining: number;
  collegeOptionRemaining: number;
  residencyRemaining: number;
  advancedCiscRemaining: number;
  bsCreditsRemaining: number;
  sourceName: string;
};

type DegreePathNode = {
  id: string;
  label: string;
  title: string;
  codes?: string[];
  note?: string;
  kind: "required" | "choice" | "electives" | "finish";
};

const degreePathLevels: { label: string; description: string; nodes: DegreePathNode[] }[] = [
  { label: "Foundations", description: "Completed placement and the selected programming entry point.", nodes: [
    { id: "math-1006", label: "Required", title: "College algebra", codes: ["MATH 1006"], kind: "required" },
    { id: "math-1011", label: "Required", title: "Precalculus", codes: ["MATH 1011"], kind: "required" },
    { id: "programming-entry", label: "Choose one", title: "Programming foundation", codes: ["CISC 1115", "CISC 1170"], note: "Your audit currently applies CISC 1115.", kind: "choice" },
  ] },
  { label: "First unlocks", description: "Math and CS courses that open the rest of the major.", nodes: [
    { id: "math-1201", label: "Required", title: "Calculus I", codes: ["MATH 1201"], kind: "required" },
    { id: "cisc-2210", label: "Required", title: "Discrete structures", codes: ["CISC 2210"], kind: "required" },
    { id: "cisc-3115", label: "Required", title: "Modern programming techniques", codes: ["CISC 3115"], kind: "required" },
  ] },
  { label: "Core construction", description: "The required data, implementation, and calculus sequence.", nodes: [
    { id: "math-1206", label: "Selected math path", title: "Calculus II", codes: ["MATH 1206"], note: "Your completed MATH 1201 selects this DegreeWorks branch.", kind: "required" },
    { id: "cisc-3130", label: "Required", title: "Data structures", codes: ["CISC 3130"], kind: "required" },
    { id: "cisc-3140", label: "Required", title: "Design & implementation II", codes: ["CISC 3140"], kind: "required" },
  ] },
  { label: "Advanced branches", description: "Required upper-level work plus the places where you choose a route.", nodes: [
    { id: "cisc-3142", label: "Required", title: "Programming paradigms in C++", codes: ["CISC 3142"], kind: "required" },
    { id: "cisc-3320", label: "Required", title: "Operating systems", codes: ["CISC 3320"], note: "CISC 7312X is an alternative only with GPA above 3.0.", kind: "required" },
    { id: "architecture-choice", label: "Choose one", title: "Architecture / organization", codes: ["CISC 3310", "CISC 3305"], kind: "choice" },
    { id: "theory-choice", label: "Choose one", title: "Algorithms / theory", codes: ["CISC 3220", "CISC 3230"], kind: "choice" },
    { id: "probability-choice", label: "Choose one", title: "Probability & statistics", codes: ["MATH 2501", "MATH 3501"], kind: "choice" },
    { id: "ethics-choice", label: "Choose one", title: "Computers & ethics", codes: ["CISC 2820W", "PHIL 3318W"], note: "CISC 2820W may also help the separate CISC writing-intensive rule; confirm with advisement.", kind: "choice" },
    { id: "electives", label: "Choose three", title: "Upper-level CISC electives", note: "Three classes numbered CISC 3000-4899.", kind: "electives" },
  ] },
  { label: "Finish line", description: "Capstone choice and degree-wide graduation gates.", nodes: [
    { id: "capstone-choice", label: "Choose one", title: "Independent group / study", codes: ["CISC 4900", "CISC 5001"], kind: "choice" },
    { id: "writing-intensive", label: "Degree requirement", title: "One writing-intensive CISC course", note: "DegreeWorks currently shows 1 CISC @W still needed.", kind: "finish" },
    { id: "degree-gates", label: "Graduation gates", title: "Credits, residency, GPA", note: "These update from the audit summary below.", kind: "finish" },
  ] },
];

const degreeWorksSnapshot: AuditSnapshot = {
  auditDate: "08/09/2026",
  degreeProgress: 57,
  appliedCredits: 59,
  remainingCredits: 61,
  gpa: 1.2,
  majorApplied: 14,
  majorRemaining: 53.5,
  collegeOptionRemaining: 3,
  residencyRemaining: 20,
  advancedCiscRemaining: 24,
  bsCreditsRemaining: 15,
  sourceName: "DegreeWorks.pdf",
};

const initialDegreeRecords: DegreeRecords = Object.fromEntries([
  ...degreeCourses.map((course) => [course.code, "not_started" as DegreeStatus]),
  ["MATH 1006", "complete"], ["MATH 1011", "complete"], ["MATH 1201", "complete"], ["CISC 1115", "in_progress"],
]) as DegreeRecords;

function chapterProgress(chapterId: string, completed: string[], practice: PracticeRecords) {
  const questions = practiceQuestions[chapterId] ?? [];
  const readingDone = completed.includes(`${chapterId}:read`);
  const passed = practice[chapterId]?.passed?.length ?? 0;
  const practiceDone = questions.length > 0 && passed >= questions.length;
  const points = (readingDone ? 1 : 0) + (practiceDone ? 3 : 0);
  return { readingDone, practiceDone, passed, questions: questions.length, points, total: 4, percent: points * 25 };
}

function learningProgress(completed: string[], practice: PracticeRecords) {
  const chapters = learningChapters.map((chapter) => chapterProgress(chapter.id, completed, practice));
  const points = chapters.reduce((sum, chapter) => sum + chapter.points, 0);
  const total = chapters.length * 4;
  return { points, total, percent: total ? Math.round((points / total) * 100) : 0, completedChapters: chapters.filter((chapter) => chapter.percent === 100).length };
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
      <div><p className="eyebrow">Education Campaign</p><h1>{titleCase(title)}</h1></div>
      <div className="top-actions"><span className="focus-pill"><Sparkles size={13} /> Education focus</span><button className="avatar" aria-label="Open profile">D</button></div>
    </header>
  );
}

function Sidebar({ view, setView, completed, practice }: { view: View; setView: (view: View) => void; completed: string[]; practice: PracticeRecords }) {
  const progress = learningProgress(completed, practice);
  return <aside className="sidebar">
    <button className="brand" onClick={() => setView("dashboard")}><span className="brand-mark">D/</span><span><b>DAYMARK</b><small>Education Campaign</small></span></button>
    <nav className="primary-nav" aria-label="Education navigation">
      <p className="nav-section-label">Campaign</p>
      <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen className="nav-mark" size={17} />Overview</button>
      <button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch className="nav-mark" size={17} />Degree Map</button>
      <p className="nav-section-label course-label">Active Course</p>
      <button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 className="nav-mark" size={17} />CISC 1115<span className="nav-progress">{progress.percent}%</span></button>
    </nav>
    <div className="sidebar-course"><div className="sidebar-course-top"><span className="course-glyph">J</span><span><small>Self-Study Campaign</small><b>Intro to Java</b></span></div><ProgressBar value={progress.percent} /><div className="split-meta"><span>{progress.completedChapters} / {learningChapters.length} chapters</span><span>{progress.percent}%</span></div></div>
    <div className="sidebar-footer"><div className="sync-state"><span />Progress saved on this device</div></div>
  </aside>;
}

function MobileNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen size={18} />Overview</button><button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch size={18} />Degree</button><button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 size={18} />Java</button></nav>;
}

function Dashboard({ completed, practice, degreeRecords, setView }: { completed: string[]; practice: PracticeRecords; degreeRecords: DegreeRecords; setView: (view: View) => void }) {
  const progress = learningProgress(completed, practice);
  const nextChapter = learningChapters.find((chapter) => chapterProgress(chapter.id, completed, practice).percent < 100) ?? learningChapters[0];
  const credits = verifiedDegreeCredits(degreeRecords);
  const knownStatuses = Object.values(degreeRecords).filter((status) => status !== "unknown").length;
  return <main className="page-content education-home">
    <section className="education-hero">
      <div className="hero-copy"><p className="eyebrow accent-text">Continue Learning</p><span className="section-chip">{nextChapter.unit}</span><h2>{titleCase(nextChapter.title)}</h2><p>{nextChapter.description}</p><div className="hero-actions"><button className="primary-button" onClick={() => setView("course")}><Play size={14} fill="currentColor" />Open chapter</button><button className="soft-button" onClick={() => setView("degree")}>View degree path <ArrowRight size={14} /></button></div></div>
      <div className="hero-progress-card"><div className="progress-orbit" style={{ "--progress": `${progress.percent}%` } as React.CSSProperties}><div><b>{progress.percent}%</b><small>course</small></div></div><div><p className="eyebrow">CISC 1115</p><h3>Introduction to Programming Using Java</h3><span>{progress.completedChapters} of {learningChapters.length} chapters demonstrated</span><ProgressBar value={progress.percent} /><small className="progress-explainer">Each chapter: reading checkpoint 25% · completed practice 75%</small></div></div>
    </section>
    <section className="education-dashboard-grid">
      <div className="campaign-card rounded-panel"><div className="panel-heading"><div><p className="eyebrow">Course Route</p><h3>Chapter Progression</h3></div><span className="route-time">Proof over time</span></div><div className="mission-list">{learningChapters.map((chapter) => { const state = chapterProgress(chapter.id, completed, practice); const done = state.percent === 100; const active = chapter.id === nextChapter.id; return <div key={chapter.id} className={`mission-row ${done ? "completed" : active ? "current" : ""}`}><StatusMark done={done} active={active} /><button onClick={() => setView("course")}><b>{titleCase(chapter.title)}</b><small>{done ? "Chapter cleared" : `${state.readingDone ? "Lesson read" : "Reading open"} · ${state.passed}/${state.questions} practice passed`}</small></button><span className="mission-percent">{state.percent}%</span>{done && <span className="cleared-pill"><Check size={11} /> Cleared</span>}</div>; })}</div><button className="panel-footer-button" onClick={() => setView("course")}>Open the Java course <ArrowRight size={14} /></button></div>
      <div className="degree-brief-card rounded-panel"><div className="panel-heading"><div><p className="eyebrow">Actual degree</p><h3>Brooklyn College CS B.S.</h3></div><GraduationCap size={22} /></div><div className="audit-state"><span className={knownStatuses ? "known" : ""}>{knownStatuses ? <Check size={22} /> : <CircleHelp size={22} />}</span><div><b>{knownStatuses ? `${credits} credits verified` : "Completion unknown"}</b><p>{knownStatuses ? `${knownStatuses} course statuses recorded.` : "Upload DegreeWorks so Daymark does not guess."}</p></div></div><div className="degree-rule-list"><div><span>67.5</span><p><b>Audit major credits</b><small>Current DegreeWorks maximum</small></p></div><div><span>3×</span><p><b>Upper-level electives</b><small>CISC 3000–4899</small></p></div><div><span>C</span><p><b>Required CS minimum</b><small>Prerequisite courses</small></p></div></div><button className="secondary-button wide" onClick={() => setView("degree")}>Open degree tree & upload audit <ArrowRight size={14} /></button></div>
    </section>
  </main>;
}

function CourseView({ completed, practice, onComplete, onPracticeChange }: { completed: string[]; practice: PracticeRecords; onComplete: (id: string) => void; onPracticeChange: (chapterId: string, record: PracticeRecord) => void }) {
  const [selectedChapterId, setSelectedChapterId] = useState(learningChapters[0].id);
  const [activeSectionId, setActiveSectionId] = useState(learningChapters[0].sections[0].id);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const scrollLockRef = useRef<string | null>(null);
  const selectedChapter = learningChapters.find((chapter) => chapter.id === selectedChapterId) ?? learningChapters[0];
  const course = learningProgress(completed, practice);
  const chapter = chapterProgress(selectedChapter.id, completed, practice);

  useLayoutEffect(() => {
    scrollLockRef.current = null;
    setActiveSectionId(selectedChapter.sections[0].id);
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, [selectedChapter.id, selectedChapter.sections]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const update = () => {
      if (scrollLockRef.current) return;
      const current = selectedChapter.sections.map((section) => { const element = reader.querySelector<HTMLElement>(`#${section.id}`); return element ? { id: section.id, top: element.getBoundingClientRect().top - reader.getBoundingClientRect().top } : null; }).filter((entry): entry is { id: string; top: number } => Boolean(entry)).filter((entry) => entry.top <= 125).at(-1);
      if (current) setActiveSectionId(current.id);
    };
    update(); reader.addEventListener("scroll", update, { passive: true });
    return () => reader.removeEventListener("scroll", update);
  }, [selectedChapter]);

  const selectChapter = (next: LearningChapter) => {
    if (next.id === selectedChapterId) return;
    scrollLockRef.current = null;
    if (readerRef.current) readerRef.current.scrollTop = 0;
    setActiveSectionId(next.sections[0].id);
    setSelectedChapterId(next.id);
    window.requestAnimationFrame(() => { if (readerRef.current) readerRef.current.scrollTop = 0; });
  };
  const scrollToSection = (sectionId: string) => {
    const reader = readerRef.current; const element = reader?.querySelector<HTMLElement>(`#${sectionId}`);
    if (!reader || !element) return;
    scrollLockRef.current = sectionId;
    setActiveSectionId(sectionId);
    const readerTop = reader.getBoundingClientRect().top;
    const sectionTop = element.getBoundingClientRect().top;
    reader.scrollTo({ top: Math.max(0, reader.scrollTop + sectionTop - readerTop - 22), behavior: "smooth" });
    window.setTimeout(() => { if (scrollLockRef.current === sectionId) scrollLockRef.current = null; }, 1600);
  };

  return <main className="course-page continuous-course">
    <div className="course-banner"><div><span className="course-glyph large">J</span><div><p className="eyebrow">CISC 1115 · Self-study</p><h2>Introduction to Programming Using Java</h2></div></div><div className="course-total"><span><b>{course.percent}%</b><small>{course.completedChapters} / {learningChapters.length} chapters cleared</small></span><ProgressBar value={course.percent} /></div></div>
    <div className="continuous-layout">
      <aside className="contents-rail">
        <div className="contents-heading"><p className="eyebrow">Course Contents</p><span>{learningChapters.length} chapters</span></div>
        {learningChapters.map((item, index) => {
          const state = chapterProgress(item.id, completed, practice);
          const open = item.id === selectedChapter.id;
          const done = state.percent === 100;
          return <div className={`contents-section ${open ? "open" : ""} ${done ? "completed" : ""}`} key={item.id}>
            <button className="contents-section-button" aria-expanded={open} onClick={() => selectChapter(item)}>
              <span className="chapter-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="chapter-copy"><small>{item.unit}</small><b>{titleCase(item.title)}</b></span>
              <span className="chapter-row-actions">{done && <span className="chapter-done-badge" role="img" aria-label="Chapter complete"><Check size={12} strokeWidth={3.2} /></span>}<ChevronDown size={15} /></span>
            </button>
            <div className={`chapter-subsections-shell ${open ? "expanded" : ""}`} aria-hidden={!open}><div><div className="part-list">{item.sections.map((section, sectionIndex) => <button key={section.id} tabIndex={open ? 0 : -1} className={open && activeSectionId === section.id ? "active" : ""} onClick={() => open && scrollToSection(section.id)}><span className="part-index">{String(sectionIndex + 1).padStart(2, "0")}</span><b>{titleCase(section.title)}</b>{section.id.endsWith("practice") && <small>{state.passed}/{state.questions}</small>}</button>)}</div></div></div>
          </div>;
        })}
        <div className="section-progress-card"><div><span>Course Completion</span><b>{course.percent}%</b></div><ProgressBar value={course.percent} /><small>{course.completedChapters} / {learningChapters.length} chapters cleared</small><p>Each chapter combines a 25% reading checkpoint with 75% demonstrated practice.</p></div>
      </aside>
      <div className="chapter-reader" ref={readerRef}><article className="chapter-article chapter-swap" key={selectedChapter.id}><header className="chapter-cover"><p className="eyebrow accent-text">{selectedChapter.unit}</p><h1>{titleCase(selectedChapter.title)}</h1><p>{selectedChapter.description}</p><div><span>One complete lesson</span><span>{practiceQuestions[selectedChapter.id].length} practice exercises</span><span>Practice required to clear</span></div></header><ChapterLessonContent chapterId={selectedChapter.id} readingDone={chapter.readingDone} onRead={() => onComplete(`${selectedChapter.id}:read`)} /><ChapterPractice chapterId={selectedChapter.id} record={practice[selectedChapter.id]} readingDone={chapter.readingDone} onChange={(record) => onPracticeChange(selectedChapter.id, record)} /></article></div>
    </div>
  </main>;
}

function LearningSectionBlock({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="lesson-section" id={id} data-learning-section><div className="lesson-section-heading"><p className="eyebrow">{eyebrow}</p><h2>{titleCase(title)}</h2></div>{children}</section>;
}

function CodeExample({ label, code }: { label: string; code: string }) {
  return <div className="teaching-code lesson-code"><div><span>Java</span><small>{label}</small></div><pre><code>{code}</code></pre></div>;
}

function ReadingCheckpoint({ done, onRead }: { done: boolean; onRead: () => void }) {
  return <div className={`reading-checkpoint ${done ? "done" : ""}`}>{done ? <><span><Check size={20} strokeWidth={3} /></span><div><b>Lesson read</b><small>This records reading. The practice session still demonstrates mastery.</small></div></> : <><div><b>Reached the end of the lesson?</b><small>Record the reading checkpoint, then prove it in practice.</small></div><button className="complete-part-button" onClick={onRead}><BookOpen size={15} /> Mark lesson read</button></>}</div>;
}

function ChapterLessonContent({ chapterId, readingDone, onRead }: { chapterId: string; readingDone: boolean; onRead: () => void }) {
  if (chapterId === "variables-data-types") return <>
    <LearningSectionBlock id="variables-overview" eyebrow="Direct definition" title="What is a variable?"><p className="lesson-lead">A variable is a named location in memory used to store a value. The name gives your program a readable way to find and use that value later.</p><CodeExample label="A first variable" code="int age = 25;" /><aside className="key-idea"><Sparkles size={17} /><p><b>The variable and its value are not the same thing.</b><span><code>age</code> is the reusable name. <code>25</code> is the value currently stored under that name.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="variables-declaration" eyebrow="Break it down" title="Declaration anatomy"><p className="lesson-lead">The general pattern is <code>type variableName = value;</code>. Read it from left to right: what kind of value, what name, and what value to store.</p><CodeExample label="General syntax" code="type variableName = value;" /><div className="declaration-grid"><div><code>int</code><b>Data type</b><small>Only whole numbers fit here</small></div><div><code>age</code><b>Variable name</b><small>The label used later</small></div><div><code>=</code><b>Assignment</b><small>Stores the right side</small></div><div><code>25</code><b>Value</b><small>The actual data</small></div><div><code>;</code><b>Statement end</b><small>Required punctuation</small></div></div><CodeExample label="More declarations" code={'String name = "Daniel";\ndouble height = 6.2;\nboolean hungry = true;\nchar grade = \'A\';'} /></LearningSectionBlock>
    <LearningSectionBlock id="variables-types" eyebrow="Five useful types" title="Java data types"><p className="lesson-lead">A data type limits what a variable can store. Java checks the type so it knows which values and operations are legal.</p><div className="type-grid expanded-types"><div><code>int</code><p><b>Whole numbers</b><small>5 · 100 · -25</small></p></div><div><code>double</code><p><b>Decimal numbers</b><small>3.14 · 2.5 · 100.001</small></p></div><div><code>boolean</code><p><b>Only true or false</b><small>No quotation marks</small></p></div><div><code>char</code><p><b>Exactly one character</b><small>Uses 'single quotes'</small></p></div><div><code>String</code><p><b>Text of any length</b><small>Uses "double quotes"</small></p></div></div><div className="rule-callout"><b>Important distinction</b><p><code>"123"</code> is a String, not a number. <code>'A'</code> is a char, while <code>"A"</code> is a String. The quotation marks change the type.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-naming" eyebrow="Readable code" title="Variable naming"><p className="lesson-lead">Use names that explain what a value means. Java commonly uses <b>camelCase</b>: begin lowercase, then capitalize each additional word.</p><div className="naming-compare"><div><span>GOOD</span><code>playerHealth</code><code>firstName</code><code>carSpeed</code></div><div><span>AVOID</span><code>x</code><code>thing</code><code>asdf</code></div></div><ul className="lesson-rules"><li>Names cannot contain spaces.</li><li>Names cannot begin with a number.</li><li>Names are case-sensitive: <code>age</code> and <code>Age</code> are different.</li><li>Do not use Java keywords such as <code>int</code> as a name.</li></ul></LearningSectionBlock>
    <LearningSectionBlock id="variables-changing" eyebrow="Reassignment" title="Changing a variable"><p className="lesson-lead">Variables can be updated. Declare the variable once with its type; later assignments reuse only the name.</p><CodeExample label="One variable, three stored values" code={'int lives = 3;\nlives = 2;\nlives = 1;'} /><aside className="key-idea"><RotateCcw size={17} /><p><b>The variable stays the same; only its value changes.</b><span>Writing <code>int lives</code> again would be a second declaration, not an update.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="variables-printing" eyebrow="See the value" title="Printing output"><p className="lesson-lead"><code>System.out.println</code> prints one line. Put text in double quotes; put a variable name without quotes when you want its stored value.</p><div className="comparison-code"><pre><small>PRINT TEXT</small><code>System.out.println("Hello");</code><b>Hello</b></pre><pre><small>PRINT A VARIABLE</small><code>{'int age = 25;\nSystem.out.println(age);'}</code><b>25</b></pre></div><div className="rule-callout"><b>Quotes decide what Java prints</b><p><code>println(age)</code> prints the value 25. <code>println("age")</code> literally prints the word age.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-concatenation" eyebrow="Joining text" title="Concatenation"><p className="lesson-lead">Use <code>+</code> to join text and variables into one output line. This is called concatenation.</p><CodeExample label="A greeting built from a variable" code={'String name = "Daniel";\nSystem.out.println("Hello " + name);'} /><div className="output-card"><span>OUTPUT</span><code>Hello Daniel</code></div><p className="lesson-note">Spaces are not added automatically. The space after <code>Hello</code> exists because it is inside <code>"Hello "</code>.</p></LearningSectionBlock>
    <LearningSectionBlock id="variables-program" eyebrow="Put it together" title="A complete program"><p className="lesson-lead">This program declares four variables and prints each stored value.</p><CodeExample label="Variables working inside Main" code={'public class Main {\n    public static void main(String[] args) {\n        String name = "Daniel";\n        int age = 25;\n        double height = 6.2;\n        boolean likesJava = true;\n\n        System.out.println(name);\n        System.out.println(age);\n        System.out.println(height);\n        System.out.println(likesJava);\n    }\n}'} /><div className="rule-callout muted"><b>Ignore the wrapper for now</b><p><code>public class Main</code> and <code>public static void main(String[] args)</code> are required structure. We will learn what they mean later.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />Every variable has a data type.</li><li><Check size={16} />A variable name points to a stored value.</li><li><Check size={16} /><code>=</code> assigns the value on the right.</li><li><Check size={16} />Statements end with <code>;</code>.</li><li><Check size={16} /><code>String</code> uses double quotes; <code>char</code> uses single quotes.</li><li><Check size={16} />Reassignment changes a value without declaring again.</li><li><Check size={16} /><code>+</code> joins text and variables when a String is involved.</li></ul><ReadingCheckpoint done={readingDone} onRead={onRead} /></LearningSectionBlock>
  </>;

  if (chapterId === "operators-expressions") return <>
    <LearningSectionBlock id="operators-arithmetic" eyebrow="Core operations" title="Arithmetic operators"><p className="lesson-lead">Operators combine or transform values. Java uses <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, and <code>%</code> for numeric work.</p><div className="operator-grid"><div><code>+</code><b>Add</b><small>8 + 2 → 10</small></div><div><code>-</code><b>Subtract</b><small>8 - 2 → 6</small></div><div><code>*</code><b>Multiply</b><small>8 * 2 → 16</small></div><div><code>/</code><b>Divide</b><small>8 / 2 → 4</small></div><div><code>%</code><b>Remainder</b><small>8 % 3 → 2</small></div></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-precedence" eyebrow="Evaluation order" title="Precedence & parentheses"><p className="lesson-lead">Multiplication, division, and remainder run before addition and subtraction. Parentheses make a different order explicit.</p><div className="comparison-code"><pre><small>DEFAULT</small><code>4 + 3 * 2</code><b>10</b></pre><pre><small>PARENTHESES</small><code>(4 + 3) * 2</code><b>14</b></pre></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-assignment" eyebrow="Update state" title="Assignment shortcuts"><p className="lesson-lead">Shortcuts update an existing variable without repeating it.</p><CodeExample label="Equivalent updates" code={'score += 10;  // score = score + 10;\nlives -= 1;   // lives = lives - 1;'} /></LearningSectionBlock>
    <LearningSectionBlock id="operators-concatenation" eyebrow="A crucial edge case" title="Text and +"><p className="lesson-lead">When Java reaches a String, <code>+</code> joins from left to right. That can make numbers look added when they were actually attached as text.</p><CodeExample label="This prints Total: 23" code={'int x = 2;\nint y = 3;\nSystem.out.println("Total: " + x + y);'} /></LearningSectionBlock>
    <LearningSectionBlock id="operators-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />Precedence controls evaluation order.</li><li><Check size={16} />Parentheses make intent explicit.</li><li><Check size={16} />Assignment shortcuts change stored state.</li><li><Check size={16} />A String changes <code>+</code> into concatenation.</li></ul><ReadingCheckpoint done={readingDone} onRead={onRead} /></LearningSectionBlock>
  </>;

  if (chapterId === "decisions") return <>
    <LearningSectionBlock id="decisions-comparisons" eyebrow="Boolean questions" title="Comparisons"><p className="lesson-lead">A comparison asks a yes-or-no question and produces <code>true</code> or <code>false</code>.</p><div className="operator-grid"><div><code>==</code><b>Equal</b><small>score == 10</small></div><div><code>!=</code><b>Not equal</b><small>lives != 0</small></div><div><code>&gt;</code><b>Greater</b><small>age &gt; 18</small></div><div><code>&lt;=</code><b>At most</b><small>speed &lt;= 55</small></div></div></LearningSectionBlock>
    <LearningSectionBlock id="decisions-logic" eyebrow="Combine conditions" title="Boolean logic"><div className="type-grid"><div><code>&amp;&amp;</code><p><b>AND</b><small>Both must be true</small></p></div><div><code>||</code><p><b>OR</b><small>At least one true</small></p></div><div><code>!</code><p><b>NOT</b><small>Flips the boolean</small></p></div></div></LearningSectionBlock>
    <LearningSectionBlock id="decisions-if-else" eyebrow="Choose a path" title="If / else"><p className="lesson-lead">An <code>if</code> block runs only when its condition is true. <code>else</code> provides the alternative path.</p><CodeExample label="Exactly one branch runs" code={'if (hasKey) {\n    System.out.println("Access granted");\n} else {\n    System.out.println("Door locked");\n}'} /></LearningSectionBlock>
    <LearningSectionBlock id="decisions-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />Comparisons produce booleans.</li><li><Check size={16} /><code>&gt;=</code> means at least; <code>==</code> means equal.</li><li><Check size={16} /><code>&amp;&amp;</code>, <code>||</code>, and <code>!</code> combine conditions.</li><li><Check size={16} />Only the matching branch runs.</li></ul><ReadingCheckpoint done={readingDone} onRead={onRead} /></LearningSectionBlock>
  </>;

  return <>
    <LearningSectionBlock id="loops-while" eyebrow="Conditional repetition" title="While loops"><p className="lesson-lead">A <code>while</code> loop repeats as long as its condition stays true. Something inside must eventually change the condition.</p><CodeExample label="Countdown" code={'while (lives > 0) {\n    System.out.println(lives);\n    lives--;\n}'} /></LearningSectionBlock>
    <LearningSectionBlock id="loops-for" eyebrow="Counted repetition" title="For loops"><p className="lesson-lead">A <code>for</code> loop keeps its starting value, condition, and update together.</p><CodeExample label="Three iterations" code={'for (int turn = 0; turn < 3; turn++) {\n    System.out.println(turn);\n}'} /></LearningSectionBlock>
    <LearningSectionBlock id="loops-tracing" eyebrow="Debug the state" title="Tracing a loop"><p className="lesson-lead">Write down the control variable before each iteration. That exposes off-by-one errors and infinite loops.</p><div className="trace-table"><div><b>Iteration</b><b>turn before</b><b>Output</b></div><div><span>1</span><span>0</span><code>0</code></div><div><span>2</span><span>1</span><code>1</code></div><div><span>3</span><span>2</span><code>2</code></div></div></LearningSectionBlock>
    <LearningSectionBlock id="loops-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />A loop needs a start, stopping condition, and update.</li><li><Check size={16} />Trace state one iteration at a time.</li><li><Check size={16} />A missing update can create an infinite loop.</li><li><Check size={16} />Use a for loop when repetition is structured.</li></ul><ReadingCheckpoint done={readingDone} onRead={onRead} /></LearningSectionBlock>
  </>;
}

const emptyPracticeRecord = (): PracticeRecord => ({ answers: {}, attempts: {}, hints: [], passed: [] });

function ChapterPractice({ chapterId, record: savedRecord, readingDone, onChange }: { chapterId: string; record?: PracticeRecord; readingDone: boolean; onChange: (record: PracticeRecord) => void }) {
  const questions = practiceQuestions[chapterId];
  const record = savedRecord ?? emptyPracticeRecord();
  const firstUnpassed = questions.findIndex((question) => !record.passed.includes(question.id));
  const [activeIndex, setActiveIndex] = useState(firstUnpassed < 0 ? 0 : firstUnpassed);
  const [feedback, setFeedback] = useState<Record<string, "correct" | "incorrect">>({});
  const question = questions[Math.min(activeIndex, questions.length - 1)];
  const passed = record.passed.includes(question.id);
  const allPassed = record.passed.length === questions.length;

  const updateAnswer = (answer: string) => {
    onChange({ ...record, answers: { ...record.answers, [question.id]: answer } });
    setFeedback((current) => { const next = { ...current }; delete next[question.id]; return next; });
  };
  const check = () => {
    const answer = record.answers[question.id] ?? "";
    const correct = question.validate(answer);
    const attempts = { ...record.attempts, [question.id]: (record.attempts[question.id] ?? 0) + 1 };
    const nextPassed = correct && !passed ? [...record.passed, question.id] : record.passed;
    onChange({ ...record, attempts, passed: nextPassed });
    setFeedback((current) => ({ ...current, [question.id]: correct ? "correct" : "incorrect" }));
  };
  const revealHint = () => onChange({ ...record, hints: record.hints.includes(question.id) ? record.hints : [...record.hints, question.id] });

  return <section className="practice-session" id={`${chapterId.split("-")[0]}-practice`} data-learning-section>
    <div className="practice-header"><div><p className="eyebrow">Demonstrated Progress</p><h2>Practice Session</h2><p>Complete every exercise to clear this chapter. Attempts are tracked; clues help without marking the answer correct.</p></div><div className="practice-score"><b>{record.passed.length}/{questions.length}</b><small>passed</small></div></div>
    <div className="question-route">{questions.map((item, index) => <button key={item.id} className={`${index === activeIndex ? "active" : ""} ${record.passed.includes(item.id) ? "passed" : ""}`} onClick={() => setActiveIndex(index)} aria-label={`Open question ${index + 1}`}><span>{record.passed.includes(item.id) ? <Check size={13} strokeWidth={3} /> : index + 1}</span><small>{item.level}</small></button>)}</div>
    <div className="practice-workspace"><header><div><span className={`difficulty ${question.level.toLowerCase()}`}>{question.level}</span><span>{question.kind}</span></div><small>{record.attempts[question.id] ?? 0} attempts</small></header><h3>{titleCase(question.title)}</h3><p>{question.prompt}</p>{question.code && <pre className="practice-code"><code>{question.code}</code></pre>}<label htmlFor={`practice-${question.id}`}>Your answer</label>{question.multiline ? <textarea id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} spellCheck={false} /> : <input id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} onKeyDown={(event) => { if (event.key === "Enter") check(); }} autoComplete="off" />}
      {record.hints.includes(question.id) && <div className="practice-hint"><Sparkles size={15} /><p><b>Clue</b>{question.hint}</p></div>}
      {(feedback[question.id] || passed) && <div className={`practice-feedback ${passed || feedback[question.id] === "correct" ? "correct" : "incorrect"}`}><span>{passed || feedback[question.id] === "correct" ? <Check size={18} strokeWidth={3} /> : <RotateCcw size={17} />}</span><p><b>{passed || feedback[question.id] === "correct" ? "Passed" : "Not yet"}</b><small>{passed || feedback[question.id] === "correct" ? question.success : "Check the exact requirement, use a clue if needed, and try again."}</small></p></div>}
      <div className="practice-actions"><button className="soft-button" onClick={revealHint} disabled={record.hints.includes(question.id)}><CircleHelp size={14} />{record.hints.includes(question.id) ? "Clue shown" : "Show clue"}</button><button className="primary-button" onClick={check} disabled={!String(record.answers[question.id] ?? "").trim()}>{passed ? "Check again" : "Check answer"}<ArrowRight size={14} /></button></div>
    </div>
    <div className="practice-pagination"><button onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={activeIndex === 0}>Previous</button><span>Question {activeIndex + 1} of {questions.length}</span><button onClick={() => setActiveIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={activeIndex === questions.length - 1}>Next</button></div>
    {allPassed && <div className={`chapter-cleared-banner ${readingDone ? "complete" : "waiting"}`}><span>{readingDone ? <Check size={24} strokeWidth={3} /> : <BookOpen size={22} />}</span><div><b>{readingDone ? "Chapter cleared" : "Practice cleared—reading checkpoint remains"}</b><small>{readingDone ? "Every exercise passed. This chapter now counts as complete." : "Return to Key takeaways and mark the lesson read to finish the chapter."}</small></div></div>}
  </section>;
}

function pathNodeStatus(node: DegreePathNode, records: DegreeRecords): DegreeStatus {
  if (!node.codes?.length) return "unknown";
  const statuses = node.codes.map((code) => records[code] ?? "unknown");
  if (statuses.includes("complete")) return "complete";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.every((status) => status === "not_started")) return "not_started";
  return "unknown";
}

function DegreeMap({ records, setRecords, snapshot, onImport }: { records: DegreeRecords; setRecords: (records: DegreeRecords) => void; snapshot: AuditSnapshot; onImport: () => void }) {
  const [selected, setSelected] = useState<DegreeCourse | null>(null);
  const completed = degreeCourses.filter((course) => records[course.code] === "complete").length;
  const inProgress = degreeCourses.filter((course) => records[course.code] === "in_progress").length;
  return <main className="page-content degree-page focused-degree vertical-degree">
    <section className="degree-hero audit-backed-hero"><div><p className="eyebrow accent-text">Brooklyn College · DegreeWorks mapped</p><h2>Your path to the degree</h2><p>Required courses stay separate from choice groups. Branches mean “choose one,” not “take everything.” Your uploaded audit controls the status colors.</p><div className="hero-actions"><button className="primary-button" onClick={onImport}><Upload size={15} />Upload DegreeWorks PDF</button><span className="honesty-note"><Check size={14} /> Audit reviewed {snapshot.auditDate}</span></div></div><div className="degree-verification"><div><b>{snapshot.degreeProgress}%</b><small>DegreeWorks progress</small></div><div><b>{snapshot.appliedCredits}</b><small>credits applied</small></div><div><b>{snapshot.remainingCredits}</b><small>credits remaining</small></div></div></section>
    <section className="audit-summary-strip"><div><small>Major block</small><b>{snapshot.majorApplied} applied · {snapshot.majorRemaining} remaining</b></div><div><small>Mapped course states</small><b>{completed} complete · {inProgress} in progress</b></div><div><small>Current GPA</small><b className={snapshot.gpa < 2 ? "needs-attention" : ""}>{snapshot.gpa.toFixed(3)} · {snapshot.gpa < 2 ? "2.0 required" : "requirement met"}</b></div><div><small>Source</small><b>{snapshot.sourceName}</b></div></section>
    <div className="degree-map-heading"><div><p className="eyebrow">Requirement family tree</p><h3>Start at the top. Follow the branches downward.</h3></div><div className="degree-legend"><span><i className="complete" />Complete</span><span><i className="in_progress" />In progress</span><span><i className="not_started" />Remaining</span><span><i className="unknown" />Audit rule</span></div></div>
    <section className="degree-family-tree">{degreePathLevels.map((level, levelIndex) => <div className="degree-family-level" key={level.label}>{levelIndex > 0 && <div className="family-connector"><span /></div>}<header><span>{String(levelIndex + 1).padStart(2, "0")}</span><div><b>{level.label}</b><small>{level.description}</small></div></header><div className="family-node-row">{level.nodes.map((node) => { const status = pathNodeStatus(node, records); return <div className={`degree-branch-bubble ${node.kind} ${status}`} key={node.id}><div className="bubble-top"><span className="degree-status-icon">{status === "complete" ? <Check size={16} strokeWidth={3} /> : status === "in_progress" ? <Play size={12} fill="currentColor" /> : status === "not_started" ? <LockKeyhole size={14} /> : <GitBranch size={14} />}</span><small>{node.label}</small></div><h4>{node.title}</h4>{node.codes && <div className="bubble-options">{node.codes.map((code, index) => { const course = degreeCourses.find((item) => item.code === code); const optionStatus = records[code] ?? "unknown"; return <div className="bubble-option-wrap" key={code}>{index > 0 && <span className="or-label">OR</span>}<button className={optionStatus} onClick={() => course && setSelected(course)}><b>{code}</b><small>{course?.title}</small><i>{optionStatus === "in_progress" ? "In progress" : optionStatus === "complete" ? "Complete" : "Still needed"}</i></button></div>; })}</div>}{node.kind === "electives" && <div className="elective-slots"><span>1</span><span>2</span><span>3</span></div>}{node.note && <p>{node.note}</p>}</div>; })}</div></div>)}</section>
    <section className="degree-wide-gates"><div className="gate-heading"><p className="eyebrow">Degree-wide requirements</p><h3>Courses are only one branch of graduation.</h3></div><div className="gate-grid"><div className="degree-gate in_progress"><span><Play size={14} fill="currentColor" /></span><p><small>College option</small><b>{snapshot.collegeOptionRemaining} credits remaining</b><em>ANTH 1200 is currently in progress toward this block.</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Brooklyn residency</small><b>{snapshot.residencyRemaining} credits remaining</b><em>DegreeWorks shows 10 completed in residence.</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Advanced CISC in residence</small><b>{snapshot.advancedCiscRemaining} credits remaining</b><em>CISC 2210-5004 with C or better.</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Additional B.S. credits</small><b>{snapshot.bsCreditsRemaining} credits remaining</b><em>Approved science, math, CS, and related courses.</em></p></div></div></section>
    <section className="degree-footnotes"><p><b>Important:</b> DegreeWorks reports both completed and in-progress credits in the applied total. In-progress does not mean earned yet.</p><p><b>Planning boundary:</b> graduate-level substitutions and double-counting rules require department or Degree Audit approval.</p></section>
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
  const compact = text.toUpperCase().replace(/\s+/g, " ");
  degreeCourses.forEach((course) => {
    const [subject, number] = course.code.split(" ");
    const matcher = new RegExp(`(?:${subject}\\.?\\s*)?\\b${number}\\b`, "g");
    const contexts: { before: string; after: string; explicitSubject: boolean }[] = [];
    for (const match of compact.matchAll(matcher)) {
      const index = match.index ?? 0;
      const before = compact.slice(Math.max(0, index - 125), index);
      const explicitSubject = match[0].includes(subject) || new RegExp(`${subject}\\.?\\s*(?:\\d{4}\\s*(?:,|OR)\\s*)*$`).test(before.slice(-65));
      if (explicitSubject) contexts.push({ before, after: compact.slice(index + match[0].length, index + match[0].length + 125), explicitSubject });
    }
    if (!contexts.length) return;
    const inProgress = contexts.some(({ after }) => /^.{0,75}\bIP\s*\(/.test(after));
    const complete = contexts.some(({ after }) => /^.{0,90}\b(A\+?|A-|B\+?|B-|C\+?|C-|CR|TR)\b\s*\(?\d/.test(after) || /^.{0,120}SATISFIED BY/.test(after));
    const remaining = contexts.some(({ before, after }) => /STILL NEEDED[^.]{0,115}$/.test(before) || /^.{0,90}(STILL NEEDED|NOT COMPLETE|REMAINING)/.test(after) || /^.{0,90}\b(F|WU)\b\s*0/.test(after));
    proposals.set(course.code, inProgress ? "in_progress" : complete ? "complete" : remaining ? "not_started" : "unknown");
  });
  return Object.fromEntries(proposals) as DegreeRecords;
}

function parseAuditSnapshot(text: string, sourceName: string): AuditSnapshot {
  const compact = text.replace(/\s+/g, " ");
  const number = (pattern: RegExp, fallback: number) => Number(compact.match(pattern)?.[1] ?? fallback);
  return {
    auditDate: compact.match(/Audit date\s+(\d{2}\/\d{2}\/\d{4})/i)?.[1] ?? degreeWorksSnapshot.auditDate,
    degreeProgress: number(/Degree progress\s+(\d+)%/i, degreeWorksSnapshot.degreeProgress),
    appliedCredits: number(/You have\s+(\d+(?:\.\d+)?)\s+applied credits/i, degreeWorksSnapshot.appliedCredits),
    remainingCredits: number(/still need\s+(\d+(?:\.\d+)?)\s+credits to meet this requirement/i, degreeWorksSnapshot.remainingCredits),
    gpa: number(/Undergrad Cumulative GPA:\s+(\d+(?:\.\d+)?)/i, degreeWorksSnapshot.gpa),
    majorApplied: number(/Computer Science \(BS\)\s+STILL NEEDED\s+Credits required:\s*67\.5\s+Credits applied:\s*(\d+(?:\.\d+)?)/i, degreeWorksSnapshot.majorApplied),
    majorRemaining: number(/Computer Science \(BS\)\s+STILL NEEDED.{0,320}?still need\s+(\d+(?:\.\d+)?)\s+more credits/i, degreeWorksSnapshot.majorRemaining),
    collegeOptionRemaining: number(/College Option.*?still need\s+(\d+(?:\.\d+)?)\s+more credits/i, degreeWorksSnapshot.collegeOptionRemaining),
    residencyRemaining: number(/still need\s+(\d+(?:\.\d+)?)\s+credit\(s\) completed at Brooklyn College/i, degreeWorksSnapshot.residencyRemaining),
    advancedCiscRemaining: number(/advanced Computer Science courses in residence.*?still need\s+(\d+(?:\.\d+)?)\s+more/i, degreeWorksSnapshot.advancedCiscRemaining),
    bsCreditsRemaining: number(/You have taken\s+\d+(?:\.\d+)?\s+credits, you require\s+(\d+(?:\.\d+)?)\s+more/i, degreeWorksSnapshot.bsCreditsRemaining),
    sourceName,
  };
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return pages.join("\n");
}

function DegreeWorksImport({ open, records, onClose, onApply }: { open: boolean; records: DegreeRecords; onClose: () => void; onApply: (records: DegreeRecords, snapshot: AuditSnapshot) => void }) {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<DegreeRecords>({});
  const [snapshot, setSnapshot] = useState<AuditSnapshot>(degreeWorksSnapshot);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const detected = degreeCourses.filter((course) => course.code in proposal);
  const analyze = (value = text, source = fileName || "Pasted DegreeWorks text") => { setProposal(parseAuditText(value)); setSnapshot(parseAuditSnapshot(value, source)); };
  const loadFile = async (file: File) => {
    setLoading(true); setError(""); setFileName(file.name); setProposal({});
    try {
      const value = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? await extractPdfText(file) : await file.text();
      setText(value); analyze(value, file.name);
    } catch { setError("Daymark could not read this PDF. Export a fresh DegreeWorks PDF and try again."); }
    finally { setLoading(false); }
  };
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="audit-dialog pdf-audit-dialog" onMouseDown={(event) => event.stopPropagation()}><header><span><FileInput size={20} /></span><div><p className="eyebrow">DegreeWorks import</p><h2>Upload the audit. Review the map update.</h2></div><button onClick={onClose}><X size={20} /></button></header><div className="audit-guidance"><p><b>PDF stays in this browser.</b> Daymark extracts its text locally and does not upload the file to a server.</p><p><b>Nothing applies automatically.</b> You review every detected course state before saving it to the map.</p></div><label className={`file-import pdf-drop ${loading ? "loading" : ""}`}><Upload size={20} /><span><b>{loading ? "Reading DegreeWorks…" : fileName || "Choose DegreeWorks PDF"}</b><small>PDF preferred · text and HTML also supported</small></span><input type="file" accept=".pdf,.txt,.html,.htm,.csv,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} /></label>{error && <p className="import-error">{error}</p>}{text && <div className="audit-detected-summary"><div><small>Audit date</small><b>{snapshot.auditDate}</b></div><div><small>Overall progress</small><b>{snapshot.degreeProgress}%</b></div><div><small>Credits</small><b>{snapshot.appliedCredits} applied · {snapshot.remainingCredits} remaining</b></div><div><small>Major</small><b>{snapshot.majorApplied} applied · {snapshot.majorRemaining} remaining</b></div></div>}<details className="paste-fallback"><summary>Paste audit text instead</summary><label className="audit-text-label">DegreeWorks text<textarea value={text} onChange={(event) => { setText(event.target.value); setProposal({}); setFileName(""); }} placeholder={'CISC 1115 — In Progress\nCISC 2210 — Still Needed'} /></label><button className="secondary-button analyze-button" disabled={!text.trim()} onClick={() => analyze()}>Analyze pasted audit</button></details>{detected.length > 0 && <div className="detected-courses"><div><p className="eyebrow">Review before applying</p><span>{detected.length} courses detected</span></div>{detected.map((course) => <div className="detected-row" key={course.code}><span><b>{course.code}</b><small>{course.title}</small></span><div>{(["complete", "in_progress", "not_started", "unknown"] as DegreeStatus[]).map((status) => <button key={status} className={proposal[course.code] === status ? "active" : ""} onClick={() => setProposal({ ...proposal, [course.code]: status })}>{status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : status === "not_started" ? "Remaining" : "Ignore"}</button>)}</div></div>)}</div>}<footer><span>Choice groups count once. In-progress is shown separately from earned credit.</span><button className="primary-button" disabled={!detected.length} onClick={() => { const applied = { ...records }; Object.entries(proposal).forEach(([code, status]) => { if (status !== "unknown") applied[code] = status; }); onApply(applied, snapshot); onClose(); }}>Update degree map <ArrowRight size={14} /></button></footer></div></div>;
}

export default function CommandCenter() {
  const [view, setView] = useState<View>("dashboard");
  const [completed, setCompleted] = useState<string[]>([]);
  const [practice, setPractice] = useState<PracticeRecords>({});
  const [degreeRecords, setDegreeRecords] = useState<DegreeRecords>(initialDegreeRecords);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditSnapshot>(degreeWorksSnapshot);
  const [importOpen, setImportOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { completed?: string[]; practice?: PracticeRecords; degreeRecords?: DegreeRecords; auditSnapshot?: AuditSnapshot };
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.practice) setPractice(parsed.practice);
        if (parsed.degreeRecords) setDegreeRecords({ ...initialDegreeRecords, ...parsed.degreeRecords });
        if (parsed.auditSnapshot) setAuditSnapshot({ ...degreeWorksSnapshot, ...parsed.auditSnapshot });
      }
    } catch { /* The focused demo remains usable if browser storage is unavailable. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, practice, degreeRecords, auditSnapshot }));
  }, [completed, practice, degreeRecords, auditSnapshot, hydrated]);

  const complete = (id: string) => setCompleted((current) => current.includes(id) ? current : [...current, id]);
  const title = view === "dashboard" ? "Overview" : view === "degree" ? "Degree map" : "Java course";
  return <div className="app-shell focused-shell"><Sidebar view={view} setView={setView} completed={completed} practice={practice} /><div className="app-main"><TopBar title={title} />{view === "dashboard" && <Dashboard completed={completed} practice={practice} degreeRecords={degreeRecords} setView={setView} />}{view === "course" && <CourseView completed={completed} practice={practice} onComplete={complete} onPracticeChange={(chapterId, record) => setPractice((current) => ({ ...current, [chapterId]: record }))} />}{view === "degree" && <DegreeMap records={degreeRecords} setRecords={setDegreeRecords} snapshot={auditSnapshot} onImport={() => setImportOpen(true)} />}</div><MobileNav view={view} setView={setView} /><DegreeWorksImport open={importOpen} records={degreeRecords} onClose={() => setImportOpen(false)} onApply={(nextRecords, nextSnapshot) => { setDegreeRecords(nextRecords); setAuditSnapshot(nextSnapshot); }} /></div>;
}

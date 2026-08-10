"use client";

import { useEffect, useMemo, useState } from "react";
import {
  chapters,
  courseContent,
  degreeCourses,
  degreeRequirementGroups,
  weightedProgress,
  type CourseContent,
  type DegreeCourse,
} from "./data/curriculum";

type View = "dashboard" | "degree" | "course" | "calendar" | "assistant";
type Task = {
  id: string;
  title: string;
  category: string;
  due: string;
  minutes: number;
  priority: "high" | "medium" | "low";
  done: boolean;
};
type Activity = { id: string; title: string; meta: string; type: "lesson" | "challenge" | "task" | "session" };

const initialTasks: Task[] = [
  { id: "task-1", title: "Finish discrete math problem set", category: "MATH 1201", due: "Today · 5:00 PM", minutes: 45, priority: "high", done: false },
  { id: "task-2", title: "Review Java operator notes", category: "CISC 1115", due: "Today", minutes: 15, priority: "medium", done: false },
  { id: "task-3", title: "Ship portfolio navigation polish", category: "Portfolio", due: "Tomorrow", minutes: 35, priority: "medium", done: false },
  { id: "task-4", title: "Email academic adviser", category: "Admin", due: "Wed", minutes: 10, priority: "low", done: true },
];

const navItems: { id: View; label: string; mark: string }[] = [
  { id: "dashboard", label: "Command center", mark: "⌘" },
  { id: "degree", label: "Degree campaign", mark: "◇" },
  { id: "course", label: "Java campaign", mark: "›_" },
  { id: "calendar", label: "Calendar", mark: "□" },
  { id: "assistant", label: "Assistant", mark: "✦" },
];

const initialActivities: Activity[] = [
  { id: "a1", title: "Data types completed", meta: "CISC 1115 · 16 min · today", type: "lesson" },
  { id: "a2", title: "Player profile repaired", meta: "Debug challenge · ★★ · yesterday", type: "challenge" },
  { id: "a3", title: "Study system wireframe shipped", meta: "Personal project · 52 min · Sun", type: "session" },
];

const weekEvents = [
  { day: 0, start: 9, duration: 1.5, title: "Calculus I", type: "class", room: "James 3305" },
  { day: 0, start: 14, duration: 1, title: "Java study block", type: "study", room: "Focus session" },
  { day: 1, start: 11, duration: 1.5, title: "CISC 1115", type: "class", room: "WEB 214" },
  { day: 2, start: 15, duration: 1, title: "Adviser check-in", type: "personal", room: "Zoom" },
  { day: 3, start: 9, duration: 1.5, title: "Calculus I", type: "class", room: "James 3305" },
  { day: 3, start: 13, duration: 1.25, title: "Problem set due", type: "deadline", room: "MATH 1201" },
  { day: 4, start: 11, duration: 1.5, title: "CISC 1115", type: "class", room: "WEB 214" },
  { day: 5, start: 10, duration: 2, title: "Portfolio build", type: "project", room: "Deep work" },
];

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function dateAtOffset(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function safeArithmetic(expression: string) {
  if (!/^[\d+\-*/%().\s]+$/.test(expression)) throw new Error("Unsupported expression");
  // The expression is restricted to digits, whitespace, parentheses, and arithmetic operators.
  return Function(`"use strict"; return (${expression})`)() as number;
}

function splitConcatenation(expression: string) {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    if (char === '"' && expression[index - 1] !== "\\") quoted = !quoted;
    if (char === "+" && !quoted) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  parts.push(current.trim());
  return parts;
}

function runMockJava(code: string) {
  const values: Record<string, string | number | boolean> = {};
  const declaration = /(String|int|double|boolean)\s+(\w+)\s*=\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  const evaluate = (raw: string): string | number | boolean => {
    const expression = raw.trim();
    if (expression.includes('"')) {
      return splitConcatenation(expression)
        .map((part) => {
          if (/^"[\s\S]*"$/.test(part)) return part.slice(1, -1);
          if (part in values) return String(values[part]);
          const replaced = part.replace(/\b[a-zA-Z_]\w*\b/g, (name) => String(values[name] ?? name));
          try { return String(safeArithmetic(replaced)); } catch { return part; }
        })
        .join("");
    }
    if (expression === "true" || expression === "false") return expression === "true";
    if (expression in values) return values[expression];
    const replaced = expression.replace(/\b[a-zA-Z_]\w*\b/g, (name) => String(values[name] ?? name));
    return safeArithmetic(replaced);
  };

  try {
    while ((match = declaration.exec(code)) !== null) {
      const [, type, name, raw] = match;
      if (type === "String" && !raw.includes('"')) return { output: "", error: `Compilation error: ${name} needs a quoted String value.` };
      if ((type === "int" || type === "double") && /^\s*"/.test(raw)) return { output: "", error: `Compilation error: ${name} cannot store text in a ${type}.` };
      values[name] = evaluate(raw);
    }
    if (code.includes("__")) return { output: "", error: "Compilation error: replace the blank before running." };
    const prints = [...code.matchAll(/System\.out\.println\(([^;]+)\);/g)];
    if (!prints.length) return { output: "", error: "No output yet. Add System.out.println(...);" };
    const output = prints.map((print) => String(evaluate(print[1]))).join("\n");
    return { output, error: "" };
  } catch {
    return { output: "", error: "Mock runner could not evaluate that expression yet. Check syntax or compare with the expected output." };
  }
}

function ProgressBar({ value, tone = "lime" }: { value: number; tone?: string }) {
  return <div className="progress-track"><span className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Difficulty({ value = 0 }: { value?: number }) {
  return <span className="difficulty" aria-label={`${value} out of 5 difficulty`}>{"★".repeat(value)}<i>{"★".repeat(5 - value)}</i></span>;
}

function TopBar({ title, onQuickAdd }: { title: string; onQuickAdd: () => void }) {
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{today}</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button className="search-button" aria-label="Search"><span>⌕</span><span className="search-copy">Search anything</span><kbd>⌘ K</kbd></button>
        <button className="icon-button" aria-label="Notifications">·<span className="notification-dot" /></button>
        <button className="avatar" aria-label="Open profile">D</button>
        <button className="mobile-add" onClick={onQuickAdd}>＋</button>
      </div>
    </header>
  );
}

function Sidebar({ view, setView, completed }: { view: View; setView: (view: View) => void; completed: string[] }) {
  const progress = weightedProgress(completed);
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setView("dashboard")}>
        <span className="brand-mark">D/</span>
        <span><b>DAYMARK</b><small>Personal operating system</small></span>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        <p className="nav-section-label">System</p>
        {navItems.map((item) => (
          <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
            <span className="nav-mark">{item.mark}</span>{item.label}
            {item.id === "course" && <span className="nav-progress">{progress.percent}%</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-course">
        <div className="sidebar-course-top"><span className="course-glyph">J</span><span><small>Active campaign</small><b>CISC 1115</b></span></div>
        <ProgressBar value={20} />
        <div className="split-meta"><span>{progress.completed} / {progress.total} min</span><span>Java</span></div>
      </div>
      <div className="sidebar-footer">
        <button><span>?</span> Help & shortcuts</button>
        <div className="sync-state"><span />Saved on this device</div>
      </div>
    </aside>
  );
}

function MobileNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.mark}</span>{item.label.split(" ")[0]}</button>)}
    </nav>
  );
}

function ActivityGrid({ onSelect }: { onSelect: (day: { date: string; level: number }) => void }) {
  const days = useMemo(() => Array.from({ length: 98 }, (_, index) => {
    const date = dateAtOffset(index - 97);
    const wave = (index * 7 + index * index * 3) % 17;
    const level = wave < 5 ? 0 : wave < 9 ? 1 : wave < 13 ? 2 : wave < 16 ? 3 : 4;
    return { date: dateKey(date), level };
  }), []);
  return (
    <div className="activity-wrap">
      <div className="activity-months"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div>
      <div className="activity-grid" aria-label="Fourteen weeks of meaningful activity">
        {days.map((day) => <button key={day.date} className={`activity-cell level-${day.level}`} title={`${day.date}: ${day.level} activity`} onClick={() => onSelect(day)} />)}
      </div>
      <div className="activity-legend"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)}<span>More</span></div>
    </div>
  );
}

function QuickAdd({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <form className="quick-dialog" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onAdd({ id: `task-${Date.now()}`, title: title.trim(), category: "Personal", due: "Today", minutes: 25, priority: "medium", done: false });
        setTitle("");
        onClose();
      }}>
        <div className="dialog-heading"><span className="accent-symbol">＋</span><div><p className="eyebrow">Quick capture</p><h2>Add a task</h2></div><button type="button" onClick={onClose}>×</button></div>
        <label>What needs to happen?<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Finish lab write-up" /></label>
        <div className="quick-options"><button type="button">Today</button><button type="button">25 min</button><button type="button">Personal</button></div>
        <div className="dialog-actions"><span>Press Enter to save</span><button className="primary-button" type="submit">Add task</button></div>
      </form>
    </div>
  );
}

function Dashboard({ tasks, setTasks, completed, activities, setView, onQuickAdd, onSelectActivity }: {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  completed: string[];
  activities: Activity[];
  setView: (view: View) => void;
  onQuickAdd: () => void;
  onSelectActivity: (day: { date: string; level: number }) => void;
}) {
  const progress = weightedProgress(completed);
  const activeTasks = tasks.filter((task) => !task.done);
  const plan = [
    { id: "review", title: "Review variables", type: "Recall", minutes: 5, done: true },
    { id: "operators", title: "Operators & precedence", type: "Lesson", minutes: 18, done: completed.includes("operators") },
    { id: "predict-precedence", title: "Predict the score", type: "Challenge · ★★", minutes: 8, done: completed.includes("predict-precedence") },
    { id: "concat-build", title: "Build a status line", type: "Challenge · ★★★", minutes: 18, done: completed.includes("concat-build") },
    { id: "operators-boss", title: "Resource calculator", type: "Boss · ★★★★", minutes: 35, done: completed.includes("operators-boss") },
  ];
  const openMinutes = plan.filter((item) => !item.done).reduce((sum, item) => sum + item.minutes, 0);
  return (
    <main className="page-content dashboard-page">
      <section className="focus-hero">
        <div className="focus-copy">
          <p className="eyebrow lime-text">Recommended next move</p>
          <h2>Make expressions<br />do the work.</h2>
          <p>Continue Java with operators and precedence. You are one lesson away from the applied challenges.</p>
          <div className="focus-actions"><button className="primary-button" onClick={() => setView("course")}><span>▶</span> Start 18-min lesson</button><button className="text-button" onClick={() => setView("course")}>View chapter <span>→</span></button></div>
        </div>
        <div className="focus-code" aria-label="Java expression example">
          <div className="code-top"><span><i className="red" /><i className="amber" /><i className="green" /></span><small>Main.java</small><span>JAVA</span></div>
          <pre><code><em>int</em> missions = <strong>4</strong>;{`\n`}<em>int</em> reward = <strong>15</strong>;{`\n`}<em>int</em> total = missions * reward;{`\n\n`}<span>System.out.println</span>(total);</code></pre>
          <div className="code-output"><small>OUTPUT</small><b>60</b></div>
          <div className="hero-progress"><span><b>Chapter 02</b> · Operators & expressions</span><span>{progress.percent}% course</span></div>
          <ProgressBar value={progress.percent} />
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel campaign-panel">
          <div className="panel-heading"><div><p className="eyebrow">Today’s campaign</p><h3>Java · Fundamentals</h3></div><div className="session-estimate"><b>{openMinutes} min</b><small>remaining</small></div></div>
          <div className="campaign-list">
            {plan.map((item, index) => <button key={item.id} className={item.done ? "done" : index === 1 ? "current" : ""} onClick={() => setView("course")}>
              <span className="campaign-check">{item.done ? "✓" : pad(index + 1)}</span>
              <span><b>{item.title}</b><small>{item.type}</small></span>
              <time>{item.minutes}m</time>
            </button>)}
          </div>
          <div className="adaptation-note"><span>↗</span><p><b>Adaptive note</b>Your variable recall is strong, so review was reduced to 5 minutes. Concatenation remains in the plan.</p></div>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-heading"><div><p className="eyebrow">Outside the campaign</p><h3>Today’s tasks</h3></div><button className="panel-action" onClick={onQuickAdd}>＋ Add</button></div>
          <div className="task-list">
            {tasks.slice(0, 4).map((task) => <label key={task.id} className={task.done ? "task-row done" : "task-row"}>
              <input type="checkbox" checked={task.done} onChange={() => setTasks(tasks.map((entry) => entry.id === task.id ? { ...entry, done: !entry.done } : entry))} />
              <span className="custom-check">✓</span>
              <span className="task-copy"><b>{task.title}</b><small><i className={`priority-dot ${task.priority}`} />{task.category} · {task.due}</small></span>
              <time>{task.minutes}m</time>
            </label>)}
          </div>
          <div className="task-footer"><span>{activeTasks.length} open · {activeTasks.reduce((sum, task) => sum + task.minutes, 0)} min estimated</span><button onClick={() => setView("calendar")}>Plan the week →</button></div>
        </section>

        <section className="panel degree-snapshot">
          <div className="panel-heading"><div><p className="eyebrow">Degree campaign</p><h3>Computer Science B.S.</h3></div><button className="panel-action" onClick={() => setView("degree")}>Open map →</button></div>
          <div className="degree-overview">
            <div className="degree-ring" style={{ "--progress": "10%" } as React.CSSProperties}><div><b>10%</b><small>6 / 59.5 credits</small></div></div>
            <div className="degree-metrics">
              <div><span className="metric-mark complete">✓</span><p><b>2</b><small>requirements done</small></p></div>
              <div><span className="metric-mark active">→</span><p><b>1</b><small>in progress</small></p></div>
              <div><span className="metric-mark available">◇</span><p><b>2</b><small>available next</small></p></div>
            </div>
          </div>
          <div className="unlock-banner"><span className="unlock-icon">⌁</span><p><small>Next unlock</small><b>Finish CISC 1115 to open the upper programming lane.</b></p><span>→</span></div>
        </section>

        <section className="panel calendar-snapshot">
          <div className="panel-heading"><div><p className="eyebrow">On the horizon</p><h3>Upcoming</h3></div><button className="panel-action" onClick={() => setView("calendar")}>Full calendar →</button></div>
          <div className="agenda-list">
            <div className="agenda-row"><div className="date-tile"><b>10</b><small>AUG</small></div><span className="agenda-line class" /><p><b>Calculus I</b><small>9:00–10:30 AM · James 3305</small></p><span className="tag">CLASS</span></div>
            <div className="agenda-row"><div className="date-tile"><b>10</b><small>AUG</small></div><span className="agenda-line study" /><p><b>Java study block</b><small>2:00–3:00 PM · Focus session</small></p><span className="tag study">STUDY</span></div>
            <div className="agenda-row"><div className="date-tile"><b>13</b><small>AUG</small></div><span className="agenda-line deadline" /><p><b>Problem set due</b><small>5:00 PM · MATH 1201</small></p><span className="tag deadline">DUE</span></div>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">Consistency</p><h3>Activity</h3></div><div className="streak"><span>↗</span><b>12 day streak</b></div></div>
          <ActivityGrid onSelect={onSelectActivity} />
          <div className="activity-stats"><div><b>23</b><small>active days this month</small></div><div><b>14.6h</b><small>focused work</small></div><div><b>38</b><small>meaningful completions</small></div></div>
        </section>

        <section className="panel recent-panel">
          <div className="panel-heading"><div><p className="eyebrow">Evidence of progress</p><h3>Recent wins</h3></div></div>
          <div className="recent-list">{activities.slice(0, 3).map((activity) => <div key={activity.id}><span className={`activity-icon ${activity.type}`}>{activity.type === "challenge" ? "★" : activity.type === "lesson" ? "✓" : "↗"}</span><p><b>{activity.title}</b><small>{activity.meta}</small></p></div>)}</div>
        </section>
      </div>
      <footer className="dashboard-footer"><span>Progress is weighted by estimated effort. Degree completion uses earned credits.</span><button onClick={() => setView("assistant")}>Ask Daymark for help <b>✦</b></button></footer>
    </main>
  );
}

function CourseView({ completed, onComplete }: { completed: string[]; onComplete: (item: CourseContent) => void }) {
  const [selectedId, setSelectedId] = useState("operators");
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [consoleText, setConsoleText] = useState("Ready. Run your code when you are ready.");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showHint, setShowHint] = useState(false);
  const selected = courseContent.find((item) => item.id === selectedId) ?? courseContent[0];
  const chapter = chapters.find((entry) => entry.id === selected.chapterId) ?? chapters[0];
  const courseProgress = weightedProgress(completed);
  const chapterItems = courseContent.filter((item) => item.chapterId === selected.chapterId);
  const chapterProgress = weightedProgress(completed, chapterItems);

  useEffect(() => {
    setCode(selected.starterCode ?? "");
    setAnswer("");
    setConsoleText("Ready. Run your code when you are ready.");
    setFeedback("idle");
    setShowHint(false);
  }, [selected.id, selected.starterCode]);

  const isLesson = selected.kind === "lesson";
  const isPredict = selected.kind === "predict";
  const check = () => {
    const actual = isPredict ? answer.trim() : runMockJava(code).output.trim();
    if (actual === selected.expectedOutput?.trim()) {
      setFeedback("correct");
      onComplete(selected);
    } else setFeedback("incorrect");
  };
  const goNext = () => {
    const index = courseContent.findIndex((item) => item.id === selected.id);
    setSelectedId(courseContent[Math.min(courseContent.length - 1, index + 1)].id);
  };

  return (
    <main className="course-page">
      <div className="course-banner">
        <div><span className="course-glyph large">J</span><div><p className="eyebrow">CISC 1115 · Self-study campaign</p><h2>Introduction to Programming Using Java</h2></div></div>
        <div className="course-total"><span><b>{courseProgress.percent}%</b><small>{courseProgress.completed} of {courseProgress.total} weighted minutes</small></span><ProgressBar value={courseProgress.percent} /></div>
      </div>
      <div className="course-layout">
        <aside className="curriculum-nav">
          <div className="curriculum-heading"><p className="eyebrow">Campaign route</p><span>4 chapters</span></div>
          {chapters.map((entry) => {
            const items = courseContent.filter((item) => item.chapterId === entry.id);
            const progress = weightedProgress(completed, items);
            const locked = entry.id !== "foundations" && entry.id !== "operators-expressions";
            return <div key={entry.id} className={`chapter-group ${locked ? "locked" : ""}`}>
              <button className="chapter-title" onClick={() => !locked && setSelectedId(entry.contentIds[0])}>
                <span className="chapter-number">{progress.percent === 100 ? "✓" : pad(chapters.indexOf(entry) + 1)}</span>
                <span><small>{entry.unit}</small><b>{entry.title}</b></span>
                <em>{locked ? "⌁" : `${progress.percent}%`}</em>
              </button>
              {!locked && <div className="content-nav">{items.map((item) => <button key={item.id} className={selected.id === item.id ? "active" : ""} onClick={() => setSelectedId(item.id)}>
                <span>{completed.includes(item.id) ? "✓" : item.kind === "lesson" ? "○" : item.kind === "boss" ? "◆" : "◇"}</span>
                <span><b>{item.title}</b><small>{item.kind} · {item.minutes} min</small></span>
              </button>)}</div>}
            </div>;
          })}
          <div className="real-college-mini"><span>BC</span><p><small>Actual college overlay</small><b>CISC 1115 · Fall</b><em>2 deadlines linked</em></p></div>
        </aside>

        <section className="learning-stage">
          <div className="lesson-breadcrumb"><span>{chapter.unit}</span><b>/</b><span>{chapter.title}</span><b>/</b><strong>{selected.title}</strong></div>
          <div className="lesson-header">
            <div><span className={`kind-pill ${selected.kind}`}>{selected.kind === "lesson" ? "LESSON" : selected.kind.toUpperCase()}</span>{selected.difficulty && <Difficulty value={selected.difficulty} />}<h1>{selected.title}</h1><p>{selected.summary}</p></div>
            <div className="lesson-time"><b>{selected.minutes}</b><small>MIN</small></div>
          </div>

          {isLesson ? <LessonArticle selected={selected} /> : <ChallengeWorkspace selected={selected} code={code} setCode={setCode} answer={answer} setAnswer={setAnswer} consoleText={consoleText} setConsoleText={setConsoleText} feedback={feedback} onRun={() => {
            const result = runMockJava(code);
            setConsoleText(result.error || result.output || "Program finished with no output.");
          }} onCheck={check} onReset={() => { setCode(selected.starterCode ?? ""); setAnswer(""); setConsoleText("Reset to starter code."); setFeedback("idle"); }} showHint={showHint} setShowHint={setShowHint} />}

          <div className="lesson-footer">
            <div><span>Chapter progress</span><b>{chapterProgress.completed} / {chapterProgress.total} min</b><ProgressBar value={chapterProgress.percent} /></div>
            {isLesson ? <button className={completed.includes(selected.id) ? "primary-button complete" : "primary-button"} onClick={() => { onComplete(selected); goNext(); }}>{completed.includes(selected.id) ? "Completed · Continue →" : "Mark complete & continue →"}</button> : feedback === "correct" ? <button className="primary-button" onClick={goNext}>Continue to next step →</button> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function LessonArticle({ selected }: { selected: CourseContent }) {
  if (selected.id === "variables") return (
    <article className="lesson-article">
      <section><p className="eyebrow">The idea</p><h2>What is a variable?</h2><p>A variable is a named place in memory used to store a value. The name lets your program use that value later without remembering where it lives.</p></section>
      <div className="teaching-code"><div className="code-top"><small>Java</small><span>Declaration</span></div><pre><code><em>int</em> age = <strong>25</strong>;</code></pre></div>
      <div className="token-grid"><div><code>int</code><p><b>Data type</b><small>Whole numbers</small></p></div><div><code>age</code><p><b>Variable name</b><small>Your readable label</small></p></div><div><code>=</code><p><b>Assignment</b><small>Stores the value</small></p></div><div><code>25</code><p><b>Value</b><small>The actual data</small></p></div><div><code>;</code><p><b>Statement end</b><small>Finishes the instruction</small></p></div></div>
      <aside className="takeaway"><span>KEY TAKEAWAY</span><p>A variable has a type, a name, and a value. Choose names for meaning, then let the program remember the value.</p></aside>
    </article>
  );
  if (selected.id === "data-types") return (
    <article className="lesson-article">
      <section><p className="eyebrow">The idea</p><h2>Values have shapes</h2><p>A data type tells Java what kind of value a variable may store and which operations make sense for it.</p></section>
      <div className="type-table"><div><code>int</code><span>Whole number</span><b>int lives = 3;</b></div><div><code>double</code><span>Decimal number</span><b>double speed = 4.5;</b></div><div><code>boolean</code><span>True or false</span><b>boolean ready = true;</b></div><div><code>String</code><span>Text</span><b>String name = "Daniel";</b></div></div>
      <aside className="takeaway"><span>KEY TAKEAWAY</span><p>Use the narrowest type that honestly represents the value. The compiler can then catch impossible assignments for you.</p></aside>
    </article>
  );
  return (
    <article className="lesson-article">
      <section><p className="eyebrow">The idea</p><h2>Operators transform values</h2><p>An operator performs an action on one or more values. Arithmetic operators calculate. Assignment operators store. The plus sign can also join text.</p></section>
      <div className="operator-grid"><div><code>+</code><b>Add / join</b><small>8 + 2 → 10</small></div><div><code>-</code><b>Subtract</b><small>8 - 2 → 6</small></div><div><code>*</code><b>Multiply</b><small>8 * 2 → 16</small></div><div><code>/</code><b>Divide</b><small>8 / 2 → 4</small></div><div><code>%</code><b>Remainder</b><small>8 % 3 → 2</small></div></div>
      <section><p className="eyebrow">Evaluation order</p><h2>Precedence decides what runs first</h2><p>Java evaluates multiplication, division, and remainder before addition and subtraction. Parentheses make your intended order explicit.</p></section>
      <div className="teaching-code split"><pre><code><small>without parentheses</small>{`\n`}int score = 4 + 3 * 2;{`\n`}<strong>// 10</strong></code></pre><pre><code><small>with parentheses</small>{`\n`}int score = (4 + 3) * 2;{`\n`}<strong>// 14</strong></code></pre></div>
      <aside className="takeaway"><span>KEY TAKEAWAY</span><p>Do not make readers remember precedence when parentheses can state your intent immediately.</p></aside>
    </article>
  );
}

function ChallengeWorkspace({ selected, code, setCode, answer, setAnswer, consoleText, setConsoleText, feedback, onRun, onCheck, onReset, showHint, setShowHint }: {
  selected: CourseContent; code: string; setCode: (value: string) => void; answer: string; setAnswer: (value: string) => void; consoleText: string; setConsoleText: (value: string) => void; feedback: "idle" | "correct" | "incorrect"; onRun: () => void; onCheck: () => void; onReset: () => void; showHint: boolean; setShowHint: (value: boolean) => void;
}) {
  const predict = selected.kind === "predict";
  return (
    <div className="challenge-workspace">
      <div className="challenge-brief">
        <div><p className="eyebrow">Mission</p><h2>{predict ? "What does this print?" : selected.kind === "debug" ? "Repair the program" : selected.kind === "complete" ? "Fill the missing operator" : "Produce the exact output"}</h2><p>{selected.summary}</p></div>
        {selected.expectedOutput && <div className="expected-output"><small>EXPECTED OUTPUT</small><code>{selected.expectedOutput}</code></div>}
        {selected.id === "concat-build" && <ul><li>Store <code>Daniel</code> in a variable.</li><li>Store <code>3</code> in an integer.</li><li>Use concatenation; do not type the finished sentence directly.</li></ul>}
      </div>
      <div className="editor-shell">
        <div className="editor-toolbar"><span><i className="red" /><i className="amber" /><i className="green" /></span><b>Main.java</b><div><button onClick={onReset}>Reset</button>{!predict && <button className="run-button" onClick={onRun}>▶ Run</button>}</div></div>
        {predict ? <div className="predict-layout"><pre className="predict-code"><code>{selected.starterCode}</code></pre><label>Your predicted output<input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the exact output" onKeyDown={(event) => { if (event.key === "Enter") onCheck(); }} /></label></div> : <textarea className="code-editor" value={code} onChange={(event) => { setCode(event.target.value); setConsoleText("Code changed. Run to see output."); }} spellCheck={false} aria-label="Java code editor" />}
        {!predict && <div className="console-panel"><div><span>CONSOLE</span><i>Mock Java runner · local</i></div><pre className={consoleText.startsWith("Compilation") || consoleText.startsWith("Mock") ? "error" : ""}>{consoleText}</pre></div>}
      </div>
      <div className="challenge-actions"><button className="hint-button" onClick={() => setShowHint(!showHint)}>◇ {showHint ? "Hide hint" : "Show hint"}</button><button className="primary-button" onClick={onCheck}>Check answer</button></div>
      {showHint && <div className="hint-panel"><b>Hint</b><p>{selected.hint ?? "Break the problem into values, transformation, and output."}</p></div>}
      {feedback !== "idle" && <div className={`feedback-panel ${feedback}`}><span>{feedback === "correct" ? "✓" : "↗"}</span><p><b>{feedback === "correct" ? "Checkpoint cleared" : "Not yet — keep the evidence"}</b><small>{feedback === "correct" ? `You demonstrated ${selected.concept}. This attempt now counts toward mastery.` : "Compare the actual and expected output, then change one thing at a time."}</small></p></div>}
    </div>
  );
}

function DegreeMap({ onOpenCourse }: { onOpenCourse: (course: DegreeCourse) => void }) {
  const stages = [0, 1, 2, 3, 4];
  return (
    <main className="page-content degree-page">
      <section className="degree-hero">
        <div><p className="eyebrow lime-text">Brooklyn College · Major campaign</p><h2>Computer Science B.S.</h2><p>A requirement-aware map of the 55–67.5 credit major. Choices stay choices; recommended stages do not invent catalog prerequisites.</p></div>
        <div className="degree-hero-metrics"><div><b>10%</b><small>degree credits earned</small></div><div><b>2</b><small>courses available now</small></div><div><b>1</b><small>active campaign</small></div></div>
      </section>
      <section className="requirement-strip">
        {degreeRequirementGroups.map((group) => <div key={group.label}><span><b>{group.label}</b><small>{group.earned} / {group.total} cr</small></span><ProgressBar value={(group.earned / group.total) * 100} tone={group.tone} /></div>)}
      </section>
      <div className="map-toolbar"><div><button className="active">Campaign map</button><button>Requirements</button></div><span><i className="status-dot complete" />Complete<i className="status-dot active" />In progress<i className="status-dot available" />Available<i className="status-dot locked" />Locked</span></div>
      <section className="campaign-map">
        <div className="map-grid-lines" />
        {stages.map((stage) => <div className="map-stage" key={stage}>
          <div className="stage-heading"><span>{pad(stage + 1)}</span><div><small>{stage === 0 ? "ENTRY" : stage === 4 ? "CAPSTONE" : `STAGE ${stage}`}</small><b>{["Placement foundation", "First unlocks", "Core systems", "Advanced branches", "Finish line"][stage]}</b></div></div>
          <div className="course-node-list">
            {degreeCourses.filter((course) => course.stage === stage).map((course) => <button key={course.code} className={`course-node ${course.status}`} onClick={() => onOpenCourse(course)}>
              <span className="node-status">{course.status === "complete" ? "✓" : course.status === "active" ? "→" : course.status === "locked" ? "⌁" : course.status === "choice" ? "OR" : "◇"}</span>
              <span className="node-copy"><small>{course.requirement}</small><b>{course.code}</b><em>{course.title}</em></span>
              <span className="node-credits">{course.credits}<small>CR</small></span>
              {course.choiceLabel && <span className="choice-ribbon">{course.choiceLabel}</span>}
            </button>)}
            {stage === 3 && <button className="course-node elective" onClick={() => onOpenCourse({ code: "3 × CISC", title: "Upper-level CS electives", credits: 9, stage: 3, status: "choice", requirement: "Elective requirement", prerequisiteText: "Choose three courses numbered 3000–4899" })}><span className="node-status">3×</span><span className="node-copy"><small>Elective requirement</small><b>CS ELECTIVES</b><em>Choose three upper-level courses</em></span><span className="node-credits">9<small>CR</small></span></button>}
          </div>
        </div>)}
      </section>
      <section className="map-notes"><div><span>i</span><p><b>How this map reads</b><small>Stages organize the campaign; course availability is based on recorded prerequisites. Either/or requirements share a labeled choice group and count only once.</small></p></div><div><span>Σ</span><p><b>Progress math</b><small>Degree completion uses earned requirement credits. A 4-credit math course counts more than a 3-credit course; in-progress study time stays separate.</small></p></div></section>
    </main>
  );
}

function CourseDrawer({ course, onClose, onPlay }: { course: DegreeCourse | null; onClose: () => void; onPlay: () => void }) {
  if (!course) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="course-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <span className={`drawer-status ${course.status}`}>{course.status.toUpperCase()}</span>
        <p className="eyebrow">{course.requirement}</p><h2>{course.code}</h2><h3>{course.title}</h3>
        <div className="drawer-facts"><div><small>CREDITS</small><b>{course.credits}</b></div><div><small>CAMPAIGN STAGE</small><b>{course.stage + 1}</b></div></div>
        <section><p className="eyebrow">Availability rule</p><p>{course.prerequisiteText}</p></section>
        {course.choiceLabel && <section className="choice-callout"><small>REQUIREMENT CHOICE</small><b>{course.choiceLabel}</b><p>Completing either option satisfies this requirement once.</p></section>}
        {course.code === "CISC 1115" ? <button className="primary-button wide" onClick={onPlay}>Open playable course →</button> : <button className="secondary-button wide">Add to future plan</button>}
        <small className="source-note">Requirement membership follows Brooklyn College’s published B.S. program page. Detailed advisement should still be confirmed with the college.</small>
      </aside>
    </div>
  );
}

function CalendarView({ tasks }: { tasks: Task[] }) {
  const [mode, setMode] = useState<"day" | "week" | "month">("week");
  const start = new Date();
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const weekdays = Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  return (
    <main className="page-content calendar-page">
      <section className="calendar-header"><div><p className="eyebrow">Time, made visible</p><h2>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date())}</h2></div><div className="calendar-controls"><button>‹</button><button className="today">Today</button><button>›</button><div>{(["day", "week", "month"] as const).map((entry) => <button key={entry} className={mode === entry ? "active" : ""} onClick={() => setMode(entry)}>{entry}</button>)}</div><button className="primary-button">＋ New event</button></div></section>
      {mode === "week" && <section className="week-calendar">
        <div className="week-head"><div /><div className="all-day-label">GMT−4</div>{weekdays.map((date) => <div key={dateKey(date)} className={date.toDateString() === new Date().toDateString() ? "today" : ""}><small>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}</small><b>{date.getDate()}</b></div>)}</div>
        <div className="week-body">
          <div className="time-axis">{Array.from({ length: 12 }, (_, index) => <span key={index}>{index + 8 > 12 ? index - 4 : index + 8}:00 {index + 8 >= 12 ? "PM" : "AM"}</span>)}</div>
          <div className="week-grid">{Array.from({ length: 7 * 12 }, (_, index) => <i key={index} />)}{weekEvents.map((event) => <button key={`${event.day}-${event.start}-${event.title}`} className={`calendar-event ${event.type}`} style={{ left: `calc(${event.day} * (100% / 7) + 4px)`, width: `calc(100% / 7 - 8px)`, top: `${(event.start - 8) * 72 + 5}px`, height: `${event.duration * 72 - 10}px` }}><b>{event.title}</b><small>{event.start}:00 · {event.room}</small></button>)}</div>
        </div>
      </section>}
      {mode === "day" && <section className="day-calendar"><div className="day-focus"><p className="eyebrow">Today · balanced load</p><h3>3h 30m planned</h3><ProgressBar value={58} /></div>{weekEvents.filter((event) => event.day === 0).map((event) => <div className={`day-event ${event.type}`} key={event.title}><time>{event.start}:00</time><span /><p><b>{event.title}</b><small>{event.room} · {event.duration * 60} min</small></p></div>)}</section>}
      {mode === "month" && <section className="month-calendar">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <b key={label}>{label}</b>)}{Array.from({ length: 35 }, (_, index) => <button key={index} className={index === 9 ? "today" : ""}><span>{index + 1}</span>{[2, 4, 9, 12, 16, 22, 25].includes(index) && <i className="month-dot" />}{[9, 12].includes(index) && <small>{index === 9 ? "Java study" : "Problem set"}</small>}</button>)}</section>}
      <section className="calendar-bottom"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">Deadlines</p><h3>Next 7 days</h3></div></div>{tasks.filter((task) => !task.done).map((task) => <div className="deadline-row" key={task.id}><i className={`priority-dot ${task.priority}`} /><p><b>{task.title}</b><small>{task.category}</small></p><span>{task.due}</span></div>)}</div><div className="panel load-panel"><p className="eyebrow">Load forecast</p><h3>6h 45m committed</h3><div className="load-bars"><span style={{ height: "42%" }} /><span style={{ height: "60%" }} /><span style={{ height: "32%" }} /><span style={{ height: "85%" }} /><span style={{ height: "50%" }} /><span style={{ height: "70%" }} /><span style={{ height: "25%" }} /></div><small>Thursday is your heaviest day. The Java session fits best Tuesday afternoon.</small></div></section>
    </main>
  );
}

function AssistantView() {
  const [messages, setMessages] = useState<{ from: "user" | "assistant"; text: string }[]>([
    { from: "assistant", text: "I can help with the Java campaign, turn a syllabus into a plan, or reason across your workload. For this version, my replies are local and rule-based." },
  ]);
  const [draft, setDraft] = useState("");
  const send = () => {
    if (!draft.trim()) return;
    const question = draft.trim();
    setMessages((current) => [...current, { from: "user", text: question }, { from: "assistant", text: question.toLowerCase().includes("operator") ? "Start with the operator’s inputs and ask what type of value it returns. For `4 + 3 * 2`, multiplication runs first, so the result is 10. Parentheses are the clearest way to override that order." : "I’ve captured the question. The clean next step is to connect this interface to a real tutoring service; no API is configured in V1, so I won’t pretend this response came from an AI model." }]);
    setDraft("");
  };
  return (
    <main className="assistant-page">
      <section className="assistant-context"><p className="eyebrow">Context</p><h2>Daymark assistant</h2><p>One place to ask about coursework and organize what enters your system.</p><div className="context-card"><span>J</span><p><small>ACTIVE CONTEXT</small><b>CISC 1115 · Operators</b><em>20% course progress</em></p></div><div className="assistant-capabilities"><button>▱ Upload syllabus<small>Extract dates and work</small></button><button>□ Upload schedule<small>Create calendar events</small></button><button>◇ More practice<small>Target a weak concept</small></button></div><div className="integration-note"><span>i</span><p><b>Honest V1 boundary</b><small>The interface and service seam are ready. Replies are deterministic until an AI provider is connected.</small></p></div></section>
      <section className="chat-stage"><div className="chat-top"><div><span className="assistant-orb">✦</span><p><b>Daymark</b><small>Local tutor preview</small></p></div><button>···</button></div><div className="messages">{messages.map((message, index) => <div key={index} className={`message ${message.from}`}><span>{message.from === "assistant" ? "✦" : "D"}</span><p>{message.text}</p></div>)}</div><div className="prompt-suggestions"><button onClick={() => setDraft("Explain operator precedence another way")}>Explain operator precedence</button><button onClick={() => setDraft("What should I study today?")}>Plan today’s study</button><button onClick={() => setDraft("Give me a concatenation challenge")}>Practice concatenation</button></div><div className="composer"><button aria-label="Attach file">＋</button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about a lesson or your workload…" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} /><button className="send-button" onClick={send}>↑</button></div></section>
    </main>
  );
}

function ActivityDrawer({ day, onClose }: { day: { date: string; level: number } | null; onClose: () => void }) {
  if (!day) return null;
  const date = new Date(`${day.date}T12:00:00`);
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="activity-drawer" onMouseDown={(event) => event.stopPropagation()}><button className="drawer-close" onClick={onClose}>×</button><p className="eyebrow">Activity evidence</p><h2>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date)}</h2><div className="day-score"><b>{day.level === 0 ? 0 : day.level + 1}</b><span><strong>meaningful actions</strong><small>Intensity comes from completed work, not check-ins.</small></span></div>{day.level === 0 ? <div className="empty-day"><span>○</span><p>No work recorded. Rest days remain honest.</p></div> : <div className="drawer-activity-list"><div><span>✓</span><p><b>Java lesson completed</b><small>18 weighted minutes</small></p></div><div><span>★</span><p><b>Applied challenge solved</b><small>Operator precedence · ★★</small></p></div>{day.level > 2 && <div><span>↗</span><p><b>Project focus session</b><small>42 minutes · Portfolio</small></p></div>}</div>}</aside></div>;
}

export default function CommandCenter() {
  const [view, setView] = useState<View>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completed, setCompleted] = useState<string[]>(["variables", "data-types", "variable-debug", "foundations-boss"]);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [quickAdd, setQuickAdd] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<DegreeCourse | null>(null);
  const [activityDay, setActivityDay] = useState<{ date: string; level: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("daymark-v1");
      if (stored) {
        const state = JSON.parse(stored) as { tasks?: Task[]; completed?: string[]; activities?: Activity[] };
        if (state.tasks) setTasks(state.tasks);
        if (state.completed) setCompleted(state.completed);
        if (state.activities) setActivities(state.activities);
      }
    } catch { /* Keep the seeded demo state when local storage is unavailable. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("daymark-v1", JSON.stringify({ tasks, completed, activities }));
  }, [tasks, completed, activities, hydrated]);

  const title = { dashboard: "Command center", degree: "Degree campaign", course: "Java campaign", calendar: "Calendar", assistant: "Assistant" }[view];
  const completeItem = (item: CourseContent) => {
    if (completed.includes(item.id)) return;
    setCompleted((current) => [...current, item.id]);
    setActivities((current) => [{ id: `activity-${Date.now()}`, title: `${item.title} completed`, meta: `${item.kind} · ${item.minutes} weighted min · just now`, type: item.kind === "lesson" ? "lesson" : "challenge" }, ...current]);
  };

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} completed={completed} />
      <div className="app-main">
        <TopBar title={title} onQuickAdd={() => setQuickAdd(true)} />
        {view === "dashboard" && <Dashboard tasks={tasks} setTasks={setTasks} completed={completed} activities={activities} setView={setView} onQuickAdd={() => setQuickAdd(true)} onSelectActivity={setActivityDay} />}
        {view === "degree" && <DegreeMap onOpenCourse={setSelectedCourse} />}
        {view === "course" && <CourseView completed={completed} onComplete={completeItem} />}
        {view === "calendar" && <CalendarView tasks={tasks} />}
        {view === "assistant" && <AssistantView />}
      </div>
      <MobileNav view={view} setView={setView} />
      <QuickAdd open={quickAdd} onClose={() => setQuickAdd(false)} onAdd={(task) => setTasks((current) => [task, ...current])} />
      <CourseDrawer course={selectedCourse} onClose={() => setSelectedCourse(null)} onPlay={() => { setSelectedCourse(null); setView("course"); }} />
      <ActivityDrawer day={activityDay} onClose={() => setActivityDay(null)} />
    </div>
  );
}

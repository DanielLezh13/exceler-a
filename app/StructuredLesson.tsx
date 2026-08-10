"use client";

import { Check, Sparkles, TriangleAlert } from "lucide-react";
import type { StructuredLessonSection } from "./data/cisc1115Course";

type StructuredLessonProps = {
  sections: StructuredLessonSection[];
  readingDone: boolean;
  requiresReading: boolean;
  onRead: () => void;
};

function CodeExample({ label, code }: { label: string; code: string }) {
  return <div className="teaching-code lesson-code"><div><span>Java</span><small>{label}</small></div><pre><code>{code}</code></pre></div>;
}

function ReadingCheckpoint({ done, onRead }: { done: boolean; onRead: () => void }) {
  if (done) return <div className="reading-checkpoint done"><span><Check size={20} strokeWidth={3} /></span><b>Lesson Read</b></div>;
  return <button type="button" className="reading-checkpoint mark-read" onClick={onRead}><span><Check size={20} strokeWidth={3} /></span><b>Mark Lesson as Read</b></button>;
}

export default function StructuredLesson({ sections, readingDone, requiresReading, onRead }: StructuredLessonProps) {
  return <>{sections.map((section, index) => {
    const finalSection = index === sections.length - 1;
    return <section className="lesson-section structured-lesson-section" id={section.id} data-learning-section key={section.id}>
      <div className="lesson-section-heading"><p className="eyebrow">{section.eyebrow}</p><h2>{section.title}</h2></div>
      <p className="lesson-lead">{section.lead}</p>

      {section.concepts?.length ? <div className="structured-concept-grid">{section.concepts.map((concept) => <article key={`${concept.label}-${concept.detail}`}>
        <div><b>{concept.label}</b><p>{concept.detail}</p></div>
        {concept.code && <code>{concept.code}</code>}
      </article>)}</div> : null}

      {section.examples?.map((example) => <div className="structured-example" key={`${example.label}-${example.code}`}>
        <CodeExample label={example.label} code={example.code} />
        {example.note && <p className="lesson-note">{example.note}</p>}
      </div>)}

      {section.rules?.length ? <ul className="lesson-rules">{section.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul> : null}

      {section.callout && <aside className={section.callout.tone === "warning" ? "structured-callout warning" : "key-idea"}>
        {section.callout.tone === "warning" ? <TriangleAlert size={19} /> : <Sparkles size={19} />}
        <p><b>{section.callout.title}</b><span>{section.callout.body}</span></p>
      </aside>}

      {section.output && <div className="output-card"><span>OUTPUT</span><code>{section.output}</code></div>}

      {section.takeaways?.length ? <ul className="takeaway-list">{section.takeaways.map((takeaway) => <li key={takeaway}><Check size={16} />{takeaway}</li>)}</ul> : null}

      {finalSection && requiresReading && <ReadingCheckpoint done={readingDone} onRead={onRead} />}
    </section>;
  })}</>;
}

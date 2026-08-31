"use client";

import { Check, Sparkles, TriangleAlert } from "lucide-react";
import CopyCodeButton from "./CopyCodeButton";
import JavaCode from "./JavaCode";
import type { StructuredLessonSection } from "./data/cisc1115Course";

type StructuredLessonProps = {
  sections: StructuredLessonSection[];
  renderAfterSection?: (sectionId: string) => React.ReactNode;
};

function CodeExample({ label, code }: { label: string; code: string }) {
  return <div className="teaching-code lesson-code"><div><span>Java</span><small>{label}</small><CopyCodeButton code={code} /></div><pre><JavaCode code={code} /></pre></div>;
}

export default function StructuredLesson({ sections, renderAfterSection }: StructuredLessonProps) {
  return <>{sections.map((section) => {
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
      {renderAfterSection?.(section.id)}
    </section>;
  })}</>;
}

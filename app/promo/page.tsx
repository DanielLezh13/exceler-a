import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exceler A — Learn the Course. Prove the Skill.",
  description: "A self-directed learning system for the Brooklyn College Computer Science B.S. path.",
  robots: { index: false, follow: false },
};

export default function ExcelerPromoPage() {
  return <main className="promo-page">
    <div className="promo-brand">EXCELER <span>A</span></div>
    <section className="promo-copy">
      <p>Self-Directed Academic Learning</p>
      <h1>Learn the course.<br /><span>Prove the skill.</span></h1>
      <h2>A learning system built around the Brooklyn College Computer Science B.S. path—including its required supporting mathematics—with complete lessons, code-first practice, mastery testing, DegreeWorks mapping, and an AI tutor.</h2>
      <div className="promo-features"><span>Complete lessons</span><span>Code-first practice</span><span>Mastery tests</span><span>AI tutor</span></div>
      <a href="/">Start learning free <b>→</b></a>
      <small>More courses from the Brooklyn College Computer Science B.S. path are coming as they are built and reviewed.</small>
    </section>
    <figure className="promo-product"><img src="/exceler-a-home.png" alt="Exceler A home screen" /></figure>
    <code>daymark-os.daniellezhanskiy13.chatgpt.site</code>
  </main>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exceler A — Learn the Course. Prove the Skill.",
  description: "A self-directed Brooklyn College computer science and mathematics learning system.",
  robots: { index: false, follow: false },
};

export default function ExcelerPromoPage() {
  return <main className="promo-page">
    <div className="promo-brand">EXCELER <span>A</span></div>
    <section className="promo-copy">
      <p>Self-Directed Academic Learning</p>
      <h1>Learn the course.<br /><span>Prove the skill.</span></h1>
      <h2>A Brooklyn College computer science and mathematics curriculum built around complete lessons, code-first practice, mastery testing, persistent progress, DegreeWorks mapping, and an AI tutor.</h2>
      <div className="promo-features"><span>Complete lessons</span><span>Code-first practice</span><span>Mastery tests</span><span>AI tutor</span></div>
      <a href="/">Start learning free <b>→</b></a>
      <small>More Brooklyn College courses are coming as they are built and reviewed.</small>
    </section>
    <figure className="promo-product"><img src="/exceler-a-home.png" alt="Exceler A home screen" /></figure>
    <code>daymark-os.daniellezhanskiy13.chatgpt.site</code>
  </main>;
}

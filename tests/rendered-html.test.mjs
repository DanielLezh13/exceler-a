import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://exceler-a.example/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Exceler A public experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Exceler A — Self-Directed Academic Learning<\/title>/i);
  assert.match(html, /aria-label="Exceler A"/i);
  assert.match(html, />Home</i);
  assert.match(html, />Degree Map</i);
  assert.match(html, />Courses</i);
  assert.match(html, /Progress saved on this device/i);
  assert.doesNotMatch(html, /OPENAI_API_KEY|sk-proj-/i);
});

test("keeps public progress and AI access separate from the private workspace", async () => {
  const [commandCenter, structuredLesson, tutorRoute, tutorStyles, packageJson] = await Promise.all([
    readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/StructuredLesson.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(commandCenter, /const PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(commandCenter, /const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
  assert.match(commandCenter, /\["localhost", "127\.0\.0\.1", "::1"\]/);
  assert.match(commandCenter, /localWorkspace && <TutorAssistant/);
  assert.match(commandCenter, /<ReactMarkdown/);
  assert.match(commandCenter, /remarkPlugins=\{\[remarkGfm\]\}/);
  assert.match(commandCenter, /Boolean\(practicePlan\.checkpoints\[section\.id\]\)/);
  assert.match(commandCenter, /studentAnswer: currentAnswer\.slice\(0, 8_000\)/);
  assert.match(commandCenter, /status: passed \? "passed" : currentFeedback === "incorrect" \? "incorrect" : "not_checked"/);
  assert.match(commandCenter, /practice-complete-card/);
  assert.match(commandCenter, /Review Answers/);
  assert.match(commandCenter, /practiceQuestionWeight/);
  assert.match(commandCenter, /A chapter clears when every exercise passes/);
  assert.match(commandCenter, /foundationalPracticePlans/);
  assert.match(commandCenter, /SectionPracticeRendererContext/);
  assert.match(commandCenter, /variant="checkpoint"/);
  assert.match(commandCenter, /Chapter Review Complete/);
  assert.match(structuredLesson, /renderAfterSection\?\.\(section\.id\)/);
  assert.doesNotMatch(commandCenter, /Mark Lesson as Read|reading checkpoint 25%/i);
  assert.doesNotMatch(structuredLesson, /ReadingCheckpoint|Mark Lesson as Read/);

  assert.match(tutorRoute, /if \(!localRequest\) return errorResponse/);
  assert.match(tutorRoute, /available only in the private Exceler A desktop workspace/);
  assert.match(tutorRoute, /Never claim you cannot see the question or submission/);
  assert.match(tutorStyles, /\.tutor-messages \{[^}]*overflow-x: hidden/);
  assert.match(tutorStyles, /\.tutor-message pre \{[^}]*white-space: pre-wrap/);
  assert.match(tutorStyles, /\.tutor-markdown table \{[^}]*table-layout: fixed/);
  assert.match(tutorStyles, /@keyframes practice-check-pop/);
  assert.match(packageJson, /"react-markdown"/);
  assert.match(packageJson, /"remark-gfm"/);
});

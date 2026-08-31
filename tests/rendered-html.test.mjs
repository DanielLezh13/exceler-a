import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { additionalPracticeQuestions, unitMasteryTests } from "../app/data/cisc1115Course.ts";
import { createMasteryAttempt, recoverLegacyMasteryAttempt } from "../app/masteryAssessment.ts";
import { laterMasteryEquivalentAnswers } from "./laterMasteryEquivalentAnswers.mjs";

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

test("keeps public progress, mastery practice, and AI access separate from the private workspace", async () => {
  const [commandCenter, courseData, practiceValidation, structuredLesson, tutorRoute, tutorStyles, packageJson] = await Promise.all([
    readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/cisc1115Course.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/practiceValidation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/StructuredLesson.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(commandCenter, /const PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(commandCenter, /const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
  assert.match(commandCenter, /\["localhost", "127\.0\.0\.1", "::1"\]/);
  assert.match(commandCenter, /privateFeatures && <TutorAssistant/);
  assert.match(commandCenter, /Sign in with ChatGPT/);
  assert.match(commandCenter, /Nothing will be merged unless you choose it/);
  assert.match(commandCenter, /className=\{`sidebar-tutor-button/);
  assert.match(commandCenter, /Ask Exceler Tutor/);
  assert.doesNotMatch(commandCenter, /onClick=\{onOpenBackup\}><Download size=\{15\} \/>Progress Backup/);
  assert.match(commandCenter, /<ReactMarkdown/);
  assert.match(commandCenter, /remarkPlugins=\{\[remarkGfm\]\}/);
  assert.match(commandCenter, /Boolean\(practicePlan\.checkpoints\[section\.id\]\)/);
  assert.match(commandCenter, /studentAnswer: currentAnswer\.slice\(0, 8_000\)/);
  assert.match(commandCenter, /status: passed \? "passed" : currentFeedback === "incorrect" \? "incorrect" : "not_checked"/);
  assert.match(commandCenter, /practice-complete-card/);
  assert.match(commandCenter, /Review Answers/);
  assert.match(commandCenter, /practiceQuestionWeight/);
  assert.match(commandCenter, /function requiredChapterPracticeQuestions/);
  assert.match(commandCenter, /const questions = requiredChapterPracticeQuestions\(chapterId\)/);
  assert.match(commandCenter, /const requiredQuestions = requiredChapterPracticeQuestions\(chapterId\)/);
  assert.match(commandCenter, /A chapter clears when every exercise passes/);
  assert.match(commandCenter, /foundationalPracticePlans/);
  assert.match(commandCenter, /"input-reading-text": \[[^\]]*"input-review-q2"/);
  assert.doesNotMatch(commandCenter, /"input-reading-numbers": \[[^\]]*"input-review-q2"/);
  assert.match(commandCenter, /SectionPracticeRendererContext/);
  assert.match(commandCenter, /variant="checkpoint"/);
  assert.match(commandCenter, /<UnitMasteryAssessment/);
  assert.match(commandCenter, /contents-section unit-test-root/);
  assert.match(commandCenter, /practice\[selectedMasteryTest\.id\]/);
  assert.match(commandCenter, /variables-independent-build/);
  assert.match(commandCenter, /operators-independent-build/);
  assert.match(commandCenter, /Chapter Review Complete/);
  assert.match(commandCenter, /aria-label="Previous question"/);
  assert.match(commandCenter, /aria-label="Next question"/);
  assert.match(commandCenter, /practice-options/);
  assert.match(commandCenter, /variables-int/);
  assert.match(commandCenter, /operators-modulus-even-remainder/);
  assert.doesNotMatch(commandCenter, /boolean even = number % 2 ___ 0/);
  assert.match(commandCenter, /additionalSectionPracticeQuestionIds/);
  assert.match(commandCenter, /Section questions complete/);
  assert.match(commandCenter, /sectionQuestionIds\.filter/);
  assert.doesNotMatch(commandCenter, /className="tutor-backdrop"/);
  assert.match(commandCenter, /onPointerDown=\{beginDrag\}/);
  assert.match(structuredLesson, /renderAfterSection\?\.\(section\.id\)/);
  assert.match(courseData, /export const unitMasteryTests/);
  assert.match(courseData, /unit1-build-complete-program/);
  assert.match(courseData, /unit8-build-application/);
  assert.match(courseData, /const independentProductionQuestions/);
  assert.match(courseData, /const distributedProductionQuestions/);
  assert.match(courseData, /const productionScenarioOverrides/);
  assert.match(courseData, /groundedChoice\("input-mistake-q2"[^\n]*"int amount = \\"input\.nextInt\(\)\\";"/);
  assert.match(courseData, /groundedChoice\("input-mistake-q3"[^\n]*"int amount = input\.nextDouble\(\);"/);
  assert.match(courseData, /groundedChoice\("input-mistake-q4"[^\n]*"int amount = input\.nextInt\(\);"/);
  assert.match(courseData, /Estimate a Delivery Drone's Range/);
  assert.match(courseData, /Build a Freeze-Monitoring Program/);
  assert.match(courseData, /const distributedProductionSectionIds/);
  assert.match(courseData, /"input-write-number-task"/);
  assert.match(courseData, /"debug-write-tests"/);
  assert.match(commandCenter, /variables-write-declarations/);
  assert.match(commandCenter, /operators-write-time-conversion/);
  assert.match(commandCenter, /Plan an Arcade Prize Purchase/);
  assert.match(commandCenter, /You have 137 arcade tickets/);
  assert.match(commandCenter, /validate: validateArcadePrizePurchase/);
  assert.match(practiceValidation, /export const javaValidationCode/);
  assert.match(practiceValidation, /export const validateArcadePrizePurchase/);
  assert.doesNotMatch(commandCenter, /Store a mission count and a reward per mission/);
  assert.match(commandCenter, /\["viii", "VIII"\]/);
  assert.match(commandCenter, /practice-header"><h2>\{titleCase\(test\.title\)\}<\/h2>/);
  assert.doesNotMatch(commandCenter, /One Scrollable Test/);
  assert.doesNotMatch(commandCenter, /Answer all \{test\.questions\.length\} programs in any order/);
  assert.match(commandCenter, /mastery-test-question-list/);
  assert.match(commandCenter, /activeQuestions\.map\(\(question\) => <article/);
  assert.match(commandCenter, /Retry this question/);
  assert.match(commandCenter, /Recheck saved answer/);
  assert.match(commandCenter, /What needs attention/);
  assert.match(commandCenter, /masteryRetry: \{ sourceAttemptId: reviewedAttempt\.id, questionIds \}/);
  assert.match(commandCenter, /questionNumber: test\.questions\.findIndex/);
  assert.match(commandCenter, /currentGraderFeedback/);
  assert.match(commandCenter, /Your exact submitted answer/);
  assert.match(commandCenter, /Reference solution/);
  assert.match(commandCenter, /createMasteryAttempt/);
  assert.match(commandCenter, /recoverLegacyMasteryAttempt/);
  assert.doesNotMatch(commandCenter, /Earlier submission detected/);
  assert.match(commandCenter, /masteryAttempts: \[\.\.\.masteryAttempts, attempt\]/);
  assert.match(commandCenter, /masteryAssessment: selectedMasteryTest \? masteryTutorContext : null/);
  assert.match(commandCenter, /learnerAnswer: learnerAnswer\.slice\(0, 12_000\)/);
  assert.doesNotMatch(commandCenter, /There are no hints, answer reveals, or per-question correctness checks/);
  assert.match(commandCenter, /Submission creates an immutable attempt/);
  assert.doesNotMatch(commandCenter, /Mark Lesson as Read|reading checkpoint 25%/i);
  assert.doesNotMatch(structuredLesson, /ReadingCheckpoint|Mark Lesson as Read/);

  assert.match(tutorRoute, /if \(!localRequest && !user\) return errorResponse\("Sign in to use the Exceler Tutor\.", 401\)/);
  assert.match(tutorRoute, /MAX_DAILY_REQUESTS/);
  assert.match(tutorRoute, /MAX_MONTHLY_REQUESTS/);
  assert.match(tutorRoute, /Stay within Exceler A's educational scope/);
  assert.match(tutorRoute, /Never claim you cannot see the question, options, or submission/);
  assert.match(tutorRoute, /activeLesson\.masteryAssessment/);
  assert.match(tutorRoute, /code-editor answer/);
  assert.match(tutorStyles, /\.tutor-messages \{[^}]*overflow-x: hidden/);
  assert.match(tutorStyles, /\.tutor-shell \{[^}]*left: 24px[^}]*bottom: 96px[^}]*justify-items: start/);
  assert.match(tutorStyles, /\.sidebar-footer \.sidebar-tutor-button \{[^}]*min-height: 44px/);
  assert.match(tutorStyles, /\.tutor-launcher \{[^}]*display: none/);
  assert.match(tutorStyles, /\.tutor-drawer \{[^}]*transform-origin: left bottom/);
  assert.match(tutorStyles, /\.tutor-message pre \{[^}]*white-space: pre-wrap/);
  assert.match(tutorStyles, /\.tutor-markdown table \{[^}]*table-layout: fixed/);
  assert.match(tutorStyles, /@keyframes practice-check-pop/);
  assert.match(tutorStyles, /\.unit-test-root \{[^}]*border: 1px solid #303735[^}]*background: #141817/);
  assert.match(tutorStyles, /\.unit-test-root\.completed \{[^}]*border-color: #52633d[^}]*background: #171e14/);
  assert.match(tutorStyles, /\.practice-answer-field\.multiline \.practice-answer-overlay \{[^}]*pointer-events: auto/);
  assert.match(tutorStyles, /\.practice-answer-overlay \{[^}]*overflow: auto[^}]*overscroll-behavior: contain/);
  assert.match(tutorStyles, /\.mastery-answer-comparison \{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(packageJson, /"react-markdown"/);
  assert.match(packageJson, /"remark-gfm"/);
});

test("preserves the authored Unit I mastery test content and order", () => {
  const questions = unitMasteryTests[0].questions.map(({ id, title, prompt, code, placeholder, hint, answer, success, options, auditRequirements, multiline, productionStage, kind, level }) => ({
    id, title, prompt, code, placeholder, hint, answer, success, options, auditRequirements, multiline, productionStage, kind, level,
  }));
  assert.deepEqual(questions.map(({ id }) => id), [
    "unit1-build-profile",
    "unit1-build-time",
    "unit1-build-purchase",
    "unit1-build-full-line",
    "unit1-build-credits",
    "unit1-build-complete-program",
  ]);
  assert.equal(createHash("sha256").update(JSON.stringify(questions)).digest("hex"), "4141b56f1335738571f93f03cd7b21d143e0245c477d2d65c22277d30e335840");
});

test("creates immutable mastery snapshots and recovers the old saved-result shape", () => {
  const definitions = [
    { id: "q1", title: "First", prompt: "Write A", starterCode: "int a;", referenceSolution: "A", validate: (answer) => answer === "A" },
    { id: "q2", title: "Second", prompt: "Write B", referenceSolution: "B", validate: (answer) => answer === "B" },
  ];
  const answers = { q1: "A", q2: "wrong" };
  const attempt = createMasteryAttempt({ testId: "test", attemptNumber: 1, questions: definitions, answers, submittedAt: "2026-08-21T12:00:00.000Z" });
  answers.q1 = "changed later";

  assert.equal(attempt.score, 1);
  assert.equal(attempt.total, 2);
  assert.equal(attempt.questionResults[0].submittedAnswer, "A");
  assert.equal(attempt.questionResults[0].prompt, "Write A");
  assert.equal(attempt.questionResults[1].referenceSolution, "B");
  assert.equal(attempt.questionResults[1].failureCategory, "not_determined");

  const recovered = recoverLegacyMasteryAttempt({ testId: "test", questions: definitions, answers: { q1: "old A", q2: "old B" }, passedQuestionIds: ["q2"], submissionCount: 1, lastScore: 1 });
  assert.equal(recovered.recoveredFromLegacy, true);
  assert.equal(recovered.submittedAt, null);
  assert.equal(recovered.questionResults[0].submittedAnswer, "old A");
  assert.equal(recovered.questionResults[1].correct, true);
});

test("Unit I mastery validators accept equivalent behavior without accepting hard-coded output", () => {
  const questions = new Map(unitMasteryTests[0].questions.map((question) => [question.id, question]));
  const equivalents = {
    "unit1-build-time": `int total = input.nextInt();
System.out.println(total / 60 + " minutes and " + total % 60 + " seconds");`,
    "unit1-build-credits": `int missions = input.nextInt();
int reward = input.nextInt();
int finalCredits = 50 + missions * reward;
System.out.println("Final credits: " + finalCredits);`,
    "unit1-build-complete-program": `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        double width = keyboard.nextDouble();
        double height = keyboard.nextDouble();
        System.out.println("Area: " + width * height);
    }
}`,
  };

  for (const [id, answer] of Object.entries(equivalents)) {
    assert.equal(questions.get(id)?.validate(answer), true, `${id} rejected an equivalent implementation`);
    assert.equal(questions.get(id)?.validate('System.out.println("hard coded");'), false, `${id} accepted hard-coded output`);
  }
});

test("accepts the six recovered Unit I answers that previously received 3/6", () => {
  const questions = new Map(unitMasteryTests[0].questions.map((question) => [question.id, question]));
  const recoveredAnswers = {
    "unit1-build-profile": [
      "String name = input.next();",
      "int age = input.nextInt();",
      "System.out.println(name + \" is \" + age);",
    ].join("\n"),
    "unit1-build-time": [
      "int seconds = input.nextInt();",
      "int minutes = seconds / 60;",
      "seconds %= 60;",
      "System.out.println(minutes + \" minutes and \" + seconds + \" seconds\");",
    ].join("\n"),
    "unit1-build-purchase": [
      "int quantity = input.nextInt();",
      "double price = input.nextDouble();",
      "double total = quantity * price + 5;",
      "System.out.print(\"Total: \" + total);",
    ].join("\n"),
    "unit1-build-full-line": [
      "int age = input.nextInt();",
      "input.nextLine();",
      "String name = input.nextLine();",
      "System.out.print(name + \" is \" + age);",
    ].join("\n"),
    "unit1-build-credits": [
      "int credits = 50;",
      "int count = input.nextInt();",
      "int award = input.nextInt();",
      "int value = credits + count * award;",
      "System.out.print(\"Final credits: \" + value);",
    ].join("\n"),
    "unit1-build-complete-program": [
      "import java.util.Scanner;",
      "public class Main {",
      "    public static void main(String[] args) {",
      "        Scanner input = new Scanner(System.in);",
      "        double width = input.nextDouble();",
      "        double height = input.nextDouble();",
      "        double area = height * width;",
      "        System.out.print(\"Area: \" + area);",
      "    }",
      "}",
    ].join("\n"),
  };

  for (const [id, answer] of Object.entries(recoveredAnswers)) {
    assert.equal(questions.get(id)?.validate(answer), true, id + " rejected the recovered valid answer");
  }
});

test("later mastery tests accept taught equivalent implementations", () => {
  const questions = new Map(unitMasteryTests.slice(1).flatMap((masteryTest) => masteryTest.questions).map((question) => [question.id, question]));

  assert.deepEqual(Object.keys(laterMasteryEquivalentAnswers).sort(), [...questions.keys()].sort());
  for (const [id, answer] of Object.entries(laterMasteryEquivalentAnswers)) {
    const question = questions.get(id);
    assert.ok(question, id + " is not a later mastery question");
    assert.equal(question.validate(answer), true, id + " rejected a valid equivalent implementation");
    assert.equal(question.validate('System.out.println("hard coded");'), false, id + " accepted hard-coded output");
  }
});

test("every practice question reveals a concrete answer that its validator accepts", () => {
  const questions = [
    ...Object.values(additionalPracticeQuestions).flat(),
    ...unitMasteryTests.flatMap((masteryTest) => masteryTest.questions),
  ];

  for (const question of questions) {
    assert.equal(typeof question.answer, "string", `${question.id} is missing a shown answer`);
    assert.notEqual(question.answer.trim(), question.hint.trim(), `${question.id} reveals its hint instead of an answer`);
    assert.equal(question.validate(question.answer), true, `${question.id} rejects its own shown answer`);
  }
});

test("the rectangle build accepts print and println", () => {
  const question = additionalPracticeQuestions["input-basic-programs"].find(({ id }) => id === "input-complete-q1");
  assert.ok(question);

  const sharedCode = `Scanner input = new Scanner(System.in);
double width = input.nextDouble();
double height = input.nextDouble();
double area = width * height;`;

  assert.equal(question.validate(`${sharedCode}\nSystem.out.print("Area: " + area);`), true);
  assert.equal(question.validate(`${sharedCode}\nSystem.out.println("Area: " + area);`), true);
});

test("coding validators ignore only irrelevant terminal newlines", () => {
  const questions = [
    ...Object.values(additionalPracticeQuestions).flat(),
    ...unitMasteryTests.flatMap((masteryTest) => masteryTest.questions),
  ];
  const byId = new Map(questions.map((question) => [question.id, question]));

  for (const id of ["input-pattern-q6", "input-complete-q2", "strings-q7", "unit1-build-purchase"]) {
    const question = byId.get(id);
    assert.ok(question?.answer, `${id} is missing`);
    const finalPrint = question.answer.replace(/System\.out\.println(?![\s\S]*System\.out\.println)/, "System.out.print");
    assert.equal(question.validate(finalPrint), true, `${id} should allow print for its final one-time output`);
  }

  const twoLineQuestion = byId.get("input-review-q5");
  assert.ok(twoLineQuestion?.answer);
  assert.equal(twoLineQuestion.validate(twoLineQuestion.answer.replace(/System\.out\.println(?![\s\S]*System\.out\.println)/, "System.out.print")), true);
  assert.equal(twoLineQuestion.validate(twoLineQuestion.answer.replaceAll("System.out.println", "System.out.print")), false);

  for (const id of ["while-write-counter", "for-q7", "nested-q7", "arrayloop-q7"]) {
    const question = byId.get(id);
    assert.ok(question?.answer, `${id} is missing`);
    assert.equal(question.validate(question.answer.replaceAll("System.out.println", "System.out.print")), false, `${id} needs repeated line breaks`);
  }
});

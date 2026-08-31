import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { unitMasteryTests } from "../app/data/cisc1115Course.ts";
import * as mastery from "../app/masteryAssessment.ts";

// Exercise the real component's handlers and JSX with a small deterministic
// hook harness. This is a component unit test, not a substitute for browser QA.
const source = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
const component = source.slice(source.indexOf("function UnitMasteryAssessment("), source.indexOf("function ChapterPractice("));
assert.ok(component.length > 1_000);
const compiled = ts.transpileModule(component, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function makeHarness(initialRecord) {
  let record = structuredClone(initialRecord);
  let context;
  let stateIndex = 0;
  let refIndex = 0;
  let effects = [];
  const states = [];
  const refs = [];
  const JavaEditor = () => null;
  const noopComponent = () => null;
  const dependencies = {
    exports: {},
    ...mastery,
    useMemo: (factory) => factory(),
    useState: (initial) => {
      const i = stateIndex++;
      if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], (value) => { states[i] = typeof value === "function" ? value(states[i]) : value; }];
    },
    useRef: (value) => { const i = refIndex++; return refs[i] ??= { current: value }; },
    useEffect: (effect) => { effects.push(effect); },
    useLayoutEffect: () => {},
    emptyPracticeRecord: () => ({ answers: {}, attempts: {}, hints: [], passed: [] }),
    titleCase: (value) => value,
    JavaEditor, JavaCode: noopComponent, Check: noopComponent, X: noopComponent, RotateCcw: noopComponent, GraduationCap: noopComponent,
    require: (name) => { assert.equal(name, "react/jsx-runtime"); return jsxRuntime; },
  };
  const renderComponent = new Function(...Object.keys(dependencies), `${compiled}\nreturn UnitMasteryAssessment;`)(...Object.values(dependencies));
  const render = () => {
    stateIndex = 0; refIndex = 0; effects = [];
    const tree = renderComponent({ test: unitMasteryTests[0], record, onChange: (value) => { record = value; }, onTutorContextChange: (value) => { context = value; } });
    for (const effect of effects) effect();
    return tree;
  };
  return { render, JavaEditor, get record() { return record; }, get context() { return context; } };
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...elements(node.props.children)];
}
function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node?.props ? textOf(node.props.children) : "";
}
function button(tree, label) {
  const found = elements(tree).find((element) => element.type === "button" && textOf(element) === label);
  assert.ok(found, `Missing button: ${label}`);
  return found;
}

const correctAnswer = 'int quantity = input.nextInt();\ndouble price = input.nextDouble();\nint fee = 5;\ndouble value = quantity * price + fee;\nSystem.out.print("Total: " + value);';
const wrongAnswer = correctAnswer.replace("fee = 5", "fee = 6");
const questionId = "unit1-build-purchase";
function recordFor(answer = wrongAnswer, oldVerdict = false) {
  const test = unitMasteryTests[0];
  const answers = Object.fromEntries(test.questions.map((q) => [q.id, q.id === questionId ? answer : q.answer]));
  const definitions = test.questions.map((q) => ({ id: q.id, title: q.title, prompt: q.prompt, starterCode: q.code, referenceSolution: q.answer, validate: q.validate }));
  const attempt = mastery.createMasteryAttempt({ testId: test.id, attemptNumber: 1, questions: definitions, answers });
  if (oldVerdict) {
    attempt.score = 5;
    Object.assign(attempt.questionResults[2], { correct: false, earnedPoints: 0, failureCategory: "not_determined", gradingMethod: "behavioral-validator", feedback: "Old checker rejected this code." });
  }
  return { answers, attempts: Object.fromEntries(test.questions.map((q) => [q.id, 1])), passed: test.questions.filter((q) => q.id !== questionId).map((q) => q.id), hints: [], submissions: 1, lastScore: 5, masteryAttempts: [attempt] };
}

test("results → retry Q3 → edit → reload → submit keeps the rest of the test intact", () => {
  let harness = makeHarness(recordFor());
  const original = structuredClone(harness.record.masteryAttempts[0]);
  let tree = harness.render();
  assert.match(textOf(tree), /What needs attention/);
  assert.match(textOf(tree), /expected "Total: 12.5"/);
  button(tree, "Retry this question").props.onClick();
  tree = harness.render();
  let editors = elements(tree).filter((element) => element.type === harness.JavaEditor);
  assert.equal(editors.length, 1);
  assert.equal(editors[0].props.value, wrongAnswer);
  assert.equal(harness.context.mode, "question_retry");
  assert.deepEqual(harness.context.retryQuestionIds, [questionId]);
  assert.equal(harness.context.questions[0].questionNumber, 3);
  assert.equal(harness.context.questions[0].referenceSolution, null);
  editors[0].props.onChange(correctAnswer);
  harness = makeHarness(JSON.parse(JSON.stringify(harness.record)));
  tree = harness.render();
  editors = elements(tree).filter((element) => element.type === harness.JavaEditor);
  assert.equal(editors.length, 1);
  assert.equal(editors[0].props.value, correctAnswer);
  button(tree, "Submit question").props.onClick();
  tree = harness.render();
  assert.equal(harness.record.masteryAttempts.length, 2);
  assert.equal(harness.record.masteryAttempts[1].score, 6);
  assert.equal(harness.record.passed.length, 6);
  assert.deepEqual(harness.record.masteryAttempts[0], original);
  assert.equal(harness.record.attempts[questionId], 2);
  assert.equal(harness.record.attempts["unit1-build-profile"], 1);
  assert.equal(harness.context.mode, "results_review");
  assert.equal(harness.context.questions[2].learnerAnswer, correctAnswer);
  assert.match(textOf(tree), /Other answers and results are carried forward unchanged/);
  button(tree, "Attempt 1 · 5/6").props.onClick();
  harness.render();
  assert.equal(harness.context.questions[2].learnerAnswer, wrongAnswer);
});

test("recheck uses the exact saved answer, updates mastery, and does not count as a learner retry", () => {
  const record = recordFor(correctAnswer, true);
  record.answers[questionId] = wrongAnswer;
  const harness = makeHarness(record);
  const tree = harness.render();
  assert.match(textOf(tree), /No answer changes are needed/);
  assert.match(harness.context.questions[2].currentGraderFeedback, /Accepted on 6/);
  button(tree, "Recheck saved answer").props.onClick();
  harness.render();
  assert.equal(harness.record.masteryAttempts[0].score, 5);
  assert.equal(harness.record.masteryAttempts[1].score, 6);
  assert.equal(harness.record.masteryAttempts[1].kind, "regrade");
  assert.equal(harness.record.masteryAttempts[1].questionResults[2].submittedAnswer, correctAnswer);
  assert.equal(harness.record.attempts[questionId], 1);
});

test("cancelling a retry leaves history intact and full retakes still present all six questions", () => {
  const harness = makeHarness(recordFor());
  const before = JSON.stringify(harness.record.masteryAttempts);
  let tree = harness.render();
  button(tree, "Retry this question").props.onClick();
  tree = harness.render();
  button(tree, "Cancel retry").props.onClick();
  tree = harness.render();
  assert.equal(JSON.stringify(harness.record.masteryAttempts), before);
  button(tree, "Retake Full Test").props.onClick();
  tree = harness.render();
  assert.equal(elements(tree).filter((element) => element.type === harness.JavaEditor).length, 6);
  assert.equal(button(tree, "Submit Test").props.disabled, true);
  assert.equal(harness.context.mode, "active_test");
});

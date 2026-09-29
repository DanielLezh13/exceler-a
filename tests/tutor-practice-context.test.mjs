import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw } from "lucide-react";
import { additionalPracticeQuestions } from "../app/data/cisc1115Course.ts";

const tutorRouteSource = await readFile(new URL("../app/api/tutor/route.ts", import.meta.url), "utf8");
const tutorRouteJs = ts.transpileModule(tutorRouteSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const tutorRouteExports = {};
new Function("require", "exports", tutorRouteJs)(name => {
  if (name === "../../chatgpt-auth") return { getChatGPTUser: async () => null };
  if (name === "../../../db") return { getD1: () => { throw new Error("local tutor tests must not access cloud storage"); } };
  throw new Error(`Unexpected tutor dependency: ${name}`);
}, tutorRouteExports);
const { POST } = tutorRouteExports;

// Run the real practice component's hooks, JSX, and event handlers without a
// browser or live API request. The exercises below are existing course content.
const source = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
const component = source.slice(source.indexOf("function ChapterPractice("), source.indexOf("function pathNodeStatus("));
assert.ok(component.length > 1_000);
const compiled = ts.transpileModule(component, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const courseQuestions = Object.values(additionalPracticeQuestions).flat();
const choices = courseQuestions.filter((question) => question.options?.length).slice(0, 2);
const codeQuestion = courseQuestions.find((question) => !question.options?.length && question.multiline);
const questions = [...choices, codeQuestion];
assert.equal(choices.length, 2);
assert.ok(codeQuestion);

function harness(initialRecord = { answers: {}, passed: [], attempts: {}, hints: [] }, savedQuestionId = choices[0].id) {
  let record = structuredClone(initialRecord);
  let context;
  let stateIndex = 0;
  let effects = [];
  const states = [];
  const noopComponent = () => null;
  const dependencies = {
    exports: {}, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw,
    practiceQuestions: { fixture: questions },
    requiredChapterPracticeQuestions: () => questions,
    questionUsesJavaEditor: (question) => question.multiline,
    titleCase: (value) => value,
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useEffect: (effect) => { effects.push(effect); },
    JavaEditor: noopComponent, JavaCode: noopComponent, CopyCodeButton: noopComponent,
    require: (name) => { assert.equal(name, "react/jsx-runtime"); return jsxRuntime; },
  };
  const renderComponent = new Function(...Object.keys(dependencies), `${compiled}\nreturn ChapterPractice;`)(...Object.values(dependencies));
  return {
    get context() { return context; },
    get record() { return record; },
    render(tutorActive = true) {
      stateIndex = 0; effects = [];
      const tree = renderComponent({ chapterId: "fixture", questionIds: questions.map((question) => question.id), variant: "checkpoint", practiceSectionId: "fixture-practice", savedQuestionId, record, onChange: (value) => { record = value; }, onActiveQuestionChange: () => {}, onTutorPracticeContextChange: (value) => { context = value; }, tutorActive });
      for (const effect of effects) effect();
      return tree;
    },
  };
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
function assertVisibleOptions(tree, context) {
  const radios = elements(tree).filter((element) => element.props.role === "radio");
  assert.deepEqual(context.options, radios.map((radio) => ({
    label: textOf(radio.props.children[0]),
    text: textOf(radio.props.children[1]),
    selected: radio.props["aria-checked"],
  })));
  return radios;
}

test("tutor sees every displayed choice before selection and follows answer changes", () => {
  const view = harness();
  let tree = view.render();
  let radios = assertVisibleOptions(tree, view.context);
  assert.deepEqual(view.context.options.map((option) => option.text), choices[0].options);
  assert.deepEqual(view.context.options.map((option) => option.label), ["A", "B", "C", "D"].slice(0, choices[0].options.length));
  assert.equal(view.context.selectedOptionLabel, null);
  assert.equal(view.context.studentAnswer, "");
  assert.equal(view.context.shownAnswer, null);
  assert.ok(view.context.options.every((option) => !Object.hasOwn(option, "correct")));
  radios[1].props.onClick();
  tree = view.render();
  radios = assertVisibleOptions(tree, view.context);
  assert.equal(view.context.selectedOptionLabel, "B");
  assert.equal(view.context.studentAnswer, choices[0].options[1]);
  assert.equal(view.context.status, "not_checked");
  radios[0].props.onClick();
  tree = view.render();
  assertVisibleOptions(tree, view.context);
  assert.equal(view.context.selectedOptionLabel, "A");
  assert.equal(view.context.options.filter((option) => option.selected).length, 1);
});

test("saved passed answers keep their choice labels, and navigation clears stale options", () => {
  const correct = choices[0].options.find((option) => choices[0].validate(option));
  assert.ok(correct);
  const view = harness({ answers: { [choices[0].id]: correct }, passed: [choices[0].id], attempts: { [choices[0].id]: 1 }, hints: [] });
  let tree = view.render();
  assertVisibleOptions(tree, view.context);
  assert.equal(view.context.status, "passed");
  assert.equal(view.context.options.find((option) => option.selected).text, correct);
  assert.ok(!elements(tree).some((element) => textOf(element).includes("Example Answer")), "passed multiple-choice questions do not need an example-answer control");
  elements(tree).find((element) => element.props["aria-label"] === "Open question 2").props.onClick();
  tree = view.render();
  assertVisibleOptions(tree, view.context);
  assert.deepEqual(view.context.options.map((option) => option.text), choices[1].options);
  assert.equal(view.context.selectedOptionLabel, null);
  elements(tree).find((element) => element.props["aria-label"] === "Open question 3").props.onClick();
  tree = view.render();
  assertVisibleOptions(tree, view.context);
  assert.deepEqual(view.context.options, []);
  assert.equal(view.context.selectedOptionLabel, null);
  assert.equal(view.context.questionId, codeQuestion.id);
});

test("passed code answers can reveal an example without covering or replacing the learner answer", () => {
  const learnerAnswer = codeQuestion.answer;
  const view = harness({ answers: { [codeQuestion.id]: learnerAnswer }, passed: [codeQuestion.id], attempts: { [codeQuestion.id]: 1 }, hints: [] }, codeQuestion.id);
  let tree = view.render();
  const reveal = elements(tree).find((element) => textOf(element) === "View Example Answer");
  assert.ok(reveal);
  reveal.props.onClick();
  tree = view.render();
  const example = elements(tree).find((element) => element.props["aria-label"] === "Example answer");
  assert.equal(view.record.answers[codeQuestion.id], learnerAnswer);
  assert.deepEqual(view.record.hints, [], "reviewing a passed answer is not a hint");
  assert.ok(example);
  assert.equal(view.context.shownAnswer, codeQuestion.answer);
  assert.ok(elements(tree).some((element) => textOf(element) === "Hide Example Answer"));
});

test("inactive exercises cannot overwrite the tutor's current choices", () => {
  const view = harness();
  view.render(false);
  assert.equal(view.context, undefined);
});

test("the tutor endpoint forwards displayed choices and selection to the model intact", async (t) => {
  const view = harness();
  let tree = view.render();
  assertVisibleOptions(tree, view.context)[1].props.onClick();
  tree = view.render();
  assertVisibleOptions(tree, view.context);
  const oldKey = process.env.OPENAI_API_KEY;
  const oldNodeEnv = process.env.NODE_ENV;
  // A fake token and mocked transport guarantee no real key or API is used.
  process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
  process.env.NODE_ENV = "test";
  t.after(() => {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNodeEnv;
  });
  let upstreamBody;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    upstreamBody = JSON.parse(init.body);
    return new Response("data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } });
  });
  const response = await POST(new Request("http://localhost:1300/api/tutor", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "What were the choices and which did I select?" }], context: { activeLesson: { activePractice: view.context } } }),
  }));
  assert.equal(response.status, 200);
  const received = JSON.parse(upstreamBody.instructions.split("<CONTEXT>\n")[1].split("\n</CONTEXT>")[0]);
  assert.deepEqual(received.activeLesson.activePractice, view.context);
  assert.match(upstreamBody.instructions, /selected means chosen, not necessarily correct/);
  assert.equal(await response.text(), "data: [DONE]\n\n");
});

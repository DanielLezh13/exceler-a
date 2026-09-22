import assert from "node:assert/strict";
import test from "node:test";
import { comparisonWritingQuestions } from "../app/data/comparisonWritingPractice.ts";
import { additionalPracticeQuestions, additionalSectionPracticeQuestionIds } from "../app/data/cisc1115Course.ts";

const byId = new Map(comparisonWritingQuestions.map((question) => [question.id, question]));
const equivalents = {
  "comparison-write-equal": [
    "System.out.println(enteredCode == lockerCode);",
    "boolean same = (lockerCode == enteredCode); System.out.print(same);",
    "boolean result; result = (enteredCode == lockerCode); System.out.println(result);",
  ],
  "comparison-write-not-equal": [
    "System.out.print(ordered != received);",
    "boolean different = received != ordered; System.out.println(different);",
  ],
  "comparison-write-greater": [
    "System.out.println(55 < speed);",
    "boolean fast = speed >= 56; System.out.print(fast);",
    "int limit = 55; boolean tooFast = (speed > limit); System.out.println(tooFast);",
  ],
  "comparison-write-less": [
    "System.out.print(10 > stock);",
    "boolean low = stock <= 9; System.out.println(low);",
  ],
  "comparison-write-at-least": [
    "System.out.println(target <= points);",
    "int difference = points - target; boolean earned = difference >= 0; System.out.print(earned);",
  ],
  "comparison-write-at-most": [
    "System.out.print(quantity * price <= budget);",
    "boolean fits = budget >= (price * quantity); System.out.println(fits);",
    "double cost; cost = quantity * price; boolean fits; fits = cost <= budget; System.out.print(fits);",
    "double cost = price; cost *= quantity; System.out.println(cost <= budget);",
    "double cost = quantity; cost = cost * price; boolean fits = cost <= budget; System.out.println(fits);",
  ],
};
const mistakes = {
  "comparison-write-equal": ["enteredCode != lockerCode", "enteredCode >= lockerCode", "enteredCode == 4821"],
  "comparison-write-not-equal": ["received == ordered", "received < ordered", "received > ordered"],
  "comparison-write-greater": ["speed >= 55", "speed < 55", "speed > 56"],
  "comparison-write-less": ["stock <= 10", "stock > 10", "stock < 9"],
  "comparison-write-at-least": ["points > target", "points <= target", "points >= 70"],
  "comparison-write-at-most": ["quantity * price < budget", "quantity * price >= budget", "price <= budget", "quantity + price <= budget"],
};

test("comparison writing is interleaved with all six unchanged multiple-choice questions", () => {
  const chapter = additionalPracticeQuestions["comparisons-booleans"];
  const ids = additionalSectionPracticeQuestionIds["comparisons-booleans"]["booleans-comparisons"];
  const originalIds = Array.from({ length: 6 }, (_, index) => `booleans-comparisons-concept-${index + 1}`);
  const originalTail = ["bool-mastery-boundary-1", "bool-mastery-boundary-2", "bool-write-comparison"];
  assert.equal(comparisonWritingQuestions.length, 6);
  assert.deepEqual(ids, [...originalIds.flatMap((id, index) => [id, comparisonWritingQuestions[index].id]), ...originalTail]);
  // ChapterPractice filters the global list; it does not sort by section IDs.
  assert.deepEqual(chapter.filter((question) => ids.includes(question.id)).map((question) => question.id), ids);
  for (const id of originalIds) assert.ok(chapter.find((question) => question.id === id).options.length);
  for (const question of comparisonWritingQuestions) {
    assert.ok(question.multiline);
    assert.equal(question.productionStage, 3);
    assert.equal(question.options, undefined);
    assert.ok(question.code, "given variables must appear inside the exercise");
    assert.doesNotMatch(question.code + question.answer, /\b(?:if|else|for|while)\b|&&|\|\||\?|!(?!=)/);
  }
});

test("every comparison accepts its reference, print/println, comments, names and equivalent implementations", () => {
  for (const question of comparisonWritingQuestions) {
    assert.ok(question.validate(question.answer), question.id);
    assert.ok(question.validate(question.answer.replace("println", "print")), question.id);
    assert.ok(question.validate(`// My solution\n${question.answer}\n/* Finished */`), question.id);
    for (const answer of equivalents[question.id]) assert.ok(question.validate(answer), `${question.id}: ${answer}`);
  }
});

test("boundary and direction errors fail, including comparisons that only fit the displayed example", () => {
  for (const [id, expressions] of Object.entries(mistakes)) {
    for (const expression of expressions) assert.equal(byId.get(id).validate(`System.out.println(${expression});`), false, `${id}: ${expression}`);
  }
});

test("hard-coded answers, missing output, invalid types, undeclared names and input mutation fail", () => {
  for (const question of comparisonWritingQuestions) {
    for (const answer of ["true", "false", "System.out.println(true);", "System.out.print(false);", "// " + question.answer.replaceAll("\n", "\n// "), question.answer.replace(/System\.out\.(?:print|println)\([^;]+;?/, "")]) {
      assert.equal(question.validate(answer), false, `${question.id}: ${answer}`);
    }
  }
  const question = byId.get("comparison-write-greater");
  for (const answer of [
    "int result = speed > 55; System.out.println(result);",
    "boolean result = unknown > 55; System.out.println(result);",
    "boolean result; System.out.println(result);",
    "boolean result = speed > 55 System.out.println(result);",
    "speed = 56; System.out.println(speed > 55);",
    "int speed = 56; System.out.println(speed > 55);",
    "System.out.println(speed = 56);",
    "boolean result = speed > 55; boolean result = false; System.out.println(result);",
    "System.out.println(speed > 55); System.out.println(speed > 55);",
    "System.out.println(speed > 55); }} class Other { void x() {",
  ]) assert.equal(question.validate(answer), false, answer);
  assert.equal(byId.get("comparison-write-at-most").validate("int cost = quantity * price; System.out.println(cost <= budget);"), false);
});

test("Tracing Truth progresses through NOT, precedence, parentheses, and mixed comparisons", () => {
  const chapter = additionalPracticeQuestions["comparisons-booleans"];
  const ids = additionalSectionPracticeQuestionIds["comparisons-booleans"]["booleans-truth"];
  const expected = [
    "booleans-truth-concept-1",
    "booleans-truth-concept-2",
    "booleans-truth-concept-3",
    "bool-truth-not-and",
    "bool-truth-and-before-or",
    "bool-truth-parentheses-change",
    "bool-truth-negated-group-true",
    "bool-mastery-grouping",
    "bool-truth-trace-order",
    "bool-truth-mixed-comparisons",
  ];
  assert.deepEqual(ids, expected);
  assert.deepEqual(chapter.filter((question) => ids.includes(question.id)).map((question) => question.id), expected);
  for (const id of expected.slice(3)) {
    const question = chapter.find((item) => item.id === id);
    assert.ok(question?.code, id);
    assert.ok(question.validate(question.answer), id);
    assert.equal(question.validate(question.answer === "true" ? "false" : "true"), false, id);
    assert.doesNotMatch(question.code, /\b(?:if|else|while|for)\b/, id);
  }
  assert.ok(!additionalSectionPracticeQuestionIds["comparisons-booleans"]["booleans-combining"].includes("bool-mastery-grouping"));
});

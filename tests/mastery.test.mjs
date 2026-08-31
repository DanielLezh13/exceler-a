import assert from "node:assert/strict";
import test from "node:test";
import { unitMasteryTests } from "../app/data/cisc1115Course.ts";
import { gradeBoothPurchase } from "../app/purchaseValidation.ts";
import { createMasteryAttempt, createMasteryFollowUp, currentMasteryGrade, masteryAttemptLabel, masteryResultLabel, readMasteryAttempts } from "../app/masteryAssessment.ts";

const purchase = unitMasteryTests[0].questions.find((q) => q.id === "unit1-build-purchase");
const screenshotAnswer = `int quantity = input.nextInt();
double price = input.nextDouble();
int fee = 5;
double value = quantity * price + fee;
System.out.print("Total: " + value);`;
const input = "int q = input.nextInt(); double p = input.nextDouble();";

test("the exact screenshot answer is valid through the real question validator", () => {
  assert.equal(purchase.validate(screenshotAnswer), true);
  const grade = gradeBoothPurchase(screenshotAnswer);
  assert.equal(grade.correct, true);
  assert.equal(grade.category, "not_applicable");
  assert.match(grade.feedback, /6 input\/output checks/);
});

test("purchase accepts named constants, changed names, parentheses, stored or direct output", () => {
  const alternatives = [
    `${input} final double serviceFee = 5.0; double bill = (p * q) + serviceFee; System.out.println("Total: " + bill);`,
    `${input} int fee; fee = 2 + 3; double result; result = fee + q * p; System.out.print("Total: " + result);`,
    `${input} double total = q*p; total += 5; System.out.println("Total: " + total);`,
    `${input} double total = 5; total = total + (q * p); System.out.println("Total: " + total);`,
    `${input} int fee = 3; fee += 2; System.out.print("Total: "); System.out.print(p*q+fee);`,
    `${input} System.out.println("Total: " + (5 + p*q));`,
    `${input} String label = "Total: "; double charge = (double)q*p + 5.0; System.out.println(label + charge);`,
    `import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner keyboard = new Scanner(System.in); int count = keyboard.nextInt(); double cost = keyboard.nextDouble(); System.out.println("Total: " + (count*cost+5)); } }`,
    `${input} /* fee next */ double fee = 5; // a variable is allowed\n System.out.println("Total: " + (q*p+fee));`,
  ];
  for (const answer of alternatives) assert.equal(purchase.validate(answer), true, `${answer}\n${gradeBoothPurchase(answer).feedback}`);
});

test("wrong purchase calculations produce an actual failing input and output", () => {
  for (const answer of [
    screenshotAnswer.replace("fee = 5", "fee = 6"),
    screenshotAnswer.replace("price + fee", "(price + fee)"),
    screenshotAnswer.replace("quantity * price + fee", "quantity + price + fee"),
    screenshotAnswer.replace("System.out.print", "fee = 9; value = quantity * price + fee; System.out.print"),
    `${input} System.out.println("Total: " + q*p + 5);`,
    `${input} System.out.println("Total: 12.5");`,
    `${input} double total=q*p+5; total=7; System.out.println("Total: " + total);`,
    `${input} double total=q*p+5; System.out.println("Total:" + total);`,
    `${input} double total=q*p+5; System.out.println("Total: " + total); System.out.println("extra");`,
  ]) {
    const grade = gradeBoothPurchase(answer);
    assert.equal(purchase.validate(answer), false, answer);
    assert.equal(grade.category, "output_mismatch", answer);
    assert.match(grade.feedback, /quantity .*expected .*produced/);
  }
});

test("rejects wrong/missing inputs, invalid types, comments-only solutions, and unsupported constructs", () => {
  const examples = [
    [screenshotAnswer.replace("quantity = input.nextInt()", "quantity = 3"), "input_mismatch"],
    [screenshotAnswer.replace("double price = input.nextDouble();", "int price = input.nextDouble();"), "invalid_code"],
    ["System.out.println(\"Total: 12.5\");", "input_mismatch"],
    ["/* " + screenshotAnswer + " */", "input_mismatch"],
    [screenshotAnswer.replace("int fee = 5", "int fee = input.nextInt()"), "input_mismatch"],
    [input + 'while (true) { System.out.println("Total: 12.5"); }', "unsupported_code"],
    [input + 'System.out.printf("Total: %.2f", q*p+5);', "unsupported_code"],
    [screenshotAnswer.replace("fee = 5", "fee = 5; fee = 0; int fee = 5"), "invalid_code"],
    [screenshotAnswer.replace("fee = 5", "fee = 5---0"), "invalid_code"],
    ["", "missing_answer"],
  ];
  for (const [answer, category] of examples) {
    const grade = gradeBoothPurchase(answer);
    assert.equal(grade.correct, false, answer);
    assert.equal(grade.category, category, answer);
  }
});

const definitionsFor = (test) => test.questions.map((q) => ({ id: q.id, title: q.title, prompt: q.prompt, starterCode: q.code, referenceSolution: q.answer, validate: q.validate }));

test("rechecking an old false rejection fixes only that result, without changing any submitted code", () => {
  const test = unitMasteryTests[0];
  const definitions = definitionsFor(test);
  const answers = Object.fromEntries(test.questions.map((q) => [q.id, q.answer]));
  answers[purchase.id] = screenshotAnswer;
  const source = createMasteryAttempt({ testId: test.id, attemptNumber: 1, questions: definitions, answers });
  // Fixture recreates the exact legacy verdict without relying on today's grader.
  source.score = 5;
  Object.assign(source.questionResults[2], { correct: false, earnedPoints: 0, gradingMethod: "behavioral-validator", failureCategory: "not_determined", feedback: "Legacy checker did not accept this answer." });
  const before = JSON.stringify(source);
  const corrected = createMasteryFollowUp({ source, attemptNumber: 2, questions: definitions, questionIds: [purchase.id], answers: { [purchase.id]: "THIS DRAFT MUST NOT BE USED" }, kind: "regrade" });
  assert.equal(corrected.score, 6);
  assert.equal(corrected.total, 6);
  assert.equal(corrected.sourceAttemptId, source.id);
  assert.deepEqual(corrected.reassessedQuestionIds, [purchase.id]);
  assert.match(masteryAttemptLabel(corrected), /^Recheck 2/);
  assert.equal(JSON.stringify(source), before);
  source.questionResults.forEach((original, i) => {
    assert.equal(corrected.questionResults[i].submittedAnswer, original.submittedAnswer);
    if (i !== 2) assert.deepEqual(corrected.questionResults[i], original);
  });
  const restored = readMasteryAttempts(JSON.parse(JSON.stringify([source, corrected])), test.id, new Set(test.questions.map((q) => q.id)));
  assert.deepEqual(restored[1], corrected);
  assert.equal(restored[0].score, 5);
});

test("single-question retries work across every unit, keeping siblings and original question numbers", () => {
  for (const test of unitMasteryTests) {
    const definitions = definitionsFor(test);
    const answers = Object.fromEntries(test.questions.map((q) => [q.id, q.answer]));
    const target = test.questions[1];
    answers[target.id] = "incorrect";
    const source = createMasteryAttempt({ testId: test.id, attemptNumber: 1, questions: definitions, answers });
    const frozen = JSON.stringify(source);
    const retry = createMasteryFollowUp({ source, attemptNumber: 2, questions: definitions, questionIds: [target.id], answers: { [target.id]: target.answer } });
    assert.equal(retry.score, test.questions.length, test.id);
    assert.equal(retry.questionResults[1].questionNumber, 2);
    assert.equal(retry.questionResults[1].prompt, source.questionResults[1].prompt);
    assert.equal(retry.questionResults[1].referenceSolution, source.questionResults[1].referenceSolution);
    assert.match(masteryAttemptLabel(retry), /^Question retry 2/);
    assert.equal(JSON.stringify(source), frozen);
    source.questionResults.forEach((result, i) => { if (i !== 1) assert.deepEqual(retry.questionResults[i], result); });
    const restored = readMasteryAttempts(JSON.parse(JSON.stringify([source, retry])), test.id, new Set(test.questions.map((q) => q.id)));
    assert.deepEqual(restored[1], retry);
  }
});

test("retry chains, blanks, and unknown question IDs do not mutate or fabricate history", () => {
  const questions = [
    { id: "q1", title: "One", prompt: "Original A", referenceSolution: "A", validate: (s) => s === "A" },
    { id: "q2", title: "Two", prompt: "Original B", referenceSolution: "B", validate: (s) => s === "B" },
  ];
  const source = createMasteryAttempt({ testId: "t", attemptNumber: 1, questions, answers: { q1: "A", q2: "wrong" } });
  const failed = createMasteryFollowUp({ source, attemptNumber: 2, questions, questionIds: ["q2"], answers: {} });
  assert.equal(failed.score, 1);
  assert.equal(failed.questionResults[1].failureCategory, "missing_answer");
  const fixed = createMasteryFollowUp({ source: failed, attemptNumber: 3, questions: questions.map((q) => ({ ...q, prompt: "Changed catalog prompt" })), questionIds: ["q2"], answers: { q2: "B" } });
  assert.equal(fixed.score, 2);
  assert.equal(fixed.sourceAttemptId, failed.id);
  assert.equal(fixed.questionResults[1].prompt, "Original B");
  assert.equal(source.questionResults[1].submittedAnswer, "wrong");
  assert.equal(failed.questionResults[1].submittedAnswer, "");
  for (const questionIds of [[], ["unknown"]]) assert.throws(() => createMasteryFollowUp({ source, questions, questionIds, attemptNumber: 4, answers: {} }));
});

test("pattern failures and unsupported Java are explicitly unverified, not invented diagnoses", () => {
  const question = { id: "q", title: "Example", prompt: "Example", referenceSolution: "example", validate: () => false };
  const grade = currentMasteryGrade(question, "some code");
  assert.equal(grade.failureCategory, "not_determined");
  assert.equal(masteryResultLabel(grade), "Needs review");
  assert.match(grade.feedback, /not proof/);
  assert.equal(masteryResultLabel({ correct: false, failureCategory: "unsupported_code" }), "Needs review");
  assert.equal(masteryResultLabel({ correct: false, failureCategory: "output_mismatch" }), "Incorrect");
});

import test from "node:test";
import assert from "node:assert/strict";
import { decisionRangePractice } from "../app/data/decisionRangePractice.ts";
import { additionalPracticeQuestions, additionalSectionPracticeQuestionIds } from "../app/data/cisc1115Course.ts";

const questions = new Map(decisionRangePractice.map(({ question }) => [question.id, question]));
const accepts = (id, answer) => questions.get(id).validate(answer);

test("validated grade decision accepts equivalent range order and checks actual branches", () => {
  const question = additionalPracticeQuestions["if-else"].find(({ id }) => id === "if-q7");
  const answer = question.answer;
  assert.equal(question.validate(answer), true);
  assert.equal(question.validate(answer.replace("score < 0 || score > 100", "score > 100 || score < 0")), true);
  assert.equal(question.validate(answer.replace('System.out.println("B");', 'System.out.println("C");')), false);
  assert.equal(question.validate(answer.replace("} else if (score >= 80) {", "}\nif (score >= 80) {")), false);
});

test("ticket and maximum graders accept equivalent decisions and reject wrong edge cases", () => {
  const byId = new Map(Object.values(additionalPracticeQuestions).flat().map((question) => [question.id, question]));
  const ticket = byId.get("if-q8");
  assert.equal(ticket.validate(ticket.answer), true);
  assert.equal(ticket.validate(ticket.answer.replace("member || age >= 65", "age >= 65 || member")), true);
  assert.equal(ticket.validate(ticket.answer.replace("age < 5", "age <= 5")), false);
  assert.equal(ticket.validate(ticket.answer.replace("double price;", "int price;")), false);
  const maximum = byId.get("decision-q7");
  assert.equal(maximum.validate(maximum.answer), true);
  assert.equal(maximum.validate(maximum.answer.replace("b > max", "max < b").replace("c > max", "max < c")), true);
  assert.equal(maximum.validate(maximum.answer.replace("int max = a;", "int max = 0;")), false);
  assert.equal(maximum.validate(maximum.answer.replace("int max = a;", "double max = a;")), false);
});

test("Boolean range and access graders accept equivalent expressions", () => {
  const byId = new Map(Object.values(additionalPracticeQuestions).flat().map((question) => [question.id, question]));
  assert.equal(byId.get("bool-q5").validate("boolean valid = 0 <= score && 100 >= score;"), true);
  assert.equal(byId.get("bool-q5").validate("boolean valid = score > 0 && score < 100;"), false);
  assert.equal(byId.get("bool-q7").validate("boolean inside = value > 9 && value < 21;"), true);
  assert.equal(byId.get("bool-q7").validate("boolean inside = value >= 10 || value <= 20;"), false);
  assert.equal(byId.get("bool-q8").validate("boolean allowed = (hasId && age >= 18) || admin;"), true);
  assert.equal(byId.get("bool-q8").validate("boolean allowed = admin || (hasId && age > 18);"), false);
  assert.equal(byId.get("bool-q8").validate("boolean allowed = admin || age >= 18 && hasId;"), false, "the prompt explicitly requires parentheses");
});

test("all decision problems are placed in section checks and accept their shown answers", () => {
  assert.equal(decisionRangePractice.length, 12);
  for (const { chapterId, sectionId, question } of decisionRangePractice) {
    assert.ok(additionalSectionPracticeQuestionIds[chapterId][sectionId].includes(question.id), question.id);
    assert.equal(question.validate(question.answer), true, question.id);
    assert.equal(question.validate('System.out.println("Eligible");'), false, `${question.id} accepted a fixed label`);
  }
  const ifChecks = additionalSectionPracticeQuestionIds["if-else"];
  for (const [sectionId, questionId] of [["if-branch", "if-q2"], ["if-else-pair", "if-q1"], ["if-else-if", "if-q3"], ["if-nested", "if-q5"], ["if-braces", "if-q6"], ["if-common-mistakes", "if-q4"]]) {
    assert.ok(ifChecks[sectionId].includes(questionId), `${questionId} belongs in ${sectionId}`);
    assert.equal(Object.values(ifChecks).flat().filter((id) => id === questionId).length, 1, `${questionId} should appear once`);
  }
  assert.ok(ifChecks["if-else-if"].includes("if-q3"), "the first-match trace belongs with else-if chains");
  assert.ok(!ifChecks["if-nested"].includes("if-q3"), "an else-if trace must not appear as nested practice");
  assert.ok(ifChecks["if-nested"].includes("if-q5"), "the existing nested trace stays with nesting");
  assert.ok(ifChecks["if-nested"].includes("decision-nested-three-outcomes"));
  assert.ok(ifChecks["if-nested"].includes("decision-nested-submission"));
  assert.deepEqual(ifChecks["if-nested"].slice(0, 6), ["if-nested-understanding", "if-q5", "if-write-nested", "decision-nested-three-outcomes", "decision-range-ban-reason", "decision-nested-submission"]);
});

test("equivalent boolean, ternary, nested, and independent branch designs pass", () => {
  assert.equal(accepts("decision-range-outside", "System.out.print(!(temperature >= 2 && temperature <= 8));"), true);
  assert.equal(accepts("decision-range-exception-expression", "System.out.println((vip || (level <= 80 && level >= 20)) && !banned);"), true);
  assert.equal(accepts("decision-range-conditional-label", 'System.out.print((temperature < 15 || temperature > 25) ? "Adjust" : "Comfortable");'), true);
  assert.equal(accepts("decision-range-two-requirements", 'if (age < 18 || !hasTicket) { System.out.print("Wait"); } else { System.out.print("Begin"); }'), true);
  assert.equal(accepts("decision-range-three-outcomes", 'if (level >= 20 && level <= 80) { System.out.println("Eligible"); } else if (level < 20) { System.out.println("Too low"); } else { System.out.println("Too high"); }'), true);
  assert.equal(accepts("decision-range-ban-reason", 'if (level >= 20 && level <= 80) { if (banned) { System.out.println("Banned"); } else { System.out.println("Eligible"); } } else if (level < 20) { System.out.println("Too low"); } else { System.out.println("Too high"); }'), true);
  assert.equal(accepts("decision-nested-three-outcomes", 'if (!member) { System.out.println("Membership required"); } else { if (age < 18) { System.out.println("Too young"); } else { System.out.println("Allowed"); } }'), true);
  assert.equal(accepts("decision-nested-submission", 'if (score < 0 || score > 100) { System.out.print("Invalid"); } else if (score < 70) { System.out.print("Retry"); } else if (!submitted) { System.out.print("Submit work"); } else { System.out.print("Pass"); }'), true);
  assert.equal(accepts("decision-range-valid-hours", 'if (hour >= 0 && hour <= 23) { if (hour < 9 || hour > 17) { System.out.println("Closed"); } else { System.out.println("Open"); } } else { System.out.println("Invalid"); }'), true);
  assert.equal(accepts("decision-range-fragile-parcel", 'if (weight <= 0) { System.out.println("Invalid"); } else { if (fragile) { System.out.println("Special"); } else if (weight > 20) { System.out.println("Large"); } else if (weight > 5) { System.out.println("Medium"); } else { System.out.println("Small"); } }'), true);
  assert.equal(accepts("decision-range-independent-entry", 'if (banned) { System.out.println("Banned"); } else if (vip || (level >= 20 && level <= 80)) { System.out.println("Eligible"); } else if (level > 80) { System.out.println("Too high"); } else { System.out.println("Too low"); }'), true);
  assert.equal(accepts("decision-range-independent-entry", 'String result; if (banned) { result = "Banned"; } else if (vip || (level >= 20 && level <= 80)) { result = "Eligible"; } else if (level < 20) { result = "Too low"; } else { result = "Too high"; } System.out.println(result);'), true);
});

test("boundary, validation, exception, and branch order mistakes fail", () => {
  assert.equal(accepts("decision-range-outside", "System.out.println(temperature < 2 && temperature > 8);"), false);
  assert.equal(accepts("decision-range-conditional-label", 'if (temperature >= 15 && temperature <= 25) { System.out.println("Comfortable"); } else { System.out.println("Adjust"); }'), false);
  assert.equal(accepts("decision-range-three-outcomes", 'if (level <= 20) { System.out.println("Too low"); } else if (level >= 80) { System.out.println("Too high"); } else { System.out.println("Eligible"); }'), false);
  assert.equal(accepts("decision-nested-three-outcomes", 'if (!member) { System.out.println("Membership required"); } else if (age < 18) { System.out.println("Too young"); } else { System.out.println("Allowed"); }'), false, "the focused nesting prompt requires an inner decision");
  assert.equal(accepts("decision-nested-three-outcomes", 'if (member) { if (age >= 18) { System.out.println("Allowed"); } else { System.out.println("Too young"); } }'), false, "the nonmember else result is required");
  assert.equal(accepts("decision-nested-submission", 'if (score < 70) { System.out.println("Retry"); } else if (submitted) { System.out.println("Pass"); } else { System.out.println("Submit work"); }'), false, "invalid scores must be rejected before ordinary classification");
  assert.equal(accepts("decision-range-repair-priority", 'if (vip || (level >= 20 && level <= 80)) { System.out.println("Eligible"); } else if (banned) { System.out.println("Banned"); } else { System.out.println("Ineligible"); }'), false);
  assert.equal(accepts("decision-range-valid-hours", 'if (hour >= 9 && hour <= 17) { System.out.println("Open"); } else { System.out.println("Closed"); }'), false);
  assert.equal(accepts("decision-range-fragile-parcel", 'if (fragile) { System.out.println("Special"); } else if (weight <= 0) { System.out.println("Invalid"); } else if (weight <= 5) { System.out.println("Small"); } else if (weight <= 20) { System.out.println("Medium"); } else { System.out.println("Large"); }'), false);
  assert.equal(accepts("decision-range-independent-entry", 'if (level < 20) { System.out.println("Too low"); } else if (banned) { System.out.println("Banned"); } else if (vip) { System.out.println("Eligible"); } else if (level > 80) { System.out.println("Too high"); } else { System.out.println("Eligible"); }'), false);
  assert.equal(accepts("decision-range-independent-entry", 'banned = false; System.out.println("Eligible");'), false);
  assert.equal(accepts("decision-range-independent-entry", 'while (true) { System.out.println("Eligible"); }'), false);
});

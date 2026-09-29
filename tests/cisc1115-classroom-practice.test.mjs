import assert from "node:assert/strict";
import test from "node:test";
import { cisc1115ProfessorTrack } from "../app/data/cisc1115ProfessorTrack.ts";
import { numberSystemsQuestions, numberSystemsSectionQuestionIds, numberSystemsSections } from "../app/data/cisc1115NumberSystems.ts";
import { classroomPracticeQuestions, classroomSectionQuestionIds } from "../app/data/cisc1115ClassroomPractice.ts";

test("number systems are placed after operators and every problem is reachable", () => {
  const entries = cisc1115ProfessorTrack.flatMap((unit) => unit.entries.map((entry) => entry.id));
  assert.equal(entries.indexOf("number-systems"), entries.indexOf("operators-expressions") + 1);
  assert.ok(entries.indexOf("number-systems") < entries.indexOf("input-basic-programs"));
  const questionIds = numberSystemsQuestions.map((question) => question.id);
  assert.equal(new Set(questionIds).size, questionIds.length);
  assert.deepEqual(
    [...Object.values(numberSystemsSectionQuestionIds).flat(), "numbers-mixed-2"].sort(),
    [...questionIds].sort(),
  );
  for (const sectionId of Object.keys(numberSystemsSectionQuestionIds)) {
    assert.ok(numberSystemsSections.some((section) => section.id === sectionId));
  }
});

test("number conversion checkers accept equivalent notation and reject changed values", () => {
  for (const question of numberSystemsQuestions) assert.ok(question.validate(question.answer), question.id);
  const find = (id) => numberSystemsQuestions.find((question) => question.id === id);
  assert.ok(find("numbers-decimal-binary-1").validate("00010011101"));
  assert.ok(find("numbers-decimal-hex-1").validate("0xdb"));
  assert.ok(find("numbers-add-1").validate("01001000"));
  assert.equal(find("numbers-decimal-hex-1").validate("0bDB"), false);
  assert.equal(find("numbers-add-1").validate("1001001"), false);
  assert.equal(find("numbers-hex-decimal-1").validate("124"), false);
});

test("new classroom problems are mapped to their instructional section", () => {
  for (const [chapterId, questions] of Object.entries(classroomPracticeQuestions)) {
    const mapped = Object.values(classroomSectionQuestionIds[chapterId] ?? {}).flat();
    assert.deepEqual(mapped.sort(), questions.map((question) => question.id).sort());
    for (const question of questions) assert.ok(question.validate(question.answer), question.id);
  }
});

test("full-program grader accepts equivalent average strategies and catches integer division", () => {
  const question = classroomPracticeQuestions["input-basic-programs"][0];
  const equivalent = [
    "import java.util.Scanner;",
    "public class AveragePractice { public static void main(String[] args) {",
    "Scanner sc = new Scanner(System.in);",
    "System.out.print(\"First: \"); int a; int b; a = sc.nextInt();",
    "System.out.print(\"Second: \"); b = sc.nextInt();",
    "System.out.println(\"Average: \" + (double)(a + b) / 2);",
    "} }",
  ].join("\n");
  assert.ok(question.validate(equivalent));
  assert.ok(question.validate(equivalent.replace("String[] args", "String args[]")));
  assert.equal(question.validate(question.answer.replace("/ 2.0", "/ 2")), false);
  assert.equal(question.validate(question.answer.replace("AveragePractice", "WrongName")), false);
  assert.equal(question.validate(question.answer.replace("public class AveragePractice", "public class WrongName /* public class AveragePractice */")), false);
  assert.equal(question.validate(question.answer.replace("input.nextInt()", "input.nextDouble()")), false);
});

test("decision graders check overlapping rules and accept a compound update", () => {
  const questions = classroomPracticeQuestions["decision-programs"];
  const fine = questions.find((question) => question.id === "classroom-decision-fine");
  const event = questions.find((question) => question.id === "classroom-decision-event");
  const pair = questions.find((question) => question.id === "classroom-decision-pair");
  assert.ok(fine.validate(fine.answer.replace("fine = fine + 100;", "fine += 100;")));
  assert.equal(fine.validate(fine.answer.replace("speed >= 55", "speed > 55")), false);
  assert.equal(event.validate(event.answer.replace("rain >= 5", "rain > 5")), false);
  assert.equal(pair.validate(pair.answer.replace("first < 0 || second < 0", "first < 0 && second < 0")), false);
});

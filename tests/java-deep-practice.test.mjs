import test from "node:test";
import assert from "node:assert/strict";
import { javaDeepPractice } from "../app/data/javaDeepPractice.ts";
import { additionalPracticeQuestions, additionalSectionPracticeQuestionIds } from "../app/data/cisc1115Course.ts";

const questions = new Map(javaDeepPractice.map(({ question }) => [question.id, question]));
const accepts = (id, code) => questions.get(id).validate(code);

test("new Java practice is distributed through the taught sections", () => {
  assert.equal(javaDeepPractice.length, 13);
  for (const { chapterId, sectionId, question } of javaDeepPractice) {
    assert.ok(additionalSectionPracticeQuestionIds[chapterId][sectionId].includes(question.id), question.id);
    assert.equal(additionalPracticeQuestions[chapterId].filter((item) => item.id === question.id).length, 1, question.id);
    assert.ok(question.answer && question.validate(question.answer), question.id);
  }
});

test("bounded writing tasks accept authored equivalent forms but reject shortcuts", () => {
  const valid = {
    "deep-method-task-status": 'public static void printTask(String task, boolean completed) { String status = completed ? "Done" : "Pending"; System.out.println(task + ": " + status); }',
    "deep-return-reuse": "public static int finalCredits(int base) { int tripled = triple(base); return addOne(tripled); }",
    "deep-array-find-flag": "boolean found = false; for (int i = 0; i < readings.length; i++) { if (readings[i] == target) { found = true; } } System.out.println(found);",
    "deep-string-adjacent-pairs": "int pairs = 0; for (int i = 0; i < text.length() - 1; i++) { if (text.charAt(i) == text.charAt(i + 1)) { pairs++; } } System.out.println(pairs);",
    "deep-search-list-method": "public static int findName(ArrayList<String> names, String target) { for (int i = 0; i < names.size(); i++) { if (target.equals(names.get(i))) { return i; } } return -1; }",
  };
  for (const [id, answer] of Object.entries(valid)) assert.equal(accepts(id, answer), true, id);
  assert.equal(accepts("deep-array-find-flag", "System.out.println(true);"), false);
  assert.equal(accepts("deep-string-adjacent-pairs", "System.out.println(3);"), false);
  assert.equal(accepts("deep-search-list-method", "public static int findName(ArrayList<String> names, String target) { return 0; }"), false);
});

test("the stalled-loop choices have one correct answer", () => {
  const question = questions.get("deep-while-stalled-branch");
  const stalls = (start) => {
    let count = start;
    for (let step = 0; step < 12; step++) {
      if (count <= 0) return false;
      if (count % 2 === 0) count -= 2;
    }
    return true;
  };
  assert.deepEqual(question.options.filter((value) => stalls(Number(value))), [question.answer]);
});

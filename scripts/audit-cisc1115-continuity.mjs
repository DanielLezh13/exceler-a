import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  additionalLearningChapters,
  additionalPracticeQuestions,
  courseContinuityModel,
  structuredLessonContent,
} from "../app/data/cisc1115Course.ts";

const openingIds = ["variables-data-types", "operators-expressions"];
const courseIds = [...openingIds, ...additionalLearningChapters.map((chapter) => chapter.id)];

assert.equal(courseIds.length, 24, "CISC 1115 must contain exactly 24 chapters");
assert.deepEqual(courseContinuityModel.map((chapter) => chapter.chapterId), courseIds, "continuity contracts must match course order");

for (const chapter of courseContinuityModel) {
  assert.ok(chapter.entry.length, `${chapter.chapterId} needs entry knowledge`);
  assert.ok(chapter.introduces.length, `${chapter.chapterId} needs introduced knowledge`);
  assert.ok(chapter.exit.length, `${chapter.chapterId} needs exit knowledge`);
}

const allQuestionIds = [];
for (const chapter of additionalLearningChapters) {
  const lesson = structuredLessonContent[chapter.id];
  const practice = additionalPracticeQuestions[chapter.id];
  assert.ok(lesson?.length, `${chapter.id} needs lesson content`);
  assert.ok(practice?.length >= 6, `${chapter.id} needs substantial practice`);
  assert.equal(chapter.sections.at(-1)?.id, `${chapter.id}-practice`, `${chapter.id} must end with practice`);
  allQuestionIds.push(...practice.map((question) => question.id));
}
assert.equal(new Set(allQuestionIds).size, allQuestionIds.length, "practice question ids must be unique");

const learnerText = (chapterId) => JSON.stringify({
  lesson: structuredLessonContent[chapterId],
  practice: additionalPracticeQuestions[chapterId] ?? [],
});
const learnerCode = (chapterId) => [
  ...(structuredLessonContent[chapterId] ?? []).flatMap((section) => [
    ...(section.concepts ?? []).map((concept) => concept.code),
    ...(section.examples ?? []).map((example) => example.code),
  ]),
  ...(additionalPracticeQuestions[chapterId] ?? []).map((question) => question.code),
].filter(Boolean).join("\n");
const before = (chapterId) => courseIds.slice(2, courseIds.indexOf(chapterId)).map(learnerText).join("\n");
const allCode = courseIds.slice(2).map(learnerCode).join("\n");

for (const [label, pattern] of [
  ["ternary expressions", /\?\s*["']/],
  ["break statements", /\bbreak\s*;/],
  ["continue statements", /\bcontinue\s*;/],
  ["Character API", /Character\./],
  ["Integer.MIN_VALUE", /Integer\.MIN_VALUE/],
  ["inline array creation", /new int\[\]\s*\{/],
]) {
  assert.doesNotMatch(allCode, pattern, `untaught ${label} found in learner-facing code`);
}

assert.doesNotMatch(before("arrays-loops"), /for\s*\([^;()]*:[^;()]*\)/, "for-each appears before Chapter 13");
assert.doesNotMatch(before("strings"), /\.(?:charAt|substring|indexOf|contains|equalsIgnoreCase|toLowerCase|toUpperCase)\s*\(/, "String API appears before Chapter 14");
assert.doesNotMatch(before("arraylists"), /ArrayList\s*</, "ArrayList appears before Chapter 15");
assert.doesNotMatch(before("sorting"), /\bswap(?:ping|ped|s)?\b/i, "swapping appears before Chapter 17");
assert.doesNotMatch(before("input-output"), /(?:printf|hasNext(?:Int)?|FileNotFoundException|new File)\s*\(?/, "stream/file syntax appears before Chapter 19");

assert.match(learnerText("input-basic-programs"), /nextBoolean/, "Chapter 3 must teach nextBoolean before Chapter 6 uses it");
assert.match(learnerText("input-basic-programs"), /print displays a prompt without ending the line/, "Chapter 3 must distinguish print from println");
assert.match(learnerText("decision-programs"), /called an algorithm/, "algorithm terminology must be introduced before repeated use");
assert.match(learnerText("arrays-loops"), /For-each traversal/, "Chapter 13 must teach for-each before practice uses it");
assert.match(learnerText("arraylists"), /isEmpty/, "Chapter 15 must teach isEmpty before cumulative practice uses it");
assert.match(learnerText("input-output"), /copy throws FileNotFoundException/, "file exception syntax must be labeled as boilerplate");

const commandCenter = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
assert.match(commandCenter, /Writing <code>\(double\) sum<\/code> is a <b>cast<\/b>/, "Chapter 2 must teach casts before later averages use them");
assert.match(commandCenter, /is a <b>comment<\/b>/, "Chapter 2 must explain line comments before later examples use them");

const totals = Object.values(additionalPracticeQuestions).reduce((sum, questions) => sum + questions.length, 14);
assert.equal(totals, 192, "the complete course should retain all 192 practice items");

console.log(`Continuity audit passed: ${courseIds.length} chapters, ${totals} practice items, 24 dependency contracts.`);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { additionalLearningChapters, courseContinuityModel, unitMasteryTests } from "../app/data/cisc1115Course.ts";
import { cisc1115ProfessorAddedChapters, cisc1115ProfessorTrack, professorChapterNumberById, professorMasteryDisplayById } from "../app/data/cisc1115ProfessorTrack.ts";

const canonicalChapterIds = ["variables-data-types", "operators-expressions", ...additionalLearningChapters.map((chapter) => chapter.id)];
const professorChapterIds = cisc1115ProfessorTrack.flatMap((group) => group.entries.filter((entry) => entry.kind === "existing-chapter").map((entry) => entry.id));
const addedChapterText = (id) => JSON.stringify(cisc1115ProfessorAddedChapters.find((chapter) => chapter.id === id));
const addedChapterReviewText = (id) => JSON.stringify(cisc1115ProfessorAddedChapters.find((chapter) => chapter.id === id)?.reviewQuestions);

test("the professor track reorders references without replacing canonical chapters", () => {
  assert.equal(canonicalChapterIds.length, 24);
  assert.deepEqual(courseContinuityModel.map((chapter) => chapter.chapterId), canonicalChapterIds);
  assert.equal(professorChapterIds.length, canonicalChapterIds.length);
  assert.equal(new Set(professorChapterIds).size, canonicalChapterIds.length);
  assert.deepEqual([...professorChapterIds].sort(), [...canonicalChapterIds].sort());
  assert.deepEqual(professorChapterIds.slice(0, 18), [
    "variables-data-types", "operators-expressions", "input-basic-programs",
    "comparisons-booleans", "if-else", "decision-programs",
    "while-loops", "for-loops", "nested-loops",
    "methods", "returns-scope",
    "arrays", "arrays-loops", "strings", "arraylists", "searching", "sorting", "algorithmic-problem-solving",
  ]);
});

test("the professor route is a normal unit and chapter hierarchy", () => {
  assert.deepEqual(cisc1115ProfessorTrack.map((unit) => unit.label), [
    "Unit I · Computer Foundations",
    "Unit II · Variables, Types, Input & Output",
    "Unit III · Selections",
    "Unit IV · Math Functions",
    "Unit V · Characters, Strings & File I/O",
    "Unit VI · Loops",
    "Unit VII · Methods",
    "Unit VIII · Arrays, Strings & Algorithms",
    "Unit IX · Program Development",
    "Unit X · Computing Context",
    "Final · Course Synthesis",
  ]);
  const routeIds = cisc1115ProfessorTrack.flatMap((unit) => unit.entries.map((entry) => entry.id));
  assert.equal(routeIds.length, 27);
  assert.equal(new Set(routeIds).size, routeIds.length);
  assert.deepEqual(routeIds.map((id) => professorChapterNumberById.get(id)), Array.from({ length: 27 }, (_, index) => index + 1));
});

test("added syllabus chapters use ordinary chapter language and unique identities", async () => {
  const addedIds = cisc1115ProfessorAddedChapters.map((chapter) => chapter.id);
  assert.deepEqual(addedIds, ["mcneill-lecture-1", "mcneill-math-functions", "mcneill-text-files"]);
  assert.equal(new Set(addedIds).size, addedIds.length);
  assert.ok(addedIds.every((id) => !canonicalChapterIds.includes(id)));
  assert.ok(cisc1115ProfessorAddedChapters.every((chapter) => chapter.sections.length > 0));
  assert.doesNotMatch(JSON.stringify(cisc1115ProfessorAddedChapters.map(({ title, description }) => ({ title, description }))), /companion|bridge/i);
  const commandCenter = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(commandCenter, /professor-bridge-item|professor-companion-note|Companion lesson/);
});

test("Lecture 1 chapter covers the professor's foundations without requiring array code", () => {
  const content = addedChapterText("mcneill-lecture-1");
  for (const pattern of [
    /hardware/i, /software/i, /CPU/, /control unit/i, /ALU/, /clock speed/i, /cores?/i,
    /RAM/, /memory address/i, /persistent storage/i, /bits?/, /bytes?/, /KB/, /MB/, /GB/, /TB/,
    /operating system/i, /resource allocation/i, /machine language/i, /assembly language/i,
    /high-level language/i, /assembler/i, /compiler/i, /interpreter/i, /source code/i,
    /JVM/, /algorithm/i, /pseudocode/i, /sorting/i,
  ]) assert.match(content, pattern);
  assert.match(content, /does not require array syntax or sorting code/i);
});

test("the timed chapters expose Math and text/file material at the syllabus points", () => {
  const math = addedChapterText("mcneill-math-functions");
  for (const pattern of [/Math\.sqrt/, /Math\.pow/, /Math\.abs/, /Math\.min/, /Math\.max/, /Math\.floor/, /Math\.ceil/, /Math\.round/, /Math\.random/, /Math\.PI/]) assert.match(math, pattern);
  const textFiles = addedChapterText("mcneill-text-files");
  for (const pattern of [/char/, /String/, /length\(\)/, /charAt/, /substring/, /equals/, /compareTo/, /printf/, /Scanner/, /FileNotFoundException/, /PrintWriter/]) assert.match(textFiles, pattern);
});

test("every added syllabus chapter ends with a working cumulative review", async () => {
  const expectedCounts = new Map([
    ["mcneill-lecture-1", 19],
    ["mcneill-math-functions", 7],
    ["mcneill-text-files", 11],
  ]);
  const allQuestionIds = [];
  for (const chapter of cisc1115ProfessorAddedChapters) {
    assert.equal(chapter.reviewQuestions.length, expectedCounts.get(chapter.id), `${chapter.id} review count changed unexpectedly`);
    assert.ok(chapter.reviewQuestions.every((question) => question.answer && question.validate(question.answer)), `${chapter.id} must accept every shown answer`);
    for (const question of chapter.reviewQuestions.filter((item) => item.kind === "Multiple choice")) {
      assert.ok(question.options?.length >= 3, `${chapter.id}/${question.id} needs credible choices`);
      assert.equal(new Set(question.options).size, question.options.length, `${chapter.id}/${question.id} choices must be unique`);
    }
    allQuestionIds.push(...chapter.reviewQuestions.map((question) => question.id));
  }
  assert.equal(new Set(allQuestionIds).size, allQuestionIds.length, "added chapter review ids must be unique");

  const foundations = addedChapterReviewText("mcneill-lecture-1");
  for (const pattern of [/program/i, /algorithm/i, /hardware/i, /software/i, /bits?/i, /bytes?/i, /ALU/, /control unit/i, /clock speed/i, /cores?/i, /RAM/, /memory address/i, /storage/i, /operating system/i, /machine language/i, /high-level language/i, /assembler/i, /compiler/i, /interpreter/i, /bytecode/i, /JVM/, /pseudocode/i, /sorting/i]) assert.match(foundations, pattern);
  for (const pattern of [/n\[2\]/, /n\[a\]/, /indexes 0 and 2/i, /swapping/i]) assert.match(foundations, pattern);
  assert.doesNotMatch(foundations, /int\[\]|for\s*\(|while\s*\(/, "the first review must not require later Java syntax");

  const foundationQuestions = cisc1115ProfessorAddedChapters.find((chapter) => chapter.id === "mcneill-lecture-1").reviewQuestions;
  const answerPositions = foundationQuestions.map((question) => question.options.indexOf(question.answer));
  const positionCounts = [0, 1, 2, 3].map((position) => answerPositions.filter((answerPosition) => answerPosition === position).length);
  assert.ok(positionCounts.every((count) => count >= 4 && count <= 5), `foundation answer positions should be balanced, got ${positionCounts.join(", ")}`);

  const math = addedChapterReviewText("mcneill-math-functions");
  for (const pattern of [/Math\.sqrt/, /Math\.pow/, /Math\.abs/, /Math\.min/, /Math\.max/, /Math\.floor/, /Math\.ceil/, /Math\.round/, /Math\.random/, /Math\.PI/]) assert.match(math, pattern);
  const textFiles = addedChapterReviewText("mcneill-text-files");
  for (const pattern of [/char/, /String/, /\\\\n/, /\\\\t/, /charAt/, /substring/, /equals/, /compareTo/, /printf/, /%d/, /%f/, /Scanner/, /File/, /PrintWriter/, /close\(\)/]) assert.match(textFiles, pattern);

  const commandCenter = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
  assert.match(commandCenter, /ChapterPractice chapterId=\{selectedProfessorChapter\.id\}/, "added chapters must render their saved chapter review");
  assert.match(commandCenter, /selectedProfessorChapter\.reviewQuestions\.map/, "the rendered review must use each added chapter's authored questions");
});

test("mastery identities and persistence keys remain independent of display track", async () => {
  assert.deepEqual(unitMasteryTests.map((test) => test.id), ["unit-1-mastery", "unit-2-mastery", "unit-3-mastery", "unit-4-mastery", "unit-5-mastery", "unit-6-mastery", "unit-7-mastery", "unit-8-mastery"]);
  assert.deepEqual(unitMasteryTests[0].questions.map((question) => question.id), ["unit1-build-profile", "unit1-build-time", "unit1-build-purchase", "unit1-build-full-line", "unit1-build-credits", "unit1-build-complete-program"]);
  const commandCenter = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
  assert.match(commandCenter, /const PRIVATE_STORAGE_KEY = "daymark-education-v4"/);
  assert.match(commandCenter, /const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1"/);
  assert.match(commandCenter, /practice\[chapterId\]/);
  assert.match(commandCenter, /practice\[itemMasteryTest\.id\]/);
  assert.match(commandCenter, /track\?: CourseTrack/);
  assert.match(commandCenter, /professorItemId\?: string/);
  assert.deepEqual(professorMasteryDisplayById.get("unit-1-mastery"), { unit: "Unit II · Variables, Types, Input & Output", title: "Unit II Mastery Test" });
  assert.deepEqual(professorMasteryDisplayById.get("unit-2-mastery"), { unit: "Unit III · Selections", title: "Unit III Mastery Test" });
});

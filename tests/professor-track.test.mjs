import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { additionalLearningChapters, courseContinuityModel, unitMasteryTests } from "../app/data/cisc1115Course.ts";
import { cisc1115ProfessorBridges, cisc1115ProfessorTrack } from "../app/data/cisc1115ProfessorTrack.ts";

const canonicalChapterIds = ["variables-data-types", "operators-expressions", ...additionalLearningChapters.map((chapter) => chapter.id)];
const professorChapterIds = cisc1115ProfessorTrack.flatMap((group) => group.entries.filter((entry) => entry.kind === "chapter").map((entry) => entry.id));
const bridgeText = (id) => JSON.stringify(cisc1115ProfessorBridges.find((bridge) => bridge.id === id));

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

test("companions are ungraded route items with unique identities", () => {
  const bridgeIds = cisc1115ProfessorBridges.map((bridge) => bridge.id);
  assert.deepEqual(bridgeIds, ["mcneill-lecture-1", "mcneill-math-functions", "mcneill-text-files"]);
  assert.equal(new Set(bridgeIds).size, bridgeIds.length);
  assert.ok(bridgeIds.every((id) => !canonicalChapterIds.includes(id)));
  assert.ok(cisc1115ProfessorBridges.every((bridge) => bridge.sections.length > 0));
  assert.doesNotMatch(JSON.stringify(cisc1115ProfessorBridges), /masteryAttempts|passedQuestions|completionRecord/);
});

test("Lecture 1 companion covers the professor's foundations without requiring array code", () => {
  const content = bridgeText("mcneill-lecture-1");
  for (const pattern of [
    /hardware/i, /software/i, /CPU/, /control unit/i, /ALU/, /clock speed/i, /cores?/i,
    /RAM/, /memory address/i, /persistent storage/i, /bits?/, /bytes?/, /KB/, /MB/, /GB/, /TB/,
    /operating system/i, /resource allocation/i, /machine language/i, /assembly language/i,
    /high-level language/i, /assembler/i, /compiler/i, /interpreter/i, /source code/i,
    /JVM/, /algorithm/i, /pseudocode/i, /sorting/i,
  ]) assert.match(content, pattern);
  assert.match(content, /does not require array syntax or sorting code/i);
});

test("the timed bridges expose Math and text/file material at the syllabus points", () => {
  const math = bridgeText("mcneill-math-functions");
  for (const pattern of [/Math\.sqrt/, /Math\.pow/, /Math\.abs/, /Math\.min/, /Math\.max/, /Math\.floor/, /Math\.ceil/, /Math\.round/, /Math\.random/, /Math\.PI/]) assert.match(math, pattern);
  const textFiles = bridgeText("mcneill-text-files");
  for (const pattern of [/char/, /String/, /length\(\)/, /charAt/, /substring/, /equals/, /compareTo/, /printf/, /Scanner/, /FileNotFoundException/, /PrintWriter/]) assert.match(textFiles, pattern);
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
});


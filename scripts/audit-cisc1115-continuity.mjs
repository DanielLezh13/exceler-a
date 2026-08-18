import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import {
  additionalLearningChapters,
  additionalPracticeQuestions,
  additionalSectionPracticeQuestionIds,
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
  assert.equal(chapter.sections.at(-1)?.title, "Chapter Review", `${chapter.id} must end with a cumulative chapter review`);
  if (!["cumulative-challenges", "final-assessment"].includes(chapter.id)) {
    for (const section of lesson.filter((item) => !item.id.endsWith("takeaways"))) {
      const sectionQuestions = additionalSectionPracticeQuestionIds[chapter.id]?.[section.id] ?? [];
      const expectedMinimum = (section.concepts?.length ?? 0) > 1 ? section.concepts.length : 1;
      assert.ok(sectionQuestions.length >= expectedMinimum, `${chapter.id}/${section.id} must check every introduced concept`);
      assert.ok(sectionQuestions.every((id) => practice.some((question) => question.id === id)), `${chapter.id}/${section.id} references missing practice`);
    }
  }
  for (const question of practice.filter((item) => item.kind === "Multiple choice")) {
    assert.ok(question.options?.length >= 3, `${chapter.id}/${question.id} needs credible answer choices`);
    assert.equal(new Set(question.options).size, question.options.length, `${chapter.id}/${question.id} answer choices must be unique`);
  }
  allQuestionIds.push(...practice.map((question) => question.id));
}
assert.equal(new Set(allQuestionIds).size, allQuestionIds.length, "practice question ids must be unique");

const commandCenter = await readFile(new URL("../app/CommandCenter.tsx", import.meta.url), "utf8");
const commandCenterAst = ts.createSourceFile("CommandCenter.tsx", commandCenter, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const collectLearnerStrings = (root) => {
  const values = [];
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) values.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return values.join("\n");
};

const propertyName = (property) => property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : null;
let practiceQuestionsNode = null;
let lessonFunctionNode = null;
const findOpeningNodes = (node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "practiceQuestions" && ts.isObjectLiteralExpression(node.initializer)) practiceQuestionsNode = node.initializer;
  if (ts.isFunctionDeclaration(node) && node.name?.text === "ChapterLessonContent") lessonFunctionNode = node;
  ts.forEachChild(node, findOpeningNodes);
};
findOpeningNodes(commandCenterAst);
assert.ok(practiceQuestionsNode && lessonFunctionNode?.body, "opening chapters must remain auditable");

const openingLearnerText = Object.fromEntries(openingIds.map((chapterId) => {
  const practiceProperty = practiceQuestionsNode.properties.find((property) => propertyName(property) === chapterId);
  const lessonBranch = lessonFunctionNode.body.statements.find((statement) => {
    if (!ts.isIfStatement(statement) || !ts.isBinaryExpression(statement.expression)) return false;
    const { left, right } = statement.expression;
    return (ts.isStringLiteral(left) && left.text === chapterId) || (ts.isStringLiteral(right) && right.text === chapterId);
  });
  assert.ok(practiceProperty && lessonBranch, `${chapterId} learner content must be discoverable`);
  return [chapterId, `${collectLearnerStrings(practiceProperty)}\n${collectLearnerStrings(lessonBranch)}`];
}));

const learnerText = (chapterId) => openingLearnerText[chapterId] ?? JSON.stringify({
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
const learnerSyntax = (chapterId) => openingLearnerText[chapterId] ?? [
  learnerCode(chapterId),
  ...(additionalPracticeQuestions[chapterId] ?? []).flatMap((question) => question.auditRequirements ?? []),
].filter(Boolean).join("\n");
const before = (chapterId) => courseIds.slice(0, courseIds.indexOf(chapterId)).map(learnerText).join("\n");
const allCode = courseIds.map(learnerSyntax).join("\n");

const compactAuditText = (value) => value.replace(/\s+/g, "").replaceAll("String[]args", "");
const firstUseRules = [
  { chapterId: "returns-scope", label: "final constant syntax", pattern: /\bfinal\s+(?:int|double|boolean|char|String|long)\b/ },
  { chapterId: "comparisons-booleans", label: "comparison or logical operator syntax", pattern: /==|!=|>=|<=|&&|\|\||(?<![+\-*/%=])[<>](?!=)/ },
  { chapterId: "comparisons-booleans", label: "conditional operator syntax", pattern: /\?\s*[^?\n:]+\s*:\s*[^?\n;]+/ },
  { chapterId: "if-else", label: "if statement syntax", pattern: /\bif\(/, compact: true },
  { chapterId: "while-loops", label: "while loop syntax", pattern: /\bwhile\(/, compact: true },
  { chapterId: "while-loops", label: "do-while syntax", pattern: /\bdo\{/ , compact: true },
  { chapterId: "for-loops", label: "for loop syntax", pattern: /\bfor\(/, compact: true },
  { chapterId: "methods", label: "custom method definition syntax", pattern: /publicstatic(?:void|int|double|boolean|String)(?!main\b)\w+\(/, compact: true },
  { chapterId: "methods", label: "standard-library utility syntax", pattern: /(?:Math\.(?:sqrt|random)|Integer\.parseInt|Double\.parseDouble|System\.currentTimeMillis)\(/ },
  { chapterId: "returns-scope", label: "return statement syntax", pattern: /\breturn\b/ },
  { chapterId: "arrays", label: "array type syntax", pattern: /(?:int|double|boolean|char|String)\[\]/, compact: true },
  { chapterId: "arrays-loops", label: "for-each syntax", pattern: /for\([^;()]+:[^;()]+\)/, compact: true },
  { chapterId: "strings", label: "String API syntax", pattern: /\.(?:charAt|substring|indexOf|lastIndexOf|contains|concat|compareTo|trim|equalsIgnoreCase|toLowerCase|toUpperCase)\(/, compact: true },
  { chapterId: "arraylists", label: "ArrayList syntax", pattern: /ArrayList</, compact: true },
  { chapterId: "searching", label: "binary search terminology", pattern: /\bbinary\s+search\b/i },
  { chapterId: "input-output", label: "file and formatted-stream syntax", pattern: /(?:printf\(|hasNext(?:Int)?\(|FileNotFoundException|newFile\()/, compact: true },
];

for (const rule of firstUseRules) {
  for (const earlierId of courseIds.slice(0, courseIds.indexOf(rule.chapterId))) {
    const earlierSyntax = learnerSyntax(earlierId);
    const value = rule.compact ? compactAuditText(earlierSyntax) : earlierSyntax;
    assert.ok(!rule.pattern.test(value), `${rule.label} appears in ${earlierId} before ${rule.chapterId}`);
  }
}

for (const [chapterId, label, pattern] of [
  ["decision-programs", "algorithm terminology", /\balgorithm\b/i],
  ["while-loops", "iteration terminology", /\biteration\b/i],
  ["methods", "parameter or argument terminology", /\b(?:parameter|argument)s?\b/i],
  ["arrays", "array-index terminology", /\bindex(?:es)?\b/i],
  ["arrays-loops", "traversal terminology", /\btravers(?:al|e|ing)\b/i],
]) {
  for (const earlierId of courseIds.slice(0, courseIds.indexOf(chapterId))) {
    assert.ok(!pattern.test(learnerText(earlierId)), `${label} appears in ${earlierId} before ${chapterId}`);
  }
}

for (const [label, pattern] of [
  ["break statements", /\bbreak\s*;/],
  ["continue statements", /\bcontinue\s*;/],
  ["Character API", /Character\./],
  ["Integer.MIN_VALUE", /Integer\.MIN_VALUE/],
  ["inline array creation", /new int\[\]\s*\{/],
]) {
  assert.doesNotMatch(allCode, pattern, `untaught ${label} found in learner-facing code`);
}

assert.doesNotMatch(before("arrays-loops"), /\bswap(?:ping|ped|s)?\b/i, "swapping appears before the array-transformation lesson");

assert.match(learnerText("input-basic-programs"), /nextBoolean/, "Chapter 3 must teach nextBoolean before Chapter 6 uses it");
assert.match(learnerText("returns-scope"), /final int MAX_ATTEMPTS/, "Chapter 11 must teach final constants alongside local scope");
assert.match(openingLearnerText["operators-expressions"], /POSTFIX: USE, THEN CHANGE/, "Chapter 2 must teach postfix expression timing");
assert.match(learnerText("comparisons-booleans"), /conditional operator/i, "Chapter 4 must teach the conditional operator");
assert.match(learnerText("while-loops"), /do-while/i, "Chapter 7 must teach do-while loops");
assert.match(learnerText("methods"), /Java API Documentation/, "Chapter 10 must teach API documentation");
assert.match(learnerText("returns-scope"), /Overloading and Method Signatures/, "Chapter 11 must teach method overloading and signatures after return types");
assert.match(learnerText("arrays-loops"), /Reversing and Array-to-Array Operations/, "Chapter 13 must teach array transformations");
assert.match(learnerText("strings"), /lastIndexOf/, "Chapter 14 must teach the required String search variants");
assert.match(learnerText("searching"), /Binary Search/, "Chapter 16 must teach binary search");
assert.match(learnerText("input-basic-programs"), /print displays a prompt without ending the line/, "Chapter 3 must distinguish print from println");
assert.match(learnerText("decision-programs"), /called an algorithm/, "algorithm terminology must be introduced before repeated use");
assert.match(learnerText("arrays-loops"), /For-each traversal/, "Chapter 13 must teach for-each before practice uses it");
assert.match(learnerText("arraylists"), /isEmpty/, "Chapter 15 must teach isEmpty before cumulative practice uses it");
assert.match(learnerText("input-output"), /copy throws FileNotFoundException/, "file exception syntax must be labeled as boilerplate");

assert.match(commandCenter, /Writing <code>\(double\) sum<\/code> is a <b>cast<\/b>/, "Chapter 2 must teach casts before later averages use them");
assert.match(commandCenter, /is a <b>comment<\/b>/, "Chapter 2 must explain line comments before later examples use them");

const foundationalQuestionCount = 40;
const totals = Object.values(additionalPracticeQuestions).reduce((sum, questions) => sum + questions.length, foundationalQuestionCount);
assert.ok(totals >= 477, "the complete course should retain dense section checks and cumulative practice");

console.log(`Continuity audit passed: ${courseIds.length} chapters, ${totals} practice items, every instructional section checked, 24 dependency contracts.`);

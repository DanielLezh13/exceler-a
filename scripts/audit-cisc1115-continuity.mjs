import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import {
  additionalLearningChapters,
  additionalPracticeQuestions,
  additionalSectionPracticeQuestionIds,
  courseContinuityModel,
  structuredLessonContent,
  unitMasteryTests,
} from "../app/data/cisc1115Course.ts";
import { javaValidationCode, validateArcadePrizePurchase } from "../app/practiceValidation.ts";
import { loadCourseModel } from "./lib/course-model.mjs";

const submittedArcadeSolution = `int tickets = 137;
int orangePrice = 12;
int applePrice = 7;
int orangeTotal = 4;
tickets -= (orangeTotal * orangePrice);
int appleTotal = tickets / applePrice;
tickets %= applePrice;
System.out.println ("Apples: " + appleTotal);
System.out.println ("Tickets left: "+ tickets);`;

assert.ok(validateArcadePrizePurchase(submittedArcadeSolution), "the arcade validator must accept an equivalent in-place solution");
assert.match(javaValidationCode("total = total + price;"), /total\+=price;/, "expanded updates must satisfy compound-update requirements");
assert.match(javaValidationCode("tickets %= applePrice;"), /int\$equivalent\d+=tickets%applePrice;/, "in-place updates must satisfy equivalent intermediate-expression requirements");
assert.ok(!validateArcadePrizePurchase("System.out.println(\"Apples: 12\");\nSystem.out.println(\"Tickets left: 5\");"), "printed constants alone must not pass the arcade build");

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
const renderedCourseModel = await loadCourseModel();

const openingLearnerSyntax = {};
const openingLearnerText = Object.fromEntries(openingIds.map((chapterId) => {
  const practiceProperty = practiceQuestionsNode.properties.find((property) => propertyName(property) === chapterId);
  const lessonBranch = lessonFunctionNode.body.statements.find((statement) => {
    if (!ts.isIfStatement(statement) || !ts.isBinaryExpression(statement.expression)) return false;
    const { left, right } = statement.expression;
    return (ts.isStringLiteral(left) && left.text === chapterId) || (ts.isStringLiteral(right) && right.text === chapterId);
  });
  assert.ok(practiceProperty && lessonBranch, `${chapterId} learner content must be discoverable`);
  const questions = renderedCourseModel.practiceQuestions[chapterId];
  const questionText = questions.flatMap((question) => Object.values(question).flat().filter((value) => typeof value === "string")).join("\n");
  // Question prose may use ordinary words such as "return the change" without
  // introducing a Java return statement. Check actual code/answers separately.
  openingLearnerSyntax[chapterId] = [collectLearnerStrings(lessonBranch), ...questions.flatMap((question) => [question.code, question.answer])].filter(Boolean).join("\n");
  return [chapterId, `${questionText}\n${collectLearnerStrings(lessonBranch)}`];
}));

const masteryQuestionsAfter = (chapterId) => unitMasteryTests.filter((test) => test.afterChapterId === chapterId).flatMap((test) => test.questions);
const learnerText = (chapterId) => openingLearnerText[chapterId] ?? JSON.stringify({
  lesson: structuredLessonContent[chapterId],
  practice: [...(additionalPracticeQuestions[chapterId] ?? []), ...masteryQuestionsAfter(chapterId)],
});
const learnerCode = (chapterId) => [
  ...(structuredLessonContent[chapterId] ?? []).flatMap((section) => [
    ...(section.concepts ?? []).map((concept) => concept.code),
    ...(section.examples ?? []).map((example) => example.code),
  ]),
  ...(additionalPracticeQuestions[chapterId] ?? []).flatMap((question) => [question.code, ...(question.multiline ? [question.answer] : [])]),
  ...masteryQuestionsAfter(chapterId).map((question) => question.code),
].filter(Boolean).join("\n");
const learnerSyntax = (chapterId) => openingLearnerSyntax[chapterId] ?? [
  learnerCode(chapterId),
  ...[...(additionalPracticeQuestions[chapterId] ?? []), ...masteryQuestionsAfter(chapterId)].flatMap((question) => question.auditRequirements ?? []),
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

const foundationalQuestionCount = openingIds.reduce((sum, chapterId) => {
  const practiceProperty = practiceQuestionsNode.properties.find((property) => propertyName(property) === chapterId);
  assert.ok(practiceProperty && ts.isPropertyAssignment(practiceProperty) && ts.isArrayLiteralExpression(practiceProperty.initializer), `${chapterId} practice must remain a directly auditable question list`);
  return sum + renderedCourseModel.practiceQuestions[chapterId].length;
}, 0);
const totals = Object.values(additionalPracticeQuestions).reduce((sum, questions) => sum + questions.length, foundationalQuestionCount);
assert.ok(totals >= 477, "the complete course should retain dense section checks and cumulative practice");

const programmingChapterIds = courseIds.slice(0, courseIds.indexOf("cs-context-applications") + 1);
const recipePromptSmell = /choose .*values yourself|store a mission count|use scanner input to read|add the earned|keep the remainder after|calculate their subtotal/i;
for (const chapterId of programmingChapterIds.filter((id) => !openingIds.includes(id))) {
  const productionQuestions = (additionalPracticeQuestions[chapterId] ?? []).filter((question) => question.kind === "Write from requirements" || question.kind === "Independent build");
  const builds = (additionalPracticeQuestions[chapterId] ?? []).filter((question) => question.productionStage === 4 && question.kind === "Independent build");
  assert.ok(builds.length >= 1, `${chapterId} needs a behavior-first independent chapter build`);
  assert.ok(productionQuestions.length >= 3, `${chapterId} needs repeated requirements-to-code practice, not only one final build`);
  const sectionQuestionIds = additionalSectionPracticeQuestionIds[chapterId] ?? {};
  const productionSections = Object.values(sectionQuestionIds).filter((ids) => ids.some((id) => productionQuestions.some((question) => question.id === id)));
  assert.ok(productionSections.length >= 3, `${chapterId} must distribute code production across at least three subsection checks`);
  for (const question of productionQuestions) {
    assert.ok(question.answer, `${chapterId}/${question.id} needs a canonical shown answer`);
    assert.ok(question.validate(question.answer), `${chapterId}/${question.id} validator must accept its canonical answer`);
    assert.ok(Object.values(sectionQuestionIds).flat().includes(question.id), `${chapterId}/${question.id} must be fitted into a subsection check, not appended only to chapter review`);
    if (question.productionStage >= 4) assert.doesNotMatch(question.prompt, recipePromptSmell, `${chapterId}/${question.id} must describe a problem instead of a disguised Java recipe`);
  }
}
for (const questionId of ["variables-write-declarations", "variables-write-label", "variables-independent-build", "operators-write-time-conversion", "operators-write-balance-updates", "operators-independent-build"]) {
  assert.match(commandCenter, new RegExp(questionId), `${questionId} must remain in the foundational chapter progression`);
}
assert.match(commandCenter, /"variables-declaration": \[[^\]]*"variables-write-declarations"/, "Chapter 1 must introduce requirements-to-code work before its independent build");
assert.match(commandCenter, /"variables-concatenation": \[[^\]]*"variables-write-label"/, "Chapter 1 must repeat code production in a later subsection");
assert.ok(renderedCourseModel.chapterPracticePlan("operators-expressions").checkpoints["operators-modulus"].includes("operators-write-time-conversion"), "the time-conversion build must follow the remainder lesson");
assert.ok(!renderedCourseModel.chapterPracticePlan("operators-expressions").checkpoints["operators-division"].includes("operators-write-time-conversion"), "remainder must not be required before it is taught");
assert.match(commandCenter, /"operators-assignment": \[[^\]]*"operators-write-balance-updates"/, "Chapter 2 must include production in state-update practice");
assert.match(commandCenter, /"variables-program": \[[^\]]*"variables-independent-build"/, "Chapter 1 independent build must finish its program subsection check");
assert.match(commandCenter, /"operators-evaluation": \[[^\]]*"operators-independent-build"/, "Chapter 2 independent build must finish its evaluation subsection check");
assert.match(commandCenter, /You have 137 arcade tickets/, "Chapter 2 independent work must require learner decomposition from fixed facts");
assert.doesNotMatch(commandCenter, /Store a mission count and a reward per mission/, "Chapter 2 independent work must not retain the decomposed recipe prompt");
assert.doesNotMatch(commandCenter, /review: \[[^\]]*independent-build/, "independent builds must not be appended only to foundational chapter reviews");

const expectedUnitEnds = ["input-basic-programs", "decision-programs", "nested-loops", "returns-scope", "arraylists", "algorithmic-problem-solving", "debugging-testing", "cs-context-applications"];
assert.equal(unitMasteryTests.length, expectedUnitEnds.length, "every numbered unit must have one distinct mastery test");
assert.deepEqual(unitMasteryTests.map((test) => test.afterChapterId), expectedUnitEnds, "each mastery test must follow the final chapter of its unit");
for (const test of unitMasteryTests) {
  assert.ok(test.questions.length >= 4, `${test.id} needs several blank-editor programs`);
  assert.ok(test.questions.every((question) => question.productionStage === 5 && question.multiline && !question.code), `${test.id} must use blank-editor retrieval without starter code`);
  assert.ok(test.questions.every((question) => question.answer && question.validate(question.answer)), `every ${test.id} validator must accept its canonical answer`);
  assert.ok(test.questions.every((question) => !recipePromptSmell.test(question.prompt)), `${test.id} must use scenario-first mastery prompts rather than operation recipes`);
}
assert.ok(unitMasteryTests[0].questions.length >= 6, "Unit I mastery must retain its full six-program test");
const allMasteryQuestions = unitMasteryTests.flatMap((test) => test.questions);
const everyQuestionId = [...allQuestionIds, ...allMasteryQuestions.map((question) => question.id)];
assert.equal(new Set(everyQuestionId).size, everyQuestionId.length, "unit mastery and chapter practice question ids must remain globally unique");

const missingReferencePattern = /\b(?:this|the following)\s+(?:declaration|line|code|program|snippet|expression|loop|method(?: call)?|output)\b|\b(?:shown here|shown (?:above|below)|example (?:above|below)|as shown|in the example)\b/i;
for (const question of [...Object.values(additionalPracticeQuestions).flat(), ...allMasteryQuestions]) {
  assert.ok(question.code || !missingReferencePattern.test(question.prompt), `${question.id} refers to an example that is not displayed inside the question`);
}

console.log(`Continuity audit passed: ${courseIds.length} chapters, ${totals} chapter practice items, ${unitMasteryTests.length} unit mastery tests with ${allMasteryQuestions.length} strict builds, and every instructional section checked.`);

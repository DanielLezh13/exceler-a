import assert from "node:assert/strict";
import test from "node:test";
import { sectionRetrievalPractice } from "../app/data/sectionRetrievalPractice.ts";
import { javaRetrievalShape, retrievalValidator } from "../app/retrievalPracticeValidation.ts";
import { loadCourseModel } from "../scripts/lib/course-model.mjs";

const byId = new Map(sectionRetrievalPractice.map((entry) => [entry.question.id.replace("retrieve-", ""), entry.question]));
const model = await loadCourseModel();

test("all 34 retrieval additions appear once in the intended section and use the Java editor", () => {
  assert.equal(sectionRetrievalPractice.length, 34);
  assert.equal(new Set(sectionRetrievalPractice.map((entry) => entry.chapterId)).size, 17);
  for (const { chapterId, sectionId, question, rationale } of sectionRetrievalPractice) {
    const chapter = model.learningChapters.find((item) => item.id === chapterId);
    assert.ok(chapter.sections.some((section) => section.id === sectionId), question.id);
    const plan = model.chapterPracticePlan(chapterId);
    const displayed = model.practiceQuestions[chapterId].filter((item) => plan.checkpoints[sectionId].includes(item.id));
    assert.equal(displayed.filter((item) => item.id === question.id).length, 1, question.id);
    assert.equal([...Object.values(plan.checkpoints).flat(), ...plan.review].filter((id) => id === question.id).length, 1, question.id);
    assert.equal(model.requiredChapterPracticeQuestions(chapterId).filter((item) => item.id === question.id).length, 1, question.id);
    assert.ok(model.questionUsesJavaEditor(question), question.id);
    assert.ok(question.multiline && rationale.length > 20, question.id);
    assert.equal(question.options, undefined, question.id);
    assert.ok(question.productionStage <= 3, "guided retrieval must not be counted as an independent build");
  }
});

test("every authored answer and alternative passes, including comments and harmless grouping", () => {
  for (const { question, alternatives } of sectionRetrievalPractice) {
    for (const answer of [question.answer, ...alternatives]) {
      assert.equal(question.validate(answer), true, `${question.id}: ${answer}`);
      assert.equal(question.validate(`/* My approach */\n${answer}\n// Finished`), true, question.id);
    }
    assert.equal(question.validate(""), false, question.id);
    assert.equal(question.validate(`// ${question.answer.replaceAll("\n", "\n// ")}`), false, question.id);
    assert.equal(question.validate('System.out.println("the example answer");'), false, question.id);
  }
});

test("plausible independent variations are accepted without copying reference spelling", () => {
  const equivalents = {
    "arithmetic-total": ["int total = (price * quantity);"],
    "arithmetic-change": ["int change = (paid - cost);"],
    "safe-range": ["boolean safe = 2 <= temperature && 8 >= temperature;", "boolean safe = temperature > 1 && temperature < 9;"],
    "weekend-rule": ["boolean weekend = (7 == day) || (6 == day);"],
    "single-if": ['if (5 > fuel) System.out.print("Low fuel");', 'if (fuel <= 4) System.out.println("Low fuel");'],
    "branch-categories": ['if (distance <= 4) System.out.print("Local"); else if (distance <= 19) System.out.print("Nearby"); else System.out.print("Far");'],
    "first-while": ["while (seconds >= 1) { System.out.println(seconds); --seconds; }", "while (seconds > 0) { System.out.println(seconds); seconds = seconds - 1; }"],
    "first-for": ["for (int i = 1; i < 4; i += 1) System.out.println(i);", "for (int i = 1; 4 > i; ++i) { System.out.println(i); }", "for (int exercise=1; exercise<=3; exercise++) System.out.println(exercise);"],
    "translate-loop": ["int counter = 2; while (counter < 7) { System.out.println(counter); counter = counter + 2; }"],
    "first-nested": ['for(int r=1; r<3; ++r) { for(int c=1; c<4; c+=1) System.out.print("X"); System.out.println(); }'],
    "void-definition": ['public static void showClosed() { System.out.print("Closed"); }'],
    "return-definition": ["public static int withFee(int price) { return (5 + price); }"],
    "array-update": ["readings[1] = readings[1] + 2;"],
    "array-traversal": ["for (int sample : readings) System.out.println(sample);", "int position=0; while(position<readings.length) { System.out.println(readings[position]); position+=1; }"],
    "array-minimum": ["int min=readings[0]; for(int sample:readings) { if(min>sample) min=sample; } System.out.print(min);", "int min=readings[0]; int pos=1; while(pos<readings.length) { if(readings[pos]<=min) min=readings[pos]; ++pos; } System.out.println(min);"],
    "string-order": ["boolean comesFirst = 0 > first.compareTo(second);"],
    "string-equality": ['boolean confirmed = "YeS".equalsIgnoreCase(answer);'],
    "list-traversal": ["for (String book : queue) System.out.println(book);"],
    "search-result": ['if (0 <= index) System.out.print(values[index]); else System.out.print("Missing");'],
    "bubble-pass": ["for(int pair=0; pair<values.length-1; ++pair) { if(values[pair+1]<values[pair]) { int temp=values[pair]; values[pair]=values[pair+1]; values[pair+1]=temp; } }"],
  };
  for (const [id, answers] of Object.entries(equivalents)) {
    for (const answer of answers) assert.equal(byId.get(id).validate(answer), true, `${id}: ${answer}`);
  }
});

test("each task rejects a plausible mistake rather than accepting whatever matches the example", () => {
  const mistakes = {
    "arithmetic-total": ["int total = quantity + price;", "int total = 28;", "double total = quantity * price;"],
    "arithmetic-change": ["int change = cost - paid;", "int change = 7;"],
    "leftover-stickers": ["int loose = stickers / 8;", "int loose = 5;"],
    "combined-score": ['System.out.println("Total: " + first + second);', 'System.out.println("Total: 17");'],
    "weekend-rule": ["boolean weekend = day == 6 && day == 7;", "boolean weekend = true;"],
    "reverse-state": ["boolean open = closed;", "boolean open = true;"],
    "safe-range": ["boolean safe = temperature > 2 && temperature < 8;", "boolean safe = temperature >= 2 || temperature <= 8;"],
    "single-if": ['if (fuel <= 5) System.out.println("Low fuel");', 'System.out.println("Low fuel");'],
    "branch-categories": [byId.get("branch-categories").answer.replace("distance < 5", "distance <= 5")],
    "invalid-before-category": [byId.get("invalid-before-category").answer.replace("weight <= 0", "weight < 0")],
    "first-while": [byId.get("first-while").answer.replace("seconds--", "seconds++"), byId.get("first-while").answer.replace("seconds > 0", "seconds >= 0")],
    "first-for": [byId.get("first-for").answer.replace("receipt <= 3", "receipt < 3"), "System.out.println(1); System.out.println(2); System.out.println(3);"],
    "translate-loop": [byId.get("translate-loop").answer.replace("number += 2", "number++")],
    "first-nested": [byId.get("first-nested").answer.replace('System.out.print("X")', 'System.out.println("X")')],
    "void-definition": ['public static void showOpen() { System.out.println("Closed"); }'],
    "ordered-arguments": ['reportDelivery(4, "Maya");', 'reportDelivery("Maya", 3);'],
    "parse-library": ["int score = Integer.parseInt(145);", "int score = 145;", "int score = Double.parseDouble(savedScore);"],
    "use-api-entry": ["double side = Math.sqrt(81);", "double side = area / 2;", "int side = Math.sqrt(area);"],
    "return-definition": ["public static int withFee(int value) { System.out.println(value + 5); }", "public static int withFee(int value) { return value - 5; }"],
    "overload-call": ["int result = area(3);", "int result = 3 * 7;", "int result = area(7, 3);"],
    "array-read": ["int third = readings[3];", "int third = 18;"],
    "array-update": ["readings[2] += 2;", "readings[1] = 23;", "readings[1] -= 2;"],
    "array-traversal": ["for (int i=0; i<=readings.length; i++) System.out.println(readings[i]);", "for (int i=0; i<4; i++) System.out.println(readings[i]);"],
    "array-minimum": [byId.get("array-minimum").answer.replace("readings[0]", "0"), byId.get("array-minimum").answer.replace("reading < lowest", "reading > lowest")],
    "string-extract": ["String zone = route.substring(0, 2);", 'String zone = "NYC";'],
    "string-search": ['int position = record.indexOf("/");', "int position = 12;"],
    "string-order": ["boolean comesFirst = first.compareTo(second) == -1;", "boolean comesFirst = first.compareTo(second) <= 0;"],
    "string-equality": ['boolean confirmed = answer == "yes";', 'boolean confirmed = answer.equals("yes");', 'boolean confirmed = answer.trim().equalsIgnoreCase("yes");'],
    "list-append": ['queue.add("Math"); queue.add("Java");', 'queue.add("Java");'],
    "list-traversal": ["for (int i=0; i<=queue.size(); i++) System.out.println(queue.get(i));", "for (String title:queue) System.out.println(queue);"],
    "search-result": ['System.out.println(values[index]);', 'if (index == 0) System.out.println("Missing"); else System.out.println(values[index]);'],
    "bubble-pass": [byId.get("bubble-pass").answer.replace("values.length - 1", "values.length"), byId.get("bubble-pass").answer.replace("values[i] > values[i + 1]", "values[i] < values[i + 1]")],
    "file-reader": ['File report = new File("report.txt"); Scanner reader = new Scanner("report.txt");', 'File report = new File("report.txt"); Scanner reader = new Scanner(System.in);'],
    "repair-index": ["System.out.println(values[values.length]);", "System.out.println(values[1]);"],
  };
  assert.deepEqual(Object.keys(mistakes).sort(), [...byId.keys()].sort(), "every addition needs a misconception check");
  for (const [id, answers] of Object.entries(mistakes)) {
    for (const answer of answers) assert.equal(byId.get(id).validate(answer), false, `${id}: ${answer}`);
  }
});

test("normalization does not erase meaningful output, updates, names, types, or syntax errors", () => {
  for (const id of ["first-while", "first-for", "translate-loop", "array-traversal", "list-traversal"]) {
    const question = byId.get(id);
    assert.equal(question.validate(question.answer.replaceAll("println", "print")), false, id);
  }
  assert.notEqual(javaRetrievalShape("System.out.println(value++);"), javaRetrievalShape("System.out.println(++value);"));
  assert.equal(retrievalValidator(["value++;"])("++value;"), true);
  assert.equal(retrievalValidator(["int value = 1;"])("int renamed = 1;"), true);
  assert.equal(byId.get("arithmetic-total").validate("int amount = quantity * price;"), false);
  assert.equal(byId.get("combined-score").validate('System.out.println("Total:" + (first + second));'), false);
  for (const answer of ["int total = quantity * price", "int total = unknown * price;", "int total = quantity * price; total++;", "int total = quantity * price; }} class Other { void x(){"]) {
    assert.equal(byId.get("arithmetic-total").validate(answer), false, answer);
  }
  assert.equal(javaRetrievalShape("x".repeat(12_001)), null);
});

test("existing input writing becomes reachable and remainder practice follows its prerequisite", () => {
  const input = model.chapterPracticePlan("input-basic-programs");
  assert.ok(input.checkpoints["input-reading-numbers"].includes("input-write-number-task"));
  assert.ok(input.checkpoints["input-reading-text"].includes("input-write-text-task"));
  const operators = model.chapterPracticePlan("operators-expressions");
  assert.ok(!operators.checkpoints["operators-division"].includes("operators-write-time-conversion"));
  assert.ok(operators.checkpoints["operators-modulus"].includes("operators-write-time-conversion"));
  // New introductory practice must not require the next chapter's constructs.
  for (const { chapterId, sectionId, question } of sectionRetrievalPractice) {
    const source = question.answer;
    if (chapterId === "operators-expressions") assert.doesNotMatch(source, /\b(?:if|else|while|for|Scanner)\b|&&|\|\|/);
    if (chapterId === "comparisons-booleans") assert.doesNotMatch(source, /\b(?:if|else|while|for)\b/);
    if (sectionId === "if-branch") assert.doesNotMatch(source, /\belse\b/);
    if (chapterId === "while-loops") assert.doesNotMatch(source, /\bfor\b/);
    if (chapterId === "methods") assert.doesNotMatch(source, /\breturn\b/);
    if (chapterId === "arrays") assert.doesNotMatch(source, /\bArrayList\b|\.substring\(/);
  }
});

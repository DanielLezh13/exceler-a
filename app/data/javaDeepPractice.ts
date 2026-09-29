import { retrievalValidator, type RetrievalSyntaxOptions } from "../retrievalPracticeValidation.ts";
import type { CoursePracticeQuestion } from "./cisc1115Course.ts";

type Placement = { chapterId: string; sectionId: string; question: CoursePracticeQuestion };
const normalized = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");

function trace(chapterId: string, sectionId: string, id: string, title: string, prompt: string, code: string, answer: string, hint: string, success: string, level: CoursePracticeQuestion["level"] = "Apply"): Placement {
  return { chapterId, sectionId, question: {
    id, level, kind: "Trace a program", title, prompt, code, answer, hint, success,
    placeholder: answer.includes("\n") ? "Write the exact output, one line at a time" : "Type the exact answer",
    multiline: answer.includes("\n"),
    validate: (submitted) => normalized(submitted) === answer,
  } };
}

function choice(chapterId: string, sectionId: string, id: string, title: string, prompt: string, code: string, options: string[], answer: string, hint: string, success: string): Placement {
  return { chapterId, sectionId, question: {
    id, level: "Apply", kind: "Multiple choice", title, prompt, code, options, answer, hint, success,
    placeholder: "Choose one answer", validate: (submitted) => submitted.trim() === answer,
  } };
}

function write(chapterId: string, sectionId: string, id: string, title: string, prompt: string, code: string | undefined, answer: string, alternatives: string[], hint: string, success: string, syntax: RetrievalSyntaxOptions = {}): Placement {
  return { chapterId, sectionId, question: {
    id, level: "Challenge", kind: "Write from requirements", title, prompt, code, answer, hint, success,
    placeholder: "Write the requested Java code", multiline: true, productionStage: 3,
    validate: retrievalValidator([answer, ...alternatives], syntax),
  } };
}

// These additions target subsection checks that previously relied mainly on
// recognition. Their harder variations reuse earlier concepts without moving
// an untaught construct forward or replacing the chapter's independent build.
export const javaDeepPractice: Placement[] = [
  choice("while-loops", "while-infinite", "deep-while-stalled-branch", "Find a Stalled Loop",
    "Which value in place of 0 on the first line makes this loop continue forever?",
    "int count = 0;\nwhile (count > 0) {\n    if (count % 2 == 0) {\n        count -= 2;\n    }\n}",
    ["0", "2", "3", "4"], "3",
    "Trace what changes after an even value becomes odd. Ask whether an odd positive count can ever change.",
    "An odd positive count satisfies the loop condition but never reaches an update."),

  trace("nested-loops", "nested-tables", "deep-nested-skipped-row", "Trace a Changing Inner Start",
    "Write the exact output.",
    "for (int row = 1; row <= 3; row++) {\n    for (int column = 2; column <= row; column++) {\n        System.out.println(row + \":\" + column);\n    }\n}",
    "2:2\n3:2\n3:3", "For each new row, test the inner loop's first condition before printing.",
    "You tracked a changing inner range, including a row with zero work.", "Challenge"),

  write("methods", "methods-decomposition", "deep-method-task-status", "Make a Reusable Task Status",
    "A report shows many tasks. Create public static void printTask(String task, boolean completed). One call must print TASK: Done when completed is true, or TASK: Pending otherwise, on its own line. Use the supplied task value in the output so the method works for different names.",
    undefined,
    "public static void printTask(String task, boolean completed) {\n    if (completed) {\n        System.out.println(task + \": Done\");\n    } else {\n        System.out.println(task + \": Pending\");\n    }\n}",
    [
      "public static void printTask(String task, boolean completed) { String status = completed ? \"Done\" : \"Pending\"; System.out.println(task + \": \" + status); }",
      "public static void printTask(String task, boolean completed) { System.out.println(task + \": \" + (completed ? \"Done\" : \"Pending\")); }",
      "public static void printTask(String task, boolean completed) { if (!completed) { System.out.println(task + \": Pending\"); } else { System.out.println(task + \": Done\"); } }",
    ],
    "Use one parameter for the changing task name and the other to choose its status.",
    "The method can display different task names and outcomes through its parameters.",
    { members: true, fixedNames: ["printTask"] }),

  trace("returns-scope", "returns-composition", "deep-return-order", "Compare Two Call Orders",
    "Write both output lines in order. The same two methods are composed differently.",
    "public static int doubleValue(int n) { return n * 2; }\npublic static int addOne(int n) { return n + 1; }\n\nSystem.out.println(doubleValue(addOne(3)));\nSystem.out.println(addOne(doubleValue(3)));",
    "8\n7", "Finish the inner call first in each expression.",
    "Changing the call order changes which returned value the outer method receives.", "Challenge"),

  write("returns-scope", "returns-composition", "deep-return-reuse", "Compose Existing Calculations",
    "The shown methods are already defined. Create public static int finalCredits(int base) that first triples base and then adds one to that result. Reuse both existing methods, return the value, and do not print it.",
    "public static int triple(int n) { return n * 3; }\npublic static int addOne(int n) { return n + 1; }",
    "public static int finalCredits(int base) {\n    return addOne(triple(base));\n}",
    [
      "public static int finalCredits(int base) { int tripled = triple(base); return addOne(tripled); }",
      "public static int finalCredits(int base) { int result = addOne(triple(base)); return result; }",
    ],
    "The inner call produces the argument for the outer call.",
    "You composed two reusable results and returned the final value.",
    { members: true, fixedNames: ["finalCredits", "triple", "addOne"] }),

  trace("arrays-loops", "array-sum-average", "deep-array-filtered-average", "Average Only Qualifying Readings",
    "Write the exact output. Zero and negative readings do not count toward the average.",
    "int[] readings = {-3, 0, 2, 5};\nint sum = 0;\nint count = 0;\nfor (int reading : readings) {\n    if (reading > 0) {\n        sum += reading;\n        count++;\n    }\n}\nSystem.out.println((double) sum / count);",
    "3.5", "Track the sum and count only when the condition succeeds.",
    "The average uses the two positive readings, not the array's full length."),

  write("arrays-loops", "array-find", "deep-array-find-flag", "Find a Reading With a Flag",
    "An int[] readings may be empty or contain repeated values. An int target is already available. Use a boolean flag and one for loop to print true when target appears and false otherwise. Do not modify readings or target.",
    "int[] readings = {4, 9, 4};\nint target = 9;",
    "boolean found = false;\nfor (int reading : readings) {\n    if (reading == target) {\n        found = true;\n    }\n}\nSystem.out.println(found);",
    ["boolean found = false; for (int i = 0; i < readings.length; i++) { if (readings[i] == target) { found = true; } } System.out.println(found);"],
    "Start false, inspect each value, and let a match change the remembered result.",
    "The flag represents whether any element matched, including an empty array.",
    { fixedNames: ["readings", "target"], singleOutput: true }),

  write("strings", "strings-loops", "deep-string-adjacent-pairs", "Count Repeated Neighbors",
    "A String text may be empty. Count each pair of equal neighboring characters and print the count. Overlapping pairs count separately: aaa has two pairs. Compare characters with charAt using one indexed for loop; do not change text.",
    "String text = \"bookkeeper\";",
    "int pairs = 0;\nfor (int i = 1; i < text.length(); i++) {\n    if (text.charAt(i) == text.charAt(i - 1)) {\n        pairs++;\n    }\n}\nSystem.out.println(pairs);",
    ["int pairs = 0; for (int i = 0; i < text.length() - 1; i++) { if (text.charAt(i) == text.charAt(i + 1)) { pairs++; } } System.out.println(pairs);"],
    "Choose loop bounds so every compared index is valid, even for an empty String.",
    "You counted neighboring matches without reading past either end.",
    { fixedNames: ["text"], singleOutput: true, integerBounds: true }),

  trace("arraylists", "arraylist-removal-loop", "deep-list-forward-skip", "See the Skipped Value",
    "Write the final list as Java displays it. This forward removal loop contains a logic mistake.",
    "ArrayList<Integer> values = new ArrayList<>();\nvalues.add(-1);\nvalues.add(-2);\nvalues.add(4);\nfor (int i = 0; i < values.size(); i++) {\n    if (values.get(i) < 0) {\n        values.remove(i);\n    }\n}\nSystem.out.println(values);",
    "[-2, 4]", "After removing index 0, ask which element shifts there before i increases.",
    "The second negative value shifts behind the advancing index and is skipped.", "Challenge"),

  trace("searching", "search-trace", "deep-search-comparison-count", "Count Checks Before an Early Return",
    "What exact line prints? Count comparisons made inside findFirst, not the number of elements in the array.",
    "public static int findFirst(int[] values, int target) {\n    int checks = 0;\n    for (int i = 0; i < values.length; i++) {\n        checks++;\n        if (values[i] == target) {\n            System.out.println(\"Checks: \" + checks);\n            return i;\n        }\n    }\n    return -1;\n}\n\nint[] data = {8, 3, 8, 5};\nfindFirst(data, 8);",
    "Checks: 1", "The first element already matches; return ends the method before the later 8 is visited.",
    "An early return prevents every later comparison, even when a duplicate exists."),

  write("searching", "search-arraylist", "deep-search-list-method", "Find a Name in a List",
    "Create public static int findName(ArrayList<String> names, String target). The list, target, and stored names are nonnull. Return the first matching index or -1 when absent. Use an indexed for loop, size(), get(), and String content equality; the list may be empty or contain duplicates.",
    undefined,
    "public static int findName(ArrayList<String> names, String target) {\n    for (int i = 0; i < names.size(); i++) {\n        if (names.get(i).equals(target)) {\n            return i;\n        }\n    }\n    return -1;\n}",
    ["public static int findName(ArrayList<String> names, String target) { for (int i = 0; i < names.size(); i++) { if (target.equals(names.get(i))) { return i; } } return -1; }"],
    "A failed comparison at one index cannot prove absence; place failure after the loop.",
    "The method checks String contents and returns the first matching position.",
    { members: true, fixedNames: ["findName"] }),

  trace("sorting", "sorting-bubble", "deep-bubble-one-pass", "Stop After One Bubble Pass",
    "Write the array after exactly one left-to-right pass. Do not finish sorting it mentally.",
    "int[] values = {4, 3, 2, 1};\nfor (int i = 0; i < values.length - 1; i++) {\n    if (values[i] > values[i + 1]) {\n        int saved = values[i];\n        values[i] = values[i + 1];\n        values[i + 1] = saved;\n    }\n}",
    "{3, 2, 1, 4}", "Follow adjacent swaps from left to right. The original 4 moves one place on every comparison.",
    "The largest value reaches the end, while the remaining prefix is still unsorted.", "Challenge"),

  trace("input-output", "io-record-processing", "deep-record-fields", "Keep Fields With Their Record",
    "The Scanner receives the four space-separated tokens Maya 68 Leo 72. Write the exact output. Each name must remain paired with the score read immediately after it.",
    "Scanner input = new Scanner(System.in);\nwhile (input.hasNext()) {\n    String name = input.next();\n    int score = input.nextInt();\n    if (score >= 70) {\n        System.out.println(name + \" Pass\");\n    } else {\n        System.out.println(name + \" Retry\");\n    }\n}",
    "Maya Retry\nLeo Pass", "Finish one name and score before beginning the next record.",
    "Each decision uses the score belonging to its own name."),
];

export const javaDeepQuestionsFor = (chapterId: string, sectionId?: string) => javaDeepPractice
  .filter((entry) => entry.chapterId === chapterId && (sectionId === undefined || entry.sectionId === sectionId))
  .map((entry) => entry.question);

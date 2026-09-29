import type { CoursePracticeQuestion } from "./cisc1115Course";
import { validateDecisionProgram } from "../decisionPracticeValidation.ts";
import { validateFullInputProgram } from "../fullProgramValidation.ts";

const normalize = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");

const fullProgram = (
  id: string, title: string, prompt: string, answer: string, hint: string, success: string,
  className: string, kinds: Array<"int" | "double">, cases: Array<{ input: number[]; expected: string }>,
): CoursePracticeQuestion => ({
  id, level: "Challenge", kind: "Complete Java program", title, prompt, answer, hint, success,
  placeholder: "Write the complete Java source file", multiline: true, productionStage: 5,
  auditRequirements: ["Complete class and main", "Scanner input", "Several input cases and boundaries"],
  validate: (value) => validateFullInputProgram(value, className, kinds, cases),
});

export const classroomPracticeQuestions: Record<string, CoursePracticeQuestion[]> = {
  "operators-expressions": [
    {
      id: "classroom-operators-trace", level: "Challenge", kind: "Trace final state", title: "Track an Old Value and a New Value",
      prompt: "What is the exact output?", code: "int count = -3;\ndouble record = 8.5;\nrecord = count++;\ncount += 5;\nSystem.out.println(count + \" \" + record);",
      answer: "3 -3.0", hint: "Postfix supplies the old count to record before count changes. Then += uses the new count.",
      success: "Correct. record keeps -3.0 while count moves from -3 to -2 to 3.", placeholder: "Type the exact output", validate: (value) => normalize(value) === "3 -3.0",
    },
    {
      id: "classroom-operators-cast-error", level: "Apply", kind: "Compile or trace", title: "Find the Type Boundary",
      prompt: "Does this compile? Answer exactly: compiles or type error.", code: "int points = 4;\nint result = (double) points + 7;",
      answer: "type error", hint: "The cast makes the right-hand expression a double, but result is declared int.",
      success: "Correct. Java cannot assign that double expression to an int without an explicit conversion.", placeholder: "compiles or type error", validate: (value) => normalize(value).toLowerCase() === "type error",
    },
  ],
  "input-basic-programs": [
    fullProgram(
      "classroom-input-average", "Build a Complete Average Program",
      "Write the complete contents of AveragePractice.java. Read two whole numbers from the keyboard and print their mathematical average as Average: VALUE, including .0 when the result is whole. The user enters valid integers. You may print prompts before reading; the grader checks the result line for several inputs.",
      [
        "import java.util.Scanner;", "public class AveragePractice {", "    public static void main(String[] args) {",
        "        Scanner input = new Scanner(System.in);", "        int first = input.nextInt();",
        "        int second = input.nextInt();", "        double average = (first + second) / 2.0;",
        "        System.out.println(\"Average: \" + average);", "    }", "}",
      ].join("\n"),
      "Use the usual import, class, main, and Scanner setup. Make the division decimal before storing the average.",
      "Your complete program handles both whole and half-unit averages, including negative inputs.",
      "AveragePractice", ["int", "int"], [
        { input: [5, 3], expected: "Average: 4.0" },
        { input: [5, 4], expected: "Average: 4.5" },
        { input: [-3, 2], expected: "Average: -0.5" },
        { input: [0, 0], expected: "Average: 0.0" },
      ],
    ),
  ],
  "comparisons-booleans": [
    {
      id: "classroom-bool-trace-a", level: "Apply", kind: "Predict exact output", title: "Combine Arithmetic and Conditions",
      prompt: "What three lines print?", code: "int a = 38;\nint b = 12;\nint c = 37;\nSystem.out.println(a < c);\nSystem.out.println(a < c || b < c);\nSystem.out.println(b * 3 == a - 2);",
      answer: "false\ntrue\ntrue", hint: "Finish the arithmetic comparisons before combining booleans.",
      success: "Correct. The first test is false, the OR is rescued by b < c, and 36 equals 36.", placeholder: "Type the three lines", multiline: true, validate: (value) => normalize(value) === "false\ntrue\ntrue",
    },
    {
      id: "classroom-bool-trace-b", level: "Challenge", kind: "Predict exact output", title: "Notice Equality Inside a Longer Rule",
      prompt: "What two lines print?", code: "int a = 14;\nint b = 9;\nint c = 9;\nSystem.out.println((b < c || b > c) && a % 2 == 0);\nSystem.out.println(!((a % 2 == 0 && b != c) && c != 1));",
      answer: "false\ntrue", hint: "Both b < c and b > c are false when b equals c. Work outward from that fact.",
      success: "Correct. Equality makes the first OR false and the inner AND false, so NOT makes the second line true.", placeholder: "Type the two lines", multiline: true, validate: (value) => normalize(value) === "false\ntrue",
    },
  ],
  "decision-programs": [
    fullProgram(
      "classroom-decision-pair", "Build a Two-Number Decision Program",
      "Write the complete contents of ComparePair.java. Read two whole numbers. Print Larger: VALUE, using the number only once when they are equal. If the smaller input is negative, print Negative on the next line. The user enters valid integers. You may print prompts before reading; the grader checks the result lines for several cases.",
      [
        "import java.util.Scanner;", "public class ComparePair {", "    public static void main(String[] args) {",
        "        Scanner input = new Scanner(System.in);", "        int first = input.nextInt();", "        int second = input.nextInt();",
        "        int larger = first;", "        if (second > larger) { larger = second; }",
        "        System.out.println(\"Larger: \" + larger);",
        "        if (first < 0 || second < 0) { System.out.println(\"Negative\"); }", "    }", "}",
      ].join("\n"),
      "Work out how to identify the larger value and whether either input makes the smaller value negative. They are related but separate output rules.",
      "Your full program handles order, equality, and a negative smaller input.",
      "ComparePair", ["int", "int"], [
        { input: [-9, 14], expected: "Larger: 14\nNegative" },
        { input: [23, 4], expected: "Larger: 23" },
        { input: [-2, -8], expected: "Larger: -2\nNegative" },
        { input: [7, 7], expected: "Larger: 7" },
        { input: [-3, -3], expected: "Larger: -3\nNegative" },
      ],
    ),
    {
      id: "classroom-decision-fine", level: "Challenge", kind: "Decision program", title: "Calculate a Speeding Fine",
      prompt: "Given int limit and int speed, print Invalid input if limit is below 5 or speed is negative. Otherwise print No fine when speed is at or below limit. For speeding, print Fine: VALUE: 1–9 over costs 50, 10–19 over costs 100, and 20 or more over costs 200. Add 100 when a speeding driver also travels at least 55. Decide the order and structure yourself.",
      answer: [
        "if (limit < 5 || speed < 0) { System.out.println(\"Invalid input\"); }",
        "else if (speed <= limit) { System.out.println(\"No fine\"); }",
        "else {", "    int over = speed - limit;", "    int fine;",
        "    if (over < 10) fine = 50;", "    else if (over < 20) fine = 100;", "    else fine = 200;",
        "    if (speed >= 55) fine = fine + 100;", "    System.out.println(\"Fine: \" + fine);", "}",
      ].join("\n"),
      hint: "Invalid input and no-fine cases should finish before the speeding bands. The extra amount applies only after a base fine exists.",
      success: "Correct. The result survives invalid inputs, both band boundaries, and the 55 MPH surcharge.",
      placeholder: "Write the Java decision code", multiline: true, productionStage: 5,
      validate: (value) => validateDecisionProgram(value, { limit: "int", speed: "int" }, [
        { values: { limit: 4, speed: 70 }, expected: "Invalid input" },
        { values: { limit: 30, speed: -1 }, expected: "Invalid input" },
        { values: { limit: 50, speed: 50 }, expected: "No fine" },
        { values: { limit: 50, speed: 51 }, expected: "Fine: 50" },
        { values: { limit: 50, speed: 54 }, expected: "Fine: 50" },
        { values: { limit: 50, speed: 55 }, expected: "Fine: 150" },
        { values: { limit: 45, speed: 55 }, expected: "Fine: 200" },
        { values: { limit: 35, speed: 55 }, expected: "Fine: 300" },
        { values: { limit: 15, speed: 40 }, expected: "Fine: 200" },
      ]),
    },
    fullProgram(
      "classroom-decision-event", "Build an Outdoor Event Advisor",
      "Write the complete contents of EventAdvisor.java. Read an integer temperature, decimal rainfall, and integer alert (0 none, 1 watch, 2 warning). Print exactly one decision: Cancel when an alert is 1 or 2 and rain is at least 5; otherwise Shelter when alert is 2 or rain is at least 2.5; otherwise Move indoors when temperature is below 35 or above 98 or alert is 1; otherwise Continue. The user enters valid values. You may print prompts before reading; the grader checks the decision line across several cases.",
      [
        "import java.util.Scanner;", "public class EventAdvisor {", "    public static void main(String[] args) {",
        "        Scanner input = new Scanner(System.in);", "        int temperature = input.nextInt();",
        "        double rain = input.nextDouble();", "        int alert = input.nextInt();",
        "        if ((alert == 1 || alert == 2) && rain >= 5) { System.out.println(\"Cancel\"); }",
        "        else if (alert == 2 || rain >= 2.5) { System.out.println(\"Shelter\"); }",
        "        else if (temperature < 35 || temperature > 98 || alert == 1) { System.out.println(\"Move indoors\"); }",
        "        else { System.out.println(\"Continue\"); }", "    }", "}",
      ].join("\n"),
      "List cases where multiple rules match. The first matching rule has priority, and equality at 5 and 2.5 matters.",
      "Your complete decision program handles overlapping rules and the boundary values.",
      "EventAdvisor", ["int", "double", "int"], [
        { input: [70, 5, 1], expected: "Cancel" },
        { input: [20, 5, 2], expected: "Cancel" },
        { input: [70, 5, 0], expected: "Shelter" },
        { input: [70, 2.5, 0], expected: "Shelter" },
        { input: [70, 0, 2], expected: "Shelter" },
        { input: [35, 0, 0], expected: "Continue" },
        { input: [98, 0, 0], expected: "Continue" },
        { input: [34, 0, 0], expected: "Move indoors" },
        { input: [99, 0, 0], expected: "Move indoors" },
        { input: [70, 0, 1], expected: "Move indoors" },
      ],
    ),
  ],
};

export const classroomSectionQuestionIds: Record<string, Record<string, string[]>> = {
  "operators-expressions": { "operators-evaluation": ["classroom-operators-trace", "classroom-operators-cast-error"] },
  "input-basic-programs": { "input-complete-program": ["classroom-input-average"] },
  "comparisons-booleans": { "booleans-truth": ["classroom-bool-trace-a", "classroom-bool-trace-b"] },
  "decision-programs": { "decision-min-max": ["classroom-decision-pair"], "decision-ranges": ["classroom-decision-fine"], "decision-combined": ["classroom-decision-event"] },
};

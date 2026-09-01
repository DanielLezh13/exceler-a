"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  Eye,
  EyeOff,
  FileInput,
  GitBranch,
  GraduationCap,
  GripHorizontal,
  House,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { createContext, Fragment, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { degreeCourses, degreeAuditCourses, type DegreeCourse } from "./data/curriculum";
import DegreeElectives from "./DegreeElectives";
import DegreePrerequisites from "./DegreePrerequisites";
import StructuredLesson from "./StructuredLesson";
import CopyCodeButton from "./CopyCodeButton";
import JavaCode from "./JavaCode";
import JavaEditor from "./JavaEditor";
import { createMasteryAttempt, createMasteryFollowUp, currentMasteryGrade, masteryAttemptLabel, masteryResultLabel, readMasteryAttempts, recoverLegacyMasteryAttempt, type MasteryAttempt } from "./masteryAssessment";
import {
  additionalLearningChapters,
  additionalPracticeQuestions,
  additionalSectionPracticeQuestionIds,
  structuredLessonContent,
  unitMasteryTests,
} from "./data/cisc1115Course";
import { javaValidationCode, validateArcadePrizePurchase } from "./practiceValidation";
import { retrievalQuestionsFor, sectionRetrievalPractice } from "./data/sectionRetrievalPractice";
import MathCourseView from "./math/MathCourseView";
import { mathCourses, courseChapters } from "./math/courses";
import { emptyMathProgress, mathCourseProgress, readMathRecords } from "./math/progress";
import type { MathProgress, MathRecords, MathTutorContext } from "./math/types";

type View = "home" | "dashboard" | "courses" | "degree" | "course" | "math";
type CoursePosition = {
  chapterId: string;
  sectionId: string;
  scrollTop: number;
  questions: Record<string, string>;
};
type DegreeStatus = "unknown" | "complete" | "in_progress" | "not_started";
type DegreeRecords = Record<string, DegreeStatus>;
type StudentIdentity = { displayName: string; email: string };

type LearningSection = {
  id: string;
  title: string;
};

type LearningChapter = {
  id: string;
  unit: string;
  title: string;
  description: string;
  status: "authored";
  sections: LearningSection[];
};

type PracticeRecord = {
  answers: Record<string, string>;
  attempts: Record<string, number>;
  hints: string[];
  passed: string[];
  submissions?: number;
  lastScore?: number;
  masteryAttempts?: MasteryAttempt[];
  masteryRetakeActive?: boolean;
  masteryRetry?: { sourceAttemptId: string; questionIds: string[] };
};

type PracticeRecords = Record<string, PracticeRecord>;

type TutorPracticeContext = {
  chapterId: string;
  questionId: string;
  questionNumber: number;
  questionTotal: number;
  level: PracticeQuestion["level"];
  kind: string;
  title: string;
  prompt: string;
  starterCode: string | null;
  options: { label: string; text: string; selected: boolean }[];
  selectedOptionLabel: string | null;
  studentAnswer: string;
  answerTruncated: boolean;
  attempts: number;
  status: "not_checked" | "incorrect" | "passed";
  answerShown: boolean;
  shownAnswer: string | null;
};

type TutorCourseContext = {
  courseCode: string;
  courseTitle: string;
  courseProgress: number;
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterProgress: number;
  sectionId: string;
  sectionTitle: string;
  lessonReference: unknown;
  practicePassed: number;
  practiceTotal: number;
  activePractice: TutorPracticeContext | null;
  masteryAssessment: TutorMasteryContext | null;
};

type TutorMasteryContext = {
  assessmentId: string;
  assessmentTitle: string;
  mode: "active_test" | "question_retry" | "results_review";
  retryQuestionIds?: string[];
  questionTotal: number;
  firstAttemptScore: number | null;
  currentMastery: number;
  answerRevealPolicy: "withhold_reference_solutions" | "submitted_attempt_review";
  questions: Array<{
    questionId: string;
    questionNumber: number;
    title: string;
    prompt: string;
    starterCode: string | null;
    learnerAnswer: string;
    answerTruncated: boolean;
    result: "correct" | "incorrect" | "not_submitted";
    graderFeedback: string | null;
    currentGraderFeedback?: string | null;
    referenceSolution: string | null;
  }>;
  reviewedAttempt: { id: string; attemptNumber: number; submittedAt: string | null; recoveredFromLegacy: boolean; score: number; total: number; kind?: MasteryAttempt["kind"]; sourceAttemptId?: string } | null;
};

type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type TutorResponseLength = "short" | "medium" | "long";

type PracticeQuestion = {
  id: string;
  level: "Warm-up" | "Apply" | "Challenge";
  kind: string;
  title: string;
  prompt: string;
  code?: string;
  placeholder: string;
  hint: string;
  answer?: string;
  success: string;
  options?: string[];
  auditRequirements?: string[];
  multiline?: boolean;
  productionStage?: 1 | 2 | 3 | 4 | 5;
  validate: (answer: string) => boolean;
};

function questionUsesJavaEditor(question: PracticeQuestion) {
  const instructions = `${question.kind} ${question.title} ${question.prompt} ${question.placeholder}`.toLowerCase();
  const asksForCode = /\b(write|rewrite|repair|fix|build|create|declare|declaration|statement|code|program|editor|implement|complete the code|missing code)\b/.test(instructions);
  if (asksForCode || (question.productionStage ?? 0) >= 3) return true;
  const asksForResult = /\b(exact output|type the output|what is printed|what does .* print|predict|trace|calculate the remainder|choose one answer)\b/.test(instructions);
  if (asksForResult) return false;
  return /\b(?:int|double|boolean|char|String|Scanner|System\.out|input\.next|public class|static void)\b|[;{}]/.test(question.answer ?? "");
}

const learningChapters: LearningChapter[] = [
  {
    id: "variables-data-types",
    unit: "Unit I · Java Fundamentals",
    title: "Variables & Data Types",
    description: "Store information with names and choose types that match what the value means.",
    status: "authored",
    sections: [
      { id: "variables-overview", title: "What Is a Variable?" },
      { id: "variables-declaration", title: "Declaration Anatomy" },
      { id: "variables-types", title: "Java Data Types" },
      { id: "variables-naming", title: "Variable Naming" },
      { id: "variables-changing", title: "Changing a Variable" },
      { id: "variables-printing", title: "Printing Output" },
      { id: "variables-concatenation", title: "Concatenation" },
      { id: "variables-program", title: "Full Program" },
      { id: "variables-takeaways", title: "Key Takeaways" },
      { id: "variables-practice", title: "Chapter Review" },
    ],
  },
  {
    id: "operators-expressions",
    unit: "Unit I · Java Fundamentals",
    title: "Operators & Expressions",
    description: "Calculate with values, control evaluation order, update state, and understand when + means text instead of arithmetic.",
    status: "authored",
    sections: [
      { id: "operators-arithmetic", title: "Arithmetic Operators" },
      { id: "operators-division", title: "Integer vs Decimal Division" },
      { id: "operators-modulus", title: "Modulus" },
      { id: "operators-precedence", title: "Precedence & Parentheses" },
      { id: "operators-increment", title: "Increment & Decrement" },
      { id: "operators-assignment", title: "Compound Assignment" },
      { id: "operators-concatenation", title: "String + Number Behavior" },
      { id: "operators-evaluation", title: "Evaluating Expressions" },
      { id: "operators-takeaways", title: "Key Takeaways" },
      { id: "operators-practice", title: "Chapter Review" },
    ],
  },
  ...additionalLearningChapters,
];

const authoredChapters = learningChapters;

const foundationalTutorReferences: Record<string, Record<string, string>> = {
  "variables-data-types": {
    "variables-overview": "A variable is a named location in memory that stores a value. In int age = 25;, int is the type, age is the reusable name, = assigns, 25 is the current value, and ; ends the statement.",
    "variables-declaration": "Declaration pattern: type variableName = value;. Explain every token and distinguish the variable name from the value stored under it.",
    "variables-types": "The chapter teaches int for whole numbers, double for decimals, boolean for true or false without quotes, char for exactly one character in single quotes, and String for text in double quotes. Even \"123\" is text.",
    "variables-naming": "Use descriptive camelCase names such as playerHealth, firstName, and carSpeed. Names cannot contain spaces, start with a number, or use Java keywords; names are case-sensitive.",
    "variables-changing": "Declare once with the type, then reassign with only the name: int lives = 3; lives = 2;. The variable remains the same while its stored value changes.",
    "variables-printing": "System.out.println prints one line. println(age) prints the stored value; println(\"age\") literally prints the word age.",
    "variables-concatenation": "Use + to join text and variables. Spaces must be included inside String literals, as in System.out.println(\"Hello \" + name);.",
    "variables-program": "The complete example declares String name, int age, double height, and boolean likesJava, then prints each. public class Main and public static void main(String[] args) are labeled boilerplate for now.",
    "variables-takeaways": "Every variable has a type; = assigns; statements end with ;. String uses double quotes, char uses single quotes, reassignment changes a stored value, and + concatenates when a String is involved.",
    "variables-practice": "Practice combines output prediction, missing types, quote repair, exact concatenated output, multi-variable declarations, reassignment, and a cumulative profile challenge.",
  },
  "operators-expressions": {
    "operators-arithmetic": "Operators act on operands; expressions produce values. The chapter introduces +, -, *, /, and %. An expression calculates; assignment stores the result. // begins a comment Java ignores.",
    "operators-division": "When both operands are integers, Java performs integer division and discards the fractional part. A double operand preserves decimal division. A (double) cast can convert one operand for the calculation.",
    "operators-modulus": "% returns the remainder after division. Use it for leftovers, even/odd checks, cycles, and splitting totals into groups plus a remainder.",
    "operators-precedence": "Parentheses first, then * / % left to right, then + - left to right. Parentheses should be used when they make intent clearer.",
    "operators-increment": "Teach this in layers. First, x = x + 1, x += 1, and x++ are equivalent standalone updates. Then explain that x++ inside an assignment has two jobs: copy the old x into the receiving variable, then increment x. Prefix ++x increments first and copies the new value. The same timing rule applies to --. For every trace, record the receiving value and the variable's final stored value separately.",
    "operators-assignment": "Compound assignment updates and stores in one statement: +=, -=, *=, /=, and %=. The operator comes before =.",
    "operators-concatenation": "Before Java reaches a String, + adds numbers. After String construction begins, later + operations append text unless parentheses force arithmetic first.",
    "operators-evaluation": "For long expressions: calculate parentheses, then * / %, then + -, working left to right among ties; then store or print while watching for String concatenation.",
    "operators-takeaways": "The chapter combines arithmetic, integer versus decimal division, casting, modulus, precedence, prefix/postfix increment and decrement, compound assignment, and String-plus-number evaluation order.",
    "operators-practice": "Practice covers precedence, integer division, modulus, mixed updates, parentheses repair, concatenation traps, longer state tracing, and a multi-concept program challenge.",
  },
};

const PRIVATE_STORAGE_KEY = "daymark-education-v4";
const PUBLIC_STORAGE_KEY = "exceler-public-learning-v1";

const normalizeLines = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");
const compactCode = (value: string) => value.replace(/\s+/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const titleCase = (value: string) => {
  const minorWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "or", "over", "per", "the", "to", "via", "vs"]);
  const preserved = new Map([
    ["arraylist", "ArrayList"], ["arraylists", "ArrayLists"], ["b.s", "B.S."], ["b.s.", "B.S."], ["c++", "C++"], ["cisc", "CISC"], ["cs", "CS"], ["degreeworks", "DegreeWorks"],
    ["gpa", "GPA"], ["i", "I"], ["ii", "II"], ["iii", "III"], ["iv", "IV"], ["v", "V"], ["vi", "VI"], ["vii", "VII"], ["viii", "VIII"],
    ["java", "Java"], ["pdf", "PDF"], ["string", "String"],
  ]);
  const words = value.split(/\s+/);
  return words.map((word, index) => {
    const match = word.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9+?.]*)$/);
    if (!match) return word;
    const [, prefix, core, suffix] = match;
    const punctuation = core.match(/^(.*?)([?.!,;:]*)$/);
    const body = punctuation?.[1] ?? core;
    const ending = punctuation?.[2] ?? "";
    const lower = body.toLowerCase();
    const keep = preserved.get(lower);
    if (keep) return `${prefix}${keep}${ending}${suffix}`;
    if (minorWords.has(lower) && index > 0 && index < words.length - 1) return `${prefix}${lower}${ending}${suffix}`;
    return `${prefix}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${ending}${suffix}`;
  }).join(" ");
};

const multipleChoiceQuestion = (id: string, title: string, prompt: string, options: string[], answer: string, hint: string, success: string): PracticeQuestion => ({
  id,
  level: "Warm-up",
  kind: "Multiple choice",
  title,
  prompt,
  placeholder: "Choose one answer",
  options,
  answer,
  hint,
  success,
  validate: (value) => value.trim() === answer,
});

const practiceQuestions: Record<string, PracticeQuestion[]> = {
  "variables-data-types": [
    multipleChoiceQuestion("variables-meaning", "Recognize a variable", "What is a variable?", ["A named location in memory used to store a value", "A command that always prints text", "A Java data type for whole numbers", "A symbol used only for addition"], "A named location in memory used to store a value", "Think about the reusable name and the value stored under it.", "Correct. A variable gives a stored value a reusable, readable name."),
    multipleChoiceQuestion("variables-name-part", "Find the variable name", "In int age = 25;, which part is the variable name?", ["25", "int", "age", "="], "age", "The variable name is the reusable word you choose.", "Correct. age is the name; 25 is its current value."),
    multipleChoiceQuestion("variables-assignment-part", "Find the assignment operator", "In int age = 25;, which symbol assigns the value?", [";", "=", "int", "25"], "=", "Look for the symbol between the name and value.", "Correct. = assigns the value on its right to the variable on its left."),
    multipleChoiceQuestion("variables-statement-end", "End the statement", "Which symbol ends an ordinary Java statement?", [".", ":", ";", ","], ";", "It appears at the end of every declaration in this lesson.", "Correct. A semicolon ends the statement."),
    { id: "variables-int", level: "Warm-up", kind: "Write one declaration", title: "Assign an int", prompt: "Declare a whole-number variable named score with the value 100.", placeholder: "Write one Java statement", hint: "Whole numbers use int.", success: "Correct. int score = 100; stores a whole number.", validate: (answer) => compactCode(answer) === "intscore=100;" },
    { id: "variables-double", level: "Warm-up", kind: "Write one declaration", title: "Assign a double", prompt: "Declare a decimal variable named price with the value 9.99.", placeholder: "Write one Java statement", hint: "Decimal numbers use double.", success: "Correct. double price = 9.99; stores a decimal.", validate: (answer) => compactCode(answer) === "doubleprice=9.99;" },
    { id: "variables-boolean", level: "Warm-up", kind: "Write one declaration", title: "Assign a boolean", prompt: "Declare a boolean variable named gameOver with the value false.", placeholder: "Write one Java statement", hint: "false is written without quotation marks.", success: "Correct. A boolean stores true or false without quotes.", validate: (answer) => compactCode(answer) === "booleangameOver=false;" },
    { id: "variables-string", level: "Warm-up", kind: "Write one declaration", title: "Assign a String", prompt: "Declare a text variable named city with the value Brooklyn.", placeholder: "Write one Java statement", hint: "String begins with a capital S, and text uses double quotes.", answer: "String city = \"Brooklyn\";", success: "Correct. String city stores the text Brooklyn.", validate: (answer) => compactCode(answer) === 'Stringcity="Brooklyn";' },
    { id: "variables-char", level: "Warm-up", kind: "Write one declaration", title: "Assign a char", prompt: "Declare a one-character variable named grade with the value A.", placeholder: "Write one Java statement", hint: "One char uses single quotes.", answer: "char grade = 'A';", success: "Correct. char grade stores exactly one character.", validate: (answer) => compactCode(answer) === "chargrade='A';" },
    { id: "variables-quoted-number-type", level: "Apply", kind: "Fix the type", title: "Store Quoted Digits as Text", prompt: "Rewrite the declaration as valid Java without removing the quotation marks.", code: "int code = \"123\";", placeholder: "Rewrite the complete declaration", hint: "The quotation marks make 123 text, regardless of which characters appear inside them.", answer: "String code = \"123\";", success: "Correct. Quoted digits are String text, not an int.", validate: (answer) => compactCode(answer) === 'Stringcode="123";' },
    { id: "variables-fix-decimal", level: "Apply", kind: "Fix the type", title: "Preserve the Decimal", prompt: "Rewrite the declaration as valid Java without changing the value.", code: "int price = 9.99;", placeholder: "Rewrite the complete declaration", hint: "A decimal value needs the decimal-number type.", answer: "double price = 9.99;", success: "Correct. The variable type now matches the decimal value.", validate: (answer) => compactCode(answer) === "doubleprice=9.99;" },
    { id: "variables-fix-boolean-quotes", level: "Apply", kind: "Fix the value", title: "Store a Boolean, Not Text", prompt: "Rewrite the declaration so active stores a boolean value.", code: "boolean active = \"true\";", placeholder: "Rewrite the complete declaration", hint: "Boolean values do not use quotation marks.", answer: "boolean active = true;", success: "Correct. true is now a boolean rather than String text.", validate: (answer) => compactCode(answer) === "booleanactive=true;" },
    { id: "variables-predict", level: "Warm-up", kind: "Predict output", title: "Follow the value", prompt: "What is the exact output?", code: "int lives = 3;\nlives = 2;\nSystem.out.println(lives);", placeholder: "Type the output", hint: "The second assignment replaces the first value.", success: "Right—the name stays lives, but its stored value is now 2.", validate: (answer) => normalizeLines(answer) === "2" },
    { id: "variables-fill", level: "Warm-up", kind: "Fill missing code", title: "Choose the exact type", prompt: "Replace the blank so the declaration is valid Java.", code: "___ grade = 'A';", placeholder: "Type only the missing word", hint: "One character in single quotes has its own primitive type.", success: "Correct. char stores exactly one character and uses single quotes.", validate: (answer) => answer.trim() === "char" },
    { id: "variables-fix", level: "Apply", kind: "Fix the error", title: "Repair the quotes", prompt: "Rewrite the line as valid Java.", code: "String name = 'Daniel';", placeholder: "Rewrite the complete line", hint: "String and char do not use the same quotation marks.", success: "Fixed. String text uses double quotes.", validate: (answer) => compactCode(answer) === 'Stringname="Daniel";' },
    multipleChoiceQuestion("variables-primitive", "Separate primitive and reference types", "Which list contains only the four primitive types introduced in this chapter?", ["int, double, boolean, char", "int, double, boolean, String", "String, char, text, number", "int, decimal, true, char"], "int, double, boolean, char", "String is the reference type introduced here.", "Correct. int, double, boolean, and char are primitive types; String is a reference type."),
    multipleChoiceQuestion("variables-valid-name", "Choose a clear valid name", "Which is the best valid Java variable name for a player's remaining health?", ["2health", "player health", "int", "playerHealth"], "playerHealth", "Use a descriptive camelCase name with no spaces, leading number, or Java keyword.", "Correct. playerHealth is descriptive and follows the naming rules."),
    multipleChoiceQuestion("variables-case-sensitive", "Track capitalization", "Java is case-sensitive. Which statement is true about score and Score?", ["They are two different variable names", "They always store the same value", "Both are invalid", "Java automatically changes both to score"], "They are two different variable names", "Capitalization is part of the name.", "Correct. score and Score refer to different names."),
    { id: "variables-fix-name", level: "Apply", kind: "Repair a declaration", title: "Remove the Space from the Name", prompt: "Rewrite the declaration using the descriptive variable name playerHealth.", code: "int player health = 100;", placeholder: "Rewrite the complete declaration", hint: "A variable name cannot contain a space.", answer: "int playerHealth = 100;", success: "Correct. playerHealth is one valid camelCase name.", validate: (answer) => compactCode(answer) === "intplayerHealth=100;" },
    { id: "variables-reassign", level: "Apply", kind: "Write one update", title: "Reassign without redeclaring", prompt: "A variable was declared with int lives = 3;. Write only the statement that changes its stored value to 2.", code: "int lives = 3;", placeholder: "Write the update", hint: "Reuse the name without writing int again.", success: "Correct. Reassignment changes the stored value without declaring a second variable.", validate: (answer) => compactCode(answer) === "lives=2;" },
    { id: "variables-reassign-type", level: "Apply", kind: "Fix the reassignment", title: "Keep the Variable's Type", prompt: "Rewrite only the broken update so lives stores the whole number 2.", code: "int lives = 3;\nlives = \"2\";", placeholder: "Write only the corrected update", hint: "lives was declared as int, so its new value must also be an int.", answer: "lives = 2;", success: "Correct. Reassignment changes the value but does not change the variable's type.", validate: (answer) => compactCode(answer) === "lives=2;" },
    multipleChoiceQuestion("variables-print-name", "Print a variable or literal", "Given int age = 25;, which statement prints the stored value 25 rather than the word age?", ["System.out.println(\"age\");", "System.out.println(age);", "System.out.println(25 age);", "System.out.println = age;"], "System.out.println(age);", "Quotation marks create literal text; a bare variable name retrieves its value.", "Correct. println(age) reads and prints the value stored under age."),
    { id: "variables-print-text", level: "Warm-up", kind: "Write one statement", title: "Print literal text", prompt: "Write one statement that prints exactly Hello.", placeholder: "Write one Java statement", hint: "Literal String text belongs in double quotes.", success: "Correct. The String literal is passed to println.", validate: (answer) => compactCode(answer) === 'System.out.println("Hello");' },
    { id: "variables-concat", level: "Apply", kind: "Exact output", title: "Trace concatenation", prompt: "What is printed? Match capitalization, spaces, and punctuation.", code: 'String name = "Daniel";\nint age = 25;\nSystem.out.println("Name: " + name + ", Age: " + age);', placeholder: "Type the exact output", hint: "Read the println from left to right and keep the spaces inside each String.", success: "Exactly. Java joined the text and both variable values into one line.", validate: (answer) => normalizeLines(answer) === "Name: Daniel, Age: 25" },
    { id: "variables-concat-space", level: "Apply", kind: "Fix exact output", title: "Preserve the space", prompt: "Rewrite only the println statement so the output is exactly Hello Daniel.", code: 'String name = "Daniel";\nSystem.out.println("Hello" + name);', placeholder: "Write the corrected println statement", hint: "The space must live inside one of the String literals.", success: "Correct. The literal includes the space Java needs to print.", validate: (answer) => compactCode(answer) === 'System.out.println("Hello"+name);' && /"Hello\s"/.test(answer) },
    { id: "variables-quoted-number", level: "Apply", kind: "Concatenation contrast", title: "Join Quoted Digits as Text", prompt: "What is the exact output?", code: "String code = \"123\";\nSystem.out.println(code + 4);", placeholder: "Type the exact output", hint: "The String begins the output, so + joins 4 after the existing text.", answer: "1234", success: "Correct. Concatenation joins the characters instead of performing numeric addition.", validate: (answer) => normalizeLines(answer) === "1234" },
    { id: "variables-constraints", level: "Apply", kind: "Write code", title: "Build four variables", prompt: "Declare name as Daniel, age as 25, height as 6.2, and hungry as true. Then print each variable on its own line.", placeholder: "Write the declarations and print statements", hint: "You need String, int, double, and boolean—plus four println statements.", success: "All four values are declared with matching types and printed.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && ["name", "age", "height", "hungry"].every((name) => code.includes(`System.out.println(${name});`)); } },
    { id: "variables-program-trace", level: "Challenge", kind: "Trace a complete state change", title: "Track Every Stored Value", prompt: "Write the exact output, one line at a time.", code: "String name = \"Daniel\";\nint level = 1;\nchar rank = 'C';\nboolean ready = false;\nlevel = 2;\nready = true;\nSystem.out.println(name);\nSystem.out.println(level);\nSystem.out.println(rank);\nSystem.out.println(ready);", placeholder: "Type the four output lines", hint: "Use the newest stored value for variables that were reassigned.", answer: "Daniel\n2\nC\ntrue", success: "Correct. You tracked four types and both reassignments through the final output.", multiline: true, validate: (answer) => normalizeLines(answer) === "Daniel\n2\nC\ntrue" },
    { id: "variables-challenge", level: "Challenge", kind: "Editor challenge", title: "Create a player profile", prompt: "Create name Daniel, age 25, height 6.2, hungry true, and grade A. Reassign age to 26. Print exactly: Daniel | 26 | 6.2 | true | A", placeholder: "Write Java statements that satisfy every constraint", hint: "Declare five variables, update age without writing int again, then concatenate the values with \" | \".", success: "Chapter challenge cleared. You declared, updated, and combined five correctly typed values.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && /chargrade='A';/.test(code) && /age=26;/.test(code) && /System\.out\.println\(name\+"\|"/.test(code.replace(/" \| "/g, '"|"')) && ["age", "height", "hungry", "grade"].every((name) => code.includes(`+${name}`)); } },
  ],
  "operators-expressions": [
    multipleChoiceQuestion("operators-terms", "Separate operator and operand", "In 8 + 2, which part is the operator?", ["8", "+", "2", "10"], "+", "The operator is the symbol that performs the action.", "Correct. + is the operator; 8 and 2 are operands."),
    { id: "operators-basic-arithmetic", level: "Warm-up", kind: "Predict output", title: "Use several arithmetic operators", prompt: "What is the exact output?", code: "int result = 12 - 3 * 2;\nSystem.out.println(result);", placeholder: "Type the output", hint: "Multiply before subtracting.", answer: "6", success: "Correct. 3 * 2 is 6, then 12 - 6 is 6.", validate: (answer) => normalizeLines(answer) === "6" },
    { id: "operators-arithmetic-predict", level: "Warm-up", kind: "Predict output", title: "Use precedence", prompt: "What is the exact output?", code: "int score = 4 + 3 * 2;\nSystem.out.println(score);", placeholder: "Type the output", hint: "Multiplication happens before addition.", answer: "10", success: "Correct: 3 × 2 happens first, then 4 is added.", validate: (answer) => normalizeLines(answer) === "10" },
    { id: "operators-integer-division", level: "Warm-up", kind: "Predict output", title: "Use integer division", prompt: "What is the exact output?", code: "int groups = 10 / 3;\nSystem.out.println(groups);", placeholder: "Type the output", hint: "Both operands are integers, so Java performs integer division.", answer: "3", success: "Correct. 10 / 3 is integer division, so the fractional part is discarded and 3 is stored.", validate: (answer) => normalizeLines(answer) === "3" },
    { id: "operators-decimal-division", level: "Apply", kind: "Predict output", title: "Keep decimal division", prompt: "What is the exact output?", code: "double result = 10.0 / 4;\nSystem.out.println(result);", placeholder: "Type the output", hint: "One operand is a double, so Java keeps the fractional result.", answer: "2.5", success: "Correct. Decimal division produces 2.5.", validate: (answer) => normalizeLines(answer) === "2.5" },
    { id: "operators-cast-division", level: "Apply", kind: "Fix the calculation", title: "Cast before dividing", prompt: "Rewrite only the assignment so average stores 2.5. Keep total and count as int variables.", code: "int total = 5;\nint count = 2;\ndouble average = total / count;", placeholder: "Write the corrected assignment", hint: "Cast one operand to double before division occurs.", answer: "double average = (double) total / count;", success: "Correct. The cast changes this calculation to decimal division.", validate: (answer) => compactCode(answer) === "doubleaverage=(double)total/count;" },
    { id: "operators-modulus-calculate", level: "Apply", kind: "Calculate the remainder", title: "Find what is left", prompt: "What is the exact output?", code: "int remainder = 23 % 6;\nSystem.out.println(remainder);", placeholder: "Type the output", hint: "Six fits into 23 three full times. What remains?", answer: "5", success: "Correct. 6 × 3 uses 18, leaving a remainder of 5.", validate: (answer) => normalizeLines(answer) === "5" },
    { id: "operators-modulus-even-remainder", level: "Apply", kind: "Predict output", title: "Recognize an even remainder", prompt: "What is the exact output?", code: "int number = 18;\nint remainder = number % 2;\nSystem.out.println(remainder);", placeholder: "Type the output", hint: "Divide 18 by 2 and keep only what remains.", answer: "0", success: "Correct. An even number leaves a remainder of 0 when divided by 2.", validate: (answer) => normalizeLines(answer) === "0" },
    { id: "operators-update-sequence", level: "Apply", kind: "Trace mixed updates", title: "Follow each change", prompt: "What is the final output?", code: "int score = 10;\nscore++;\nscore += 5;\nscore--;\nSystem.out.println(score);", placeholder: "Type the output", hint: "Track score after every line: add one, add five, then subtract one.", answer: "15", success: "Correct. Score changes from 10 to 11 to 16 to 15.", validate: (answer) => normalizeLines(answer) === "15" },
    multipleChoiceQuestion("operators-increment-equivalent", "Recognize equivalent updates", "Starting with int lives = 4;, which three statements each change lives to 5 when used on their own?", ["lives = lives + 1; · lives += 1; · lives++;", "lives = 1; · lives += 4; · lives--;", "lives + 1; · lives =+ 1; · ++1;", "lives = lives - 1; · lives -= 1; · lives--;"], "lives = lives + 1; · lives += 1; · lives++;", "Look for three different ways to add exactly one to the current stored value.", "Correct. The long form, compound assignment, and standalone increment all change 4 to 5."),
    { id: "operators-increment-output", level: "Warm-up", kind: "Predict output", title: "Trace a standalone increment", prompt: "What is the exact output?", code: "int score = 10;\nscore++;\nSystem.out.println(score);", placeholder: "Type the output", hint: "There is no second variable receiving a value; just add one to score.", answer: "11", success: "Correct. A standalone score++ changes 10 to 11.", validate: (answer) => normalizeLines(answer) === "11" },
    { id: "operators-increment-long-form", level: "Apply", kind: "Rewrite the update", title: "Expand the shorthand", prompt: "Rewrite only score++; using the full assignment form. Do not use ++ or +=.", code: "score++;", placeholder: "Write one Java statement", hint: "Store the current score plus one back into score.", answer: "score = score + 1;", success: "Correct. score = score + 1; makes the read, addition, and assignment explicit.", validate: (answer) => compactCode(answer) === "score=score+1;" },
    { id: "operators-increment", level: "Warm-up", kind: "Write two updates", title: "Increment and decrement", prompt: "Write two statements: first increase lives by one with ++, then decrease score by one with --.", placeholder: "Write the two statements", hint: "Each operator comes directly after its variable name.", answer: "lives++;\nscore--;", success: "Correct. Both values change by exactly one.", multiline: true, validate: (answer) => compactCode(answer) === "lives++;score--;" },
    { id: "operators-postfix-trace", level: "Apply", kind: "Trace postfix", title: "Use the old value first", prompt: "What is the exact output?", code: "int x = 4;\nint y = x++;\nSystem.out.println(x + \" \" + y);", placeholder: "Type the exact output", hint: "Postfix produces x's old value for y, then increments x.", answer: "5 4", success: "Correct. y receives 4, and x finishes at 5.", validate: (answer) => normalizeLines(answer) === "5 4" },
    { id: "operators-postfix-expand", level: "Apply", kind: "Expand the two jobs", title: "Rewrite postfix without ++", prompt: "Replace int y = x++; with two statements that give y the old x first and then add one to x. Do not use ++ or +=.", code: "int x = 4;\nint y = x++;", placeholder: "Write the two replacement statements", hint: "First copy x into y. On the next line, store x + 1 back into x.", answer: "int y = x;\nx = x + 1;", success: "Correct. The two explicit statements show the exact order of postfix.", multiline: true, validate: (answer) => compactCode(answer) === "inty=x;x=x+1;" },
    multipleChoiceQuestion("operators-prefix-meaning", "Learn the prefix rule", "In int y = ++x;, what does Java do first?", ["Increase x by 1, then give the new value to y", "Give the old value to y, then increase x", "Increase y by 1 without changing x", "Add x and y together"], "Increase x by 1, then give the new value to y", "Because ++ appears before x, the update happens before the expression supplies its value.", "Correct. Prefix ++x updates x first, then y receives that new value."),
    { id: "operators-prefix-trace", level: "Apply", kind: "Trace prefix", title: "Update before producing the value", prompt: "What is the exact output?", code: "int x = 4;\nint y = ++x;\nSystem.out.println(x + \" \" + y);", placeholder: "Type the exact output", hint: "Prefix increments x before the expression supplies a value to y.", answer: "5 5", success: "Correct. x becomes 5 first, so both x and y are 5.", validate: (answer) => normalizeLines(answer) === "5 5" },
    { id: "operators-postfix-plus", level: "Apply", kind: "Controlled variation", title: "Use Postfix Inside Addition", prompt: "What is the exact output?", code: "int x = 5;\nint result = x++ + 2;\nSystem.out.println(x + \" \" + result);", placeholder: "Type the exact output", hint: "Postfix supplies the old 5 to the addition, then x becomes 6.", answer: "6 7", success: "Correct. result uses 5 + 2 while x finishes at 6.", validate: (answer) => normalizeLines(answer) === "6 7" },
    { id: "operators-prefix-plus", level: "Apply", kind: "Controlled variation", title: "Use Prefix Inside Addition", prompt: "What is the exact output?", code: "int x = 5;\nint result = ++x + 2;\nSystem.out.println(x + \" \" + result);", placeholder: "Type the exact output", hint: "Prefix changes x to 6 before the addition uses it.", answer: "6 8", success: "Correct. result uses 6 + 2 and x remains 6.", validate: (answer) => normalizeLines(answer) === "6 8" },
    { id: "operators-two-increments", level: "Challenge", kind: "Evaluation-order trace", title: "Trace Two Updates in One Expression", prompt: "What is the exact output?", code: "int x = 5;\nint result = x++ + ++x;\nSystem.out.println(x + \" \" + result);", placeholder: "Type the exact output", hint: "Java evaluates the left operand first: postfix supplies 5 and leaves x at 6; prefix then changes x to 7 and supplies 7.", answer: "7 12", success: "Correct. The expression produces 5 + 7 while x finishes at 7.", validate: (answer) => normalizeLines(answer) === "7 12" },
    { id: "operators-two-increments-precedence", level: "Challenge", kind: "Multi-rule trace", title: "Combine Timing and Precedence", prompt: "What is the exact output?", code: "int x = 5;\nint result = x++ * 2 + ++x;\nSystem.out.println(x + \" \" + result);", placeholder: "Type the exact output", hint: "Postfix supplies 5, so multiplication produces 10. Then prefix changes x from 6 to 7 before the addition.", answer: "7 17", success: "Correct. The stored result is 5 * 2 + 7, and x finishes at 7.", validate: (answer) => normalizeLines(answer) === "7 17" },
    { id: "operators-postfix-decrement", level: "Apply", kind: "Trace postfix decrement", title: "Use the old value before subtracting", prompt: "What is the exact output?", code: "int lives = 3;\nint shown = lives--;\nSystem.out.println(lives + \" \" + shown);", placeholder: "Type the exact output", hint: "Postfix gives shown the old 3, then subtracts one from lives.", answer: "2 3", success: "Correct. lives finishes at 2 while shown keeps the old value 3.", validate: (answer) => normalizeLines(answer) === "2 3" },
    { id: "operators-prefix-decrement", level: "Apply", kind: "Trace prefix decrement", title: "Subtract before using the value", prompt: "What is the exact output?", code: "int lives = 3;\nint shown = --lives;\nSystem.out.println(lives + \" \" + shown);", placeholder: "Type the exact output", hint: "Prefix subtracts one first, then supplies the updated value to shown.", answer: "2 2", success: "Correct. lives becomes 2 before shown receives 2.", validate: (answer) => normalizeLines(answer) === "2 2" },
    { id: "operators-prefix-postfix-mixed", level: "Challenge", kind: "Trace both forms", title: "Keep three values separate", prompt: "What is the exact output?", code: "int x = 4;\nint first = x++;\nint second = ++x;\nSystem.out.println(x + \" \" + first + \" \" + second);", placeholder: "Type the exact output", hint: "After postfix: first is 4 and x is 5. Then prefix makes x 6 before second receives it.", answer: "6 4 6", success: "Correct. x finishes at 6, first keeps 4, and second receives 6.", validate: (answer) => normalizeLines(answer) === "6 4 6" },
    { id: "operators-compound", level: "Apply", kind: "Rewrite with shorthand", title: "Use compound assignment", prompt: "Rewrite score = score + 5; using compound assignment.", code: "score = score + 5;", placeholder: "Write the shorter statement", hint: "The operator comes before the equals sign.", answer: "score += 5;", success: "Correct. += calculates and stores the updated value.", validate: (answer) => compactCode(answer) === "score+=5;" },
    { id: "operators-compound-subtract", level: "Apply", kind: "Rewrite with shorthand", title: "Shorten a subtraction update", prompt: "Rewrite only the second line using compound assignment.", code: "int lives = 9;\nlives = lives - 3;", placeholder: "Write the shorter second line", hint: "Keep lives on the left and place the subtraction operator before =.", answer: "lives -= 3;", success: "Correct. -= subtracts three from the current value and stores six back in lives.", validate: (answer) => compactCode(answer) === "lives-=3;" },
    { id: "operators-compound-expression", level: "Apply", kind: "Trace a right-side expression", title: "Calculate the right side first", prompt: "What is the exact output?", code: "int score = 10;\nint bonus = 4;\nscore += bonus * 2;\nSystem.out.println(score);", placeholder: "Type the output", hint: "Calculate bonus * 2 first, then add that result to score.", answer: "18", success: "Correct. bonus * 2 produces 8, then score += 8 changes score from 10 to 18.", validate: (answer) => normalizeLines(answer) === "18" },
    { id: "operators-compound-chain", level: "Challenge", kind: "Trace every compound operator", title: "Survive the full update chain", prompt: "What is the exact output? Track value after every line.", code: "int value = 24;\nvalue /= 3;\nvalue += 7;\nvalue *= 2;\nvalue -= 5;\nvalue %= 6;\nSystem.out.println(value);", placeholder: "Type the output", hint: "The stored values are 24 → 8 → 15 → 30 → 25 before the final remainder operation.", answer: "1", success: "Correct. The final 25 % 6 leaves a remainder of 1.", validate: (answer) => normalizeLines(answer) === "1" },
    { id: "operators-compound-reverse", level: "Challenge", kind: "Solve the missing operand", title: "Reason backward from the output", prompt: "Replace the blank with one integer so the program prints 25.", code: "int coins = 7;\ncoins *= ___;\ncoins -= 3;\nSystem.out.println(coins);", placeholder: "Type only the missing integer", hint: "Before subtracting 3, coins must be 28. What multiplies 7 into 28?", answer: "4", success: "Correct. 7 *= 4 produces 28, then 28 -= 3 produces 25.", validate: (answer) => answer.trim() === "4" },
    { id: "operators-compound-postfix", level: "Challenge", kind: "Combine stored and produced values", title: "Mix postfix with compound assignment", prompt: "What is the exact output? Keep x and bonus separate while tracing.", code: "int x = 5;\nint bonus = x++;\nx += bonus * 2;\nSystem.out.println(x + \" \" + bonus);", placeholder: "Type the exact output", hint: "Postfix gives bonus the old 5 and leaves x at 6. Then calculate bonus * 2 before updating x.", answer: "16 5", success: "Correct. bonus keeps 5, x becomes 6, and x += 10 finishes at 16.", validate: (answer) => normalizeLines(answer) === "16 5" },
    { id: "operators-compound-repair", level: "Challenge", kind: "Repair two updates", title: "Put each operator in the right place", prompt: "Rewrite the two broken update lines as valid compound assignments. Keep their order.", code: "int energy = 12;\nenergy =+ 5;\nenergy =* 2;", placeholder: "Write the two corrected update statements", hint: "The arithmetic operator must come before = in both statements.", answer: "energy += 5;\nenergy *= 2;", success: "Correct. The repaired updates change energy from 12 to 17 to 34.", multiline: true, validate: (answer) => compactCode(answer) === "energy+=5;energy*=2;" },
    { id: "operators-compound-build", level: "Challenge", kind: "Editor challenge", title: "Build a multi-stage balance update", prompt: "Declare balance as 50, reward as 8, and fee as 6. After the declarations, use compound assignments to add reward * 3 to balance, double balance, subtract fee, and keep the remainder after division by 40. Then print balance.", placeholder: "Write the declarations, updates, and println statement", hint: "The four balance updates use +=, *=, -=, and %= in that order. The final value is 22.", answer: "int balance = 50;\nint reward = 8;\nint fee = 6;\nbalance += reward * 3;\nbalance *= 2;\nbalance -= fee;\nbalance %= 40;\nSystem.out.println(balance);", success: "Compound assignment challenge cleared. You combined precedence, four update operators, stored state, and exact output.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /intbalance=50;/.test(code) && /intreward=8;/.test(code) && /intfee=6;/.test(code) && /balance\+=reward\*3;/.test(code) && /balance\*=2;/.test(code) && /balance-=fee;/.test(code) && /balance%=40;/.test(code) && /System\.out\.println\(balance\);/.test(code); } },
    { id: "operators-parentheses-repair", level: "Apply", kind: "Fix the expression", title: "Make addition happen first", prompt: "Rewrite the full line so total stores 14. Change only the expression by adding parentheses.", code: "int total = 4 + 3 * 2;", placeholder: "Rewrite the full corrected line", hint: "Group 4 + 3 so Java evaluates it before multiplying by 2.", answer: "int total = (4 + 3) * 2;", success: "Fixed. Parentheses make 4 + 3 happen first, so 7 × 2 stores 14.", validate: (answer) => compactCode(answer) === "inttotal=(4+3)*2;" },
    { id: "operators-string-order", level: "Challenge", kind: "Predict exact text", title: "Catch the concatenation trap", prompt: "What is the exact output, including spaces?", code: "int x = 2;\nint y = 3;\nSystem.out.println(\"Total: \" + x + y);", placeholder: "Type the exact output", hint: "Once Java starts with the String, each later value is joined as text from left to right.", answer: "Total: 23", success: "Correct. Java builds \"Total: 2\" first, then appends 3, producing Total: 23.", validate: (answer) => normalizeLines(answer) === "Total: 23" },
    { id: "operators-string-parentheses", level: "Apply", kind: "Predict exact text", title: "Force arithmetic first", prompt: "What is the exact output?", code: "int x = 2;\nint y = 3;\nSystem.out.println(\"Total: \" + (x + y));", placeholder: "Type the exact output", hint: "Parentheses finish the numeric addition before concatenation.", answer: "Total: 5", success: "Correct. x + y becomes 5 before it joins the String.", validate: (answer) => normalizeLines(answer) === "Total: 5" },
    { id: "operators-state-trace", level: "Challenge", kind: "Trace stored state", title: "Track a longer update chain", prompt: "What is the final output?", code: "int energy = 20;\nenergy /= 2;\nenergy += 7;\nenergy *= 3;\nenergy %= 10;\nSystem.out.println(energy);", placeholder: "Type the output", hint: "Write down energy after each statement before moving to the next one.", answer: "1", success: "Correct. Energy changes 20 → 10 → 17 → 51 → 1.", validate: (answer) => normalizeLines(answer) === "1" },
    { id: "operators-resource-challenge", level: "Challenge", kind: "Editor challenge", title: "Build a resource calculator", prompt: "Declare missions as 4, reward as 15, multiplier as 2, and fee as 7. Calculate balance with missions * reward * multiplier - fee. Print exactly: Balance: 113 credits", placeholder: "Write the declarations, calculation, and println statement", hint: "Store the longer expression in an int named balance, then concatenate balance between the two text pieces.", success: "Operators challenge cleared. You combined declarations, precedence, a longer expression, and exact String output.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /intmissions=4;/.test(code) && /intreward=15;/.test(code) && /intmultiplier=2;/.test(code) && /intfee=7;/.test(code) && /intbalance=missions\*reward\*multiplier-fee;/.test(code) && /System\.out\.println\("Balance:"\+balance\+"credits"\);/.test(code); } },
  ],
  ...additionalPracticeQuestions,
};

practiceQuestions["variables-data-types"].push({
  id: "variables-independent-build",
  level: "Challenge",
  kind: "Independent build",
  title: "Build a Tournament Check-In Card",
  prompt: "Maya enters a tournament with a score of 120, an accuracy of 92.5, and a completed qualifying level. Write Java that represents this check-in record and prints four labeled lines: Player, Score, Accuracy, and Qualified.",
  placeholder: "Build the solution from an empty editor",
  hint: "You need one String, one int, one double, one boolean, and four println statements that use the stored values.",
  answer: "String playerName = \"Maya\";\nint score = 120;\ndouble accuracy = 92.5;\nboolean qualified = true;\nSystem.out.println(\"Player: \" + playerName);\nSystem.out.println(\"Score: \" + score);\nSystem.out.println(\"Accuracy: \" + accuracy);\nSystem.out.println(\"Qualified: \" + qualified);",
  success: "You independently selected types, names, values, declarations, and labeled output.",
  multiline: true,
  productionStage: 4,
  auditRequirements: ["String declaration", "int declaration", "double declaration", "boolean declaration", "four labeled println statements"],
  validate: (answer) => {
    const code = compactCode(answer);
    return /String[A-Za-z_$][\w$]*="[^"]*";/.test(code)
      && /int[A-Za-z_$][\w$]*=-?\d+;/.test(code)
      && /double[A-Za-z_$][\w$]*=-?\d+(?:\.\d+)?;/.test(code)
      && /boolean[A-Za-z_$][\w$]*=(?:true|false);/.test(code)
      && (code.match(/System\.out\.println\(/g)?.length ?? 0) >= 4;
  },
});

practiceQuestions["operators-expressions"].push({
  id: "operators-independent-build",
  level: "Challenge",
  kind: "Independent build",
  title: "Plan an Arcade Prize Purchase",
  prompt: "You have 137 arcade tickets. An orange prize costs 12 tickets and an apple prize costs 7 tickets. You buy 4 oranges first, then spend as many of the remaining tickets as possible on apples. Write Java that reports Apples: VALUE and Tickets left: VALUE. Use variables to represent the ticket balance, item prices, and quantities.",
  placeholder: "Build the solution from an empty editor",
  hint: "First determine the ticket balance after the oranges. That remaining balance determines both how many complete apple prizes fit and what is left over.",
  answer: "int tickets = 137;\nint orangePrice = 12;\nint applePrice = 7;\nint oranges = 4;\nint afterOranges = tickets - orangePrice * oranges;\nint apples = afterOranges / applePrice;\nint ticketsLeft = afterOranges % applePrice;\nSystem.out.println(\"Apples: \" + apples);\nSystem.out.println(\"Tickets left: \" + ticketsLeft);",
  success: "You modeled the purchase, chose the intermediate balance, and derived both results.",
  multiline: true,
  productionStage: 4,
  auditRequirements: ["137-ticket balance", "12-ticket orange price", "7-ticket apple price", "four oranges", "purchase subtraction", "integer division", "remainder", "two labeled outputs"],
  validate: validateArcadePrizePurchase,
});

practiceQuestions["variables-data-types"].push(
  {
    id: "variables-write-declarations",
    level: "Apply",
    kind: "Write from requirements",
    title: "Represent an Inventory Entry",
    prompt: "A store has 3 notebooks priced at $4.50 each. Write three Java declarations that preserve the product name, quantity, and price.",
    placeholder: "Write the three declarations",
    hint: "Match each kind of value to the type that can store it.",
    answer: "String product = \"Notebook\";\nint quantity = 3;\ndouble price = 4.5;",
    success: "You translated three data requirements into typed Java declarations.",
    multiline: true,
    productionStage: 3,
    auditRequirements: ["String declaration", "int declaration", "double declaration"],
    validate: (answer) => {
      const code = javaValidationCode(answer);
      return /String[A-Za-z_$][\w$]*="[^"]*";/.test(code)
        && /int[A-Za-z_$][\w$]*=-?\d+;/.test(code)
        && /double[A-Za-z_$][\w$]*=-?\d+(?:\.\d+)?;/.test(code);
    },
  },
  {
    id: "variables-write-label",
    level: "Apply",
    kind: "Write from requirements",
    title: "Print an Inventory Label",
    prompt: "An inventory program already has String item and int quantity. Print one label in the form ITEM: QUANTITY.",
    placeholder: "Write the println statement",
    hint: "Join the first variable, the quoted label punctuation, and the second variable.",
    answer: "System.out.println(item + \": \" + quantity);",
    success: "You produced labeled output directly from its required format.",
    multiline: true,
    productionStage: 3,
    auditRequirements: ["println", "String concatenation", "item", "quantity"],
    validate: (answer) => /System\.out\.println\(item\+":"\+quantity\);/.test(compactCode(answer)),
  },
);

practiceQuestions["operators-expressions"].push(
  {
    id: "operators-write-time-conversion",
    level: "Apply",
    kind: "Write from requirements",
    title: "Report a Video Duration",
    prompt: "A video player stores a duration in int totalMinutes. Display the duration as complete hours and leftover minutes.",
    placeholder: "Write the calculations and output",
    hint: "Division finds complete groups of 60; modulus finds what remains.",
    answer: "int hours = totalMinutes / 60;\nint remaining = totalMinutes % 60;\nSystem.out.println(hours + \" hours and \" + remaining + \" minutes\");",
    success: "You chose division and remainder from a behavioral requirement.",
    multiline: true,
    productionStage: 3,
    auditRequirements: ["integer division by 60", "modulus by 60", "println"],
    validate: (answer) => {
      const code = javaValidationCode(answer);
      return /int\w+=totalMinutes\/60;/.test(code)
        && /int\w+=totalMinutes%60;/.test(code)
        && /System\.out\.println\(/.test(code);
    },
  },
  {
    id: "operators-write-balance-updates",
    level: "Apply",
    kind: "Write from requirements",
    title: "Apply Two Account Updates",
    prompt: "An account program already stores its current amount in int balance. A $20 deposit arrives, followed by a $5 service charge. Update balance using compound assignment and print the final amount.",
    placeholder: "Write the updates and output",
    hint: "Apply each update in the order stated.",
    answer: "balance += 20;\nbalance -= 5;\nSystem.out.println(balance);",
    success: "You converted ordered state changes into Java statements.",
    multiline: true,
    productionStage: 3,
    auditRequirements: ["+= 20", "-= 5", "println"],
    validate: (answer) => {
      const code = compactCode(answer);
      return /balance\+=20;/.test(code) && /balance-=5;/.test(code) && /System\.out\.println\(balance\);/.test(code)
        && code.indexOf("balance+=20;") < code.indexOf("balance-=5;");
    },
  },
);

for (const chapterId of ["variables-data-types", "operators-expressions"]) {
  practiceQuestions[chapterId].push(...retrievalQuestionsFor(chapterId));
}

type AuditSnapshot = {
  auditDate: string;
  degreeProgress: number;
  appliedCredits: number;
  remainingCredits: number;
  gpa: number;
  majorApplied: number;
  majorRemaining: number;
  collegeOptionRemaining: number;
  residencyRemaining: number;
  advancedCiscRemaining: number;
  bsCreditsRemaining: number;
  sourceName: string;
};

type DegreePathNode = {
  id: string;
  label: string;
  title: string;
  codes?: string[];
  note?: string;
  kind: "required" | "choice" | "electives" | "finish";
};

const degreePathLevels: { label: string; description: string; nodes: DegreePathNode[] }[] = [
  { label: "Foundations", description: "Completed placement and the selected programming entry point.", nodes: [
    { id: "math-1006", label: "Required", title: "College algebra", codes: ["MATH 1006"], kind: "required" },
    { id: "math-1011", label: "Required", title: "Precalculus", codes: ["MATH 1011"], kind: "required" },
    { id: "programming-entry", label: "Choose one", title: "Programming foundation", codes: ["CISC 1115", "CISC 1170"], note: "The degree accepts either programming entry route; the learning library currently begins with CISC 1115.", kind: "choice" },
  ] },
  { label: "First unlocks", description: "Math and CS courses that open the rest of the major.", nodes: [
    { id: "math-1201", label: "Required", title: "Calculus I", codes: ["MATH 1201"], kind: "required" },
    { id: "cisc-2210", label: "Required", title: "Discrete structures", codes: ["CISC 2210"], kind: "required" },
    { id: "cisc-3115", label: "Required", title: "Modern programming techniques", codes: ["CISC 3115"], kind: "required" },
  ] },
  { label: "Core construction", description: "Parallel math and programming paths—not a row you must finish before moving on.", nodes: [
    { id: "math-1206", label: "Standard math path", title: "Calculus II", codes: ["MATH 1206"], note: "This map follows the standard calculus sequence; transferred or substituted credit should be confirmed in DegreeWorks.", kind: "required" },
    { id: "cisc-3130", label: "Required", title: "Data structures", codes: ["CISC 3130"], kind: "required" },
    { id: "cisc-3140", label: "Required", title: "Large-scale applications", codes: ["CISC 3140"], kind: "required" },
  ] },
  { label: "Advanced branches", description: "Two required courses + one from each of four pairs. Each course has its own prerequisites.", nodes: [
    { id: "cisc-3142", label: "Required", title: "Programming paradigms in C++", codes: ["CISC 3142"], kind: "required" },
    { id: "cisc-3320", label: "Required", title: "Operating systems", codes: ["CISC 3320"], note: "CISC 7312X is an alternative only with GPA above 3.0.", kind: "required" },
    { id: "architecture-choice", label: "Choose one", title: "Architecture / organization", codes: ["CISC 3310", "CISC 3305"], kind: "choice" },
    { id: "theory-choice", label: "Choose one", title: "Algorithms / theory", codes: ["CISC 3220", "CISC 3230"], kind: "choice" },
    { id: "probability-choice", label: "Choose one", title: "Probability & statistics", codes: ["MATH 2501", "MATH 3501"], kind: "choice" },
    { id: "ethics-choice", label: "Choose one", title: "Computers & ethics", codes: ["CISC 2820W", "PHIL 3318W"], note: "CISC 2820W may also help the separate CISC writing-intensive rule; confirm with advisement.", kind: "choice" },
    { id: "electives", label: "Choose three · required", title: "Upper-level CISC electives", kind: "electives" },
  ] },
  { label: "Finish line", description: "Capstone choice and degree-wide graduation gates.", nodes: [
    { id: "capstone-choice", label: "Choose one", title: "Independent group / study", codes: ["CISC 4900", "CISC 5001"], kind: "choice" },
    { id: "writing-intensive", label: "Degree requirement", title: "One writing-intensive CISC course", note: "A qualifying CISC writing-intensive course must appear in the completed degree audit.", kind: "finish" },
    { id: "degree-gates", label: "Graduation gates", title: "Credits, residency, GPA", note: "Personal totals appear only after a visitor loads their own audit.", kind: "finish" },
  ] },
];

const degreeWorksSnapshot: AuditSnapshot = {
  auditDate: "Not loaded",
  degreeProgress: 0,
  appliedCredits: 0,
  remainingCredits: 0,
  gpa: 0,
  majorApplied: 0,
  majorRemaining: 0,
  collegeOptionRemaining: 0,
  residencyRemaining: 0,
  advancedCiscRemaining: 0,
  bsCreditsRemaining: 0,
  sourceName: "No audit uploaded",
};

const initialDegreeRecords: DegreeRecords = Object.fromEntries(
  degreeAuditCourses.map((course) => [course.code, "unknown" as DegreeStatus]),
) as DegreeRecords;

// Retained only so older progress-backup files can still be imported.
const legacyReadingCheckpointId = (chapterId: string) => chapterId === "operators-expressions" ? `${chapterId}:read:v2` : `${chapterId}:read`;

function practiceQuestionWeight(question: PracticeQuestion) {
  if (question.level === "Challenge") return 3;
  if (question.level === "Apply") return 2;
  return 1;
}

type ChapterPracticePlan = {
  checkpoints: Record<string, string[]>;
  review: string[];
};

const foundationalPracticePlans: Record<string, ChapterPracticePlan> = {
  "variables-data-types": {
    checkpoints: {
      "variables-overview": ["variables-meaning"],
      "variables-declaration": ["variables-name-part", "variables-assignment-part", "variables-statement-end"],
      "variables-types": ["variables-int", "variables-double", "variables-boolean", "variables-string", "variables-char", "variables-quoted-number-type", "variables-fill", "variables-fix", "variables-fix-decimal", "variables-fix-boolean-quotes", "variables-primitive"],
      "variables-naming": ["variables-valid-name", "variables-case-sensitive", "variables-fix-name"],
      "variables-changing": ["variables-predict", "variables-reassign", "variables-reassign-type"],
      "variables-printing": ["variables-print-name", "variables-print-text"],
      "variables-declaration": ["variables-name-part", "variables-assignment-part", "variables-statement-end", "variables-write-declarations"],
      "variables-concatenation": ["variables-concat", "variables-concat-space", "variables-quoted-number", "variables-write-label"],
      "variables-program": ["variables-constraints", "variables-program-trace", "variables-independent-build"],
    },
    review: ["variables-challenge"],
  },
  "operators-expressions": {
    checkpoints: {
      "operators-arithmetic": ["operators-terms", "operators-basic-arithmetic"],
      "operators-division": ["operators-integer-division", "operators-decimal-division", "operators-cast-division"],
      // The time-conversion build needs both division and the remainder operator.
      "operators-modulus": ["operators-modulus-calculate", "operators-modulus-even-remainder", "operators-write-time-conversion"],
      "operators-precedence": ["operators-arithmetic-predict", "operators-parentheses-repair"],
      "operators-increment": ["operators-increment-equivalent", "operators-increment-output", "operators-increment-long-form", "operators-increment", "operators-postfix-trace", "operators-postfix-expand", "operators-prefix-meaning", "operators-prefix-trace", "operators-postfix-plus", "operators-prefix-plus", "operators-two-increments", "operators-two-increments-precedence", "operators-postfix-decrement", "operators-prefix-decrement", "operators-prefix-postfix-mixed"],
      "operators-assignment": ["operators-compound", "operators-compound-subtract", "operators-update-sequence", "operators-compound-expression", "operators-compound-chain", "operators-compound-reverse", "operators-compound-postfix", "operators-compound-repair", "operators-compound-build", "operators-write-balance-updates"],
      "operators-concatenation": ["operators-string-order", "operators-string-parentheses"],
      "operators-evaluation": ["operators-state-trace", "operators-independent-build"],
    },
    review: ["operators-resource-challenge"],
  },
  "input-basic-programs": {
    checkpoints: {
      "input-execution": ["input-exec-q1", "input-exec-q2", "input-exec-q3", "input-exec-q4", "input-exec-q5"],
      "input-scanner-setup": ["input-setup-q1", "input-setup-q2", "input-setup-q3", "input-setup-q4", "input-setup-q5"],
      "input-reading-numbers": ["input-number-q1", "input-number-q2", "input-number-q3", "input-number-q4", "input-number-q5", "input-number-q6", "input-number-q7", "input-number-q8", "input-review-q1", "input-review-q3"],
      "input-reading-text": ["input-text-q1", "input-text-q2", "input-text-q3", "input-text-q4", "input-text-q5", "input-text-q6", "input-text-q7", "input-review-q2"],
      "input-program-pattern": ["input-pattern-q1", "input-pattern-q2", "input-pattern-q3", "input-pattern-q4", "input-pattern-q5", "input-pattern-q6"],
      "input-common-mistakes": ["input-mistake-q1", "input-mistake-q2", "input-mistake-q3", "input-mistake-q4", "input-mistake-q5"],
      "input-complete-program": ["input-complete-q1", "input-complete-q2", "input-complete-q3", "input-independent-build"],
    },
    review: ["input-review-q4", "input-review-q5"],
  },
};

function chapterPracticePlan(chapterId: string): ChapterPracticePlan {
  const explicit = foundationalPracticePlans[chapterId];
  if (explicit) {
    const checkpoints = Object.fromEntries(Object.entries(explicit.checkpoints).map(([sectionId, ids]) => [sectionId, [...ids]]));
    for (const entry of sectionRetrievalPractice.filter((entry) => entry.chapterId === chapterId)) {
      const ids = checkpoints[entry.sectionId] ??= [];
      if (!ids.includes(entry.question.id)) ids.push(entry.question.id);
    }
    if (chapterId === "input-basic-programs") {
      // Preserve the hand-authored plan while making existing writing tasks
      // reachable; previously its override silently omitted these additions.
      for (const [sectionId, ids] of Object.entries(additionalSectionPracticeQuestionIds[chapterId] ?? {})) {
        checkpoints[sectionId] = [...new Set([...(checkpoints[sectionId] ?? []), ...ids])];
      }
    }
    return { checkpoints, review: explicit.review };
  }

  const questions = practiceQuestions[chapterId] ?? [];
  if (["cumulative-challenges", "final-assessment"].includes(chapterId)) return { checkpoints: {}, review: questions.map((question) => question.id) };

  const chapter = learningChapters.find((item) => item.id === chapterId);
  const lessonSectionIds = (chapter?.sections ?? []).filter((section) => !section.id.endsWith("-practice")).map((section) => section.id);
  const generatedCheckpoints = additionalSectionPracticeQuestionIds[chapterId] ?? {};
  const reviewCount = questions.length >= 8 ? 2 : 1;
  const generatedIds = new Set(Object.values(generatedCheckpoints).flat());
  const authoredQuestions = questions.filter((question) => !generatedIds.has(question.id));
  const checkpointQuestions = authoredQuestions.slice(0, Math.max(0, authoredQuestions.length - reviewCount));
  const review = authoredQuestions.slice(checkpointQuestions.length).map((question) => question.id);
  const groups: PracticeQuestion[][] = [];
  checkpointQuestions.forEach((question, index) => {
    if (index < 2) {
      if (!groups[0]) groups[0] = [];
      groups[0].push(question);
    } else {
      groups.push([question]);
    }
  });

  const checkpoints: Record<string, string[]> = Object.fromEntries(
    Object.entries(generatedCheckpoints).map(([sectionId, questionIds]) => [sectionId, [...questionIds]]),
  );
  const startIndex = Math.min(2, Math.max(0, lessonSectionIds.length - groups.length));
  groups.forEach((group, index) => {
    const sectionId = lessonSectionIds[Math.min(startIndex + index, lessonSectionIds.length - 1)];
    if (sectionId) checkpoints[sectionId] = [...(checkpoints[sectionId] ?? []), ...group.map((question) => question.id)];
  });
  return { checkpoints, review };
}

function requiredChapterPracticeQuestions(chapterId: string) {
  const plan = chapterPracticePlan(chapterId);
  const requiredQuestionIds = new Set([
    ...Object.values(plan.checkpoints).flat(),
    ...plan.review,
  ]);
  return (practiceQuestions[chapterId] ?? []).filter((question) => requiredQuestionIds.has(question.id));
}

function chapterProgress(chapterId: string, _completed: string[], practice: PracticeRecords) {
  const questions = requiredChapterPracticeQuestions(chapterId);
  const passedQuestions = questions.filter((question) => practice[chapterId]?.passed?.includes(question.id));
  const passed = passedQuestions.length;
  const practiceDone = questions.length > 0 && passed >= questions.length;
  const points = passedQuestions.reduce((sum, question) => sum + practiceQuestionWeight(question), 0);
  const total = questions.reduce((sum, question) => sum + practiceQuestionWeight(question), 0);
  const weightedPercent = total ? Math.round((points / total) * 100) : 0;
  return { practiceDone, passed, questions: questions.length, points, total, percent: practiceDone ? 100 : Math.min(99, weightedPercent) };
}

function learningProgress(completed: string[], practice: PracticeRecords) {
  const chapters = learningChapters.map((chapter) => chapterProgress(chapter.id, completed, practice));
  const points = chapters.reduce((sum, chapter) => sum + chapter.points, 0);
  const total = chapters.reduce((sum, chapter) => sum + chapter.total, 0);
  const completedChapters = chapters.filter((chapter) => chapter.practiceDone).length;
  const weightedPercent = total ? Math.round((points / total) * 100) : 0;
  return { points, total, percent: completedChapters === chapters.length ? 100 : Math.min(99, weightedPercent), completedChapters };
}

function requirementKey(course: DegreeCourse) {
  return course.choiceLabel ? `choice:${course.choiceLabel}` : course.code;
}

function verifiedDegreeCredits(records: DegreeRecords) {
  const counted = new Map<string, number>();
  degreeCourses.forEach((course) => {
    if (records[course.code] !== "complete") return;
    const key = requirementKey(course);
    counted.set(key, Math.max(counted.get(key) ?? 0, course.credits));
  });
  return Array.from(counted.values()).reduce((sum, credits) => sum + credits, 0);
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-track"><span className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function StatusMark({ done, active = false }: { done: boolean; active?: boolean }) {
  return <span className={`mission-status ${done ? "done" : active ? "active" : ""}`}>{done ? <Check size={17} strokeWidth={3} /> : active ? <Play size={13} fill="currentColor" /> : <span />}</span>;
}

function Sidebar({ view, setView, completed, practice, tutorOpen, onToggleTutor, onOpenInfo, student, localWorkspace, signInPath, signOutPath, syncLabel }: { view: View; setView: (view: View) => void; completed: string[]; practice: PracticeRecords; tutorOpen: boolean; onToggleTutor: () => void; onOpenInfo: () => void; student: StudentIdentity | null; localWorkspace: boolean; signInPath: string; signOutPath: string; syncLabel: string }) {
  const progress = learningProgress(completed, practice);
  return <aside className="sidebar">
    <button className="brand exceler-brand" onClick={() => setView("home")} aria-label="Exceler A home"><img className="sidebar-brand-logo" src="/exceler-a-mark-512.png" alt="" /></button>
    <nav className="primary-nav" aria-label="Education navigation">
      <p className="nav-section-label">Workspace</p>
      <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><House className="nav-mark" size={17} />Home</button>
      <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen className="nav-mark" size={17} />Overview</button>
      <button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch className="nav-mark" size={17} />Degree Map</button>
      <button className={view === "courses" ? "active" : ""} onClick={() => setView("courses")}><GraduationCap className="nav-mark" size={17} />Courses</button>
    </nav>
    {view === "course" && <div className="sidebar-active-course"><p className="nav-section-label">Active Course</p><button className="sidebar-course active" onClick={() => setView("course")}><div className="sidebar-course-top"><span className="course-glyph">J</span><span><small>CISC 1115 · Self-Study</small><b>{titleCase("Introduction to Programming Using Java")}</b></span></div><ProgressBar value={progress.percent} /><div className="split-meta"><span>{progress.completedChapters} / {learningChapters.length} chapters</span><span>{progress.percent}%</span></div></button></div>}
    <div className="sidebar-footer"><div className="sidebar-footer-actions"><button className="about-sidebar-button" onClick={onOpenInfo}><CircleHelp size={16} />About Exceler A</button></div>{student && !localWorkspace ? <div className="student-account"><UserRound size={15}/><span><b>{student.displayName}</b><small>Private student workspace</small></span><a href={signOutPath} target="_top">Sign out</a></div> : !localWorkspace ? <a className="student-sign-in" href={signInPath} target="_top"><UserRound size={15}/><span><b>Sign in with ChatGPT</b><small>Private sync, DegreeWorks, and tutor</small></span></a> : null}<div className={`sync-state ${student && !localWorkspace ? "cloud" : ""}`}><span />{syncLabel}</div>{localWorkspace || student ? <button className={`sidebar-tutor-button ${tutorOpen ? "open" : ""}`} onClick={onToggleTutor} aria-expanded={tutorOpen} aria-controls="exceler-tutor-drawer">{tutorOpen ? <X size={17} /> : <MessageCircle size={17} />}{tutorOpen ? "Close Tutor" : "Ask Exceler Tutor"}</button> : <a className="sidebar-tutor-button" href={signInPath} target="_top"><LockKeyhole size={16}/>Sign in for Tutor</a>}</div>
  </aside>;
}

function MobileNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><House size={18} /><span>Home</span></button><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen size={18} /><span>Overview</span></button><button className={view === "courses" ? "active" : ""} onClick={() => setView("courses")}><GraduationCap size={18} /><span>Courses</span></button><button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch size={18} /><span>Degree</span></button><button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 size={18} /><span>Java</span></button></nav>;
}

function HomeView({ completed, practice, snapshot, setView, onOpenInfo }: { completed: string[]; practice: PracticeRecords; snapshot: AuditSnapshot; setView: (view: View) => void; onOpenInfo: () => void }) {
  const progress = learningProgress(completed, practice);
  const nextChapter = authoredChapters.find((chapter) => chapterProgress(chapter.id, completed, practice).percent < 100) ?? authoredChapters[0];
  const nextState = chapterProgress(nextChapter.id, completed, practice);
  const hasAudit = snapshot.sourceName !== "No audit uploaded";
  return <main className="home-page">
    <section className="home-stage">
      <div className="home-title-lockup" aria-label="Exceler A"><b>EXCELER</b><img src="/exceler-a-mark-512.png" alt="A" /></div>
      <button className="home-about-button" onClick={onOpenInfo}><CircleHelp size={15} /><span>About</span></button>
      <div className="home-primary">
        <div className="home-intro">
          <p className="eyebrow">Self-Directed Academic Learning</p>
          <h1>Your Education,<br /><span>Under Your Direction.</span></h1>
          <p className="home-declaration">A self-directed learning system for the Brooklyn College Computer Science B.S. path—including its required supporting mathematics—with complete lessons, code-first practice, mastery testing, DegreeWorks mapping, and an AI tutor.</p>
          <p className="home-maker-line"><span>Built by</span><b>Daniel Lezhanskiy</b><i />Brooklyn College Computer Science</p>
          <p className="home-release-note"><span />More courses from the Brooklyn College Computer Science B.S. path are coming as they are built and reviewed.</p>
        </div>
        <button className="pinned-course-card" onClick={() => setView("course")}>
          <span className="pinned-course-glyph">J</span>
          <span className="pinned-course-copy"><small>Pinned Course · CISC 1115</small><b>{titleCase("Introduction to Programming Using Java")}</b><em>Next: {titleCase(nextChapter.title)}</em></span>
          <span className="pinned-course-progress"><strong>{progress.percent}%</strong><ProgressBar value={progress.percent} /><small>{progress.completedChapters} / {learningChapters.length} chapters cleared</small></span>
          <ArrowRight size={18} />
        </button>
      </div>
      <aside className="home-guidance-stack" aria-label="Learning guidance">
        <button className="home-guidance-card next-move" onClick={() => setView("course")}><span className="home-card-icon"><Play size={15} fill="currentColor" /></span><span><small>Recommended Next Move</small><b>{titleCase(nextChapter.title)}</b><em>{nextState.passed ? `${nextState.passed} of ${nextState.questions} practice questions passed` : "Study the lesson, then begin the practice"}</em></span><ArrowRight size={16} /></button>
        <button className="home-guidance-card degree-status" onClick={() => setView("degree")}><span className="home-card-icon"><GraduationCap size={17} /></span><span><small>{hasAudit ? "Degree Position" : "Degree Path"}</small><b>{hasAudit ? `${snapshot.degreeProgress}% Degree Progress` : "Brooklyn College CS B.S."}</b><em>{hasAudit ? `${snapshot.remainingCredits} total credits remaining · ${snapshot.majorRemaining} major credits remaining` : "Required courses, choice branches, and graduation gates"}</em></span><ArrowRight size={16} /></button>
        <div className="home-guidance-card learning-proof"><span className="home-card-icon"><Check size={17} strokeWidth={3} /></span><span><small>Demonstrated Learning</small><b>{progress.completedChapters} Chapters Cleared</b><em>Reading creates familiarity. Completed practice creates progress.</em></span></div>
      </aside>
      <div className="home-console-dock">
        <div className="home-console" aria-label="Current learning status">
          <div className="console-bar"><span /><span /><span /><small>learning_state.java</small></div>
          <div className="console-body"><code><i>String</i> project = <b>&quot;Exceler A&quot;</b>;</code><code><i>String</i> path = <b>&quot;Brooklyn College CS&quot;</b>;</code><code><i>int</i> chaptersCleared = <strong>{progress.completedChapters}</strong>;</code><code><i>boolean</i> keepBuilding = <em>true</em>;</code></div>
          <div className="console-progress"><span><small>CISC 1115</small><b>{progress.percent}%</b></span><ProgressBar value={progress.percent} /><p>{progress.completedChapters} of {learningChapters.length} chapters cleared</p></div>
        </div>
      </div>
    </section>
  </main>;
}

function Dashboard({ completed, practice, degreeRecords, setView }: { completed: string[]; practice: PracticeRecords; degreeRecords: DegreeRecords; setView: (view: View) => void }) {
  const progress = learningProgress(completed, practice);
  const nextChapter = authoredChapters.find((chapter) => chapterProgress(chapter.id, completed, practice).percent < 100) ?? authoredChapters[0];
  const routePreview = learningChapters.slice(0, 6);
  const credits = verifiedDegreeCredits(degreeRecords);
  const knownStatuses = Object.values(degreeRecords).filter((status) => status !== "unknown").length;
  return <main className="page-content education-home">
    <section className="education-hero">
      <div className="hero-copy"><p className="eyebrow accent-text">Continue Learning</p><span className="section-chip">{nextChapter.unit}</span><h2>{titleCase(nextChapter.title)}</h2><p>{nextChapter.description}</p><div className="hero-actions"><button className="primary-button" onClick={() => setView("course")}><Play size={14} fill="currentColor" />Open chapter</button><button className="soft-button" onClick={() => setView("degree")}>View degree path <ArrowRight size={14} /></button></div></div>
      <div className="hero-progress-card"><div className="progress-orbit" style={{ "--progress": `${progress.percent}%` } as React.CSSProperties}><div><b>{progress.percent}%</b><small>course</small></div></div><div><p className="eyebrow">CISC 1115</p><h3>Introduction to Programming Using Java</h3><span>{progress.completedChapters} of {learningChapters.length} chapters demonstrated</span><ProgressBar value={progress.percent} /><small className="progress-explainer">Only passed practice creates progress. Apply and challenge questions carry more weight.</small></div></div>
    </section>
    <section className="education-dashboard-grid">
      <div className="campaign-card rounded-panel"><div className="panel-heading"><div><p className="eyebrow">Course Route</p><h3>Chapter Progression</h3></div><span className="route-time">24 chapters mapped</span></div><div className="mission-list">{routePreview.map((chapter) => { const state = chapterProgress(chapter.id, completed, practice); const done = state.percent === 100; const active = chapter.id === nextChapter.id; return <div key={chapter.id} className={`mission-row ${done ? "completed" : active ? "current" : ""}`}><StatusMark done={done} active={active} /><button onClick={() => setView("course")}><b>{titleCase(chapter.title)}</b><small>{done ? "Chapter cleared" : `${state.passed}/${state.questions} practice passed`}</small></button><span className="mission-percent">{state.percent}%</span>{done && <span className="cleared-pill"><Check size={11} /> Cleared</span>}</div>; })}</div><button className="panel-footer-button" onClick={() => setView("course")}>Open all 24 chapters <ArrowRight size={14} /></button></div>
      <div className="degree-brief-card rounded-panel"><div className="panel-heading"><div><p className="eyebrow">Actual degree</p><h3>Brooklyn College CS B.S.</h3></div><GraduationCap size={22} /></div><div className="audit-state"><span className={knownStatuses ? "known" : ""}>{knownStatuses ? <Check size={22} /> : <CircleHelp size={22} />}</span><div><b>{knownStatuses ? `${credits} credits verified` : "Completion unknown"}</b><p>{knownStatuses ? `${knownStatuses} course statuses recorded.` : "Upload DegreeWorks so Exceler A does not guess."}</p></div></div><div className="degree-rule-list"><div><span>67.5</span><p><b>Audit major credits</b><small>Current DegreeWorks maximum</small></p></div><div><span>3×</span><p><b>Upper-level electives</b><small>CISC 3000–4899</small></p></div><div><span>C</span><p><b>Required CS minimum</b><small>Prerequisite courses</small></p></div></div><button className="secondary-button wide" onClick={() => setView("degree")}>Open degree tree & upload audit <ArrowRight size={14} /></button></div>
    </section>
  </main>;
}

function CoursesView({ completed, practice, onOpenCourse, math, onOpenMath }: { completed: string[]; practice: PracticeRecords; onOpenCourse: () => void; math: MathRecords; onOpenMath: (id: string) => void }) {
  const progress = learningProgress(completed, practice);
  const mathematics = mathCourses.filter(course => course.code.startsWith("MATH"));
  const computing = mathCourses.filter(course => course.code.startsWith("CISC"));
  const writtenCourseCard = (course: (typeof mathCourses)[number]) => {
    const state = mathCourseProgress(course, math[course.id] ?? emptyMathProgress());
    return <button className="course-library-card" key={course.id} onClick={() => onOpenMath(course.id)}><span className="course-glyph large">{course.code.startsWith("CISC") ? "∀" : course.id === "math1006" ? "x" : course.id === "math1011" ? "π" : "∫"}</span><span className="course-library-copy"><small>{course.code} · Self-Study</small><b>{course.title}</b><em>{courseChapters(course).length} chapters · {course.units.length} unit tests · {state.total} problems</em></span><span className="course-library-progress"><strong>{state.percent}%</strong><small>{state.chaptersCleared}/{state.chapterCount} chapters cleared</small><ProgressBar value={state.percent}/></span><ArrowRight size={17}/></button>;
  };
  return <main className="page-content courses-page">
    <header className="courses-heading"><div><p className="eyebrow accent-text">Course Library</p><h2>Courses</h2><p>Full lessons, written practice, chapter reviews, and unit mastery tests. Follow the math sequence from College Algebra through Calculus I.</p></div><div className="course-count"><b>{1 + mathCourses.length}</b><small>Courses Available</small></div></header>
    <section className="course-library-group"><header><div><p className="eyebrow">Mathematics</p><h3>Algebra → Precalculus → Calculus I</h3></div><span>{mathematics.length} courses</span></header><div className="course-library-list">{mathematics.map(writtenCourseCard)}</div></section>
    <section className="course-library-group"><header><div><p className="eyebrow">Computer &amp; Information Science</p><h3>Programming &amp; Discrete Structures</h3></div><span>{1 + computing.length} courses</span></header><div className="course-library-list">
      <button className="course-library-card" onClick={onOpenCourse}>
        <span className="course-glyph large">J</span>
        <span className="course-library-copy"><small>CISC 1115 · Self-Study</small><b>{titleCase("Introduction to Programming Using Java")}</b><em>{learningChapters.length} chapters · Lessons and demonstrated practice</em></span>
        <span className="course-library-progress"><strong>{progress.percent}%</strong><small>{progress.completedChapters} / {learningChapters.length} chapters cleared</small><ProgressBar value={progress.percent} /></span>
        <ArrowRight size={17} />
      </button>
      {computing.map(writtenCourseCard)}
    </div></section>
  </main>;
}

function tutorLessonReference(chapterId: string, sectionId: string) {
  const foundational = foundationalTutorReferences[chapterId]?.[sectionId];
  if (foundational) return foundational;
  return structuredLessonContent[chapterId]?.find((section) => section.id === sectionId) ?? "The current section is a practice session. Use the chapter description and progress as context.";
}

const SectionPracticeRendererContext = createContext<(sectionId: string) => React.ReactNode>(() => null);

function CourseView({ completed, practice, position, setPosition, onPracticeChange, onTutorContextChange }: { completed: string[]; practice: PracticeRecords; position: CoursePosition; setPosition: Dispatch<SetStateAction<CoursePosition>>; onPracticeChange: (chapterId: string, record: PracticeRecord) => void; onTutorContextChange: (context: TutorCourseContext) => void }) {
  const initialChapter = learningChapters.find((chapter) => chapter.id === position.chapterId) ?? learningChapters[0];
  const initialMasteryTest = unitMasteryTests.find((test) => test.afterChapterId === initialChapter.id);
  const initiallyViewingMastery = initialMasteryTest?.sectionId === position.sectionId;
  const initialSections = initiallyViewingMastery && initialMasteryTest ? [{ id: initialMasteryTest.sectionId, title: initialMasteryTest.title }] : initialChapter.sections;
  const initialSectionId = initialSections.some((section) => section.id === position.sectionId) ? position.sectionId : initialSections[0]?.id ?? "";
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapter.id);
  const [selectedMasteryTestId, setSelectedMasteryTestId] = useState<string | null>(initiallyViewingMastery ? initialMasteryTest?.id ?? null : null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(initialChapter.id);
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);
  const [mobileContentsOpen, setMobileContentsOpen] = useState(false);
  const [practiceTutorContext, setPracticeTutorContext] = useState<TutorPracticeContext | null>(null);
  const [masteryTutorContext, setMasteryTutorContext] = useState<TutorMasteryContext | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const scrollLockRef = useRef<string | null>(null);
  const scrollSaveTimerRef = useRef<number | null>(null);
  const initialPositionRef = useRef({ ...position, chapterId: initialChapter.id, sectionId: initialSectionId });
  const firstChapterLayoutRef = useRef(true);
  const selectedChapter = learningChapters.find((chapter) => chapter.id === selectedChapterId) ?? learningChapters[0];
  const selectedMasteryTest = unitMasteryTests.find((test) => test.id === selectedMasteryTestId);
  const visibleSections = useMemo(() => selectedMasteryTest ? [{ id: selectedMasteryTest.sectionId, title: selectedMasteryTest.title }] : selectedChapter.sections, [selectedMasteryTest, selectedChapter.sections]);
  const contentKey = selectedMasteryTest?.id ?? selectedChapter.id;
  const course = learningProgress(completed, practice);
  const chapter = chapterProgress(selectedChapter.id, completed, practice);
  const practicePlan = useMemo(() => chapterPracticePlan(selectedChapter.id), [selectedChapter.id]);
  const activeSectionTitle = titleCase(visibleSections.find((section) => section.id === activeSectionId)?.title ?? selectedMasteryTest?.title ?? selectedChapter.title);
  const resetReaderPosition = () => {
    setMobileContentsOpen(false);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 700px)").matches) readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      else readerRef.current?.scrollTo({ top: 0 });
    }));
  };

  useLayoutEffect(() => {
    scrollLockRef.current = null;
    const restore = firstChapterLayoutRef.current && initialPositionRef.current.chapterId === selectedChapter.id;
    firstChapterLayoutRef.current = false;
    const sectionId = restore && visibleSections.some((section) => section.id === initialPositionRef.current.sectionId) ? initialPositionRef.current.sectionId : visibleSections[0]?.id ?? "";
    const scrollTop = restore ? Math.max(0, initialPositionRef.current.scrollTop) : 0;
    setActiveSectionId(sectionId);
    if (readerRef.current) readerRef.current.scrollTop = scrollTop;
    setPosition((current) => ({ ...current, chapterId: selectedChapter.id, sectionId, scrollTop }));
  }, [contentKey, selectedChapter.id, setPosition, visibleSections]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const update = () => {
      if (scrollLockRef.current) return;
      const current = visibleSections.map((section) => { const element = reader.querySelector<HTMLElement>(`#${section.id}`); return element ? { id: section.id, top: element.getBoundingClientRect().top - reader.getBoundingClientRect().top } : null; }).filter((entry): entry is { id: string; top: number } => Boolean(entry)).filter((entry) => entry.top <= 125).at(-1);
      const sectionId = current?.id ?? visibleSections[0]?.id ?? "";
      if (current) setActiveSectionId(current.id);
      if (scrollSaveTimerRef.current !== null) window.clearTimeout(scrollSaveTimerRef.current);
      scrollSaveTimerRef.current = window.setTimeout(() => {
        const scrollTop = Math.max(0, Math.round(reader.scrollTop));
        setPosition((position) => position.chapterId === selectedChapter.id && position.sectionId === sectionId && position.scrollTop === scrollTop ? position : { ...position, chapterId: selectedChapter.id, sectionId, scrollTop });
        scrollSaveTimerRef.current = null;
      }, 150);
    };
    update(); reader.addEventListener("scroll", update, { passive: true });
    return () => {
      reader.removeEventListener("scroll", update);
      if (scrollSaveTimerRef.current !== null) window.clearTimeout(scrollSaveTimerRef.current);
      scrollSaveTimerRef.current = null;
    };
  }, [contentKey, selectedChapter.id, setPosition, visibleSections]);

  useEffect(() => {
    const section = visibleSections.find((item) => item.id === activeSectionId) ?? visibleSections[0];
    if (!section) return;
    onTutorContextChange({
      courseCode: "CISC 1115",
      courseTitle: "Introduction to Programming Using Java",
      courseProgress: course.percent,
      chapterId: selectedMasteryTest?.id ?? selectedChapter.id,
      chapterTitle: titleCase(selectedMasteryTest?.title ?? selectedChapter.title),
      chapterDescription: selectedMasteryTest?.description ?? selectedChapter.description,
      chapterProgress: chapter.percent,
      sectionId: section.id,
      sectionTitle: titleCase(section.title),
      lessonReference: selectedMasteryTest?.description ?? tutorLessonReference(selectedChapter.id, section.id),
      practicePassed: chapter.passed,
      practiceTotal: chapter.questions,
      activePractice: !selectedMasteryTest && (section.id.endsWith("practice") || Boolean(practicePlan.checkpoints[section.id])) && practiceTutorContext?.chapterId === selectedChapter.id ? practiceTutorContext : null,
      masteryAssessment: selectedMasteryTest ? masteryTutorContext : null,
    });
  }, [activeSectionId, chapter.passed, chapter.percent, chapter.questions, course.percent, masteryTutorContext, onTutorContextChange, practicePlan.checkpoints, practiceTutorContext, selectedChapter, selectedMasteryTest, visibleSections]);

  const selectChapter = (next: LearningChapter) => {
    setMasteryTutorContext(null);
    if (next.id === selectedChapterId) {
      if (selectedMasteryTestId) {
        setSelectedMasteryTestId(null);
        setExpandedChapterId(next.id);
        setActiveSectionId(next.sections[0]?.id ?? "");
        setPosition((current) => ({ ...current, chapterId: next.id, sectionId: next.sections[0]?.id ?? "", scrollTop: 0 }));
        resetReaderPosition();
        return;
      }
      setExpandedChapterId((current) => current === next.id ? null : next.id);
      return;
    }
    scrollLockRef.current = null;
    setActiveSectionId(next.sections[0]?.id ?? "");
    setExpandedChapterId(next.id);
    setSelectedChapterId(next.id);
    setSelectedMasteryTestId(null);
    setPosition((current) => ({ ...current, chapterId: next.id, sectionId: next.sections[0]?.id ?? "", scrollTop: 0 }));
    resetReaderPosition();
  };
  const selectMasteryTest = (test: (typeof unitMasteryTests)[number]) => {
    setMasteryTutorContext(null);
    const nextChapter = learningChapters.find((chapter) => chapter.id === test.afterChapterId) ?? selectedChapter;
    scrollLockRef.current = null;
    setSelectedChapterId(nextChapter.id);
    setSelectedMasteryTestId(test.id);
    setExpandedChapterId(null);
    setActiveSectionId(test.sectionId);
    setPosition((current) => ({ ...current, chapterId: nextChapter.id, sectionId: test.sectionId, scrollTop: 0 }));
    resetReaderPosition();
  };
  const scrollToSection = (sectionId: string) => {
    const reader = readerRef.current; const element = reader?.querySelector<HTMLElement>(`#${sectionId}`);
    if (!reader || !element) return;
    scrollLockRef.current = sectionId;
    setActiveSectionId(sectionId);
    setPosition((current) => ({ ...current, chapterId: selectedChapter.id, sectionId }));
    if (window.matchMedia("(max-width: 700px)").matches) {
      setMobileContentsOpen(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => element.scrollIntoView({ behavior: "smooth", block: "start" })));
      window.setTimeout(() => {
        if (scrollLockRef.current === sectionId) scrollLockRef.current = null;
        setPosition((current) => ({ ...current, chapterId: selectedChapter.id, sectionId, scrollTop: Math.max(0, Math.round(window.scrollY)) }));
      }, 1000);
      return;
    }
    const readerTop = reader.getBoundingClientRect().top;
    const sectionTop = element.getBoundingClientRect().top;
    reader.scrollTo({ top: Math.max(0, reader.scrollTop + sectionTop - readerTop - 22), behavior: "smooth" });
    window.setTimeout(() => {
      if (scrollLockRef.current === sectionId) scrollLockRef.current = null;
      setPosition((current) => ({ ...current, chapterId: selectedChapter.id, sectionId, scrollTop: Math.max(0, Math.round(reader.scrollTop)) }));
    }, 1600);
  };
  const saveActiveQuestion = useCallback((sectionId: string, questionId: string) => {
    setPosition((current) => current.questions[sectionId] === questionId ? current : { ...current, questions: { ...current.questions, [sectionId]: questionId } });
  }, [setPosition]);
  const checkpointEntries = Object.entries(practicePlan.checkpoints);
  const renderSectionPractice = (sectionId: string) => {
    const questionIds = practicePlan.checkpoints[sectionId];
    if (!questionIds?.length) return null;
    const checkpointNumber = checkpointEntries.findIndex(([id]) => id === sectionId) + 1;
    const practiceSectionId = `${sectionId}-check`;
    return <ChapterPractice chapterId={selectedChapter.id} questionIds={questionIds} variant="checkpoint" checkpointNumber={checkpointNumber} practiceSectionId={practiceSectionId} savedQuestionId={position.questions[practiceSectionId]} onActiveQuestionChange={saveActiveQuestion} record={practice[selectedChapter.id]} onChange={(record) => onPracticeChange(selectedChapter.id, record)} onTutorPracticeContextChange={setPracticeTutorContext} tutorActive={activeSectionId === sectionId} />;
  };

  return <main className="course-page continuous-course">
    <div className="continuous-layout">
      <div className="mobile-course-toolbar"><button aria-expanded={mobileContentsOpen} aria-controls="java-course-contents" onClick={() => setMobileContentsOpen((open) => !open)}><span><small>Course Contents</small><b>{activeSectionTitle}</b></span><ChevronDown size={18} /></button></div>
      <button className={`mobile-contents-backdrop ${mobileContentsOpen ? "visible" : ""}`} aria-label="Close course contents" onClick={() => setMobileContentsOpen(false)} />
      <aside className={`contents-rail ${mobileContentsOpen ? "mobile-open" : ""}`} id="java-course-contents" aria-label="Course contents">
        <button className="mobile-contents-close" onClick={() => setMobileContentsOpen(false)}><span>Course Contents</span><X size={18} /></button>
        <div className="contents-heading"><p className="eyebrow">Course Contents</p><span>{learningChapters.length} chapters</span></div>
        {learningChapters.map((item, index) => {
          const state = chapterProgress(item.id, completed, practice);
          const selected = item.id === selectedChapter.id && !selectedMasteryTest;
          const open = item.id === expandedChapterId;
          const done = state.percent === 100;
          const itemPracticePlan = chapterPracticePlan(item.id);
          const passedQuestionIds = new Set(practice[item.id]?.passed ?? []);
          const itemMasteryTest = unitMasteryTests.find((test) => test.afterChapterId === item.id);
          const startsUnit = index === 0 || learningChapters[index - 1].unit !== item.unit;
          return <Fragment key={item.id}>{startsUnit && <p className="course-unit-label">{item.unit}</p>}<div className={`contents-section ${selected ? "selected" : ""} ${open ? "open" : ""} ${done ? "completed" : ""}`}>
            <button className="contents-section-button" aria-expanded={open} onClick={() => selectChapter(item)}>
              <span className="chapter-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="chapter-copy"><b>{titleCase(item.title)}</b></span>
              <span className="chapter-row-actions">{done && <span className="chapter-done-badge" role="img" aria-label="Chapter complete"><Check size={12} strokeWidth={3.2} /></span>}<ChevronDown size={15} /></span>
            </button>
            <div className={`chapter-subsections-shell ${open ? "expanded" : ""}`} aria-hidden={!open}><div><div className="part-list">{item.sections.map((section, sectionIndex) => {
              const sectionQuestionIds = section.id.endsWith("practice") ? itemPracticePlan.review : itemPracticePlan.checkpoints[section.id] ?? [];
              const sectionPassed = sectionQuestionIds.filter((questionId) => passedQuestionIds.has(questionId)).length;
              const sectionDone = sectionQuestionIds.length > 0 && sectionPassed === sectionQuestionIds.length;
              return <button key={section.id} tabIndex={open ? 0 : -1} className={`${open && activeSectionId === section.id ? "active" : ""} ${sectionDone ? "completed" : ""}`} onClick={() => open && scrollToSection(section.id)}><span className="part-index">{String(sectionIndex + 1).padStart(2, "0")}</span><b>{titleCase(section.title)}</b>{sectionDone ? <span className="part-done" role="img" aria-label="Section questions complete"><Check size={12} strokeWidth={3.2} /></span> : sectionQuestionIds.length > 0 ? <small>{sectionPassed}/{sectionQuestionIds.length}</small> : null}</button>;
            })}</div></div></div>
          </div>{itemMasteryTest && (() => { const testPassed = practice[itemMasteryTest.id]?.passed?.filter((questionId) => itemMasteryTest.questions.some((question) => question.id === questionId)).length ?? 0; const testDone = testPassed === itemMasteryTest.questions.length; const testSelected = selectedMasteryTest?.id === itemMasteryTest.id; return <div className={`contents-section unit-test-root ${testSelected ? "selected" : ""} ${testDone ? "completed" : ""}`}><button className="contents-section-button" onClick={() => selectMasteryTest(itemMasteryTest)}><span className="chapter-number"><GraduationCap size={16} /></span><span className="chapter-copy"><b>{titleCase(itemMasteryTest.title)}</b><small>Unit-level assessment</small></span><span className="chapter-row-actions">{testDone ? <span className="chapter-done-badge" role="img" aria-label="Unit test complete"><Check size={12} strokeWidth={3.2} /></span> : <small>{testPassed}/{itemMasteryTest.questions.length}</small>}</span></button></div>; })()}</Fragment>;
        })}
        <div className="section-progress-card"><div><span>Course Completion</span><b>{course.percent}%</b></div><ProgressBar value={course.percent} /><small>{course.completedChapters} / {learningChapters.length} chapters cleared</small><p>Only passed practice creates course progress. A chapter clears when every exercise passes.</p></div>
      </aside>
      <div className="chapter-reader" ref={readerRef}>{selectedMasteryTest ? <article className="chapter-article chapter-swap unit-test-article" key={selectedMasteryTest.id}>
        <header className="chapter-cover unit-test-cover"><p className="eyebrow">{selectedMasteryTest.unit}</p><h1>{titleCase(selectedMasteryTest.title)}</h1><p>{selectedMasteryTest.description}</p></header>
        <UnitMasteryAssessment test={selectedMasteryTest} record={practice[selectedMasteryTest.id]} onChange={(record) => onPracticeChange(selectedMasteryTest.id, record)} onTutorContextChange={setMasteryTutorContext} />
      </article> : <article className="chapter-article chapter-swap" key={selectedChapter.id}><header className="chapter-cover"><h1>{titleCase(selectedChapter.title)}</h1><p>{selectedChapter.description}</p></header><SectionPracticeRendererContext.Provider value={renderSectionPractice}><ChapterLessonContent chapterId={selectedChapter.id} /></SectionPracticeRendererContext.Provider>{(() => { const practiceSectionId = selectedChapter.sections.at(-1)?.id ?? `${selectedChapter.id}-practice`; return <ChapterPractice chapterId={selectedChapter.id} questionIds={practicePlan.review} variant="review" practiceSectionId={practiceSectionId} savedQuestionId={position.questions[practiceSectionId]} onActiveQuestionChange={saveActiveQuestion} record={practice[selectedChapter.id]} onChange={(record) => onPracticeChange(selectedChapter.id, record)} onTutorPracticeContextChange={setPracticeTutorContext} tutorActive={activeSectionId.endsWith("practice")} />; })()}</article>}</div>
    </div>
  </main>;
}

function LearningSectionBlock({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  const renderSectionPractice = useContext(SectionPracticeRendererContext);
  return <section className="lesson-section" id={id} data-learning-section><div className="lesson-section-heading"><p className="eyebrow">{eyebrow}</p><h2>{titleCase(title)}</h2></div>{children}{renderSectionPractice(id)}</section>;
}

function CodeExample({ label, code }: { label: string; code: string }) {
  return <div className="teaching-code lesson-code"><div><span>Java</span><small>{label}</small><CopyCodeButton code={code} /></div><pre><JavaCode code={code} /></pre></div>;
}

function DataTypeLesson({ type, category, meaning, description, declaration, explanation, values, rule }: { type: string; category: string; meaning: string; description: string; declaration: string; explanation: string; values: string[]; rule: React.ReactNode }) {
  return <article className="data-type-lesson">
    <div className="data-type-copy">
      <span>{category}</span>
      <h3><code>{type}</code><b>{meaning}</b></h3>
      <p>{description}</p>
      <div className="data-type-values"><small>More valid values</small><div>{values.map((value) => <code key={value}>{value}</code>)}</div></div>
    </div>
    <div className="data-type-example">
      <small>Example declaration</small>
      <CopyCodeButton code={declaration} />
      <pre><code>{declaration}</code></pre>
      <p><b>Read it:</b> {explanation}</p>
      <p className="data-type-rule">{rule}</p>
    </div>
  </article>;
}

function ChapterLessonContent({ chapterId }: { chapterId: string }) {
  const renderSectionPractice = useContext(SectionPracticeRendererContext);
  if (chapterId === "variables-data-types") return <>
    <LearningSectionBlock id="variables-overview" eyebrow="Direct definition" title="What is a variable?"><p className="lesson-lead">A variable is a named location in memory used to store a value. The name gives your program a readable way to find and use that value later.</p><CodeExample label="A first variable" code="int age = 25;" /><aside className="key-idea"><Sparkles size={17} /><p><b>The variable and its value are not the same thing.</b><span><code>age</code> is the reusable name. <code>25</code> is the value currently stored under that name.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="variables-declaration" eyebrow="Break it down" title="Declaration anatomy"><p className="lesson-lead">The general pattern is <code>type variableName = value;</code>. A <b>statement</b> is one complete instruction to Java. Read this statement from left to right: what kind of value, what name, and what value to store.</p><CodeExample label="General syntax" code="type variableName = value;" /><div className="declaration-grid"><div><code>int</code><b>Data type</b><small>Only whole numbers fit here</small></div><div><code>age</code><b>Variable name</b><small>The label used later</small></div><div><code>=</code><b>Assignment</b><small>Stores the right side</small></div><div><code>25</code><b>Value</b><small>The actual data</small></div><div><code>;</code><b>Statement end</b><small>Required punctuation</small></div></div><CodeExample label="More declarations" code={'String name = "Daniel";\ndouble height = 6.2;\nboolean hungry = true;\nchar grade = \'A\';'} /></LearningSectionBlock>
    <LearningSectionBlock id="variables-types" eyebrow="Five useful types" title="Java data types"><p className="lesson-lead">A data type tells Java what kind of value a variable is allowed to store. Learn each type by seeing a complete declaration—not just a list of values. <b>Primitive type</b> is Java's name for a simple built-in value type. <code>String</code> is a <b>reference type</b>; you only need to know how to declare and use it for now.</p><div className="data-type-lessons">
      <DataTypeLesson type="int" category="Primitive Type" meaning="Whole Numbers" description="Use int when the value should be a whole number with no decimal point, such as a score, age, or number of lives." declaration="int score = 100;" explanation="create a variable named score and store the whole number 100 in it." values={["5", "100", "-25"]} rule={<>Negative whole numbers are valid. A value such as <code>2.5</code> is not an <code>int</code>.</>} />
      <DataTypeLesson type="double" category="Primitive Type" meaning="Decimal Numbers" description="Use double when the value may contain a decimal point, such as a price, height, or measurement." declaration="double price = 9.99;" explanation="create a variable named price and store the decimal number 9.99 in it." values={["3.14", "2.5", "100.001"]} rule={<>A whole number can also fit in a <code>double</code>, but use <code>int</code> when decimals are not needed.</>} />
      <DataTypeLesson type="boolean" category="Primitive Type" meaning="True or False" description="Use boolean for a yes-or-no condition: whether a game is over, a door is open, or a user is logged in." declaration="boolean gameOver = false;" explanation="create a variable named gameOver and store the boolean value false in it." values={["true", "false"]} rule={<><code>true</code> and <code>false</code> never use quotation marks. Java treats <code>"false"</code> as text instead.</>} />
      <DataTypeLesson type="char" category="Primitive Type" meaning="One Character" description="Use char when you need exactly one letter, number symbol, or punctuation mark—not a full word." declaration="char letter = 'A';" explanation="create a variable named letter and store the single character A in it." values={["'A'", "'7'", "'?'"]} rule={<>A <code>char</code> uses single quotes. <code>'AB'</code> is invalid because it contains two characters.</>} />
      <DataTypeLesson type="String" category="Reference Type" meaning="Text" description="Use String for text of any length, including names, messages, and characters that should be treated as text." declaration={'String name = "Daniel";'} explanation="create a variable named name and store the text Daniel in it." values={['"Hello"', '"Java"', '"123"']} rule={<><code>String</code> starts with a capital S and uses double quotes. Even <code>"123"</code> is text, not a number.</>} />
    </div><div className="rule-callout"><b>Quotation marks change the type</b><p><code>123</code> is a number, but <code>"123"</code> is a String. <code>'A'</code> is a char, while <code>"A"</code> is a String.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-naming" eyebrow="Readable code" title="Variable naming"><p className="lesson-lead">Use names that explain what a value means. Java commonly uses <b>camelCase</b>: begin lowercase, then capitalize each additional word.</p><div className="naming-compare"><div><span>GOOD</span><code>playerHealth</code><code>firstName</code><code>carSpeed</code></div><div><span>AVOID</span><code>x</code><code>thing</code><code>asdf</code></div></div><ul className="lesson-rules"><li>Names cannot contain spaces.</li><li>Names cannot begin with a number.</li><li>Names are case-sensitive: <code>age</code> and <code>Age</code> are different.</li><li>Do not use Java keywords such as <code>int</code> as a name.</li></ul></LearningSectionBlock>
    <LearningSectionBlock id="variables-changing" eyebrow="Reassignment" title="Changing a variable"><p className="lesson-lead">Variables can be updated. Declare the variable once with its type; later assignments reuse only the name.</p><CodeExample label="One variable, three stored values" code={'int lives = 3;\nlives = 2;\nlives = 1;'} /><aside className="key-idea"><RotateCcw size={17} /><p><b>The variable stays the same; only its value changes.</b><span>Writing <code>int lives</code> again would be a second declaration, not an update.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="variables-printing" eyebrow="See the value" title="Printing output"><p className="lesson-lead"><code>System.out.println</code> prints one line. Put text in double quotes; put a variable name without quotes when you want its stored value.</p><div className="comparison-code"><pre><small>PRINT TEXT</small><code>System.out.println("Hello");</code><b>Hello</b></pre><pre><small>PRINT A VARIABLE</small><code>{'int age = 25;\nSystem.out.println(age);'}</code><b>25</b></pre></div><div className="rule-callout"><b>Quotes decide what Java prints</b><p><code>println(age)</code> prints the value 25. <code>println("age")</code> literally prints the word age.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-concatenation" eyebrow="Joining text" title="Concatenation"><p className="lesson-lead">Use <code>+</code> to join text and variables into one output line. This is called concatenation.</p><CodeExample label="A greeting built from a variable" code={'String name = "Daniel";\nSystem.out.println("Hello " + name);'} /><div className="output-card"><span>OUTPUT</span><code>Hello Daniel</code></div><p className="lesson-note">Spaces are not added automatically. The space after <code>Hello</code> exists because it is inside <code>"Hello "</code>.</p></LearningSectionBlock>
    <LearningSectionBlock id="variables-program" eyebrow="Put it together" title="A complete program"><p className="lesson-lead">This program declares four variables and prints each stored value.</p><CodeExample label="Variables working inside Main" code={'public class Main {\n    public static void main(String[] args) {\n        String name = "Daniel";\n        int age = 25;\n        double height = 6.2;\n        boolean likesJava = true;\n\n        System.out.println(name);\n        System.out.println(age);\n        System.out.println(height);\n        System.out.println(likesJava);\n    }\n}'} /><div className="rule-callout muted"><b>Ignore the wrapper for now</b><p><code>public class Main</code> and <code>public static void main(String[] args)</code> are required structure. We will learn what they mean later.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="variables-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />Every variable has a data type.</li><li><Check size={16} />A variable name points to a stored value.</li><li><Check size={16} /><code>=</code> assigns the value on the right.</li><li><Check size={16} />Statements end with <code>;</code>.</li><li><Check size={16} /><code>String</code> uses double quotes; <code>char</code> uses single quotes.</li><li><Check size={16} />Reassignment changes a variable without declaring it again.</li><li><Check size={16} /><code>+</code> joins text and variables when a String is involved.</li></ul></LearningSectionBlock>
  </>;

  if (chapterId === "operators-expressions") return <>
    <LearningSectionBlock id="operators-arithmetic" eyebrow="Core operations" title="Arithmetic operators"><p className="lesson-lead">An operator tells Java to perform an action on values. The values an operator works with are called <b>operands</b>. An <b>expression</b> is code that produces a value. Arithmetic expressions produce a new number; they do not change a variable unless you assign the result.</p><div className="operator-grid"><div><code>+</code><b>Add</b><small>8 + 2 → 10</small></div><div><code>-</code><b>Subtract</b><small>8 - 2 → 6</small></div><div><code>*</code><b>Multiply</b><small>8 * 2 → 16</small></div><div><code>/</code><b>Divide</b><small>8 / 2 → 4</small></div><div><code>%</code><b>Remainder</b><small>8 % 3 → 2</small></div></div><CodeExample label="Calculate, then store the result" code={'int price = 12;\nint quantity = 3;\nint subtotal = price * quantity;\n\nSystem.out.println(subtotal);  // 36'} /><div className="rule-callout"><b>The expression and assignment do different jobs</b><p><code>price * quantity</code> calculates 36. The <code>=</code> then stores that result in <code>subtotal</code>. Text after <code>{'//'}</code> is a <b>comment</b>: Java ignores it, so it can explain code without changing the program.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-division" eyebrow="A Java-specific trap" title="Integer vs decimal division"><p className="lesson-lead">Division depends on the types of the values being divided. When both operands are integers, Java performs integer division. Any fractional part of the result is discarded.</p><div className="comparison-code"><pre><small>INTEGER DIVISION</small><code>10 / 3</code><b>3</b></pre><pre><small>DECIMAL DIVISION</small><code>10.0 / 3</code><b>3.3333333333333335</b></pre></div><CodeExample label="The variable type alone does not rescue the decimal" code={'double first = 10 / 3;    // stores 3.0\ndouble second = 10.0 / 3; // stores 3.333...'} /><CodeExample label="Convert an existing int for one calculation" code={'int sum = 5;\nint count = 2;\ndouble average = (double) sum / count;  // 2.5'} /><aside className="key-idea"><Sparkles size={17} /><p><b>Java decides how to divide before it stores the answer.</b><span>Make at least one operand a <code>double</code> when you need a decimal result. Writing <code>(double) sum</code> is a <b>cast</b>: for that calculation, Java treats the stored integer as a decimal value.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="operators-modulus" eyebrow="Keep the remainder" title="Modulus"><p className="lesson-lead">The modulus operator <code>%</code> returns the remainder left after integer division. Read <code>17 % 5</code> as “the remainder when 17 is divided by 5.”</p><div className="operator-grid remainder-grid"><div><code>10 % 3</code><b>1</b><small>3 fits three times</small></div><div><code>14 % 2</code><b>0</b><small>Evenly divisible</small></div><div><code>17 % 5</code><b>2</b><small>15 used, 2 left</small></div><div><code>5 % 8</code><b>5</b><small>8 does not fit once</small></div></div><CodeExample label="Store a remainder" code={'int cookies = 17;\nint people = 5;\nint leftovers = cookies % people;\n\nSystem.out.println(leftovers);  // 2'} /><div className="rule-callout"><b>Why zero matters</b><p>If <code>number % 2</code> is <code>0</code>, the number is even. Modulus is also useful for cycles, grouping, and determining whether division comes out evenly.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-precedence" eyebrow="Evaluation order" title="Precedence & parentheses"><p className="lesson-lead">Java does not simply calculate every expression from left to right. Parentheses run first; then multiplication, division, and modulus; then addition and subtraction.</p><div className="comparison-code"><pre><small>DEFAULT ORDER</small><code>4 + 3 * 2</code><b>10</b></pre><pre><small>PARENTHESES FIRST</small><code>(4 + 3) * 2</code><b>14</b></pre></div><div className="expression-steps"><div><span>1</span><code>18 - 4 * 2 + 12 / 3</code><small>Original expression</small></div><div><span>2</span><code>18 - 8 + 4</code><small>Multiply and divide</small></div><div><span>3</span><code>10 + 4</code><small>Equal precedence: left to right</small></div><div><span>4</span><code>14</code><small>Final result</small></div></div><p className="lesson-note">Use parentheses when they clarify your intention, even when Java would already produce the same result.</p></LearningSectionBlock>
    <LearningSectionBlock id="operators-increment" eyebrow="Change by one" title="Increment & decrement"><p className="lesson-lead"><code>++</code> means add one and <code>--</code> means subtract one. The basic update is simple. The part that needs special attention is what happens when one of these operators also supplies a value to another variable on the same line.</p><h3 className="lesson-subheading">Three ways to add one</h3><p className="lesson-lead">Starting with <code>lives = 4</code>, each statement below changes lives to 5 when used by itself.</p><CodeExample label="Equivalent standalone updates" code={'lives = lives + 1;  // full assignment\nlives += 1;           // compound assignment\nlives++;              // increment'} /><div className="rule-callout"><b>Read these as three alternatives—not three lines to run in a row.</b><p>Each form reads the current value, adds one, and stores the result back in the same variable. Similarly, <code>lives = lives - 1</code>, <code>lives -= 1</code>, and <code>lives--</code> each subtract one.</p></div><h3 className="lesson-subheading">When ++ stands alone</h3><p className="lesson-lead">There is only one value to track when the increment is its own statement. No second variable receives anything.</p><CodeExample label="A straightforward update" code={'int score = 10;\nscore++;\nSystem.out.println(score);'} /><div className="output-card"><span>OUTPUT</span><code>11</code></div><aside className="key-idea"><Sparkles size={17} /><p><b>On its own line, the placement does not change the final value.</b><span><code>score++;</code> and <code>++score;</code> both leave score one higher. Prefix versus postfix matters only when the produced value is used inside a larger expression.</span></p></aside><h3 className="lesson-subheading">Why int y = x++ is different</h3><p className="lesson-lead">This single line asks Java to do two jobs: assign a value to <code>y</code> and increase <code>x</code>. Postfix <code>x++</code> says: give out the old value first, then update x.</p><div className="expression-steps"><div><span>1</span><code>int x = 4;</code><small>x begins at 4</small></div><div><span>2</span><code>int y = x;</code><small>y receives the old 4</small></div><div><span>3</span><code>x = x + 1;</code><small>x becomes 5</small></div><div><span>4</span><code>x is 5 · y is 4</code><small>Final stored values</small></div></div><h3 className="lesson-subheading">Prefix: ++x updates first</h3><p className="lesson-lead">When <code>++</code> comes before the variable, it is called <b>prefix increment</b>. Read <code>++x</code> as “increase x first, then use its new value.” In <code>int y = ++x;</code>, x changes before anything is copied into y.</p><CodeExample label="Prefix increment supplies the new value" code={'int x = 4;\nint y = ++x;\nSystem.out.println(x + " " + y);'} /><div className="expression-steps"><div><span>1</span><code>int x = 4;</code><small>x begins at 4</small></div><div><span>2</span><code>x = x + 1;</code><small>++x changes x to 5 first</small></div><div><span>3</span><code>int y = x;</code><small>y receives the new 5</small></div><div><span>4</span><code>x is 5 · y is 5</code><small>Both variables now store 5</small></div></div><div className="output-card"><span>OUTPUT</span><code>5 5</code></div><h3 className="lesson-subheading">Postfix vs prefix</h3><p className="lesson-lead">The side containing <code>++</code> tells you whether Java updates before or after supplying a value to the rest of the expression.</p><div className="comparison-code"><pre><small>POSTFIX: USE, THEN CHANGE</small><code>{'int x = 4;\nint y = x++;'}</code><b>x is 5, y is 4</b></pre><pre><small>PREFIX: CHANGE, THEN USE</small><code>{'int x = 4;\nint y = ++x;'}</code><b>x is 5, y is 5</b></pre></div><CodeExample label="The same timing rule applies to decrement" code={'int lives = 3;\nint oldLives = lives--;  // oldLives 3, lives 2\n\nint energy = 3;\nint newEnergy = --energy; // energy 2, newEnergy 2'} /><div className="rule-callout"><b>The space in the print statement changes nothing.</b><p>In <code>System.out.println(x + " " + y)</code>, <code>" "</code> only places a visible space between the two printed values. It does not affect when x changes.</p></div><h3 className="lesson-subheading">A reliable tracing method</h3><div className="expression-checklist"><div><span>1</span><p><b>Write the starting value</b><small>Record x before the line runs.</small></p></div><div><span>2</span><p><b>Find prefix or postfix</b><small>Postfix supplies the old value; prefix updates first.</small></p></div><div><span>3</span><p><b>Record the receiving value</b><small>Write what y, savedScore, or another variable receives.</small></p></div><div><span>4</span><p><b>Record the final stored value</b><small>Only then write where x finishes.</small></p></div></div><aside className="key-idea"><RotateCcw size={17} /><p><b>Never try to hold both results in your head.</b><span>Write two separate facts: what value the expression supplied, and what value the updated variable stores afterward.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="operators-assignment" eyebrow="Update stored state" title="Compound assignment"><p className="lesson-lead">Compound assignment performs an operation using the current value, then stores the result back in the same variable.</p><div className="operator-grid"><div><code>+=</code><b>Add, assign</b><small>score += 5</small></div><div><code>-=</code><b>Subtract, assign</b><small>lives -= 1</small></div><div><code>*=</code><b>Multiply, assign</b><small>coins *= 2</small></div><div><code>/=</code><b>Divide, assign</b><small>team /= 3</small></div><div><code>%=</code><b>Remainder, assign</b><small>value %= 4</small></div></div><CodeExample label="Follow the stored value" code={'int energy = 10;\nenergy += 5;  // 15\nenergy *= 2;  // 30\nenergy -= 4;  // 26'} /><h3 className="lesson-subheading">The right side can be an expression</h3><p className="lesson-lead">Java evaluates the entire expression on the right first. It then combines that result with the variable’s current value and stores the new value.</p><CodeExample label="Calculate the bonus before updating score" code={'int score = 10;\nint bonus = 4;\n\nscore += bonus * 2;  // score += 8\nSystem.out.println(score);  // 18'} /><div className="rule-callout"><b>Keep tracking the stored value.</b><p><code>score += bonus * 2</code> means <code>score = score + (bonus * 2)</code>. Multiplication still follows the precedence rules you learned earlier.</p></div><aside className="key-idea"><RotateCcw size={17} /><p><b>The operator comes before the equals sign.</b><span>Write <code>+=</code>, not <code>=+</code>. Read it as “add, then assign.”</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="operators-concatenation" eyebrow="A crucial edge case" title="String + number behavior"><p className="lesson-lead">The <code>+</code> symbol adds numbers, but it joins values when a String is involved. Operations with the same precedence are evaluated from left to right.</p><div className="expression-steps string-order"><div><span>1</span><code>System.out.println(2 + 3);</code><small>5</small></div><div><span>2</span><code>System.out.println("Total: " + 2 + 3);</code><small>Total: 23</small></div><div><span>3</span><code>System.out.println("Total: " + (2 + 3));</code><small>Total: 5</small></div><div><span>4</span><code>System.out.println(2 + 3 + " total");</code><small>5 total</small></div></div><div className="rule-callout"><b>Find the first String</b><p>Before Java reaches a String, numeric <code>+</code> still adds. After Java starts building text, later values are appended unless parentheses force arithmetic first.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-evaluation" eyebrow="Put the rules together" title="Evaluating expressions"><p className="lesson-lead">For a longer expression, do not guess. Mark the parentheses, calculate high-precedence operations, work left to right among ties, and only then follow String concatenation.</p><div className="expression-checklist"><div><span>1</span><p><b>Find parentheses</b><small>Evaluate the innermost group first.</small></p></div><div><span>2</span><p><b>Handle *, /, and %</b><small>For ties, move left to right.</small></p></div><div><span>3</span><p><b>Handle + and -</b><small>Continue left to right.</small></p></div><div><span>4</span><p><b>Store or print</b><small>Watch for the first String when + appears.</small></p></div></div><CodeExample label="A complete resource calculation" code={'int missions = 4;\nint reward = 15;\nint multiplier = 2;\nint fee = 7;\n\nint balance = missions * reward * multiplier - fee;\nSystem.out.println("Balance: " + balance + " credits");'} /><div className="output-card"><span>OUTPUT</span><code>Balance: 113 credits</code></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} /><code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, and <code>%</code> create numeric results.</li><li><Check size={16} />The values an operator works with are operands.</li><li><Check size={16} />Integer division discards the decimal part; a double operand keeps it.</li><li><Check size={16} /><code>(double)</code> casts a value for decimal calculation.</li><li><Check size={16} /><code>{'//'}</code> begins a comment that Java ignores.</li><li><Check size={16} /><code>%</code> returns the remainder.</li><li><Check size={16} />Parentheses run before <code>* / %</code>, which run before <code>+ -</code>.</li><li><Check size={16} /><code>++</code> and <code>--</code> change a value by one.</li><li><Check size={16} />Postfix produces the old value before updating; prefix updates before producing the value.</li><li><Check size={16} /><code>+=</code>, <code>-=</code>, <code>*=</code>, <code>/=</code>, and <code>%=</code> update and assign.</li><li><Check size={16} />Equal-precedence operators are evaluated left to right.</li><li><Check size={16} />Once a String is involved, <code>+</code> concatenates unless parentheses force arithmetic first.</li></ul></LearningSectionBlock>
  </>;

  const structuredSections = structuredLessonContent[chapterId];
  if (structuredSections) return <StructuredLesson sections={structuredSections} renderAfterSection={renderSectionPractice} />;

  return null;
}

const emptyPracticeRecord = (): PracticeRecord => ({ answers: {}, attempts: {}, hints: [], passed: [] });

function UnitMasteryAssessment({ test, record: savedRecord, onChange, onTutorContextChange }: { test: (typeof unitMasteryTests)[number]; record?: PracticeRecord; onChange: (record: PracticeRecord) => void; onTutorContextChange: (context: TutorMasteryContext) => void }) {
  const emptyRecord = useMemo(() => emptyPracticeRecord(), []);
  const record = savedRecord ?? emptyRecord;
  const questionDefinitions = useMemo(() => test.questions.map((question) => ({
    id: question.id,
    title: question.title,
    prompt: question.prompt,
    starterCode: question.code,
    referenceSolution: question.answer ?? "",
    validate: question.validate,
  })), [test]);
  const recoveredAttempt = useMemo(() => {
    if (record.masteryAttempts?.length || !(record.submissions ?? 0) || record.lastScore === undefined) return null;
    return recoverLegacyMasteryAttempt({
      testId: test.id,
      questions: questionDefinitions,
      answers: record.answers,
      passedQuestionIds: record.passed,
      submissionCount: record.submissions ?? 1,
      lastScore: record.lastScore,
    });
  }, [questionDefinitions, record.answers, record.lastScore, record.masteryAttempts, record.passed, record.submissions, test.id]);
  const masteryAttempts = useMemo(() => record.masteryAttempts?.length ? record.masteryAttempts : recoveredAttempt ? [recoveredAttempt] : [], [record.masteryAttempts, recoveredAttempt]);
  const [reviewedAttemptId, setReviewedAttemptId] = useState<string | null>(masteryAttempts.at(-1)?.id ?? null);
  const activeTest = masteryAttempts.length === 0 || Boolean(record.masteryRetakeActive);
  const assessmentRef = useRef<HTMLElement | null>(null);
  const previousActiveTestRef = useRef(activeTest);
  const validQuestionIds = useMemo(() => new Set(test.questions.map((question) => question.id)), [test.questions]);
  const currentMasteryIds = record.passed.filter((questionId) => validQuestionIds.has(questionId));
  const currentMastery = new Set(currentMasteryIds).size;
  const reviewedAttempt = masteryAttempts.find((attempt) => attempt.id === reviewedAttemptId) ?? masteryAttempts.at(-1) ?? null;
  const firstAttempt = masteryAttempts[0] ?? null;
  const retrySource = masteryAttempts.find((attempt) => attempt.id === record.masteryRetry?.sourceAttemptId);
  const retrying = Boolean(record.masteryRetakeActive && retrySource && record.masteryRetry?.questionIds.length);
  const activeQuestions = useMemo(() => test.questions.filter((question) => !retrying || record.masteryRetry?.questionIds.includes(question.id)).map((question) => {
    const saved = retrying ? retrySource?.questionResults.find((result) => result.questionId === question.id) : null;
    return saved ? { ...question, title: saved.title, prompt: saved.prompt, code: saved.starterCode ?? undefined } : question;
  }), [test.questions, retrying, record.masteryRetry, retrySource]);
  const allAnswered = activeQuestions.length > 0 && activeQuestions.every((question) => String(record.answers[question.id] ?? "").trim());
  const nextAttemptNumber = Math.max(0, ...masteryAttempts.map((attempt) => attempt.attemptNumber)) + 1;
  const liveGrades = useMemo(() => new Map((reviewedAttempt?.questionResults ?? []).map((result) => {
    const question = questionDefinitions.find((item) => item.id === result.questionId);
    return [result.questionId, question ? currentMasteryGrade(question, result.submittedAnswer) : null];
  })), [reviewedAttempt, questionDefinitions]);

  useEffect(() => {
    if (!recoveredAttempt || record.masteryAttempts?.length) return;
    onChange({ ...record, masteryAttempts: [recoveredAttempt], masteryRetakeActive: false });
  }, [onChange, record, recoveredAttempt]);

  useLayoutEffect(() => {
    if (previousActiveTestRef.current !== activeTest) assessmentRef.current?.scrollIntoView({ block: "start" });
    previousActiveTestRef.current = activeTest;
  }, [activeTest]);

  const tutorContext = useMemo<TutorMasteryContext>(() => {
    if (activeTest) {
      return {
        assessmentId: test.id,
        assessmentTitle: test.title,
        mode: retrying ? "question_retry" : "active_test",
        retryQuestionIds: retrying ? activeQuestions.map((question) => question.id) : undefined,
        questionTotal: test.questions.length,
        firstAttemptScore: firstAttempt?.score ?? null,
        currentMastery,
        answerRevealPolicy: "withhold_reference_solutions",
        questions: activeQuestions.map((question) => {
          const learnerAnswer = record.answers[question.id] ?? "";
          return {
            questionId: question.id,
            questionNumber: test.questions.findIndex((item) => item.id === question.id) + 1,
            title: question.title,
            prompt: question.prompt,
            starterCode: question.code ?? null,
            learnerAnswer: learnerAnswer.slice(0, 12_000),
            answerTruncated: learnerAnswer.length > 12_000,
            result: "not_submitted" as const,
            graderFeedback: null,
            referenceSolution: null,
          };
        }),
        reviewedAttempt: null,
      };
    }

    return {
      assessmentId: test.id,
      assessmentTitle: test.title,
      mode: "results_review",
      questionTotal: test.questions.length,
      firstAttemptScore: firstAttempt?.score ?? null,
      currentMastery,
      answerRevealPolicy: "submitted_attempt_review",
      questions: (reviewedAttempt?.questionResults ?? []).map((result) => ({
        questionId: result.questionId,
        questionNumber: result.questionNumber,
        title: result.title,
        prompt: result.prompt,
        starterCode: result.starterCode,
        learnerAnswer: result.submittedAnswer.slice(0, 12_000),
        answerTruncated: result.submittedAnswer.length > 12_000,
        result: result.correct ? "correct" as const : "incorrect" as const,
        graderFeedback: result.feedback,
        currentGraderFeedback: !result.correct ? liveGrades.get(result.questionId)?.feedback ?? null : null,
        referenceSolution: result.referenceSolution,
      })),
      reviewedAttempt: reviewedAttempt ? { id: reviewedAttempt.id, attemptNumber: reviewedAttempt.attemptNumber, submittedAt: reviewedAttempt.submittedAt, recoveredFromLegacy: reviewedAttempt.recoveredFromLegacy, score: reviewedAttempt.score, total: reviewedAttempt.total, kind: reviewedAttempt.kind, sourceAttemptId: reviewedAttempt.sourceAttemptId } : null,
    };
  }, [activeTest, activeQuestions, retrying, currentMastery, firstAttempt?.score, record.answers, reviewedAttempt, liveGrades, test]);

  useEffect(() => {
    onTutorContextChange(tutorContext);
  }, [onTutorContextChange, tutorContext]);

  const updateAnswer = (questionId: string, answer: string) => onChange({ ...record, answers: { ...record.answers, [questionId]: answer } });
  const saveAttempt = (attempt: MasteryAttempt) => {
    const correctIds = attempt.questionResults.filter((result) => result.correct).map((result) => result.questionId);
    const passed = [...new Set([...currentMasteryIds, ...correctIds])];
    const attempts = { ...record.attempts };
    if (attempt.kind !== "regrade") {
      const submittedIds = attempt.reassessedQuestionIds ?? test.questions.map((question) => question.id);
      submittedIds.forEach((id) => { attempts[id] = (attempts[id] ?? 0) + 1; });
    }
    setReviewedAttemptId(attempt.id);
    onChange({
      ...record,
      attempts,
      hints: [],
      passed,
      submissions: masteryAttempts.length + 1,
      lastScore: attempt.score,
      masteryAttempts: [...masteryAttempts, attempt],
      masteryRetakeActive: false,
      masteryRetry: undefined,
    });
  };
  const submit = () => {
    if (!allAnswered) return;
    saveAttempt(retrying && retrySource ? createMasteryFollowUp({
      source: retrySource, attemptNumber: nextAttemptNumber, questions: questionDefinitions,
      questionIds: activeQuestions.map((question) => question.id), answers: record.answers,
    }) : createMasteryAttempt({ testId: test.id, attemptNumber: nextAttemptNumber, questions: questionDefinitions, answers: record.answers }));
  };
  const retake = () => onChange({ ...record, answers: {}, masteryRetakeActive: true, masteryRetry: undefined });
  const retryQuestions = (questionIds: string[]) => {
    if (!reviewedAttempt || !questionIds.length) return;
    const answers = { ...record.answers };
    reviewedAttempt.questionResults.filter((result) => questionIds.includes(result.questionId)).forEach((result) => { answers[result.questionId] = result.submittedAnswer; });
    onChange({ ...record, answers, masteryRetakeActive: true, masteryRetry: { sourceAttemptId: reviewedAttempt.id, questionIds } });
  };
  const recheckQuestion = (questionId: string) => {
    if (!reviewedAttempt) return;
    saveAttempt(createMasteryFollowUp({ source: reviewedAttempt, attemptNumber: nextAttemptNumber, questions: questionDefinitions, questionIds: [questionId], answers: {}, kind: "regrade" }));
  };

  if (!activeTest && reviewedAttempt) {
    const mastered = currentMastery === test.questions.length;
    const missed = reviewedAttempt.questionResults.filter((result) => !result.correct);
    const firstScoreLabel = firstAttempt?.recoveredFromLegacy && firstAttempt.attemptNumber !== 1 ? "Earliest preserved score" : "First-attempt score";
    return <section ref={assessmentRef} className={`practice-session unit-mastery-session mastery-result ${mastered ? "mastery-complete" : "mastery-not-passed"}`} id={test.sectionId} data-learning-section>
      <header className="mastery-results-header">
        <div><p className="eyebrow">Results &amp; Review</p><h2>{titleCase(test.title)}</h2><p>Review the exact assessment submission and compare it with one valid reference solution.</p></div>
        <div className="mastery-summary-grid"><span><small>{firstScoreLabel}</small><b>{firstAttempt?.score ?? 0}/{firstAttempt?.total ?? test.questions.length}</b></span><span><small>Current mastery</small><b>{currentMastery}/{test.questions.length}</b></span><span><small>Status</small><b>{mastered ? "Mastered" : "In progress"}</b></span></div>
      </header>
      <nav className="mastery-attempt-history" aria-label="Mastery test attempt history"><span>Attempt history</span>{masteryAttempts.map((attempt) => <button type="button" key={attempt.id} className={attempt.id === reviewedAttempt.id ? "selected" : ""} onClick={() => setReviewedAttemptId(attempt.id)}>{masteryAttemptLabel(attempt)} · {attempt.score}/{attempt.total}</button>)}</nav>
      <div className="mastery-attempt-meta"><b>{masteryAttemptLabel(reviewedAttempt)}</b><span>{reviewedAttempt.submittedAt ? new Date(reviewedAttempt.submittedAt).toLocaleString() : "Recovered from older saved progress · original submission time unavailable"}</span></div>
      {reviewedAttempt.sourceAttemptId && <p className="mastery-follow-up-note">Only question{reviewedAttempt.reassessedQuestionIds?.length === 1 ? "" : "s"} {reviewedAttempt.questionResults.filter((result) => reviewedAttempt.reassessedQuestionIds?.includes(result.questionId)).map((result) => result.questionNumber).join(", ")} {reviewedAttempt.kind === "regrade" ? "rechecked using the exact saved answer" : "resubmitted"}. Other answers and results are carried forward unchanged. This is not a new full-test attempt.</p>}
      {missed.length > 0 && <section className="mastery-needs-attention" aria-label="Questions needing attention">
        <h3>What needs attention</h3>
        <ul>{missed.map((result) => <li key={result.questionId}>
          <a href={`#review-${result.questionId}`}>Question {result.questionNumber} · {titleCase(result.title)}</a>
          <p>{liveGrades.get(result.questionId)?.correct ? "The current checker accepts your saved answer. Use Recheck saved answer below to record the correction without retyping." : liveGrades.get(result.questionId)?.feedback ?? result.feedback}</p>
        </li>)}</ul>
        {missed.length > 1 && <button className="secondary-button" onClick={() => retryQuestions(missed.map((result) => result.questionId))}>Retry these {missed.length} questions<RotateCcw size={14} /></button>}
      </section>}
      <div className="mastery-review-list">{reviewedAttempt.questionResults.map((result) => <article id={`review-${result.questionId}`} className={`mastery-review-question ${result.correct ? "correct" : "incorrect"}`} key={result.questionId}>
        <header><span>Question {result.questionNumber}</span><strong>{result.correct ? <Check size={14} /> : <X size={14} />}{masteryResultLabel(result)}</strong></header>
        <h3>{titleCase(result.title)}</h3>
        <p>{result.prompt}</p>
        {result.starterCode && <div className="mastery-starter-context"><small>Starter code</small><pre><JavaCode code={result.starterCode} /></pre></div>}
        <div className="mastery-answer-comparison">
          <section><h4>Your exact submitted answer</h4>{result.submittedAnswer ? <pre><JavaCode code={result.submittedAnswer} /></pre> : <div className="mastery-missing-answer">No submitted answer was recoverable for this question.</div>}</section>
          <section><h4>Reference solution</h4><pre><JavaCode code={result.referenceSolution} /></pre></section>
        </div>
        <div className={`mastery-grader-feedback ${result.correct ? "correct" : "incorrect"}`}><b>Saved grading feedback</b><p>{result.feedback}</p><small>{result.earnedPoints}/{result.possiblePoints} point · {result.gradingMethod === "input-output-checks" ? "Supported Java input/output checks" : result.gradingMethod === "pattern-validator" ? "Code-pattern checker" : "Legacy validator result"}</small></div>
        {!result.correct && <div className="mastery-question-actions">
          <p>{liveGrades.get(result.questionId)?.correct ? "Your saved code passes the current checker. No answer changes are needed." : "Retry only this question; your other answers stay unchanged."}</p>
          <div><button className="secondary-button" onClick={() => recheckQuestion(result.questionId)}>Recheck saved answer<Check size={14} /></button><button className="primary-button" onClick={() => retryQuestions([result.questionId])}>Retry this question<RotateCcw size={14} /></button></div>
        </div>}
      </article>)}</div>
      <footer className="mastery-results-actions"><p>{mastered ? "This mastery test is complete. Attempt history remains available for review." : "Retry an individual question above, or choose a fresh full test. Earlier attempts remain unchanged."}</p><button className="secondary-button" onClick={retake}>Retake Full Test<RotateCcw size={15} /></button></footer>
    </section>;
  }

  const answeredCount = activeQuestions.filter((question) => String(record.answers[question.id] ?? "").trim()).length;
  return <section ref={assessmentRef} className="practice-session unit-mastery-session strict-test-session" id={test.sectionId} data-learning-section>
    <div className="practice-header"><h2>{titleCase(test.title)}</h2></div>
    {retrying && <div className="mastery-retry-banner"><p>Question retry · only {activeQuestions.length === 1 ? "this answer is" : "these answers are"} being resubmitted.</p><button className="secondary-button" onClick={() => onChange({ ...record, masteryRetakeActive: false, masteryRetry: undefined })}>Cancel retry</button></div>}
    <div className="mastery-test-question-list">{activeQuestions.map((question) => <article className="practice-workspace strict-test-workspace mastery-test-question" key={question.id}>
      <header><span>Question {test.questions.findIndex((item) => item.id === question.id) + 1}</span><small>{String(record.answers[question.id] ?? "").trim() ? "Answered" : "Not answered"}</small></header>
      <h3>{titleCase(question.title)}</h3>
      <p>{question.prompt}</p>
      {question.code && <div className="mastery-starter-context"><small>Starter code</small><pre><JavaCode code={question.code} /></pre></div>}
      <label htmlFor={`mastery-${question.id}`}>Your program</label>
      <div className="practice-answer-field multiline code-editor-field"><JavaEditor id={`mastery-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(answer) => updateAnswer(question.id, answer)} placeholder={question.placeholder} multiline starterCode={question.code ?? ""} /></div>
    </article>)}</div>
    <div className="mastery-submit-panel"><div><b>Ready to submit?</b><p>{allAnswered ? "Submission creates an immutable attempt. Earlier answers remain saved." : `${activeQuestions.length - answeredCount} question${activeQuestions.length - answeredCount === 1 ? "" : "s"} still need an answer.`}</p></div><button className="primary-button" onClick={submit} disabled={!allAnswered}>{retrying ? activeQuestions.length === 1 ? "Submit question" : "Submit corrections" : "Submit Test"}<GraduationCap size={16} /></button></div>
  </section>;
}

function ChapterPractice({ chapterId, questionIds, variant, checkpointNumber = 1, practiceSectionId, savedQuestionId, record: savedRecord, onChange, onActiveQuestionChange, onTutorPracticeContextChange, tutorActive }: { chapterId: string; questionIds: string[]; variant: "checkpoint" | "review"; checkpointNumber?: number; practiceSectionId: string; savedQuestionId?: string; record?: PracticeRecord; onChange: (record: PracticeRecord) => void; onActiveQuestionChange: (sectionId: string, questionId: string) => void; onTutorPracticeContextChange: (context: TutorPracticeContext) => void; tutorActive: boolean }) {
  const allQuestions = practiceQuestions[chapterId] ?? [];
  const requiredQuestions = requiredChapterPracticeQuestions(chapterId);
  const questionIdSet = new Set(questionIds);
  const questions = allQuestions.filter((question) => questionIdSet.has(question.id));
  const record = savedRecord ?? emptyPracticeRecord();
  const allValidPassed = requiredQuestions.filter((question) => record.passed.includes(question.id)).map((question) => question.id);
  const validPassed = questions.filter((question) => record.passed.includes(question.id)).map((question) => question.id);
  const firstUnpassed = questions.findIndex((question) => !record.passed.includes(question.id));
  const savedQuestionIndex = questions.findIndex((question) => question.id === savedQuestionId);
  const [activeIndex, setActiveIndex] = useState(savedQuestionIndex >= 0 ? savedQuestionIndex : firstUnpassed < 0 ? 0 : firstUnpassed);
  const [feedback, setFeedback] = useState<Record<string, "correct" | "incorrect">>({});
  const [visibleAnswers, setVisibleAnswers] = useState<Record<string, boolean>>({});
  const [reviewingCompleted, setReviewingCompleted] = useState(false);
  const question = questions[Math.min(activeIndex, questions.length - 1)];
  const passed = record.passed.includes(question.id);
  const allPassed = validPassed.length === questions.length;
  const chapterAllPassed = requiredQuestions.length > 0 && allValidPassed.length === requiredQuestions.length;
  const unansweredIndexes = questions
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !record.passed.includes(item.id))
    .map(({ index }) => index);
  const nextQuestionIndex = unansweredIndexes.find((index) => index > activeIndex) ?? unansweredIndexes[0] ?? -1;
  const currentAnswer = record.answers[question.id] ?? "";
  const currentFeedback = feedback[question.id];
  const currentAttempts = record.attempts[question.id] ?? 0;
  const answerShown = Boolean(visibleAnswers[question.id]);
  const shownAnswer = question.answer ?? question.options?.find((option) => question.validate(option)) ?? question.hint;
  const usesJavaEditor = questionUsesJavaEditor(question);

  // The controls and tutor share one ordered list, so option letters cannot drift.
  const answerOptions = useMemo(() => (question.options ?? []).map((text, index) => ({
    label: String.fromCharCode(65 + index),
    text,
    selected: currentAnswer === text,
  })), [question.options, currentAnswer]);

  useEffect(() => {
    if (!tutorActive) return;
    onActiveQuestionChange(practiceSectionId, question.id);
    onTutorPracticeContextChange({
      chapterId,
      questionId: question.id,
      questionNumber: activeIndex + 1,
      questionTotal: questions.length,
      level: question.level,
      kind: question.kind,
      title: titleCase(question.title),
      prompt: question.prompt,
      starterCode: question.code ?? null,
      options: answerOptions,
      selectedOptionLabel: answerOptions.find((option) => option.selected)?.label ?? null,
      studentAnswer: currentAnswer.slice(0, 8_000),
      answerTruncated: currentAnswer.length > 8_000,
      attempts: currentAttempts,
      status: passed ? "passed" : currentFeedback === "incorrect" ? "incorrect" : "not_checked",
      answerShown,
      shownAnswer: answerShown ? shownAnswer : null,
    });
  }, [activeIndex, answerOptions, answerShown, chapterId, currentAnswer, currentAttempts, currentFeedback, onActiveQuestionChange, onTutorPracticeContextChange, passed, practiceSectionId, question, questions.length, shownAnswer, tutorActive]);

  const updateAnswer = (answer: string) => {
    onChange({ ...record, answers: { ...record.answers, [question.id]: answer } });
    setFeedback((current) => { const next = { ...current }; delete next[question.id]; return next; });
  };
  const check = () => {
    const answer = currentAnswer;
    const correct = question.validate(answer);
    const attempts = { ...record.attempts, [question.id]: (record.attempts[question.id] ?? 0) + 1 };
    const nextPassed = correct && !passed ? [...allValidPassed, question.id] : allValidPassed;
    onChange({ ...record, attempts, passed: nextPassed });
    setFeedback((current) => ({ ...current, [question.id]: correct ? "correct" : "incorrect" }));
  };
  const toggleAnswer = () => {
    if (!answerShown && !record.hints.includes(question.id)) {
      onChange({ ...record, hints: [...record.hints, question.id] });
    }
    setVisibleAnswers((current) => ({ ...current, [question.id]: !current[question.id] }));
  };
  const goToNextQuestion = () => {
    if (nextQuestionIndex >= 0) setActiveIndex(nextQuestionIndex);
  };

  const completionTitle = variant === "checkpoint" ? "Section Check Complete" : chapterAllPassed ? "Chapter Complete" : "Chapter Review Complete";
  const completionCopy = variant === "checkpoint" ? "" : chapterAllPassed ? "Every required exercise passed. This chapter is cleared and your progress is saved." : "The cumulative review passed. Finish the remaining section checks to clear the chapter.";
  const completionCard = <div className={`practice-complete-card ${variant === "checkpoint" ? "section-complete" : chapterAllPassed ? "chapter-complete" : "review-complete"}`}>
      {variant !== "checkpoint" && chapterAllPassed && <div className="practice-complete-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /></div>}
      <span className="practice-complete-check"><Check size={42} strokeWidth={3.2} /></span>
      <p className="eyebrow">{variant === "checkpoint" ? `Checkpoint ${checkpointNumber}` : "Cumulative Review"}</p>
      <h2>{completionTitle}</h2>
      {completionCopy && <p>{completionCopy}</p>}
      <div className="practice-complete-stats"><span><b>{questions.length}/{questions.length}</b> exercises passed</span><span><b>{record.hints.length}</b> answers shown</span></div>
      <button className="soft-button practice-review-button" onClick={() => setReviewingCompleted(true)}>Review Answers<ChevronDown size={15} /></button>
    </div>;

  if (allPassed && !reviewingCompleted) return variant === "checkpoint"
    ? <div className="practice-session section-practice practice-complete-state" id={practiceSectionId}>{completionCard}</div>
    : <section className="practice-session practice-complete-state" id={practiceSectionId} data-learning-section>{completionCard}</section>;

  const practiceBody = <>
    <div className="practice-header"><div><p className="eyebrow">{variant === "checkpoint" ? `Check Your Understanding · ${String(checkpointNumber).padStart(2, "0")}` : "Cumulative Review"}</p><h2>{variant === "checkpoint" ? "Section Check" : "Chapter Review"}</h2>{variant === "review" && <p>Combine what you learned across the chapter. Every earlier section check also counts toward completion.</p>}</div><div className="practice-score"><b>{validPassed.length}/{questions.length}</b><small>passed</small></div></div>
    {questions.length > 1 && <div className="question-route">{questions.map((item, index) => <button key={item.id} className={`${index === activeIndex ? "active" : ""} ${record.passed.includes(item.id) ? "passed" : ""}`} onClick={() => setActiveIndex(index)} aria-label={`Open question ${index + 1}`}><span>{record.passed.includes(item.id) ? <Check size={13} strokeWidth={3} /> : index + 1}</span><small>{(item.productionStage ?? 0) >= 4 ? "Build" : item.level}</small></button>)}</div>}
    <div className="practice-workspace" key={question.id}><h3>{titleCase(question.title)}</h3><p>{question.prompt}</p>{question.code && <div className="practice-code-wrap"><CopyCodeButton code={question.code} /><pre className="practice-code"><JavaCode code={question.code} /></pre></div>}<label htmlFor={`practice-${question.id}`}>Your answer</label>{answerOptions.length ? <div className="practice-options" id={`practice-${question.id}`} role="radiogroup" aria-label="Answer choices">{answerOptions.map((option) => <button type="button" role="radio" aria-checked={option.selected} className={`${option.selected ? "selected" : ""} ${answerShown && question.validate(option.text) ? "revealed-answer" : ""}`} key={option.label} onClick={() => updateAnswer(option.text)}><span>{option.label}</span><b>{option.text}</b></button>)}</div> : <div className={`practice-answer-field ${question.multiline ? "multiline" : "single"} ${usesJavaEditor ? "code-editor-field" : "written-answer-field"}`}>{usesJavaEditor ? <JavaEditor id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={updateAnswer} placeholder={question.placeholder} multiline={Boolean(question.multiline)} starterCode={question.code ?? ""} onSubmit={() => { if (passed) goToNextQuestion(); else check(); }} /> : question.multiline ? <textarea id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} spellCheck autoCorrect="off" autoCapitalize="off" /> : <input id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} onKeyDown={(event) => { if (event.key !== "Enter") return; if (passed) goToNextQuestion(); else check(); }} autoComplete="off" spellCheck autoCorrect="off" autoCapitalize="off" />}{answerShown && <div className="practice-answer-overlay" aria-live="polite" role="region" aria-label="Shown answer" tabIndex={question.multiline ? 0 : undefined}>{usesJavaEditor ? <JavaCode code={shownAnswer} /> : shownAnswer}</div>}</div>}
      <div className="practice-response-row">
        <div className="practice-feedback-slot">{(feedback[question.id] || passed) && <div className={`practice-feedback ${passed || feedback[question.id] === "correct" ? "correct" : "incorrect"}`}><span>{passed || feedback[question.id] === "correct" ? <Check size={18} strokeWidth={3} /> : <RotateCcw size={17} />}</span><p><b>{passed || feedback[question.id] === "correct" ? "Passed" : "Not yet"}</b><small>{passed || feedback[question.id] === "correct" ? question.success : "Check the exact requirement, show the answer if needed, and try again."}</small></p></div>}</div>
        <div className={`practice-actions ${passed ? "passed" : ""}`}>
          {!passed && <button className="soft-button" onClick={toggleAnswer} aria-pressed={answerShown}>{answerShown ? <EyeOff size={14} /> : <Eye size={14} />}{answerShown ? "Hide Answer" : "Show Answer"}</button>}
          {passed ? (
            nextQuestionIndex >= 0
              ? <button className="primary-button practice-next-button" onClick={goToNextQuestion}>Next Question<ArrowRight size={16} /></button>
              : <button className="primary-button complete practice-next-button" disabled><Check size={16} strokeWidth={3} />All Questions Passed</button>
          ) : <button className="primary-button" onClick={check} disabled={!String(record.answers[question.id] ?? "").trim()}>Check Answer<ArrowRight size={14} /></button>}
        </div>
      </div>
    </div>
    {questions.length > 1 && <div className="practice-pagination"><button aria-label="Previous question" title="Previous question" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} disabled={activeIndex === 0}><ChevronLeft size={18} strokeWidth={2.4} /></button><span>Question {activeIndex + 1} of {questions.length}</span><button aria-label="Next question" title="Next question" onClick={() => setActiveIndex((index) => Math.min(questions.length - 1, index + 1))} disabled={activeIndex === questions.length - 1}><ChevronRight size={18} strokeWidth={2.4} /></button></div>}
    {allPassed && <div className="chapter-cleared-banner complete"><span><Check size={24} strokeWidth={3} /></span><div><b>{completionTitle}</b><small>{completionCopy}</small></div><button className="soft-button practice-collapse-button" onClick={() => setReviewingCompleted(false)}>Close Review<ChevronDown size={14} /></button></div>}
  </>;

  return variant === "checkpoint"
    ? <div className={`practice-session section-practice ${allPassed ? "reviewing-complete" : ""}`} id={practiceSectionId}>{practiceBody}</div>
    : <section className={`practice-session ${allPassed ? "reviewing-complete" : ""}`} id={practiceSectionId} data-learning-section>{practiceBody}</section>;
}

function pathNodeStatus(node: DegreePathNode, records: DegreeRecords): DegreeStatus {
  if (!node.codes?.length) return "unknown";
  const statuses = node.codes.map((code) => records[code] ?? "unknown");
  if (statuses.includes("complete")) return "complete";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.every((status) => status === "not_started")) return "not_started";
  return "unknown";
}

function DegreeMap({ records, setRecords, snapshot, onImport, canImport = true }: { records: DegreeRecords; setRecords: (records: DegreeRecords) => void; snapshot: AuditSnapshot; onImport: () => void; canImport?: boolean }) {
  const [selected, setSelected] = useState<DegreeCourse | null>(null);
  const completed = degreeCourses.filter((course) => records[course.code] === "complete").length;
  const inProgress = degreeCourses.filter((course) => records[course.code] === "in_progress").length;
  const hasAudit = snapshot.sourceName !== "No audit uploaded";
  return <main className="page-content degree-page focused-degree vertical-degree">
    <section className="degree-hero audit-backed-hero"><div><p className="eyebrow accent-text">Brooklyn College · Computer Science B.S.</p><h2>{hasAudit ? titleCase("Your path to the degree") : titleCase("Computer Science degree path")}</h2><p>{hasAudit ? "Required courses stay separate from choice groups. Branches mean “choose one,” not “take everything.” Your uploaded audit controls the status colors." : canImport ? "Explore the requirements, then privately load your own DegreeWorks audit when you want your personal status on the map." : "Explore the complete degree structure anonymously. Sign in when you want a private DegreeWorks map that stays separate from every other student."}</p><div className="hero-actions"><button className="primary-button" onClick={onImport}>{canImport ? <Upload size={15} /> : <LockKeyhole size={15} />}{hasAudit ? "Update DegreeWorks PDF" : canImport ? "Load Your DegreeWorks PDF" : "Sign in to load DegreeWorks"}</button><span className="honesty-note">{hasAudit ? <><Check size={14} /> Audit reviewed {snapshot.auditDate}</> : <><LockKeyhole size={14} /> No personal audit loaded</>}</span></div></div><div className="degree-verification">{hasAudit ? <><div><b>{snapshot.degreeProgress}%</b><small>DegreeWorks progress</small></div><div><b>{snapshot.appliedCredits}</b><small>credits applied</small></div><div><b>{snapshot.remainingCredits}</b><small>credits remaining</small></div></> : <><div><b>B.S.</b><small>degree route</small></div><div><b>BC</b><small>Brooklyn College</small></div><div><b>{canImport ? "Private" : "Sign in"}</b><small>personal audit data</small></div></>}</div></section>
    {hasAudit && <section className="audit-summary-strip"><div><small>Major block</small><b>{snapshot.majorApplied} applied · {snapshot.majorRemaining} remaining</b></div><div><small>Mapped course states</small><b>{completed} complete · {inProgress} in progress</b></div><div><small>Current GPA</small><b className={snapshot.gpa < 2 ? "needs-attention" : ""}>{snapshot.gpa.toFixed(3)} · {snapshot.gpa < 2 ? "2.0 required" : "requirement met"}</b></div><div><small>Source</small><b>{snapshot.sourceName}</b></div></section>}
    <div className="degree-map-heading"><div><p className="eyebrow">Requirement family tree</p><h3>{titleCase("Follow the prerequisites, not the row order.")}</h3></div><div className="degree-legend"><span><i className="complete" />Complete</span><span><i className="in_progress" />In progress</span><span><i className="not_started" />Remaining</span><span><i className="unknown" />Audit rule</span></div></div>
    <p className="degree-map-prerequisite-guide"><strong>You do not need to finish a whole row before starting the next.</strong> Each course lists what it needs below. Within a pair, choose one course; between prerequisite groups, AND means you need both. Checkmarks reflect saved college-course completion—not lesson progress or confirmed registration eligibility. Open “Conditions &amp; equivalencies” for grade and other restrictions; confirm your catalog year, substitutions, and enrollment eligibility with advisement.</p>
    <section className="degree-family-tree">{degreePathLevels.map((level, levelIndex) => <div className="degree-family-level" key={level.label}>{levelIndex > 0 && <div className="family-connector"><span /></div>}<header><span>{String(levelIndex + 1).padStart(2, "0")}</span><div><b>{titleCase(level.label)}</b><small>{level.description}</small></div></header><div className="family-node-row">{level.nodes.map((node) => { const status = pathNodeStatus(node, records); return <div className={`degree-branch-bubble ${node.kind} ${status}`} key={node.id}><div className="bubble-top"><span className="degree-status-icon">{status === "complete" ? <Check size={16} strokeWidth={3} /> : status === "in_progress" ? <Play size={12} fill="currentColor" /> : status === "not_started" ? <LockKeyhole size={14} /> : <GitBranch size={14} />}</span><small>{node.label}</small></div><h4>{titleCase(node.title)}</h4>{node.codes && <div className="bubble-options">{node.codes.map((code, index) => { const course = degreeCourses.find((item) => item.code === code); const optionStatus = records[code] ?? "unknown"; return <div className="bubble-option-wrap" key={code}>{index > 0 && <span className="or-label">OR</span>}<button className={optionStatus} onClick={() => course && setSelected(course)}><b>{code}</b><small>{course ? titleCase(course.title) : ""}</small><i>{optionStatus === "in_progress" ? "In progress" : optionStatus === "complete" ? "Complete" : optionStatus === "not_started" ? "Still needed" : "Requirement"}</i></button>{course && <DegreePrerequisites course={course} records={records}/>}</div>; })}</div>}{node.kind === "electives" && <DegreeElectives records={records} onOpenCourse={setSelected} />}{node.note && <p>{node.note}</p>}</div>; })}</div></div>)}</section>
    <section className="degree-wide-gates"><div className="gate-heading"><p className="eyebrow">Degree-wide requirements</p><h3>{titleCase("Courses are only one branch of graduation.")}</h3></div><div className="gate-grid"><div className={`degree-gate ${hasAudit ? "in_progress" : "unknown"}`}><span>{hasAudit ? <Play size={14} fill="currentColor" /> : <GraduationCap size={15} />}</span><p><small>College option</small><b>{hasAudit ? `${snapshot.collegeOptionRemaining} credits remaining` : "Separate graduation requirement"}</b><em>{hasAudit ? "The loaded audit determines the remaining college-option work." : "Load an audit to see how this block applies to you."}</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Brooklyn residency</small><b>{hasAudit ? `${snapshot.residencyRemaining} credits remaining` : "Residency minimum applies"}</b><em>{hasAudit ? "Calculated from the loaded DegreeWorks summary." : "Only an official audit can confirm the personal remainder."}</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Advanced CISC in residence</small><b>{hasAudit ? `${snapshot.advancedCiscRemaining} credits remaining` : "Upper-level residency applies"}</b><em>CISC 2210-5004 with C or better.</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Additional B.S. credits</small><b>{hasAudit ? `${snapshot.bsCreditsRemaining} credits remaining` : "Approved B.S. credits required"}</b><em>Approved science, math, CS, and related courses.</em></p></div></div></section>
    <section className="degree-footnotes"><p><b>Important:</b> DegreeWorks reports both completed and in-progress credits in the applied total. In-progress does not mean earned yet.</p><p><b>Planning boundary:</b> graduate-level substitutions and double-counting rules require department or Degree Audit approval.</p></section>
    <DegreeCourseDrawer course={selected} records={records} status={selected ? records[selected.code] ?? "unknown" : "unknown"} onClose={() => setSelected(null)} onStatus={(status) => { if (!selected) return; setRecords({ ...records, [selected.code]: status }); }} />
  </main>;
}

function DegreeCourseDrawer({ course, records, status, onClose, onStatus }: { course: DegreeCourse | null; records: DegreeRecords; status: DegreeStatus; onClose: () => void; onStatus: (status: DegreeStatus) => void }) {
  if (!course) return null;
  const options: { status: DegreeStatus; label: string; description: string }[] = [
    { status: "complete", label: "Complete", description: "Credit earned or requirement satisfied" },
    { status: "in_progress", label: "In progress", description: "Currently enrolled or officially underway" },
    { status: "not_started", label: "Not started", description: "Confirmed remaining" },
    { status: "unknown", label: "Unknown", description: "Keep Exceler A from assuming" },
  ];
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="degree-drawer" onMouseDown={(event) => event.stopPropagation()}><button className="drawer-close" onClick={onClose}><X size={20} /></button><p className="eyebrow">{course.requirement}</p><h2>{course.code}</h2><h3>{titleCase(course.title)}</h3><div className="drawer-facts"><div><small>CREDITS</small><b>{course.credits}</b></div><div><small>MAP STAGE</small><b>{course.stage + 1}</b></div></div>{mathCourses.filter(item => item.code === course.code).map(item => <a key={item.id} className="primary-button" href={`/${item.id}`}>Open lessons <ArrowRight size={15}/></a>)}<section><p className="eyebrow">Requirement context</p><p>{course.prerequisiteText}</p><DegreePrerequisites course={course} records={records}/>{course.prerequisites && <p className="source-note">Checks use your saved degree statuses, not lesson progress. Confirm registration eligibility with advisement.</p>}{course.catalogUrl && <p><a href={course.catalogUrl} target="_blank" rel="noreferrer">Official course description and prerequisites <ArrowUpRight size={12}/></a></p>}{course.choiceLabel && <div className="choice-callout"><small>CHOICE GROUP</small><b>{titleCase(course.choiceLabel)}</b><p>Only one option is counted toward this requirement.</p></div>}</section><section><p className="eyebrow">Your official status</p><div className="status-options">{options.map((option) => <button className={status === option.status ? "active" : ""} key={option.status} onClick={() => onStatus(option.status)}><i className={option.status} /> <span><b>{option.label}</b><small>{option.description}</small></span>{status === option.status && <Check size={15} />}</button>)}</div></section><small className="source-note">Set this from DegreeWorks or your official record—not from self-study progress.</small></aside></div>;
}

function parseAuditText(text: string) {
  const proposals = new Map<string, DegreeStatus>();
  const compact = text.toUpperCase().replace(/\s+/g, " ");
  degreeAuditCourses.forEach((course) => {
    const [subject, number] = course.code.split(" ");
    const matcher = new RegExp(`(?:${subject}\\.?\\s*)?\\b${number}\\b`, "g");
    const contexts: { before: string; after: string; explicitSubject: boolean }[] = [];
    for (const match of compact.matchAll(matcher)) {
      const index = match.index ?? 0;
      const before = compact.slice(Math.max(0, index - 125), index);
      const explicitSubject = match[0].includes(subject) || new RegExp(`${subject}\\.?\\s*(?:\\d{4}\\s*(?:,|OR)\\s*)*$`).test(before.slice(-65));
      // Do not borrow a grade from the following course's audit row.
      const after = compact.slice(index + match[0].length, index + match[0].length + 125).split(/\b(?:CISC|MATH|PHIL|ENGL|CORC)\.?\s*\d{4}[A-Z]*\b/)[0];
      if (explicitSubject) contexts.push({ before, after, explicitSubject });
    }
    if (!contexts.length) return;
    const inProgress = contexts.some(({ after }) => /^.{0,75}\bIP\s*\(/.test(after));
    const complete = contexts.some(({ after }) => /^.{0,90}\b(A\+?|A-|B\+?|B-|C\+?|C-|CR|TR)\b\s*\(?\d/.test(after) || /^.{0,120}SATISFIED BY/.test(after));
    const remaining = contexts.some(({ before, after }) => /STILL NEEDED[^.]{0,115}$/.test(before) || /^.{0,90}(STILL NEEDED|NOT COMPLETE|REMAINING)/.test(after) || /^.{0,90}\b(F|WU)\b\s*0/.test(after));
    proposals.set(course.code, inProgress ? "in_progress" : complete ? "complete" : remaining ? "not_started" : "unknown");
  });
  return Object.fromEntries(proposals) as DegreeRecords;
}

function parseAuditSnapshot(text: string, sourceName: string): AuditSnapshot {
  const compact = text.replace(/\s+/g, " ");
  const number = (pattern: RegExp, fallback: number) => Number(compact.match(pattern)?.[1] ?? fallback);
  return {
    auditDate: compact.match(/Audit date\s+(\d{2}\/\d{2}\/\d{4})/i)?.[1] ?? degreeWorksSnapshot.auditDate,
    degreeProgress: number(/Degree progress\s+(\d+)%/i, degreeWorksSnapshot.degreeProgress),
    appliedCredits: number(/You have\s+(\d+(?:\.\d+)?)\s+applied credits/i, degreeWorksSnapshot.appliedCredits),
    remainingCredits: number(/still need\s+(\d+(?:\.\d+)?)\s+credits to meet this requirement/i, degreeWorksSnapshot.remainingCredits),
    gpa: number(/Undergrad Cumulative GPA:\s+(\d+(?:\.\d+)?)/i, degreeWorksSnapshot.gpa),
    majorApplied: number(/Computer Science \(BS\)\s+STILL NEEDED\s+Credits required:\s*67\.5\s+Credits applied:\s*(\d+(?:\.\d+)?)/i, degreeWorksSnapshot.majorApplied),
    majorRemaining: number(/Computer Science \(BS\)\s+STILL NEEDED.{0,320}?still need\s+(\d+(?:\.\d+)?)\s+more credits/i, degreeWorksSnapshot.majorRemaining),
    collegeOptionRemaining: number(/College Option.*?still need\s+(\d+(?:\.\d+)?)\s+more credits/i, degreeWorksSnapshot.collegeOptionRemaining),
    residencyRemaining: number(/still need\s+(\d+(?:\.\d+)?)\s+credit\(s\) completed at Brooklyn College/i, degreeWorksSnapshot.residencyRemaining),
    advancedCiscRemaining: number(/advanced Computer Science courses in residence.*?still need\s+(\d+(?:\.\d+)?)\s+more/i, degreeWorksSnapshot.advancedCiscRemaining),
    bsCreditsRemaining: number(/You have taken\s+\d+(?:\.\d+)?\s+credits, you require\s+(\d+(?:\.\d+)?)\s+more/i, degreeWorksSnapshot.bsCreditsRemaining),
    sourceName,
  };
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return pages.join("\n");
}

function DegreeWorksImport({ open, records, onClose, onApply }: { open: boolean; records: DegreeRecords; onClose: () => void; onApply: (records: DegreeRecords, snapshot: AuditSnapshot) => void }) {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<DegreeRecords>({});
  const [snapshot, setSnapshot] = useState<AuditSnapshot>(degreeWorksSnapshot);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const detected = degreeAuditCourses.filter((course) => course.code in proposal);
  const analyze = (value = text, source = fileName || "Pasted DegreeWorks text") => { setProposal(parseAuditText(value)); setSnapshot(parseAuditSnapshot(value, source)); };
  const loadFile = async (file: File) => {
    setLoading(true); setError(""); setFileName(file.name); setProposal({});
    try {
      const value = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? await extractPdfText(file) : await file.text();
      setText(value); analyze(value, file.name);
    } catch { setError("Exceler A could not read this PDF. Export a fresh DegreeWorks PDF and try again."); }
    finally { setLoading(false); }
  };
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="audit-dialog pdf-audit-dialog" onMouseDown={(event) => event.stopPropagation()}><header><span><FileInput size={20} /></span><div><p className="eyebrow">DegreeWorks import</p><h2>Upload the audit. Review the map update.</h2></div><button onClick={onClose}><X size={20} /></button></header><div className="audit-guidance"><p><b>PDF stays in this browser.</b> Exceler A extracts its text locally and does not upload the file to a server.</p><p><b>Nothing applies automatically.</b> You review every detected course state before saving it to the map.</p></div><label className={`file-import pdf-drop ${loading ? "loading" : ""}`}><Upload size={20} /><span><b>{loading ? "Reading DegreeWorks…" : fileName || "Choose DegreeWorks PDF"}</b><small>PDF preferred · text and HTML also supported</small></span><input type="file" accept=".pdf,.txt,.html,.htm,.csv,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} /></label>{error && <p className="import-error">{error}</p>}{text && <div className="audit-detected-summary"><div><small>Audit date</small><b>{snapshot.auditDate}</b></div><div><small>Overall progress</small><b>{snapshot.degreeProgress}%</b></div><div><small>Credits</small><b>{snapshot.appliedCredits} applied · {snapshot.remainingCredits} remaining</b></div><div><small>Major</small><b>{snapshot.majorApplied} applied · {snapshot.majorRemaining} remaining</b></div></div>}<details className="paste-fallback"><summary>Paste audit text instead</summary><label className="audit-text-label">DegreeWorks text<textarea value={text} onChange={(event) => { setText(event.target.value); setProposal({}); setFileName(""); }} placeholder={'CISC 1115 — In Progress\nCISC 2210 — Still Needed'} /></label><button className="secondary-button analyze-button" disabled={!text.trim()} onClick={() => analyze()}>Analyze pasted audit</button></details>{detected.length > 0 && <div className="detected-courses"><div><p className="eyebrow">Review before applying</p><span>{detected.length} courses detected</span></div>{detected.map((course) => <div className="detected-row" key={course.code}><span><b>{course.code}</b><small>{course.title}</small></span><div>{(["complete", "in_progress", "not_started", "unknown"] as DegreeStatus[]).map((status) => <button key={status} className={proposal[course.code] === status ? "active" : ""} onClick={() => setProposal({ ...proposal, [course.code]: status })}>{status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : status === "not_started" ? "Remaining" : "Ignore"}</button>)}</div></div>)}</div>}<footer><span>Choice groups count once. In-progress is shown separately from earned credit.</span><button className="primary-button" disabled={!detected.length} onClick={() => { const applied = { ...records }; Object.entries(proposal).forEach(([code, status]) => { if (status !== "unknown") applied[code] = status; }); onApply(applied, snapshot); onClose(); }}>Update degree map <ArrowRight size={14} /></button></footer></div></div>;
}

type PortableProgress = {
  completed: string[];
  practice: PracticeRecords;
  degreeRecords: DegreeRecords;
  auditSnapshot: AuditSnapshot;
  math?: MathRecords;
};

const objectValue = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const finiteNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;


function readProgressBackup(value: unknown): PortableProgress | null {
  const root = objectValue(value);
  const data = objectValue(root?.data);
  if (root?.app !== "Exceler A" || root.version !== 1 || !data) return null;

  const validCheckpoints = new Set(learningChapters.map((chapter) => legacyReadingCheckpointId(chapter.id)));
  const completed = Array.isArray(data.completed) ? data.completed.filter((item): item is string => typeof item === "string" && validCheckpoints.has(item)) : [];
  const practice: PracticeRecords = {};
  const rawPractice = objectValue(data.practice) ?? {};
  Object.entries(rawPractice).forEach(([chapterId, value]) => {
    const questions = practiceQuestions[chapterId] ?? unitMasteryTests.find((test) => test.id === chapterId)?.questions;
    const rawRecord = objectValue(value);
    if (!questions || !rawRecord) return;
    const validIds = new Set(questions.map((question) => question.id));
    const rawAnswers = objectValue(rawRecord.answers) ?? {};
    const rawAttempts = objectValue(rawRecord.attempts) ?? {};
    const answers = Object.fromEntries(Object.entries(rawAnswers).filter(([id, answer]) => validIds.has(id) && typeof answer === "string").map(([id, answer]) => [id, (answer as string).slice(0, 20_000)]));
    const attempts = Object.fromEntries(Object.entries(rawAttempts).filter(([id, attempt]) => validIds.has(id) && typeof attempt === "number" && Number.isFinite(attempt)).map(([id, attempt]) => [id, Math.max(0, Math.floor(attempt as number))]));
    const hints = Array.isArray(rawRecord.hints) ? rawRecord.hints.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
    const passed = Array.isArray(rawRecord.passed) ? rawRecord.passed.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
    const masteryAttempts = readMasteryAttempts(rawRecord.masteryAttempts, chapterId, validIds);
    const rawRetry = objectValue(rawRecord.masteryRetry);
    const retrySource = masteryAttempts.find((attempt) => attempt.id === rawRetry?.sourceAttemptId);
    const retryIds = Array.isArray(rawRetry?.questionIds) ? rawRetry.questionIds.filter((id): id is string => typeof id === "string" && validIds.has(id) && Boolean(retrySource?.questionResults.some((result) => result.questionId === id))) : [];
    practice[chapterId] = {
      answers,
      attempts,
      hints: [...new Set(hints)],
      passed: [...new Set(passed)],
      submissions: typeof rawRecord.submissions === "number" && Number.isFinite(rawRecord.submissions) ? Math.max(0, Math.floor(rawRecord.submissions)) : undefined,
      lastScore: typeof rawRecord.lastScore === "number" && Number.isFinite(rawRecord.lastScore) ? Math.max(0, Math.floor(rawRecord.lastScore)) : undefined,
      masteryAttempts: masteryAttempts.length ? masteryAttempts : undefined,
      masteryRetakeActive: Boolean(rawRecord.masteryRetakeActive),
      masteryRetry: retrySource && retryIds.length ? { sourceAttemptId: retrySource.id, questionIds: [...new Set(retryIds)] } : undefined,
    };
  });

  const rawRecords = objectValue(data.degreeRecords) ?? {};
  const degreeRecords = { ...initialDegreeRecords };
  const validStatuses = new Set<DegreeStatus>(["unknown", "complete", "in_progress", "not_started"]);
  degreeAuditCourses.forEach((course) => {
    const status = rawRecords[course.code];
    if (typeof status === "string" && validStatuses.has(status as DegreeStatus)) degreeRecords[course.code] = status as DegreeStatus;
  });

  const rawSnapshot = objectValue(data.auditSnapshot) ?? {};
  const auditSnapshot: AuditSnapshot = {
    auditDate: typeof rawSnapshot.auditDate === "string" ? rawSnapshot.auditDate.slice(0, 80) : degreeWorksSnapshot.auditDate,
    degreeProgress: finiteNumber(rawSnapshot.degreeProgress, degreeWorksSnapshot.degreeProgress),
    appliedCredits: finiteNumber(rawSnapshot.appliedCredits, degreeWorksSnapshot.appliedCredits),
    remainingCredits: finiteNumber(rawSnapshot.remainingCredits, degreeWorksSnapshot.remainingCredits),
    gpa: finiteNumber(rawSnapshot.gpa, degreeWorksSnapshot.gpa),
    majorApplied: finiteNumber(rawSnapshot.majorApplied, degreeWorksSnapshot.majorApplied),
    majorRemaining: finiteNumber(rawSnapshot.majorRemaining, degreeWorksSnapshot.majorRemaining),
    collegeOptionRemaining: finiteNumber(rawSnapshot.collegeOptionRemaining, degreeWorksSnapshot.collegeOptionRemaining),
    residencyRemaining: finiteNumber(rawSnapshot.residencyRemaining, degreeWorksSnapshot.residencyRemaining),
    advancedCiscRemaining: finiteNumber(rawSnapshot.advancedCiscRemaining, degreeWorksSnapshot.advancedCiscRemaining),
    bsCreditsRemaining: finiteNumber(rawSnapshot.bsCreditsRemaining, degreeWorksSnapshot.bsCreditsRemaining),
    sourceName: typeof rawSnapshot.sourceName === "string" ? rawSnapshot.sourceName.slice(0, 160) : degreeWorksSnapshot.sourceName,
  };
  return { completed, practice, degreeRecords, auditSnapshot, math: data.math === undefined ? undefined : readMathRecords(data.math) };
}

function ProgressBackupDialog({ open, progress, onClose, onRestore }: { open: boolean; progress: PortableProgress; onClose: () => void; onRestore: (progress: PortableProgress) => void }) {
  const [preview, setPreview] = useState<{ name: string; progress: PortableProgress } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setPreview(null); setError(""); }
  }, [open]);

  if (!open) return null;
  const exportedProgress = learningProgress(progress.completed, progress.practice);
  const exportBackup = () => {
    const payload = { app: "Exceler A", version: 1, exportedAt: new Date().toISOString(), data: progress };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `exceler-a-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const chooseBackup = async (file: File) => {
    setError(""); setPreview(null);
    try {
      if (file.size > 2_000_000) throw new Error("That backup is too large to be an Exceler A progress file.");
      const parsed = readProgressBackup(JSON.parse(await file.text()));
      if (!parsed) throw new Error("This is not a valid Exceler A progress backup.");
      setPreview({ name: file.name, progress: parsed });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Exceler A could not read this backup.");
    }
  };
  const previewProgress = preview ? learningProgress(preview.progress.completed, preview.progress.practice) : null;
  const previewPassed = preview ? Object.values(preview.progress.practice).reduce((sum, record) => sum + record.passed.length, 0) : 0;

  return <div className="project-info-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="progress-backup-dialog" role="dialog" aria-modal="true" aria-labelledby="progress-backup-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="project-info-brand"><span><Download size={21} /></span><div><p className="eyebrow">No Account Required</p><h2 id="progress-backup-title">Progress Backup</h2></div></div><button onClick={onClose} aria-label="Close progress backup"><X size={19} /></button></header>
      <div className="progress-backup-intro"><h3>Your progress already saves automatically.</h3><p>Download a portable copy when you want a backup or need to move your work to another browser or device.</p></div>
      <div className="progress-backup-grid">
        <article><span className="backup-card-icon"><Download size={18} /></span><div><p className="eyebrow">Export</p><h3>Download Your Progress</h3><p>Saves practice answers, attempts, course completion, and your current degree-map state.</p><div className="backup-current-summary"><b>{exportedProgress.completedChapters} / {learningChapters.length}</b><span>chapters cleared</span></div><button className="primary-button" onClick={exportBackup}><Download size={15} />Download Backup</button></div></article>
        <article><span className="backup-card-icon"><Upload size={18} /></span><div><p className="eyebrow">Restore</p><h3>Import a Backup</h3><p>Choose a previous Exceler A backup. Nothing changes until you confirm the restore.</p><label className="backup-file-button"><FileInput size={15} /><span>Choose Backup File</span><input type="file" accept=".json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseBackup(file); event.currentTarget.value = ""; }} /></label>{error && <p className="backup-error">{error}</p>}{preview && previewProgress && <div className="backup-preview"><small>{preview.name}</small><b>{previewProgress.completedChapters} chapters · {previewPassed} exercises passed</b><button className="primary-button" onClick={() => { onRestore(preview.progress); onClose(); }}>Restore This Backup<ArrowRight size={14} /></button></div>}</div></article>
      </div>
      <footer><LockKeyhole size={14} /><p><b>Keep the file private.</b> A backup may contain practice answers and DegreeWorks-derived academic information.</p></footer>
    </section>
  </div>;
}

function ProjectInfoDialog({ open, onClose, onOpenBackup }: { open: boolean; onClose: () => void; onOpenBackup: () => void }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="project-info-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="project-info-dialog" role="dialog" aria-modal="true" aria-labelledby="project-info-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div className="project-info-brand"><span><img src="/exceler-a-mark-512.png" alt="" /></span><div><p className="eyebrow">Independent Learning Project</p><h2 id="project-info-title">About Exceler A</h2></div></div><button onClick={onClose} aria-label="Close project information"><X size={19} /></button></header>
      <div className="project-info-intro"><p>Exceler A is a student-built learning system that turns the Brooklyn College Computer Science B.S. path into sequenced teaching, demonstrated practice, and a visual degree map.</p><span>Built by <b>Daniel Lezhanskiy</b></span></div>
      <div className="project-info-grid">
        <article><span><Code2 size={17} /></span><div><b>What Is Available</b><p>Available now: CISC 1115 and CISC 2210, plus the supporting CS-degree math sequence through MATH 1201. Courses include connected lessons, written practice, and mastery tests. More courses from the Brooklyn College Computer Science B.S. path are coming as they are built and reviewed.</p></div></article>
        <article><span><GraduationCap size={18} /></span><div><b>Degree-Path Context</b><p>The map organizes required courses, either-or choices, elective groups, and graduation gates. It is a planning aid—not an official Brooklyn College service or a replacement for DegreeWorks and academic advisement.</p></div></article>
        <article><span><LockKeyhole size={17} /></span><div><b>Private Student Workspaces</b><p>Anyone can learn anonymously with progress saved on that device. Students may sign in for isolated cloud progress, a private DegreeWorks map, and the protected tutor. The original PDF is read in the browser; only the reviewed academic summary is saved.</p></div></article>
      </div>
      <footer><span>Self-directed education, built course by course.</span><div className="project-info-footer-actions"><button className="secondary-button" onClick={onOpenBackup}><Download size={14} />Progress Backup</button><button className="primary-button" onClick={onClose}>Explore Exceler A<ArrowRight size={14} /></button></div></footer>
    </section>
  </div>;
}

const tutorWelcomeMessage = (): TutorMessage => ({
  id: "tutor-welcome",
  role: "assistant",
  content: "Ask me about the page you’re on. I can explain the lesson, help you reason through practice, or make the degree map easier to understand.",
});

const tutorMessageId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function textFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromReactNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromReactNode(node.props.children);
  return "";
}

function TutorMessageContent({ content }: { content: string }) {
  return <div className="tutor-markdown"><ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, children, ...props }) => {
        void node;
        return <a {...props} target="_blank" rel="noreferrer">{children}</a>;
      },
      pre: ({ node, children, ...props }) => {
        void node;
        const code = textFromReactNode(children).replace(/\n$/, "");
        return <pre {...props}><CopyCodeButton code={code} />{children}</pre>;
      },
    }}
  >{content}</ReactMarkdown></div>;
}

function TutorAssistant({ view, completed, practice, courseContext, snapshot, open, setOpen }: { view: View; completed: string[]; practice: PracticeRecords; courseContext: TutorCourseContext | MathTutorContext | null; snapshot: AuditSnapshot; open: boolean; setOpen: Dispatch<SetStateAction<boolean>> }) {
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [responseLength, setResponseLength] = useState<TutorResponseLength>("medium");
  const [settingsReady, setSettingsReady] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<TutorMessage[]>([tutorWelcomeMessage()]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; rect: DOMRect } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const progress = learningProgress(completed, practice);
  const activeLesson = view === "course" || view === "math" ? courseContext : null;
  const contextLabel = activeLesson ? activeLesson.sectionTitle : view === "degree" ? "Degree Map" : view === "courses" ? "Courses" : view === "dashboard" ? "Overview" : "Home";

  useEffect(() => {
    const savedLength = window.localStorage.getItem("exceler-tutor-response-length");
    const savedSize = window.localStorage.getItem("exceler-tutor-size");
    if (savedLength === "short" || savedLength === "medium" || savedLength === "long") setResponseLength(savedLength);
    if (savedSize === "expanded") setExpanded(true);
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    window.localStorage.setItem("exceler-tutor-response-length", responseLength);
    window.localStorage.setItem("exceler-tutor-size", expanded ? "expanded" : "standard");
  }, [expanded, responseLength, settingsReady]);

  useEffect(() => {
    if (!open) return;
    const messagesNode = messagesRef.current;
    if (!messagesNode) return;
    const finishAtBottom = () => { messagesNode.scrollTop = messagesNode.scrollHeight; };
    messagesNode.scrollTo({ top: messagesNode.scrollHeight, behavior: "smooth" });
    const frame = window.requestAnimationFrame(finishAtBottom);
    const settle = window.setTimeout(finishAtBottom, 220);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(settle); };
  }, [busy, messages, open]);

  useLayoutEffect(() => {
    const input = composerInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
    input.style.overflowY = input.scrollHeight > 110 ? "auto" : "hidden";
  }, [draft, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!open) setDrawerPosition({ x: 0, y: 0 });
  }, [open]);

  const beginDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (window.innerWidth <= 700 || (event.target as HTMLElement).closest("button")) return;
    const rect = drawerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: drawerPosition.x, originY: drawerPosition.y, rect };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const padding = 10;
    const deltaX = Math.min(window.innerWidth - padding - drag.rect.right, Math.max(padding - drag.rect.left, event.clientX - drag.startX));
    const deltaY = Math.min(window.innerHeight - padding - drag.rect.bottom, Math.max(padding - drag.rect.top, event.clientY - drag.startY));
    setDrawerPosition({ x: drag.originX + deltaX, y: drag.originY + deltaY });
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  };

  const toggleTutor = () => {
    if (!open) setDrawerPosition({ x: 0, y: 0 });
    setOpen((current) => !current);
  };

  const toggleTutorSize = () => {
    setDrawerPosition({ x: 0, y: 0 });
    setExpanded((current) => !current);
  };

  const clearConversation = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
    setMessages([tutorWelcomeMessage()]);
  };

  const submit = async (suggested?: string) => {
    const question = (suggested ?? draft).trim();
    if (!question || busy) return;
    const userMessage: TutorMessage = { id: tutorMessageId(), role: "user", content: question };
    const assistantId = tutorMessageId();
    const history = [...messages.filter((message) => message.content.trim()), userMessage].slice(-12);
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          responseLength,
          context: {
            currentView: view,
            course: {
              code: activeLesson?.courseCode ?? "CISC 1115",
              title: activeLesson?.courseTitle ?? "Introduction to Programming Using Java",
              progressPercent: activeLesson?.courseProgress ?? progress.percent,
              chaptersCleared: view === "math" ? undefined : progress.completedChapters,
              chapterCount: view === "math" ? courseChapters(mathCourses.find(c => c.code === activeLesson?.courseCode) ?? mathCourses[0]).length : learningChapters.length,
            },
            activeLesson,
            degreeAudit: {
              auditDate: snapshot.auditDate,
              degreeProgress: snapshot.degreeProgress,
              appliedCredits: snapshot.appliedCredits,
              remainingCredits: snapshot.remainingCredits,
              majorApplied: snapshot.majorApplied,
              majorRemaining: snapshot.majorRemaining,
              sourceName: snapshot.sourceName,
            },
          },
        }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(problem.error || "The tutor could not respond right now.");
      }
      if (!response.body) throw new Error("The tutor returned an empty response.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const applyEvent = (block: string) => {
        const data = block.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (!data || data === "[DONE]") return;
        try {
          const event = JSON.parse(data) as { type?: string; delta?: string; message?: string; error?: { message?: string } };
          if (event.type === "response.output_text.delta" && event.delta) {
            answer += event.delta;
            setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: answer } : message));
          }
          if (event.type === "error") throw new Error(event.message || event.error?.message || "The response stream failed.");
        } catch (error) {
          if (error instanceof SyntaxError) return;
          throw error;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          applyEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
        }
        if (done) break;
      }
      if (buffer.trim()) applyEvent(buffer);
      if (!answer.trim()) throw new Error("The tutor finished without returning text.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : "The tutor could not respond right now.";
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: `I hit a connection problem: ${message}` } : item));
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setBusy(false);
    }
  };

  return <div className={`tutor-shell ${open ? "open" : ""}`}>
    {open && <section id="exceler-tutor-drawer" ref={drawerRef} className={`tutor-drawer ${expanded ? "expanded" : ""} ${dragging ? "dragging" : ""}`} style={{ translate: `${drawerPosition.x}px ${drawerPosition.y}px` }} aria-label="Exceler tutor" aria-live="polite">
      <header className="tutor-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="tutor-identity"><span><img src="/exceler-a-mark-512.png" alt="" /></span><p><b>Exceler Tutor</b><small>Using your current page</small></p></div>
        <span className="tutor-drag-handle" aria-hidden="true"><GripHorizontal size={18} /></span>
        <div className="tutor-header-actions"><button className="tutor-action-size" onClick={toggleTutorSize} aria-label={expanded ? "Restore tutor size" : "Expand tutor"} title={expanded ? "Restore size" : "Expand chat"}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><button className="tutor-action-clear" onClick={clearConversation} aria-label="Clear tutor conversation" title="Clear conversation"><Trash2 size={16} /></button><button className="tutor-action-close" onClick={() => setOpen(false)} aria-label="Close tutor" title="Close tutor"><X size={18} /></button></div>
      </header>
      <div className="tutor-context"><div className="tutor-context-page"><Sparkles size={13} /><span>Context</span><b>{contextLabel}</b></div><div className="tutor-response-length" role="group" aria-label="Tutor response length">{(["short", "medium", "long"] as TutorResponseLength[]).map((length) => <button key={length} type="button" className={responseLength === length ? "selected" : ""} aria-pressed={responseLength === length} onClick={() => setResponseLength(length)} title={`${length[0].toUpperCase()}${length.slice(1)} tutor responses`}>{length}</button>)}</div></div>
      <div ref={messagesRef} className="tutor-messages">
        {messages.map((message) => <article key={message.id} className={`tutor-message ${message.role}`}><small>{message.role === "assistant" ? "Tutor" : "You"}</small><div>{message.content ? <TutorMessageContent content={message.content} /> : <span className="tutor-thinking"><i /><i /><i /></span>}</div></article>)}
        <div className="tutor-scroll-anchor" />
      </div>
      <form className="tutor-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <textarea ref={composerInputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Ask about what you’re learning…" rows={1} aria-label="Ask the Exceler tutor" />
        <button type="submit" disabled={!draft.trim() || busy} aria-label="Send question"><Send size={17} /></button>
      </form>
    </section>}
    <button className="tutor-launcher" onClick={toggleTutor} aria-label={open ? "Close Exceler tutor" : "Ask Exceler tutor"} aria-expanded={open} title={open ? "Close Tutor" : "Ask Tutor"}>
      {open ? <X size={20} /> : <MessageCircle size={24} strokeWidth={2.15} />}
    </button>
  </div>;
}

export default function CommandCenter({ initialMathCourse, student = null, signInPath = "/signin-with-chatgpt?return_to=%2F", signOutPath = "/signout-with-chatgpt?return_to=%2F" }: { initialMathCourse?: string; student?: StudentIdentity | null; signInPath?: string; signOutPath?: string } = {}) {
  const firstChapter = learningChapters[0];
  const [view, setView] = useState<View>(initialMathCourse ? "math" : "home");
  const [math, setMath] = useState<MathRecords>({});
  const [mathCourseId, setMathCourseId] = useState(initialMathCourse ?? "math1006");
  const [storageError, setStorageError] = useState(false);
  const [coursePosition, setCoursePosition] = useState<CoursePosition>({ chapterId: firstChapter.id, sectionId: firstChapter.sections[0]?.id ?? "", scrollTop: 0, questions: {} });
  const [completed, setCompleted] = useState<string[]>([]);
  const [practice, setPractice] = useState<PracticeRecords>({});
  const [degreeRecords, setDegreeRecords] = useState<DegreeRecords>(initialDegreeRecords);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditSnapshot>(degreeWorksSnapshot);
  const [importOpen, setImportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [courseTutorContext, setCourseTutorContext] = useState<TutorCourseContext | MathTutorContext | null>(null);
  const [localWorkspace, setLocalWorkspace] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [anonymousCandidate, setAnonymousCandidate] = useState<Record<string, unknown> | null>(null);
  const [syncLabel, setSyncLabel] = useState("Progress saved on this device");
  const cloudRevisionRef = useRef(0);
  const lastCloudPayloadRef = useRef("");
  const queuedCloudPayloadRef = useRef<string | null>(null);
  const cloudSaveRunningRef = useRef(false);
  const selectedMathCourse = mathCourses.find(course => course.id === mathCourseId) ?? mathCourses[0];
  const selectedMathProgress = useMemo(() => math[selectedMathCourse.id] ?? emptyMathProgress(), [math, selectedMathCourse.id]);
  const updateSelectedMathProgress = useCallback<Dispatch<SetStateAction<MathProgress>>>((update) => {
    setMath(current => ({ ...current, [selectedMathCourse.id]: typeof update === "function" ? update(current[selectedMathCourse.id] ?? emptyMathProgress()) : update }));
  }, [selectedMathCourse.id]);

  useEffect(() => {
    let cancelled = false;
    const applyWorkspace = (raw: Record<string, unknown>) => {
      const restored = readProgressBackup({ app: "Exceler A", version: 1, data: raw });
      if (!restored) return false;
      const navigation = objectValue(raw.navigation) as { view?: View; mathCourseId?: string; course?: Partial<CoursePosition> } | null;
      setMath(readMathRecords(restored.math));
      setCompleted(restored.completed); setPractice(restored.practice); setDegreeRecords(restored.degreeRecords); setAuditSnapshot(restored.auditSnapshot);
      if (!initialMathCourse && mathCourses.some(c => c.id === navigation?.mathCourseId)) setMathCourseId(navigation!.mathCourseId!);
      if (!initialMathCourse && navigation?.view && ["home", "dashboard", "courses", "degree", "course", "math"].includes(navigation.view)) setView(navigation.view);
      if (navigation?.course) {
        const storedChapter = learningChapters.find(chapter => chapter.id === navigation.course?.chapterId) ?? firstChapter;
        const storedSectionId = storedChapter.sections.some(section => section.id === navigation.course?.sectionId) ? navigation.course.sectionId! : storedChapter.sections[0]?.id ?? "";
        setCoursePosition({ chapterId: storedChapter.id, sectionId: storedSectionId, scrollTop: Number.isFinite(navigation.course.scrollTop) ? Math.max(0, Number(navigation.course.scrollTop)) : 0, questions: navigation.course.questions && typeof navigation.course.questions === "object" ? navigation.course.questions : {} });
      }
      return true;
    };
    const hydrate = async () => {
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
      setLocalWorkspace(isLocal);
      try {
        if (isLocal) {
          const stored = localStorage.getItem(PRIVATE_STORAGE_KEY);
          if (stored) applyWorkspace(JSON.parse(stored) as Record<string, unknown>);
          if (!cancelled) { setSyncLabel("Private progress saved on this device"); setHydrated(true); }
          return;
        }
        if (!student) {
          const stored = localStorage.getItem(PUBLIC_STORAGE_KEY);
          if (stored) applyWorkspace(JSON.parse(stored) as Record<string, unknown>);
          if (!cancelled) { setSyncLabel("Anonymous progress saved on this device"); setHydrated(true); }
          return;
        }
        setSyncLabel("Loading your private workspace…");
        const response = await fetch("/api/student-state", { cache: "no-store" });
        if (!response.ok) throw new Error("Your private workspace could not be loaded.");
        const result = await response.json() as { state: Record<string, unknown> | null; revision: number };
        if (cancelled) return;
        cloudRevisionRef.current = result.revision;
        if (result.state && applyWorkspace(result.state)) {
          lastCloudPayloadRef.current = JSON.stringify(result.state);
          setCloudSyncEnabled(true);
          setSyncLabel("Private progress synced");
        } else {
          const anonymous = localStorage.getItem(PUBLIC_STORAGE_KEY);
          let candidate: Record<string, unknown> | null = null;
          if (anonymous) {
            const parsed = JSON.parse(anonymous) as Record<string, unknown>;
            if (readProgressBackup({ app: "Exceler A", version: 1, data: parsed })) candidate = parsed;
          }
          setAnonymousCandidate(candidate);
          setCloudSyncEnabled(!candidate);
          setSyncLabel(candidate ? "Choose how to start your private workspace" : "Private progress synced");
        }
      } catch {
        if (!cancelled) { setStorageError(true); setSyncLabel("Private sync needs attention"); }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, [student?.email]);

  const flushCloudSaves = useCallback(async () => {
    if (cloudSaveRunningRef.current) return;
    cloudSaveRunningRef.current = true;
    while (queuedCloudPayloadRef.current) {
      const payload = queuedCloudPayloadRef.current;
      queuedCloudPayloadRef.current = null;
      setSyncLabel("Saving private progress…");
      try {
        const response = await fetch("/api/student-state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: JSON.parse(payload), expectedRevision: cloudRevisionRef.current }) });
        const result = await response.json() as { revision?: number; error?: string };
        if (!response.ok || typeof result.revision !== "number") throw new Error(result.error ?? "Private sync failed.");
        cloudRevisionRef.current = result.revision;
        lastCloudPayloadRef.current = payload;
        setStorageError(false); setSyncLabel("Private progress synced");
      } catch {
        queuedCloudPayloadRef.current = null;
        setStorageError(true); setSyncLabel("Private sync needs attention");
      }
    }
    cloudSaveRunningRef.current = false;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state = { completed, practice, math, degreeRecords, auditSnapshot, navigation: { view, course: coursePosition, mathCourseId } };
    if (localWorkspace || !student) {
      try { localStorage.setItem(localWorkspace ? PRIVATE_STORAGE_KEY : PUBLIC_STORAGE_KEY, JSON.stringify(state)); setStorageError(false); }
      catch { setStorageError(true); }
      return;
    }
    if (!cloudSyncEnabled) return;
    const payload = JSON.stringify(state);
    if (payload === lastCloudPayloadRef.current) return;
    queuedCloudPayloadRef.current = payload;
    const timer = window.setTimeout(() => { void flushCloudSaves(); }, 900);
    return () => window.clearTimeout(timer);
  }, [completed, practice, math, degreeRecords, auditSnapshot, view, coursePosition, mathCourseId, hydrated, localWorkspace, student, cloudSyncEnabled, flushCloudSaves]);

  const openBackup = () => { setInfoOpen(false); setBackupOpen(true); };
  const restoreProgress = (next: PortableProgress) => { setCompleted(next.completed); setPractice(next.practice); if (next.math) setMath(next.math); setDegreeRecords(next.degreeRecords); setAuditSnapshot(next.auditSnapshot); };
  const chooseAnonymousProgress = (keep: boolean) => {
    if (keep && anonymousCandidate) {
      const restored = readProgressBackup({ app: "Exceler A", version: 1, data: anonymousCandidate });
      if (restored) restoreProgress(restored);
    }
    lastCloudPayloadRef.current = "";
    setAnonymousCandidate(null); setCloudSyncEnabled(true); setSyncLabel("Saving private progress…");
  };
  const privateFeatures = localWorkspace || Boolean(student);
  return <div className="app-shell focused-shell"><Sidebar view={view} setView={setView} completed={completed} practice={practice} tutorOpen={tutorOpen} onToggleTutor={() => setTutorOpen((current) => !current)} onOpenInfo={() => setInfoOpen(true)} student={student} localWorkspace={localWorkspace} signInPath={signInPath} signOutPath={signOutPath} syncLabel={syncLabel}/><div className="app-main">{storageError && <div className="math-storage-error" role="alert">Your latest changes could not be saved safely. Keep this page open and export a progress backup before closing.</div>}{anonymousCandidate && student && !localWorkspace && <section className="progress-migration-banner"><LockKeyhole size={18}/><div><b>Continue with progress from this browser?</b><p>Before you signed in as {student.displayName}, this browser had progress saved on the public Exceler A site. Copy it into your private account, or leave the account empty. Your localhost progress is separate and will not change.</p></div><button className="primary-button" onClick={() => chooseAnonymousProgress(true)}>Copy to my account</button><button className="secondary-button" onClick={() => chooseAnonymousProgress(false)}>Leave account empty</button></section>}{view === "home" && <HomeView completed={completed} practice={practice} snapshot={auditSnapshot} setView={setView} onOpenInfo={() => setInfoOpen(true)} />}{view === "dashboard" && <Dashboard completed={completed} practice={practice} degreeRecords={degreeRecords} setView={setView} />}{view === "courses" && <CoursesView completed={completed} practice={practice} math={math} onOpenCourse={() => { setCourseTutorContext(null); setView("course"); }} onOpenMath={(id) => { setCourseTutorContext(null); setMathCourseId(id); setView("math"); }} />}{view === "course" && <CourseView completed={completed} practice={practice} position={coursePosition} setPosition={setCoursePosition} onPracticeChange={(chapterId, record) => setPractice((current) => ({ ...current, [chapterId]: record }))} onTutorContextChange={setCourseTutorContext} />}{view === "math" && <MathCourseView key={selectedMathCourse.id} course={selectedMathCourse} progress={selectedMathProgress} setProgress={updateSelectedMathProgress} onTutorContextChange={setCourseTutorContext} onBack={() => setView("courses")} />}{view === "degree" && <DegreeMap records={degreeRecords} setRecords={setDegreeRecords} snapshot={auditSnapshot} canImport={privateFeatures} onImport={() => privateFeatures ? setImportOpen(true) : window.location.assign(signInPath)} />}</div><MobileNav view={view} setView={setView} />{privateFeatures && <TutorAssistant view={view} completed={completed} practice={practice} courseContext={courseTutorContext} snapshot={auditSnapshot} open={tutorOpen} setOpen={setTutorOpen} />}{!privateFeatures && <a className="mobile-tutor-signin" href={signInPath} target="_top" aria-label="Sign in with ChatGPT to use the Exceler tutor" title="Sign in for Tutor"><MessageCircle size={22}/><span><LockKeyhole size={9}/></span></a>}<DegreeWorksImport open={importOpen && privateFeatures} records={degreeRecords} onClose={() => setImportOpen(false)} onApply={(nextRecords, nextSnapshot) => { setDegreeRecords(nextRecords); setAuditSnapshot(nextSnapshot); }} /><ProjectInfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} onOpenBackup={openBackup} /><ProgressBackupDialog open={backupOpen} progress={{ completed, practice, math, degreeRecords, auditSnapshot }} onClose={() => setBackupOpen(false)} onRestore={restoreProgress} /></div>;
}

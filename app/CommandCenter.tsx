"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  FileInput,
  GitBranch,
  GraduationCap,
  GripHorizontal,
  House,
  LockKeyhole,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createContext, Fragment, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { degreeCourses, type DegreeCourse } from "./data/curriculum";
import StructuredLesson from "./StructuredLesson";
import {
  additionalLearningChapters,
  additionalPracticeQuestions,
  additionalSectionPracticeQuestionIds,
  structuredLessonContent,
} from "./data/cisc1115Course";

type View = "home" | "dashboard" | "courses" | "degree" | "course";
type DegreeStatus = "unknown" | "complete" | "in_progress" | "not_started";
type DegreeRecords = Record<string, DegreeStatus>;

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
  studentAnswer: string;
  answerTruncated: boolean;
  attempts: number;
  status: "not_checked" | "incorrect" | "passed";
  clueShown: boolean;
  shownClue: string | null;
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
};

type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PracticeQuestion = {
  id: string;
  level: "Warm-up" | "Apply" | "Challenge";
  kind: string;
  title: string;
  prompt: string;
  code?: string;
  placeholder: string;
  hint: string;
  success: string;
  options?: string[];
  multiline?: boolean;
  validate: (answer: string) => boolean;
};

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
    "variables-takeaways": "Every variable has a type; = assigns; statements end with ;. String uses double quotes, char uses single quotes, reassignment changes the stored value, and + concatenates when a String is involved.",
    "variables-practice": "Practice combines output prediction, missing types, quote repair, exact concatenated output, multi-variable declarations, reassignment, and a cumulative profile challenge.",
  },
  "operators-expressions": {
    "operators-arithmetic": "Operators act on operands; expressions produce values. The chapter introduces +, -, *, /, and %. An expression calculates; assignment stores the result. // begins a comment Java ignores.",
    "operators-division": "When both operands are integers, Java performs integer division and discards the fractional part. A double operand preserves decimal division. A (double) cast can convert one operand for the calculation.",
    "operators-modulus": "% returns the remainder after division. Use it for leftovers, even/odd checks, cycles, and splitting totals into groups plus a remainder.",
    "operators-precedence": "Parentheses first, then * / % left to right, then + - left to right. Parentheses should be used when they make intent clearer.",
    "operators-increment": "++ increases a variable by one and -- decreases it by one. At this stage they are taught as standalone updates, avoiding prefix/postfix expression trivia.",
    "operators-assignment": "Compound assignment updates and stores in one statement: +=, -=, *=, /=, and %=. The operator comes before =.",
    "operators-concatenation": "Before Java reaches a String, + adds numbers. After String construction begins, later + operations append text unless parentheses force arithmetic first.",
    "operators-evaluation": "For long expressions: calculate parentheses, then * / %, then + -, working left to right among ties; then store or print while watching for String concatenation.",
    "operators-takeaways": "The chapter combines arithmetic, integer versus decimal division, casting, modulus, precedence, increment/decrement, compound assignment, and String-plus-number evaluation order.",
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
    ["gpa", "GPA"], ["java", "Java"], ["pdf", "PDF"], ["string", "String"],
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
    { id: "variables-predict", level: "Warm-up", kind: "Predict output", title: "Follow the value", prompt: "What is the exact output?", code: "int lives = 3;\nlives = 2;\nSystem.out.println(lives);", placeholder: "Type the output", hint: "The second assignment replaces the first value.", success: "Right—the name stays lives, but its stored value is now 2.", validate: (answer) => normalizeLines(answer) === "2" },
    { id: "variables-fill", level: "Warm-up", kind: "Fill missing code", title: "Choose the exact type", prompt: "Replace the blank so the declaration is valid Java.", code: "___ grade = 'A';", placeholder: "Type only the missing word", hint: "One character in single quotes has its own primitive type.", success: "Correct. char stores exactly one character and uses single quotes.", validate: (answer) => answer.trim() === "char" },
    { id: "variables-fix", level: "Apply", kind: "Fix the error", title: "Repair the quotes", prompt: "Rewrite the line as valid Java.", code: "String name = 'Daniel';", placeholder: "Rewrite the complete line", hint: "String and char do not use the same quotation marks.", success: "Fixed. String text uses double quotes.", validate: (answer) => compactCode(answer) === 'Stringname="Daniel";' },
    multipleChoiceQuestion("variables-primitive", "Separate primitive and reference types", "Which list contains only the four primitive types introduced in this chapter?", ["int, double, boolean, char", "int, double, boolean, String", "String, char, text, number", "int, decimal, true, char"], "int, double, boolean, char", "String is the reference type introduced here.", "Correct. int, double, boolean, and char are primitive types; String is a reference type."),
    multipleChoiceQuestion("variables-valid-name", "Choose a clear valid name", "Which is the best valid Java variable name for a player's remaining health?", ["2health", "player health", "int", "playerHealth"], "playerHealth", "Use a descriptive camelCase name with no spaces, leading number, or Java keyword.", "Correct. playerHealth is descriptive and follows the naming rules."),
    multipleChoiceQuestion("variables-case-sensitive", "Track capitalization", "Java is case-sensitive. Which statement is true about score and Score?", ["They are two different variable names", "They always store the same value", "Both are invalid", "Java automatically changes both to score"], "They are two different variable names", "Capitalization is part of the name.", "Correct. score and Score refer to different names."),
    { id: "variables-reassign", level: "Apply", kind: "Write one update", title: "Reassign without redeclaring", prompt: "A variable was declared with int lives = 3;. Write only the statement that changes its stored value to 2.", code: "int lives = 3;", placeholder: "Write the update", hint: "Reuse the name without writing int again.", success: "Correct. Reassignment changes the stored value without declaring a second variable.", validate: (answer) => compactCode(answer) === "lives=2;" },
    multipleChoiceQuestion("variables-print-name", "Print a variable or literal", "Given int age = 25;, which statement prints the stored value 25 rather than the word age?", ["System.out.println(\"age\");", "System.out.println(age);", "System.out.println(25 age);", "System.out.println = age;"], "System.out.println(age);", "Quotation marks create literal text; a bare variable name retrieves its value.", "Correct. println(age) reads and prints the value stored under age."),
    { id: "variables-print-text", level: "Warm-up", kind: "Write one statement", title: "Print literal text", prompt: "Write one statement that prints exactly Hello.", placeholder: "Write one Java statement", hint: "Literal String text belongs in double quotes.", success: "Correct. The String literal is passed to println.", validate: (answer) => compactCode(answer) === 'System.out.println("Hello");' },
    { id: "variables-concat", level: "Apply", kind: "Exact output", title: "Trace concatenation", prompt: "What is printed? Match capitalization, spaces, and punctuation.", code: 'String name = "Daniel";\nint age = 25;\nSystem.out.println("Name: " + name + ", Age: " + age);', placeholder: "Type the exact output", hint: "Read the println from left to right and keep the spaces inside each String.", success: "Exactly. Java joined the text and both variable values into one line.", validate: (answer) => normalizeLines(answer) === "Name: Daniel, Age: 25" },
    { id: "variables-concat-space", level: "Apply", kind: "Fix exact output", title: "Preserve the space", prompt: "Rewrite only the println statement so the output is exactly Hello Daniel.", code: 'String name = "Daniel";\nSystem.out.println("Hello" + name);', placeholder: "Write the corrected println statement", hint: "The space must live inside one of the String literals.", success: "Correct. The literal includes the space Java needs to print.", validate: (answer) => compactCode(answer) === 'System.out.println("Hello"+name);' && /"Hello\s"/.test(answer) },
    { id: "variables-constraints", level: "Apply", kind: "Write code", title: "Build four variables", prompt: "Declare name as Daniel, age as 25, height as 6.2, and hungry as true. Then print each variable on its own line.", placeholder: "Write the declarations and print statements", hint: "You need String, int, double, and boolean—plus four println statements.", success: "All four values are declared with matching types and printed.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && ["name", "age", "height", "hungry"].every((name) => code.includes(`System.out.println(${name});`)); } },
    { id: "variables-challenge", level: "Challenge", kind: "Editor challenge", title: "Create a player profile", prompt: "Create name Daniel, age 25, height 6.2, hungry true, and grade A. Reassign age to 26. Print exactly: Daniel | 26 | 6.2 | true | A", placeholder: "Write Java statements that satisfy every constraint", hint: "Declare five variables, update age without writing int again, then concatenate the values with \" | \".", success: "Chapter challenge cleared. You declared, updated, and combined five correctly typed values.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /Stringname="Daniel";/.test(code) && /intage=25;/.test(code) && /doubleheight=6\.2;/.test(code) && /booleanhungry=true;/.test(code) && /chargrade='A';/.test(code) && /age=26;/.test(code) && /System\.out\.println\(name\+"\|"/.test(code.replace(/" \| "/g, '"|"')) && ["age", "height", "hungry", "grade"].every((name) => code.includes(`+${name}`)); } },
  ],
  "operators-expressions": [
    multipleChoiceQuestion("operators-terms", "Separate operator and operand", "In 8 + 2, which part is the operator?", ["8", "+", "2", "10"], "+", "The operator is the symbol that performs the action.", "Correct. + is the operator; 8 and 2 are operands."),
    { id: "operators-basic-arithmetic", level: "Warm-up", kind: "Predict output", title: "Use several arithmetic operators", prompt: "What is the exact output?", code: "int result = 12 - 3 * 2;\nSystem.out.println(result);", placeholder: "Type the output", hint: "Multiply before subtracting.", success: "Correct. 3 * 2 is 6, then 12 - 6 is 6.", validate: (answer) => normalizeLines(answer) === "6" },
    { id: "operators-arithmetic-predict", level: "Warm-up", kind: "Predict output", title: "Use precedence", prompt: "What is the exact output?", code: "int score = 4 + 3 * 2;\nSystem.out.println(score);", placeholder: "Type the output", hint: "Multiplication happens before addition.", success: "Correct: 3 × 2 happens first, then 4 is added.", validate: (answer) => normalizeLines(answer) === "10" },
    { id: "operators-integer-division", level: "Warm-up", kind: "Predict output", title: "Use integer division", prompt: "What is the exact output?", code: "int groups = 10 / 3;\nSystem.out.println(groups);", placeholder: "Type the output", hint: "Both operands are integers, so Java performs integer division.", success: "Correct. 10 / 3 is integer division, so the fractional part is discarded and 3 is stored.", validate: (answer) => normalizeLines(answer) === "3" },
    { id: "operators-decimal-division", level: "Apply", kind: "Predict output", title: "Keep decimal division", prompt: "What is the exact output?", code: "double result = 10.0 / 4;\nSystem.out.println(result);", placeholder: "Type the output", hint: "One operand is a double, so Java keeps the fractional result.", success: "Correct. Decimal division produces 2.5.", validate: (answer) => normalizeLines(answer) === "2.5" },
    { id: "operators-cast-division", level: "Apply", kind: "Fix the calculation", title: "Cast before dividing", prompt: "Rewrite only the assignment so average stores 2.5. Keep total and count as int variables.", code: "int total = 5;\nint count = 2;\ndouble average = total / count;", placeholder: "Write the corrected assignment", hint: "Cast one operand to double before division occurs.", success: "Correct. The cast changes this calculation to decimal division.", validate: (answer) => compactCode(answer) === "doubleaverage=(double)total/count;" },
    { id: "operators-modulus-calculate", level: "Apply", kind: "Calculate the remainder", title: "Find what is left", prompt: "What is the exact output?", code: "int remainder = 23 % 6;\nSystem.out.println(remainder);", placeholder: "Type the output", hint: "Six fits into 23 three full times. What remains?", success: "Correct. 6 × 3 uses 18, leaving a remainder of 5.", validate: (answer) => normalizeLines(answer) === "5" },
    { id: "operators-modulus-even", level: "Apply", kind: "Complete a condition", title: "Use modulus for evenness", prompt: "Replace the blank so even is true when number is divisible by 2 with no remainder.", code: "boolean even = number % 2 ___ 0;", placeholder: "Type only the missing operator", hint: "Compare the remainder with zero.", success: "Correct. A remainder equal to zero means the number is even.", validate: (answer) => answer.trim() === "==" },
    { id: "operators-update-sequence", level: "Apply", kind: "Trace mixed updates", title: "Follow each change", prompt: "What is the final output?", code: "int score = 10;\nscore++;\nscore += 5;\nscore--;\nSystem.out.println(score);", placeholder: "Type the output", hint: "Track score after every line: add one, add five, then subtract one.", success: "Correct. Score changes from 10 to 11 to 16 to 15.", validate: (answer) => normalizeLines(answer) === "15" },
    { id: "operators-increment", level: "Warm-up", kind: "Write two updates", title: "Increment and decrement", prompt: "Write two statements: first increase lives by one with ++, then decrease score by one with --.", placeholder: "Write the two statements", hint: "Each operator comes directly after its variable name.", success: "Correct. Both values change by exactly one.", multiline: true, validate: (answer) => compactCode(answer) === "lives++;score--;" },
    { id: "operators-compound", level: "Apply", kind: "Rewrite with shorthand", title: "Use compound assignment", prompt: "Rewrite score = score + 5; using compound assignment.", code: "score = score + 5;", placeholder: "Write the shorter statement", hint: "The operator comes before the equals sign.", success: "Correct. += calculates and stores the updated value.", validate: (answer) => compactCode(answer) === "score+=5;" },
    { id: "operators-parentheses-repair", level: "Apply", kind: "Fix the expression", title: "Make addition happen first", prompt: "Rewrite the full line so total stores 14. Change only the expression by adding parentheses.", code: "int total = 4 + 3 * 2;", placeholder: "Rewrite the full corrected line", hint: "Group 4 + 3 so Java evaluates it before multiplying by 2.", success: "Fixed. Parentheses make 4 + 3 happen first, so 7 × 2 stores 14.", validate: (answer) => compactCode(answer) === "inttotal=(4+3)*2;" },
    { id: "operators-string-order", level: "Challenge", kind: "Predict exact text", title: "Catch the concatenation trap", prompt: "What is the exact output, including spaces?", code: "int x = 2;\nint y = 3;\nSystem.out.println(\"Total: \" + x + y);", placeholder: "Type the exact output", hint: "Once Java starts with the String, each later value is joined as text from left to right.", success: "Correct. Java builds \"Total: 2\" first, then appends 3, producing Total: 23.", validate: (answer) => normalizeLines(answer) === "Total: 23" },
    { id: "operators-string-parentheses", level: "Apply", kind: "Predict exact text", title: "Force arithmetic first", prompt: "What is the exact output?", code: "int x = 2;\nint y = 3;\nSystem.out.println(\"Total: \" + (x + y));", placeholder: "Type the exact output", hint: "Parentheses finish the numeric addition before concatenation.", success: "Correct. x + y becomes 5 before it joins the String.", validate: (answer) => normalizeLines(answer) === "Total: 5" },
    { id: "operators-state-trace", level: "Challenge", kind: "Trace stored state", title: "Track a longer update chain", prompt: "What is the final output?", code: "int energy = 20;\nenergy /= 2;\nenergy += 7;\nenergy *= 3;\nenergy %= 10;\nSystem.out.println(energy);", placeholder: "Type the output", hint: "Write down energy after each statement before moving to the next one.", success: "Correct. Energy changes 20 → 10 → 17 → 51 → 1.", validate: (answer) => normalizeLines(answer) === "1" },
    { id: "operators-resource-challenge", level: "Challenge", kind: "Editor challenge", title: "Build a resource calculator", prompt: "Declare missions as 4, reward as 15, multiplier as 2, and fee as 7. Calculate balance with missions * reward * multiplier - fee. Print exactly: Balance: 113 credits", placeholder: "Write the declarations, calculation, and println statement", hint: "Store the longer expression in an int named balance, then concatenate balance between the two text pieces.", success: "Operators challenge cleared. You combined declarations, precedence, a longer expression, and exact String output.", multiline: true, validate: (answer) => { const code = compactCode(answer); return /intmissions=4;/.test(code) && /intreward=15;/.test(code) && /intmultiplier=2;/.test(code) && /intfee=7;/.test(code) && /intbalance=missions\*reward\*multiplier-fee;/.test(code) && /System\.out\.println\("Balance:"\+balance\+"credits"\);/.test(code); } },
  ],
  ...additionalPracticeQuestions,
};

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
  { label: "Core construction", description: "The required data, implementation, and calculus sequence.", nodes: [
    { id: "math-1206", label: "Standard math path", title: "Calculus II", codes: ["MATH 1206"], note: "This map follows the standard calculus sequence; transferred or substituted credit should be confirmed in DegreeWorks.", kind: "required" },
    { id: "cisc-3130", label: "Required", title: "Data structures", codes: ["CISC 3130"], kind: "required" },
    { id: "cisc-3140", label: "Required", title: "Design & implementation II", codes: ["CISC 3140"], kind: "required" },
  ] },
  { label: "Advanced branches", description: "Required upper-level work plus the places where you choose a route.", nodes: [
    { id: "cisc-3142", label: "Required", title: "Programming paradigms in C++", codes: ["CISC 3142"], kind: "required" },
    { id: "cisc-3320", label: "Required", title: "Operating systems", codes: ["CISC 3320"], note: "CISC 7312X is an alternative only with GPA above 3.0.", kind: "required" },
    { id: "architecture-choice", label: "Choose one", title: "Architecture / organization", codes: ["CISC 3310", "CISC 3305"], kind: "choice" },
    { id: "theory-choice", label: "Choose one", title: "Algorithms / theory", codes: ["CISC 3220", "CISC 3230"], kind: "choice" },
    { id: "probability-choice", label: "Choose one", title: "Probability & statistics", codes: ["MATH 2501", "MATH 3501"], kind: "choice" },
    { id: "ethics-choice", label: "Choose one", title: "Computers & ethics", codes: ["CISC 2820W", "PHIL 3318W"], note: "CISC 2820W may also help the separate CISC writing-intensive rule; confirm with advisement.", kind: "choice" },
    { id: "electives", label: "Choose three", title: "Upper-level CISC electives", note: "Three classes numbered CISC 3000-4899.", kind: "electives" },
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
  degreeCourses.map((course) => [course.code, "unknown" as DegreeStatus]),
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
      "variables-types": ["variables-int", "variables-double", "variables-boolean", "variables-fill", "variables-fix", "variables-primitive"],
      "variables-naming": ["variables-valid-name", "variables-case-sensitive"],
      "variables-changing": ["variables-predict", "variables-reassign"],
      "variables-printing": ["variables-print-name", "variables-print-text"],
      "variables-concatenation": ["variables-concat", "variables-concat-space"],
      "variables-program": ["variables-constraints"],
    },
    review: ["variables-challenge"],
  },
  "operators-expressions": {
    checkpoints: {
      "operators-arithmetic": ["operators-terms", "operators-basic-arithmetic"],
      "operators-division": ["operators-integer-division", "operators-decimal-division", "operators-cast-division"],
      "operators-modulus": ["operators-modulus-calculate", "operators-modulus-even"],
      "operators-precedence": ["operators-arithmetic-predict", "operators-parentheses-repair"],
      "operators-increment": ["operators-increment"],
      "operators-assignment": ["operators-update-sequence", "operators-compound"],
      "operators-concatenation": ["operators-string-order", "operators-string-parentheses"],
      "operators-evaluation": ["operators-state-trace"],
    },
    review: ["operators-resource-challenge"],
  },
};

function chapterPracticePlan(chapterId: string): ChapterPracticePlan {
  const explicit = foundationalPracticePlans[chapterId];
  if (explicit) return explicit;

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

function chapterProgress(chapterId: string, _completed: string[], practice: PracticeRecords) {
  const questions = practiceQuestions[chapterId] ?? [];
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

function Sidebar({ view, setView, completed, practice, onOpenInfo, onOpenBackup }: { view: View; setView: (view: View) => void; completed: string[]; practice: PracticeRecords; onOpenInfo: () => void; onOpenBackup: () => void }) {
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
    <div className="sidebar-footer"><div className="sidebar-footer-actions"><button className="about-sidebar-button" onClick={onOpenBackup}><Download size={15} />Progress Backup</button><button className="about-sidebar-button" onClick={onOpenInfo}><CircleHelp size={16} />About Exceler A</button></div><div className="sync-state"><span />Progress saved on this device</div></div>
  </aside>;
}

function MobileNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><House size={18} />Home</button><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BookOpen size={18} />Overview</button><button className={view === "courses" ? "active" : ""} onClick={() => setView("courses")}><GraduationCap size={18} />Courses</button><button className={view === "degree" ? "active" : ""} onClick={() => setView("degree")}><GitBranch size={18} />Degree</button><button className={view === "course" ? "active" : ""} onClick={() => setView("course")}><Code2 size={18} />Java</button></nav>;
}

function HomeView({ completed, practice, snapshot, setView, onOpenInfo }: { completed: string[]; practice: PracticeRecords; snapshot: AuditSnapshot; setView: (view: View) => void; onOpenInfo: () => void }) {
  const progress = learningProgress(completed, practice);
  const nextChapter = authoredChapters.find((chapter) => chapterProgress(chapter.id, completed, practice).percent < 100) ?? authoredChapters[0];
  const nextState = chapterProgress(nextChapter.id, completed, practice);
  const hasAudit = snapshot.sourceName !== "No audit uploaded";
  return <main className="home-page">
    <section className="home-stage">
      <div className="home-title-lockup" aria-label="Exceler A"><b>EXCELER</b><img src="/exceler-a-mark-512.png" alt="A" /></div>
      <button className="home-about-button" onClick={onOpenInfo}><CircleHelp size={15} />About</button>
      <div className="home-primary">
        <div className="home-intro">
          <p className="eyebrow">Self-Directed Academic Learning</p>
          <h1>Your Education,<br /><span>Under Your Direction.</span></h1>
          <p className="home-declaration">Structured teaching, academic guidance, and a clear degree path—without giving up control of how you learn.</p>
          <p className="home-maker-line"><span>Built by</span><b>Daniel Lezhanskiy</b><i />Brooklyn College Computer Science</p>
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

function CoursesView({ completed, practice, onOpenCourse }: { completed: string[]; practice: PracticeRecords; onOpenCourse: () => void }) {
  const progress = learningProgress(completed, practice);
  return <main className="page-content courses-page">
    <header className="courses-heading"><div><p className="eyebrow accent-text">Course Library</p><h2>Courses</h2><p>Open a course to continue its lessons, practice, and chapter progression. Additional Brooklyn College CS courses will be added as they are built and reviewed.</p></div><div className="course-count"><b>1</b><small>Course Available</small></div></header>
    <section className="course-library-group"><header><div><p className="eyebrow">Computer &amp; Information Science</p><h3>{titleCase("Programming Courses")}</h3></div><span>1 course</span></header><div className="course-library-list">
      <button className="course-library-card" onClick={onOpenCourse}>
        <span className="course-glyph large">J</span>
        <span className="course-library-copy"><small>CISC 1115 · Self-Study</small><b>{titleCase("Introduction to Programming Using Java")}</b><em>{learningChapters.length} chapters · Lessons and demonstrated practice</em></span>
        <span className="course-library-progress"><strong>{progress.percent}%</strong><small>{progress.completedChapters} / {learningChapters.length} chapters cleared</small><ProgressBar value={progress.percent} /></span>
        <ArrowRight size={17} />
      </button>
    </div></section>
  </main>;
}

function tutorLessonReference(chapterId: string, sectionId: string) {
  const foundational = foundationalTutorReferences[chapterId]?.[sectionId];
  if (foundational) return foundational;
  return structuredLessonContent[chapterId]?.find((section) => section.id === sectionId) ?? "The current section is a practice session. Use the chapter description and progress as context.";
}

const SectionPracticeRendererContext = createContext<(sectionId: string) => React.ReactNode>(() => null);

function CourseView({ completed, practice, onPracticeChange, onTutorContextChange }: { completed: string[]; practice: PracticeRecords; onPracticeChange: (chapterId: string, record: PracticeRecord) => void; onTutorContextChange: (context: TutorCourseContext) => void }) {
  const [selectedChapterId, setSelectedChapterId] = useState(learningChapters[0].id);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(learningChapters[0].id);
  const [activeSectionId, setActiveSectionId] = useState(learningChapters[0].sections[0]?.id ?? "");
  const [practiceTutorContext, setPracticeTutorContext] = useState<TutorPracticeContext | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const scrollLockRef = useRef<string | null>(null);
  const selectedChapter = learningChapters.find((chapter) => chapter.id === selectedChapterId) ?? learningChapters[0];
  const course = learningProgress(completed, practice);
  const chapter = chapterProgress(selectedChapter.id, completed, practice);
  const practicePlan = useMemo(() => chapterPracticePlan(selectedChapter.id), [selectedChapter.id]);

  useLayoutEffect(() => {
    scrollLockRef.current = null;
    setActiveSectionId(selectedChapter.sections[0]?.id ?? "");
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }, [selectedChapter.id, selectedChapter.sections]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    const update = () => {
      if (scrollLockRef.current) return;
      const current = selectedChapter.sections.map((section) => { const element = reader.querySelector<HTMLElement>(`#${section.id}`); return element ? { id: section.id, top: element.getBoundingClientRect().top - reader.getBoundingClientRect().top } : null; }).filter((entry): entry is { id: string; top: number } => Boolean(entry)).filter((entry) => entry.top <= 125).at(-1);
      if (current) setActiveSectionId(current.id);
    };
    update(); reader.addEventListener("scroll", update, { passive: true });
    return () => reader.removeEventListener("scroll", update);
  }, [selectedChapter]);

  useEffect(() => {
    const section = selectedChapter.sections.find((item) => item.id === activeSectionId) ?? selectedChapter.sections[0];
    if (!section) return;
    onTutorContextChange({
      courseCode: "CISC 1115",
      courseTitle: "Introduction to Programming Using Java",
      courseProgress: course.percent,
      chapterId: selectedChapter.id,
      chapterTitle: titleCase(selectedChapter.title),
      chapterDescription: selectedChapter.description,
      chapterProgress: chapter.percent,
      sectionId: section.id,
      sectionTitle: titleCase(section.title),
      lessonReference: tutorLessonReference(selectedChapter.id, section.id),
      practicePassed: chapter.passed,
      practiceTotal: chapter.questions,
      activePractice: (section.id.endsWith("practice") || Boolean(practicePlan.checkpoints[section.id])) && practiceTutorContext?.chapterId === selectedChapter.id ? practiceTutorContext : null,
    });
  }, [activeSectionId, chapter.passed, chapter.percent, chapter.questions, course.percent, onTutorContextChange, practicePlan.checkpoints, practiceTutorContext, selectedChapter]);

  const selectChapter = (next: LearningChapter) => {
    if (next.id === selectedChapterId) {
      setExpandedChapterId((current) => current === next.id ? null : next.id);
      return;
    }
    scrollLockRef.current = null;
    if (readerRef.current) readerRef.current.scrollTop = 0;
    setActiveSectionId(next.sections[0]?.id ?? "");
    setExpandedChapterId(next.id);
    setSelectedChapterId(next.id);
    window.requestAnimationFrame(() => { if (readerRef.current) readerRef.current.scrollTop = 0; });
  };
  const scrollToSection = (sectionId: string) => {
    const reader = readerRef.current; const element = reader?.querySelector<HTMLElement>(`#${sectionId}`);
    if (!reader || !element) return;
    scrollLockRef.current = sectionId;
    setActiveSectionId(sectionId);
    const readerTop = reader.getBoundingClientRect().top;
    const sectionTop = element.getBoundingClientRect().top;
    reader.scrollTo({ top: Math.max(0, reader.scrollTop + sectionTop - readerTop - 22), behavior: "smooth" });
    window.setTimeout(() => { if (scrollLockRef.current === sectionId) scrollLockRef.current = null; }, 1600);
  };
  const checkpointEntries = Object.entries(practicePlan.checkpoints);
  const renderSectionPractice = (sectionId: string) => {
    const questionIds = practicePlan.checkpoints[sectionId];
    if (!questionIds?.length) return null;
    const checkpointNumber = checkpointEntries.findIndex(([id]) => id === sectionId) + 1;
    return <ChapterPractice chapterId={selectedChapter.id} questionIds={questionIds} variant="checkpoint" checkpointNumber={checkpointNumber} practiceSectionId={`${sectionId}-check`} record={practice[selectedChapter.id]} onChange={(record) => onPracticeChange(selectedChapter.id, record)} onTutorPracticeContextChange={setPracticeTutorContext} tutorActive={activeSectionId === sectionId} />;
  };

  return <main className="course-page continuous-course">
    <div className="continuous-layout">
      <aside className="contents-rail">
        <div className="contents-heading"><p className="eyebrow">Course Contents</p><span>{learningChapters.length} chapters</span></div>
        {learningChapters.map((item, index) => {
          const state = chapterProgress(item.id, completed, practice);
          const selected = item.id === selectedChapter.id;
          const open = item.id === expandedChapterId;
          const done = state.percent === 100;
          const itemPracticePlan = chapterPracticePlan(item.id);
          const passedQuestionIds = new Set(practice[item.id]?.passed ?? []);
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
          </div></Fragment>;
        })}
        <div className="section-progress-card"><div><span>Course Completion</span><b>{course.percent}%</b></div><ProgressBar value={course.percent} /><small>{course.completedChapters} / {learningChapters.length} chapters cleared</small><p>Only passed practice creates course progress. A chapter clears when every exercise passes.</p></div>
      </aside>
      <div className="chapter-reader" ref={readerRef}><article className="chapter-article chapter-swap" key={selectedChapter.id}><header className="chapter-cover"><h1>{titleCase(selectedChapter.title)}</h1><p>{selectedChapter.description}</p><div><span>Learn, check, continue</span><span>{practiceQuestions[selectedChapter.id]?.length ?? 0} practice exercises</span><span>Pass every exercise to clear</span></div></header><SectionPracticeRendererContext.Provider value={renderSectionPractice}><ChapterLessonContent chapterId={selectedChapter.id} /></SectionPracticeRendererContext.Provider><ChapterPractice chapterId={selectedChapter.id} questionIds={practicePlan.review} variant="review" practiceSectionId={selectedChapter.sections.at(-1)?.id ?? `${selectedChapter.id}-practice`} record={practice[selectedChapter.id]} onChange={(record) => onPracticeChange(selectedChapter.id, record)} onTutorPracticeContextChange={setPracticeTutorContext} tutorActive={activeSectionId.endsWith("practice")} /></article></div>
    </div>
  </main>;
}

function LearningSectionBlock({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  const renderSectionPractice = useContext(SectionPracticeRendererContext);
  return <section className="lesson-section" id={id} data-learning-section><div className="lesson-section-heading"><p className="eyebrow">{eyebrow}</p><h2>{titleCase(title)}</h2></div>{children}{renderSectionPractice(id)}</section>;
}

function CodeExample({ label, code }: { label: string; code: string }) {
  return <div className="teaching-code lesson-code"><div><span>Java</span><small>{label}</small></div><pre><code>{code}</code></pre></div>;
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
    <LearningSectionBlock id="variables-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} />Every variable has a data type.</li><li><Check size={16} />A variable name points to a stored value.</li><li><Check size={16} /><code>=</code> assigns the value on the right.</li><li><Check size={16} />Statements end with <code>;</code>.</li><li><Check size={16} /><code>String</code> uses double quotes; <code>char</code> uses single quotes.</li><li><Check size={16} />Reassignment changes a value without declaring again.</li><li><Check size={16} /><code>+</code> joins text and variables when a String is involved.</li></ul></LearningSectionBlock>
  </>;

  if (chapterId === "operators-expressions") return <>
    <LearningSectionBlock id="operators-arithmetic" eyebrow="Core operations" title="Arithmetic operators"><p className="lesson-lead">An operator tells Java to perform an action on values. The values an operator works with are called <b>operands</b>. An <b>expression</b> is code that produces a value. Arithmetic expressions produce a new number; they do not change a variable unless you assign the result.</p><div className="operator-grid"><div><code>+</code><b>Add</b><small>8 + 2 → 10</small></div><div><code>-</code><b>Subtract</b><small>8 - 2 → 6</small></div><div><code>*</code><b>Multiply</b><small>8 * 2 → 16</small></div><div><code>/</code><b>Divide</b><small>8 / 2 → 4</small></div><div><code>%</code><b>Remainder</b><small>8 % 3 → 2</small></div></div><CodeExample label="Calculate, then store the result" code={'int price = 12;\nint quantity = 3;\nint subtotal = price * quantity;\n\nSystem.out.println(subtotal);  // 36'} /><div className="rule-callout"><b>The expression and assignment do different jobs</b><p><code>price * quantity</code> calculates 36. The <code>=</code> then stores that result in <code>subtotal</code>. Text after <code>{'//'}</code> is a <b>comment</b>: Java ignores it, so it can explain code without changing the program.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-division" eyebrow="A Java-specific trap" title="Integer vs decimal division"><p className="lesson-lead">Division depends on the types of the values being divided. When both operands are integers, Java performs integer division. Any fractional part of the result is discarded.</p><div className="comparison-code"><pre><small>INTEGER DIVISION</small><code>10 / 3</code><b>3</b></pre><pre><small>DECIMAL DIVISION</small><code>10.0 / 3</code><b>3.3333333333333335</b></pre></div><CodeExample label="The variable type alone does not rescue the decimal" code={'double first = 10 / 3;    // stores 3.0\ndouble second = 10.0 / 3; // stores 3.333...'} /><CodeExample label="Convert an existing int for one calculation" code={'int sum = 5;\nint count = 2;\ndouble average = (double) sum / count;  // 2.5'} /><aside className="key-idea"><Sparkles size={17} /><p><b>Java decides how to divide before it stores the answer.</b><span>Make at least one operand a <code>double</code> when you need a decimal result. Writing <code>(double) sum</code> is a <b>cast</b>: for that calculation, Java treats the stored integer as a decimal value.</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="operators-modulus" eyebrow="Keep the remainder" title="Modulus"><p className="lesson-lead">The modulus operator <code>%</code> returns the remainder left after integer division. Read <code>17 % 5</code> as “the remainder when 17 is divided by 5.”</p><div className="operator-grid remainder-grid"><div><code>10 % 3</code><b>1</b><small>3 fits three times</small></div><div><code>14 % 2</code><b>0</b><small>Evenly divisible</small></div><div><code>17 % 5</code><b>2</b><small>15 used, 2 left</small></div><div><code>5 % 8</code><b>5</b><small>8 does not fit once</small></div></div><CodeExample label="Store a remainder" code={'int cookies = 17;\nint people = 5;\nint leftovers = cookies % people;\n\nSystem.out.println(leftovers);  // 2'} /><div className="rule-callout"><b>Why zero matters</b><p>If <code>number % 2</code> is <code>0</code>, the number is even. Modulus is also useful for cycles, grouping, and determining whether division comes out evenly.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-precedence" eyebrow="Evaluation order" title="Precedence & parentheses"><p className="lesson-lead">Java does not simply calculate every expression from left to right. Parentheses run first; then multiplication, division, and modulus; then addition and subtraction.</p><div className="comparison-code"><pre><small>DEFAULT ORDER</small><code>4 + 3 * 2</code><b>10</b></pre><pre><small>PARENTHESES FIRST</small><code>(4 + 3) * 2</code><b>14</b></pre></div><div className="expression-steps"><div><span>1</span><code>18 - 4 * 2 + 12 / 3</code><small>Original expression</small></div><div><span>2</span><code>18 - 8 + 4</code><small>Multiply and divide</small></div><div><span>3</span><code>10 + 4</code><small>Equal precedence: left to right</small></div><div><span>4</span><code>14</code><small>Final result</small></div></div><p className="lesson-note">Use parentheses when they clarify your intention, even when Java would already produce the same result.</p></LearningSectionBlock>
    <LearningSectionBlock id="operators-increment" eyebrow="Change by one" title="Increment & decrement"><p className="lesson-lead"><code>++</code> adds one and <code>--</code> subtracts one. They are common with counters, scores, lives, and later with loops.</p><CodeExample label="One-step updates" code={'int lives = 3;\nlives--;  // lives is now 2\nlives++;  // lives is back to 3'} /><div className="comparison-code"><pre><small>LONG FORM</small><code>score = score + 1;</code><b>adds one</b></pre><pre><small>SHORT FORM</small><code>score++;</code><b>adds one</b></pre></div><div className="rule-callout muted"><b>Keep it simple for now</b><p>Use <code>++</code> and <code>--</code> on their own lines. Putting them inside a larger expression introduces evaluation-order behavior that is easier to misread.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-assignment" eyebrow="Update stored state" title="Compound assignment"><p className="lesson-lead">Compound assignment performs an operation using the current value, then stores the result back in the same variable.</p><div className="operator-grid"><div><code>+=</code><b>Add, assign</b><small>score += 5</small></div><div><code>-=</code><b>Subtract, assign</b><small>lives -= 1</small></div><div><code>*=</code><b>Multiply, assign</b><small>coins *= 2</small></div><div><code>/=</code><b>Divide, assign</b><small>team /= 3</small></div><div><code>%=</code><b>Remainder, assign</b><small>index %= 4</small></div></div><CodeExample label="Follow the stored value" code={'int energy = 10;\nenergy += 5;  // 15\nenergy *= 2;  // 30\nenergy -= 4;  // 26'} /><aside className="key-idea"><RotateCcw size={17} /><p><b>The operator comes before the equals sign.</b><span>Write <code>+=</code>, not <code>=+</code>. Read it as “add, then assign.”</span></p></aside></LearningSectionBlock>
    <LearningSectionBlock id="operators-concatenation" eyebrow="A crucial edge case" title="String + number behavior"><p className="lesson-lead">The <code>+</code> symbol adds numbers, but it joins values when a String is involved. Operations with the same precedence are evaluated from left to right.</p><div className="expression-steps string-order"><div><span>1</span><code>System.out.println(2 + 3);</code><small>5</small></div><div><span>2</span><code>System.out.println("Total: " + 2 + 3);</code><small>Total: 23</small></div><div><span>3</span><code>System.out.println("Total: " + (2 + 3));</code><small>Total: 5</small></div><div><span>4</span><code>System.out.println(2 + 3 + " total");</code><small>5 total</small></div></div><div className="rule-callout"><b>Find the first String</b><p>Before Java reaches a String, numeric <code>+</code> still adds. After Java starts building text, later values are appended unless parentheses force arithmetic first.</p></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-evaluation" eyebrow="Put the rules together" title="Evaluating expressions"><p className="lesson-lead">For a longer expression, do not guess. Mark the parentheses, calculate high-precedence operations, work left to right among ties, and only then follow String concatenation.</p><div className="expression-checklist"><div><span>1</span><p><b>Find parentheses</b><small>Evaluate the innermost group first.</small></p></div><div><span>2</span><p><b>Handle *, /, and %</b><small>For ties, move left to right.</small></p></div><div><span>3</span><p><b>Handle + and -</b><small>Continue left to right.</small></p></div><div><span>4</span><p><b>Store or print</b><small>Watch for the first String when + appears.</small></p></div></div><CodeExample label="A complete resource calculation" code={'int missions = 4;\nint reward = 15;\nint multiplier = 2;\nint fee = 7;\n\nint balance = missions * reward * multiplier - fee;\nSystem.out.println("Balance: " + balance + " credits");'} /><div className="output-card"><span>OUTPUT</span><code>Balance: 113 credits</code></div></LearningSectionBlock>
    <LearningSectionBlock id="operators-takeaways" eyebrow="Chapter summary" title="Key takeaways"><ul className="takeaway-list"><li><Check size={16} /><code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, and <code>%</code> create numeric results.</li><li><Check size={16} />The values an operator works with are operands.</li><li><Check size={16} />Integer division discards the decimal part; a double operand keeps it.</li><li><Check size={16} /><code>(double)</code> casts a value for decimal calculation.</li><li><Check size={16} /><code>{'//'}</code> begins a comment that Java ignores.</li><li><Check size={16} /><code>%</code> returns the remainder.</li><li><Check size={16} />Parentheses run before <code>* / %</code>, which run before <code>+ -</code>.</li><li><Check size={16} /><code>++</code> and <code>--</code> change a value by one.</li><li><Check size={16} /><code>+=</code>, <code>-=</code>, <code>*=</code>, <code>/=</code>, and <code>%=</code> update and assign.</li><li><Check size={16} />Equal-precedence operators are evaluated left to right.</li><li><Check size={16} />Once a String is involved, <code>+</code> concatenates unless parentheses force arithmetic first.</li></ul></LearningSectionBlock>
  </>;

  const structuredSections = structuredLessonContent[chapterId];
  if (structuredSections) return <StructuredLesson sections={structuredSections} renderAfterSection={renderSectionPractice} />;

  return null;
}

const emptyPracticeRecord = (): PracticeRecord => ({ answers: {}, attempts: {}, hints: [], passed: [] });

function ChapterPractice({ chapterId, questionIds, variant, checkpointNumber = 1, practiceSectionId, record: savedRecord, onChange, onTutorPracticeContextChange, tutorActive }: { chapterId: string; questionIds: string[]; variant: "checkpoint" | "review"; checkpointNumber?: number; practiceSectionId: string; record?: PracticeRecord; onChange: (record: PracticeRecord) => void; onTutorPracticeContextChange: (context: TutorPracticeContext) => void; tutorActive: boolean }) {
  const allQuestions = practiceQuestions[chapterId] ?? [];
  const questionIdSet = new Set(questionIds);
  const questions = allQuestions.filter((question) => questionIdSet.has(question.id));
  const record = savedRecord ?? emptyPracticeRecord();
  const allValidPassed = allQuestions.filter((question) => record.passed.includes(question.id)).map((question) => question.id);
  const validPassed = questions.filter((question) => record.passed.includes(question.id)).map((question) => question.id);
  const firstUnpassed = questions.findIndex((question) => !record.passed.includes(question.id));
  const [activeIndex, setActiveIndex] = useState(firstUnpassed < 0 ? 0 : firstUnpassed);
  const [feedback, setFeedback] = useState<Record<string, "correct" | "incorrect">>({});
  const [reviewingCompleted, setReviewingCompleted] = useState(false);
  const question = questions[Math.min(activeIndex, questions.length - 1)];
  const passed = record.passed.includes(question.id);
  const allPassed = validPassed.length === questions.length;
  const chapterAllPassed = allValidPassed.length === allQuestions.length;
  const unansweredIndexes = questions
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !record.passed.includes(item.id))
    .map(({ index }) => index);
  const nextQuestionIndex = unansweredIndexes.find((index) => index > activeIndex) ?? unansweredIndexes[0] ?? -1;
  const currentAnswer = record.answers[question.id] ?? "";
  const currentFeedback = feedback[question.id];
  const currentAttempts = record.attempts[question.id] ?? 0;
  const clueShown = record.hints.includes(question.id);

  useEffect(() => {
    if (!tutorActive) return;
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
      studentAnswer: currentAnswer.slice(0, 8_000),
      answerTruncated: currentAnswer.length > 8_000,
      attempts: currentAttempts,
      status: passed ? "passed" : currentFeedback === "incorrect" ? "incorrect" : "not_checked",
      clueShown,
      shownClue: clueShown ? question.hint : null,
    });
  }, [activeIndex, chapterId, clueShown, currentAnswer, currentAttempts, currentFeedback, onTutorPracticeContextChange, passed, question, questions.length, tutorActive]);

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
  const revealHint = () => onChange({ ...record, hints: record.hints.includes(question.id) ? record.hints : [...record.hints, question.id] });
  const goToNextQuestion = () => {
    if (nextQuestionIndex >= 0) setActiveIndex(nextQuestionIndex);
  };

  const completionTitle = variant === "checkpoint" ? "Section Check Complete" : chapterAllPassed ? "Chapter Complete" : "Chapter Review Complete";
  const completionCopy = variant === "checkpoint" ? "" : chapterAllPassed ? "Every required exercise passed. This chapter is cleared and your progress is saved." : "The cumulative review passed. Finish the remaining section checks to clear the chapter.";
  const completionCard = <div className={`practice-complete-card ${variant === "checkpoint" ? "section-complete" : chapterAllPassed ? "chapter-complete" : "review-complete"}`}>
      {variant === "review" && chapterAllPassed && <div className="practice-complete-burst" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /></div>}
      <span className="practice-complete-check"><Check size={42} strokeWidth={3.2} /></span>
      <p className="eyebrow">{variant === "checkpoint" ? `Checkpoint ${checkpointNumber}` : "Cumulative Review"}</p>
      <h2>{completionTitle}</h2>
      {completionCopy && <p>{completionCopy}</p>}
      <div className="practice-complete-stats"><span><b>{questions.length}/{questions.length}</b> exercises passed</span><span><b>{record.hints.length}</b> clues used</span></div>
      <button className="soft-button practice-review-button" onClick={() => setReviewingCompleted(true)}>Review Answers<ChevronDown size={15} /></button>
    </div>;

  if (allPassed && !reviewingCompleted) return variant === "checkpoint"
    ? <div className="practice-session section-practice practice-complete-state" id={practiceSectionId}>{completionCard}</div>
    : <section className="practice-session practice-complete-state" id={practiceSectionId} data-learning-section>{completionCard}</section>;

  const practiceBody = <>
    <div className="practice-header"><div><p className="eyebrow">{variant === "checkpoint" ? `Check Your Understanding · ${String(checkpointNumber).padStart(2, "0")}` : "Cumulative Review"}</p><h2>{variant === "checkpoint" ? "Section Check" : "Chapter Review"}</h2>{variant === "review" && <p>Combine what you learned across the chapter. Every earlier section check also counts toward completion.</p>}</div><div className="practice-score"><b>{validPassed.length}/{questions.length}</b><small>passed</small></div></div>
    {questions.length > 1 && <div className="question-route">{questions.map((item, index) => <button key={item.id} className={`${index === activeIndex ? "active" : ""} ${record.passed.includes(item.id) ? "passed" : ""}`} onClick={() => setActiveIndex(index)} aria-label={`Open question ${index + 1}`}><span>{record.passed.includes(item.id) ? <Check size={13} strokeWidth={3} /> : index + 1}</span><small>{item.level}</small></button>)}</div>}
    <div className="practice-workspace" key={question.id}><header><div><span className={`difficulty ${question.level.toLowerCase()}`}>{question.level}</span><span>{question.kind}</span></div><small>{record.attempts[question.id] ?? 0} attempts</small></header><h3>{titleCase(question.title)}</h3><p>{question.prompt}</p>{question.code && <pre className="practice-code"><code>{question.code}</code></pre>}<label htmlFor={`practice-${question.id}`}>Your answer</label>{question.options?.length ? <div className="practice-options" id={`practice-${question.id}`} role="radiogroup" aria-label="Answer choices">{question.options.map((option, index) => <button type="button" role="radio" aria-checked={currentAnswer === option} className={currentAnswer === option ? "selected" : ""} key={option} onClick={() => updateAnswer(option)}><span>{String.fromCharCode(65 + index)}</span><b>{option}</b></button>)}</div> : question.multiline ? <textarea id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} spellCheck={false} /> : <input id={`practice-${question.id}`} value={record.answers[question.id] ?? ""} onChange={(event) => updateAnswer(event.target.value)} placeholder={question.placeholder} onKeyDown={(event) => { if (event.key !== "Enter") return; if (passed) goToNextQuestion(); else check(); }} autoComplete="off" />}
      {record.hints.includes(question.id) && <div className="practice-hint"><Sparkles size={15} /><p><b>Clue</b>{question.hint}</p></div>}
      <div className="practice-response-row">
        <div className="practice-feedback-slot">{(feedback[question.id] || passed) && <div className={`practice-feedback ${passed || feedback[question.id] === "correct" ? "correct" : "incorrect"}`}><span>{passed || feedback[question.id] === "correct" ? <Check size={18} strokeWidth={3} /> : <RotateCcw size={17} />}</span><p><b>{passed || feedback[question.id] === "correct" ? "Passed" : "Not yet"}</b><small>{passed || feedback[question.id] === "correct" ? question.success : "Check the exact requirement, use a clue if needed, and try again."}</small></p></div>}</div>
        <div className={`practice-actions ${passed ? "passed" : ""}`}>
          {!passed && <button className="soft-button" onClick={revealHint} disabled={record.hints.includes(question.id)}><CircleHelp size={14} />{record.hints.includes(question.id) ? "Clue shown" : "Show clue"}</button>}
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

function DegreeMap({ records, setRecords, snapshot, onImport }: { records: DegreeRecords; setRecords: (records: DegreeRecords) => void; snapshot: AuditSnapshot; onImport: () => void }) {
  const [selected, setSelected] = useState<DegreeCourse | null>(null);
  const completed = degreeCourses.filter((course) => records[course.code] === "complete").length;
  const inProgress = degreeCourses.filter((course) => records[course.code] === "in_progress").length;
  const hasAudit = snapshot.sourceName !== "No audit uploaded";
  return <main className="page-content degree-page focused-degree vertical-degree">
    <section className="degree-hero audit-backed-hero"><div><p className="eyebrow accent-text">Brooklyn College · Computer Science B.S.</p><h2>{hasAudit ? titleCase("Your path to the degree") : titleCase("Computer Science degree path")}</h2><p>{hasAudit ? "Required courses stay separate from choice groups. Branches mean “choose one,” not “take everything.” Your uploaded audit controls the status colors." : "Explore the required courses, choice groups, and graduation gates without exposing anyone’s personal academic record. Load your own DegreeWorks audit only when you want a private, device-local view."}</p><div className="hero-actions"><button className="primary-button" onClick={onImport}><Upload size={15} />{hasAudit ? "Update DegreeWorks PDF" : "Load Your DegreeWorks PDF"}</button><span className="honesty-note">{hasAudit ? <><Check size={14} /> Audit reviewed {snapshot.auditDate}</> : <><LockKeyhole size={14} /> No personal audit loaded</>}</span></div></div><div className="degree-verification">{hasAudit ? <><div><b>{snapshot.degreeProgress}%</b><small>DegreeWorks progress</small></div><div><b>{snapshot.appliedCredits}</b><small>credits applied</small></div><div><b>{snapshot.remainingCredits}</b><small>credits remaining</small></div></> : <><div><b>B.S.</b><small>degree route</small></div><div><b>BC</b><small>Brooklyn College</small></div><div><b>Local</b><small>private audit data</small></div></>}</div></section>
    {hasAudit && <section className="audit-summary-strip"><div><small>Major block</small><b>{snapshot.majorApplied} applied · {snapshot.majorRemaining} remaining</b></div><div><small>Mapped course states</small><b>{completed} complete · {inProgress} in progress</b></div><div><small>Current GPA</small><b className={snapshot.gpa < 2 ? "needs-attention" : ""}>{snapshot.gpa.toFixed(3)} · {snapshot.gpa < 2 ? "2.0 required" : "requirement met"}</b></div><div><small>Source</small><b>{snapshot.sourceName}</b></div></section>}
    <div className="degree-map-heading"><div><p className="eyebrow">Requirement family tree</p><h3>{titleCase("Start at the top. Follow the branches downward.")}</h3></div><div className="degree-legend"><span><i className="complete" />Complete</span><span><i className="in_progress" />In progress</span><span><i className="not_started" />Remaining</span><span><i className="unknown" />Audit rule</span></div></div>
    <section className="degree-family-tree">{degreePathLevels.map((level, levelIndex) => <div className="degree-family-level" key={level.label}>{levelIndex > 0 && <div className="family-connector"><span /></div>}<header><span>{String(levelIndex + 1).padStart(2, "0")}</span><div><b>{titleCase(level.label)}</b><small>{level.description}</small></div></header><div className="family-node-row">{level.nodes.map((node) => { const status = pathNodeStatus(node, records); return <div className={`degree-branch-bubble ${node.kind} ${status}`} key={node.id}><div className="bubble-top"><span className="degree-status-icon">{status === "complete" ? <Check size={16} strokeWidth={3} /> : status === "in_progress" ? <Play size={12} fill="currentColor" /> : status === "not_started" ? <LockKeyhole size={14} /> : <GitBranch size={14} />}</span><small>{node.label}</small></div><h4>{titleCase(node.title)}</h4>{node.codes && <div className="bubble-options">{node.codes.map((code, index) => { const course = degreeCourses.find((item) => item.code === code); const optionStatus = records[code] ?? "unknown"; return <div className="bubble-option-wrap" key={code}>{index > 0 && <span className="or-label">OR</span>}<button className={optionStatus} onClick={() => course && setSelected(course)}><b>{code}</b><small>{course ? titleCase(course.title) : ""}</small><i>{optionStatus === "in_progress" ? "In progress" : optionStatus === "complete" ? "Complete" : optionStatus === "not_started" ? "Still needed" : "Requirement"}</i></button></div>; })}</div>}{node.kind === "electives" && <div className="elective-slots"><span>1</span><span>2</span><span>3</span></div>}{node.note && <p>{node.note}</p>}</div>; })}</div></div>)}</section>
    <section className="degree-wide-gates"><div className="gate-heading"><p className="eyebrow">Degree-wide requirements</p><h3>{titleCase("Courses are only one branch of graduation.")}</h3></div><div className="gate-grid"><div className={`degree-gate ${hasAudit ? "in_progress" : "unknown"}`}><span>{hasAudit ? <Play size={14} fill="currentColor" /> : <GraduationCap size={15} />}</span><p><small>College option</small><b>{hasAudit ? `${snapshot.collegeOptionRemaining} credits remaining` : "Separate graduation requirement"}</b><em>{hasAudit ? "The loaded audit determines the remaining college-option work." : "Load an audit to see how this block applies to you."}</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Brooklyn residency</small><b>{hasAudit ? `${snapshot.residencyRemaining} credits remaining` : "Residency minimum applies"}</b><em>{hasAudit ? "Calculated from the loaded DegreeWorks summary." : "Only an official audit can confirm the personal remainder."}</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Advanced CISC in residence</small><b>{hasAudit ? `${snapshot.advancedCiscRemaining} credits remaining` : "Upper-level residency applies"}</b><em>CISC 2210-5004 with C or better.</em></p></div><div className="degree-gate not_started"><span><LockKeyhole size={14} /></span><p><small>Additional B.S. credits</small><b>{hasAudit ? `${snapshot.bsCreditsRemaining} credits remaining` : "Approved B.S. credits required"}</b><em>Approved science, math, CS, and related courses.</em></p></div></div></section>
    <section className="degree-footnotes"><p><b>Important:</b> DegreeWorks reports both completed and in-progress credits in the applied total. In-progress does not mean earned yet.</p><p><b>Planning boundary:</b> graduate-level substitutions and double-counting rules require department or Degree Audit approval.</p></section>
    <DegreeCourseDrawer course={selected} status={selected ? records[selected.code] ?? "unknown" : "unknown"} onClose={() => setSelected(null)} onStatus={(status) => { if (!selected) return; setRecords({ ...records, [selected.code]: status }); }} />
  </main>;
}

function DegreeCourseDrawer({ course, status, onClose, onStatus }: { course: DegreeCourse | null; status: DegreeStatus; onClose: () => void; onStatus: (status: DegreeStatus) => void }) {
  if (!course) return null;
  const options: { status: DegreeStatus; label: string; description: string }[] = [
    { status: "complete", label: "Complete", description: "Credit earned or requirement satisfied" },
    { status: "in_progress", label: "In progress", description: "Currently enrolled or officially underway" },
    { status: "not_started", label: "Not started", description: "Confirmed remaining" },
    { status: "unknown", label: "Unknown", description: "Keep Exceler A from assuming" },
  ];
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="degree-drawer" onMouseDown={(event) => event.stopPropagation()}><button className="drawer-close" onClick={onClose}><X size={20} /></button><p className="eyebrow">{course.requirement}</p><h2>{course.code}</h2><h3>{titleCase(course.title)}</h3><div className="drawer-facts"><div><small>CREDITS</small><b>{course.credits}</b></div><div><small>MAP STAGE</small><b>{course.stage + 1}</b></div></div><section><p className="eyebrow">Requirement context</p><p>{course.prerequisiteText}</p>{course.choiceLabel && <div className="choice-callout"><small>CHOICE GROUP</small><b>{titleCase(course.choiceLabel)}</b><p>Only one option is counted toward this requirement.</p></div>}</section><section><p className="eyebrow">Your official status</p><div className="status-options">{options.map((option) => <button className={status === option.status ? "active" : ""} key={option.status} onClick={() => onStatus(option.status)}><i className={option.status} /> <span><b>{option.label}</b><small>{option.description}</small></span>{status === option.status && <Check size={15} />}</button>)}</div></section><small className="source-note">Set this from DegreeWorks or your official record—not from self-study progress.</small></aside></div>;
}

function parseAuditText(text: string) {
  const proposals = new Map<string, DegreeStatus>();
  const compact = text.toUpperCase().replace(/\s+/g, " ");
  degreeCourses.forEach((course) => {
    const [subject, number] = course.code.split(" ");
    const matcher = new RegExp(`(?:${subject}\\.?\\s*)?\\b${number}\\b`, "g");
    const contexts: { before: string; after: string; explicitSubject: boolean }[] = [];
    for (const match of compact.matchAll(matcher)) {
      const index = match.index ?? 0;
      const before = compact.slice(Math.max(0, index - 125), index);
      const explicitSubject = match[0].includes(subject) || new RegExp(`${subject}\\.?\\s*(?:\\d{4}\\s*(?:,|OR)\\s*)*$`).test(before.slice(-65));
      if (explicitSubject) contexts.push({ before, after: compact.slice(index + match[0].length, index + match[0].length + 125), explicitSubject });
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
  const detected = degreeCourses.filter((course) => course.code in proposal);
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
    const questions = practiceQuestions[chapterId];
    const rawRecord = objectValue(value);
    if (!questions || !rawRecord) return;
    const validIds = new Set(questions.map((question) => question.id));
    const rawAnswers = objectValue(rawRecord.answers) ?? {};
    const rawAttempts = objectValue(rawRecord.attempts) ?? {};
    const answers = Object.fromEntries(Object.entries(rawAnswers).filter(([id, answer]) => validIds.has(id) && typeof answer === "string").map(([id, answer]) => [id, (answer as string).slice(0, 20_000)]));
    const attempts = Object.fromEntries(Object.entries(rawAttempts).filter(([id, attempt]) => validIds.has(id) && typeof attempt === "number" && Number.isFinite(attempt)).map(([id, attempt]) => [id, Math.max(0, Math.floor(attempt as number))]));
    const hints = Array.isArray(rawRecord.hints) ? rawRecord.hints.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
    const passed = Array.isArray(rawRecord.passed) ? rawRecord.passed.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
    practice[chapterId] = { answers, attempts, hints: [...new Set(hints)], passed: [...new Set(passed)] };
  });

  const rawRecords = objectValue(data.degreeRecords) ?? {};
  const degreeRecords = { ...initialDegreeRecords };
  const validStatuses = new Set<DegreeStatus>(["unknown", "complete", "in_progress", "not_started"]);
  degreeCourses.forEach((course) => {
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
  return { completed, practice, degreeRecords, auditSnapshot };
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
        <article><span><Code2 size={17} /></span><div><b>What Is Available</b><p>CISC 1115 currently includes 24 connected chapters with lessons, practice, and completion based mainly on demonstrated work. More Brooklyn College computer science and supporting math courses will be added as they are built and reviewed.</p></div></article>
        <article><span><GraduationCap size={18} /></span><div><b>Degree-Path Context</b><p>The map organizes required courses, either-or choices, elective groups, and graduation gates. It is a planning aid—not an official Brooklyn College service or a replacement for DegreeWorks and academic advisement.</p></div></article>
        <article><span><LockKeyhole size={17} /></span><div><b>Privacy and AI</b><p>The public experience starts without Daniel’s grades, GPA, audit, or college progress. Visitor progress and optional DegreeWorks data stay in that visitor’s browser. The AI tutor is disabled on the hosted public build so strangers cannot use Daniel’s API credits.</p></div></article>
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

function TutorMessageContent({ content }: { content: string }) {
  return <div className="tutor-markdown"><ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, children, ...props }) => {
        void node;
        return <a {...props} target="_blank" rel="noreferrer">{children}</a>;
      },
    }}
  >{content}</ReactMarkdown></div>;
}

function TutorAssistant({ view, completed, practice, courseContext, snapshot }: { view: View; completed: string[]; practice: PracticeRecords; courseContext: TutorCourseContext | null; snapshot: AuditSnapshot }) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [drawerPosition, setDrawerPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<TutorMessage[]>([tutorWelcomeMessage()]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; rect: DOMRect } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const progress = learningProgress(completed, practice);
  const activeLesson = view === "course" ? courseContext : null;
  const contextLabel = activeLesson ? activeLesson.sectionTitle : view === "degree" ? "Degree Map" : view === "courses" ? "Courses" : view === "dashboard" ? "Overview" : "Home";

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [busy, messages, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
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
          context: {
            currentView: view,
            course: {
              code: "CISC 1115",
              title: "Introduction to Programming Using Java",
              progressPercent: progress.percent,
              chaptersCleared: progress.completedChapters,
              chapterCount: learningChapters.length,
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
    {open && <section ref={drawerRef} className={`tutor-drawer ${dragging ? "dragging" : ""}`} style={{ translate: `${drawerPosition.x}px ${drawerPosition.y}px` }} aria-label="Exceler tutor" aria-live="polite">
      <header className="tutor-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="tutor-identity"><span><img src="/exceler-a-mark-512.png" alt="" /></span><p><b>Exceler Tutor</b><small>Using your current page</small></p></div>
        <span className="tutor-drag-handle" aria-hidden="true"><GripHorizontal size={18} /></span>
        <div className="tutor-header-actions"><button onClick={clearConversation} aria-label="Clear tutor conversation" title="Clear conversation"><Trash2 size={16} /></button><button onClick={() => setOpen(false)} aria-label="Close tutor"><X size={18} /></button></div>
      </header>
      <div className="tutor-context"><Sparkles size={13} /><span>Context</span><b>{contextLabel}</b></div>
      <div className="tutor-messages">
        {messages.map((message) => <article key={message.id} className={`tutor-message ${message.role}`}><small>{message.role === "assistant" ? "Tutor" : "You"}</small><div>{message.content ? <TutorMessageContent content={message.content} /> : <span className="tutor-thinking"><i /><i /><i /></span>}</div></article>)}
        <div ref={bottomRef} />
      </div>
      <form className="tutor-composer" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder="Ask about what you’re learning…" rows={1} aria-label="Ask the Exceler tutor" />
        <button type="submit" disabled={!draft.trim() || busy} aria-label="Send question"><Send size={17} /></button>
      </form>
      <p className="tutor-footnote">Hints don’t change course progress. Your work still has to pass.</p>
    </section>}
    <button className="tutor-launcher" onClick={toggleTutor} aria-label={open ? "Close Exceler tutor" : "Open Exceler tutor"} aria-expanded={open}>
      {open ? <X size={20} /> : <><img src="/exceler-a-mark-512.png" alt="" /><span>Ask Tutor</span></>}
    </button>
  </div>;
}

export default function CommandCenter() {
  const [view, setView] = useState<View>("home");
  const [completed, setCompleted] = useState<string[]>([]);
  const [practice, setPractice] = useState<PracticeRecords>({});
  const [degreeRecords, setDegreeRecords] = useState<DegreeRecords>(initialDegreeRecords);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditSnapshot>(degreeWorksSnapshot);
  const [importOpen, setImportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [courseTutorContext, setCourseTutorContext] = useState<TutorCourseContext | null>(null);
  const [localWorkspace, setLocalWorkspace] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
      setLocalWorkspace(isLocal);
      const stored = localStorage.getItem(isLocal ? PRIVATE_STORAGE_KEY : PUBLIC_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { completed?: string[]; practice?: PracticeRecords; degreeRecords?: DegreeRecords; auditSnapshot?: AuditSnapshot };
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.practice) setPractice(parsed.practice);
        if (parsed.degreeRecords) setDegreeRecords({ ...initialDegreeRecords, ...parsed.degreeRecords });
        if (parsed.auditSnapshot) setAuditSnapshot({ ...degreeWorksSnapshot, ...parsed.auditSnapshot });
      }
    } catch { /* The focused demo remains usable if browser storage is unavailable. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(localWorkspace ? PRIVATE_STORAGE_KEY : PUBLIC_STORAGE_KEY, JSON.stringify({ completed, practice, degreeRecords, auditSnapshot }));
  }, [completed, practice, degreeRecords, auditSnapshot, hydrated, localWorkspace]);

  const openBackup = () => { setInfoOpen(false); setBackupOpen(true); };
  const restoreProgress = (next: PortableProgress) => { setCompleted(next.completed); setPractice(next.practice); setDegreeRecords(next.degreeRecords); setAuditSnapshot(next.auditSnapshot); };
  return <div className="app-shell focused-shell"><Sidebar view={view} setView={setView} completed={completed} practice={practice} onOpenInfo={() => setInfoOpen(true)} onOpenBackup={openBackup} /><div className="app-main">{view === "home" && <HomeView completed={completed} practice={practice} snapshot={auditSnapshot} setView={setView} onOpenInfo={() => setInfoOpen(true)} />}{view === "dashboard" && <Dashboard completed={completed} practice={practice} degreeRecords={degreeRecords} setView={setView} />}{view === "courses" && <CoursesView completed={completed} practice={practice} onOpenCourse={() => setView("course")} />}{view === "course" && <CourseView completed={completed} practice={practice} onPracticeChange={(chapterId, record) => setPractice((current) => ({ ...current, [chapterId]: record }))} onTutorContextChange={setCourseTutorContext} />}{view === "degree" && <DegreeMap records={degreeRecords} setRecords={setDegreeRecords} snapshot={auditSnapshot} onImport={() => setImportOpen(true)} />}</div><MobileNav view={view} setView={setView} />{localWorkspace && <TutorAssistant view={view} completed={completed} practice={practice} courseContext={courseTutorContext} snapshot={auditSnapshot} />}<DegreeWorksImport open={importOpen} records={degreeRecords} onClose={() => setImportOpen(false)} onApply={(nextRecords, nextSnapshot) => { setDegreeRecords(nextRecords); setAuditSnapshot(nextSnapshot); }} /><ProjectInfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} onOpenBackup={openBackup} /><ProgressBackupDialog open={backupOpen} progress={{ completed, practice, degreeRecords, auditSnapshot }} onClose={() => setBackupOpen(false)} onRestore={restoreProgress} /></div>;
}

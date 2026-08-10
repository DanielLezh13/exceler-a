export type ContentKind = "lesson" | "predict" | "complete" | "debug" | "build" | "boss";

export type CourseContent = {
  id: string;
  chapterId: string;
  title: string;
  kind: ContentKind;
  minutes: number;
  difficulty?: number;
  concept: string;
  summary: string;
  starterCode?: string;
  expectedOutput?: string;
  hint?: string;
};

export type Chapter = {
  id: string;
  unit: string;
  title: string;
  description: string;
  contentIds: string[];
};

export const courseContent: CourseContent[] = [
  {
    id: "variables",
    chapterId: "foundations",
    title: "Variables",
    kind: "lesson",
    minutes: 12,
    concept: "variables",
    summary: "Name, store, and update values in memory.",
  },
  {
    id: "data-types",
    chapterId: "foundations",
    title: "Data types",
    kind: "lesson",
    minutes: 16,
    concept: "types",
    summary: "Choose types that match the values your program needs.",
  },
  {
    id: "variable-debug",
    chapterId: "foundations",
    title: "Repair the player profile",
    kind: "debug",
    minutes: 14,
    difficulty: 2,
    concept: "types",
    summary: "Fix declarations so the player profile compiles and prints correctly.",
    starterCode: 'public class Main {\n  public static void main(String[] args) {\n    String player = Daniel;\n    int lives = "3";\n    System.out.println(player + " has " + lives + " lives");\n  }\n}',
    expectedOutput: "Daniel has 3 lives",
    hint: "Text values need quotes. Whole numbers do not.",
  },
  {
    id: "foundations-boss",
    chapterId: "foundations",
    title: "Character card",
    kind: "boss",
    minutes: 28,
    difficulty: 3,
    concept: "variables",
    summary: "Create and print a character card using at least three different data types.",
    starterCode: "public class Main {\n  public static void main(String[] args) {\n    // Build the character card\n  }\n}",
    expectedOutput: "Daniel | Level 4 | Ready: true",
    hint: "You will need String, int, and boolean values.",
  },
  {
    id: "operators",
    chapterId: "operators-expressions",
    title: "Operators & precedence",
    kind: "lesson",
    minutes: 18,
    concept: "operators",
    summary: "Combine values and control evaluation order.",
  },
  {
    id: "predict-precedence",
    chapterId: "operators-expressions",
    title: "Predict the score",
    kind: "predict",
    minutes: 8,
    difficulty: 2,
    concept: "precedence",
    summary: "Trace a mixed arithmetic expression before running it.",
    starterCode: "int score = 4 + 3 * 2;\nSystem.out.println(score);",
    expectedOutput: "10",
    hint: "Multiplication is evaluated before addition.",
  },
  {
    id: "complete-modulo",
    chapterId: "operators-expressions",
    title: "Complete the checkpoint",
    kind: "complete",
    minutes: 10,
    difficulty: 2,
    concept: "operators",
    summary: "Use the remainder operator to determine whether a checkpoint is even.",
    starterCode: 'public class Main {\n  public static void main(String[] args) {\n    int checkpoint = 14;\n    int remainder = checkpoint __ 2;\n    System.out.println(remainder);\n  }\n}',
    expectedOutput: "0",
    hint: "The remainder operator is written with a percent sign.",
  },
  {
    id: "debug-total",
    chapterId: "operators-expressions",
    title: "Debug the shop total",
    kind: "debug",
    minutes: 14,
    difficulty: 3,
    concept: "precedence",
    summary: "Fix the expression so a quantity is applied before the discount.",
    starterCode: 'public class Main {\n  public static void main(String[] args) {\n    int price = 12;\n    int quantity = 3;\n    int discount = 4;\n    int total = price * (quantity - discount);\n    System.out.println(total);\n  }\n}',
    expectedOutput: "32",
    hint: "The intended total is (price × quantity) minus discount.",
  },
  {
    id: "concat-build",
    chapterId: "operators-expressions",
    title: "Build a status line",
    kind: "build",
    minutes: 18,
    difficulty: 3,
    concept: "concatenation",
    summary: "Store the name and lives separately, then assemble the requested output.",
    starterCode: "public class Main {\n  public static void main(String[] args) {\n    // Store the name and lives, then print the sentence\n  }\n}",
    expectedOutput: "Daniel has 3 lives remaining.",
    hint: "Concatenate text and variables with the + operator.",
  },
  {
    id: "operators-boss",
    chapterId: "operators-expressions",
    title: "Resource calculator",
    kind: "boss",
    minutes: 35,
    difficulty: 4,
    concept: "operators",
    summary: "Calculate a final resource balance from earnings, a multiplier, and a fee.",
    starterCode: "public class Main {\n  public static void main(String[] args) {\n    int missions = 4;\n    int reward = 15;\n    int multiplier = 2;\n    int fee = 7;\n\n    // Print the final balance\n  }\n}",
    expectedOutput: "Balance: 113 credits",
    hint: "Calculate missions × reward × multiplier, then subtract the fee.",
  },
  {
    id: "comparisons",
    chapterId: "decisions",
    title: "Comparisons",
    kind: "lesson",
    minutes: 18,
    concept: "comparisons",
    summary: "Turn comparisons into true or false values.",
  },
  {
    id: "if-else",
    chapterId: "decisions",
    title: "If / else",
    kind: "lesson",
    minutes: 24,
    concept: "conditionals",
    summary: "Make a program choose one path at runtime.",
  },
  {
    id: "decision-boss",
    chapterId: "decisions",
    title: "Access control",
    kind: "boss",
    minutes: 40,
    difficulty: 4,
    concept: "conditionals",
    summary: "Combine several conditions into a clear access decision.",
  },
  {
    id: "while-loops",
    chapterId: "loops",
    title: "While loops",
    kind: "lesson",
    minutes: 24,
    concept: "loops",
    summary: "Repeat work while a condition remains true.",
  },
  {
    id: "for-loops",
    chapterId: "loops",
    title: "For loops",
    kind: "lesson",
    minutes: 28,
    concept: "loops",
    summary: "Express counting loops compactly and safely.",
  },
  {
    id: "loops-boss",
    chapterId: "loops",
    title: "Combat simulator",
    kind: "boss",
    minutes: 50,
    difficulty: 5,
    concept: "loops",
    summary: "Build a small simulation with state, conditions, and repeated turns.",
  },
];

export const chapters: Chapter[] = [
  {
    id: "foundations",
    unit: "Unit 01 · Fundamentals",
    title: "Variables & data types",
    description: "Represent information precisely and keep it available while a program runs.",
    contentIds: ["variables", "data-types", "variable-debug", "foundations-boss"],
  },
  {
    id: "operators-expressions",
    unit: "Unit 01 · Fundamentals",
    title: "Operators & expressions",
    description: "Transform values with arithmetic, assignment, and concatenation.",
    contentIds: ["operators", "predict-precedence", "complete-modulo", "debug-total", "concat-build", "operators-boss"],
  },
  {
    id: "decisions",
    unit: "Unit 02 · Control flow",
    title: "Decisions",
    description: "Use boolean logic to choose which instructions run.",
    contentIds: ["comparisons", "if-else", "decision-boss"],
  },
  {
    id: "loops",
    unit: "Unit 02 · Control flow",
    title: "Loops",
    description: "Repeat operations without repeating yourself.",
    contentIds: ["while-loops", "for-loops", "loops-boss"],
  },
];

export type DegreeCourse = {
  code: string;
  title: string;
  credits: number;
  stage: number;
  status: "complete" | "active" | "available" | "locked" | "choice";
  requirement: string;
  prerequisiteText: string;
  choiceLabel?: string;
};

export const degreeCourses: DegreeCourse[] = [
  { code: "MATH 1006", title: "College Algebra", credits: 3, stage: 0, status: "complete", requirement: "Math foundation", prerequisiteText: "Placement dependent" },
  { code: "MATH 1011", title: "Precalculus Mathematics", credits: 4, stage: 0, status: "complete", requirement: "Math foundation", prerequisiteText: "Satisfied by transfer credit" },
  { code: "CISC 1115", title: "Introduction to Java Programming", credits: 4, stage: 1, status: "active", requirement: "Programming foundation choice", prerequisiteText: "Current DegreeWorks selection", choiceLabel: "1115 or 1170" },
  { code: "CISC 1170", title: "Introduction to Programming Using C++", credits: 3.5, stage: 1, status: "choice", requirement: "Programming foundation choice", prerequisiteText: "Alternative path", choiceLabel: "1115 or 1170" },
  { code: "MATH 1201", title: "Calculus I", credits: 3, stage: 1, status: "available", requirement: "Calculus sequence", prerequisiteText: "Satisfied by transfer credit" },
  { code: "CISC 2210", title: "Introduction to Discrete Structures", credits: 3, stage: 1, status: "available", requirement: "Required core", prerequisiteText: "MATH 1011 or placement" },
  { code: "MATH 1206", title: "Calculus II", credits: 4, stage: 2, status: "locked", requirement: "Calculus sequence", prerequisiteText: "MATH 1201" },
  { code: "CISC 3115", title: "Modern Programming Techniques", credits: 3, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "Programming foundation" },
  { code: "CISC 3130", title: "Data Structures", credits: 3, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "Programming foundation + discrete structures" },
  { code: "CISC 3140", title: "Design & Implementation II", credits: 3, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "Upper-level programming eligibility" },
  { code: "CISC 2820W", title: "Computers & Ethics", credits: 3, stage: 2, status: "choice", requirement: "Writing-intensive choice", prerequisiteText: "Writing-intensive eligibility", choiceLabel: "2820W or PHIL 3318W" },
  { code: "PHIL 3318W", title: "Information Ethics", credits: 3, stage: 2, status: "choice", requirement: "Writing-intensive choice", prerequisiteText: "Writing-intensive eligibility", choiceLabel: "2820W or PHIL 3318W" },
  { code: "CISC 3142", title: "Programming Paradigms in C++", credits: 3, stage: 3, status: "locked", requirement: "Required core", prerequisiteText: "Upper-level programming sequence" },
  { code: "CISC 3320", title: "Operating Systems", credits: 3, stage: 3, status: "locked", requirement: "Required core", prerequisiteText: "Data structures sequence" },
  { code: "CISC 3305", title: "Computer Organization", credits: 3, stage: 3, status: "choice", requirement: "Architecture choice", prerequisiteText: "Upper-level standing", choiceLabel: "3310 or 3305" },
  { code: "CISC 3310", title: "Principles of Computer Architecture", credits: 3, stage: 3, status: "choice", requirement: "Architecture choice", prerequisiteText: "Upper-level standing", choiceLabel: "3310 or 3305" },
  { code: "CISC 3220", title: "Analysis of Algorithms", credits: 3, stage: 3, status: "choice", requirement: "Theory choice", prerequisiteText: "Upper-level standing", choiceLabel: "3220 or 3230" },
  { code: "CISC 3230", title: "Theoretical Computer Science", credits: 3, stage: 3, status: "choice", requirement: "Theory choice", prerequisiteText: "Upper-level standing", choiceLabel: "3220 or 3230" },
  { code: "MATH 2501", title: "Probability & Statistics", credits: 3, stage: 3, status: "choice", requirement: "Probability choice", prerequisiteText: "Choose one approved statistics course", choiceLabel: "2501 or 3501" },
  { code: "MATH 3501", title: "Probability & Statistics", credits: 3, stage: 3, status: "choice", requirement: "Probability choice", prerequisiteText: "Choose one approved statistics course", choiceLabel: "2501 or 3501" },
  { code: "CISC 4900", title: "Independent Group Study", credits: 3, stage: 4, status: "choice", requirement: "Capstone choice", prerequisiteText: "Department approval", choiceLabel: "4900 or 5001" },
  { code: "CISC 5001", title: "Independent Study", credits: 3, stage: 4, status: "choice", requirement: "Capstone choice", prerequisiteText: "Department approval", choiceLabel: "4900 or 5001" },
];

export const degreeRequirementGroups = [
  { label: "Required CS core", earned: 0, total: 27.5, tone: "lime" },
  { label: "Mathematics", earned: 6, total: 14, tone: "blue" },
  { label: "Choice requirements", earned: 0, total: 9, tone: "violet" },
  { label: "CS electives", earned: 0, total: 9, tone: "amber" },
];

export const TOTAL_COURSE_MINUTES = courseContent.reduce((sum, item) => sum + item.minutes, 0);

export function weightedProgress(completedIds: string[], items = courseContent) {
  const completed = items
    .filter((item) => completedIds.includes(item.id))
    .reduce((sum, item) => sum + item.minutes, 0);
  const total = items.reduce((sum, item) => sum + item.minutes, 0);
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

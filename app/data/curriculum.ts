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
    title: "Variables & Data Types",
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
  catalogUrl?: string;
  // Every group is required; any one option within a group is enough.
  // An array option requires ALL of its courses (e.g. both 1113 and 1114).
  prerequisites?: { anyOf: (string | string[])[]; alternativeNote?: string }[];
  prerequisiteNote?: string;
};

export const degreeCourses: DegreeCourse[] = [
  { code: "MATH 1006", title: "College Algebra", credits: 3, stage: 0, status: "complete", requirement: "Math foundation", prerequisiteText: "Placement dependent" },
  { code: "MATH 1011", title: "Precalculus Mathematics", credits: 4, stage: 0, status: "complete", requirement: "Math foundation", prerequisiteText: "Satisfied by transfer credit" },
  { code: "CISC 1115", title: "Introduction to Java Programming", credits: 4, stage: 1, status: "active", requirement: "Programming foundation choice", prerequisiteText: "Current DegreeWorks selection", choiceLabel: "1115 or 1170" },
  { code: "CISC 1170", title: "Introduction to Programming Using C++", credits: 3.5, stage: 1, status: "choice", requirement: "Programming foundation choice", prerequisiteText: "Alternative path", choiceLabel: "1115 or 1170" },
  { code: "MATH 1201", title: "Calculus I", credits: 4, stage: 1, status: "available", requirement: "Calculus sequence", prerequisiteText: "Precalculus with the required grade, qualifying placement, or departmental permission.", prerequisites: [{ anyOf: ["MATH 1011", "MATH 1012", "MATH 1026"], alternativeNote: "OR qualifying placement-test scores or departmental permission; confirm separately with Mathematics." }], prerequisiteNote: "The course route requires C− or higher. A completion check does not verify your grade or placement.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=1201&div=U&dsc=MATH." },
  { code: "CISC 2210", title: "Introduction to Discrete Structures", credits: 3, stage: 1, status: "available", requirement: "Required core", prerequisiteText: "A programming entry course AND the mathematics requirement below. Calculus itself is not required.", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"], "CISC 1110", "CISC 1180", "CISC 1215"] }, { anyOf: ["MATH 1011", "MATH 1012"], alternativeNote: "OR departmental assignment to MATH 1201 (or legacy 3.20 / 4.10); confirm placement separately." }], prerequisiteNote: "The catalog also accepts legacy CIS 1.10 / 1.20 for programming and MATH 2.92 for mathematics. Confirm old equivalencies with advisement.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=2210&div=U&dsc=CISC." },
  { code: "MATH 1206", title: "Calculus II", credits: 4, stage: 2, status: "locked", requirement: "Calculus sequence", prerequisiteText: "Calculus I with a grade of C− or higher.", prerequisites: [{ anyOf: ["MATH 1201"] }], prerequisiteNote: "Requires C− or higher; completion alone does not verify the grade. The catalog also accepts legacy MATH 3.20.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=1206&div=U&dsc=MATH." },
  { code: "CISC 3115", title: "Introduction to Modern Programming Techniques", credits: 4, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "One programming entry route below. Discrete Structures and calculus are not listed prerequisites.", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"]] }], prerequisiteNote: "Not open to students enrolled in or who completed CISC 3110; credit cannot be earned for both.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3115&div=U&dsc=CISC." },
  { code: "CISC 3130", title: "Data Structures", credits: 4, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "CISC 3115 is the direct route. The alternative uses CISC 3110 together with an approved entry course. Discrete Structures is not a listed prerequisite.", prerequisites: [{ anyOf: ["CISC 3115", ["CISC 3110", "CISC 1115"], ["CISC 3110", "CISC 1170"]] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3130&div=U&dsc=CISC." },
  { code: "CISC 3140", title: "Design and Implementation of Large-Scale Applications", credits: 3, stage: 2, status: "locked", requirement: "Required core", prerequisiteText: "The old map title “Design & Implementation II” was misleading. The current catalog does not require a separate Design & Implementation I course.", prerequisites: [{ anyOf: ["CISC 3130"] }, { anyOf: ["CISC 3115", "CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"]] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3140&div=U&dsc=CISC." },
  { code: "CISC 2820W", title: "Computers and Ethics", credits: 3, stage: 2, status: "choice", requirement: "Writing-intensive choice", prerequisiteText: "An approved computing/Core course AND English Composition II. Cross-listed with PHIL 3318W.", choiceLabel: "2820W or PHIL 3318W", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"], "CISC 1000", "CISC 1110", "CISC 1180", "CORC 1312"] }, { anyOf: ["ENGL 1012"] }], prerequisiteNote: "Legacy Core Studies 5.1 is also accepted for the computing/Core group. Confirm equivalencies with advisement.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=2820W&div=U&dsc=CISC." },
  { code: "PHIL 3318W", title: "Computers and Ethics", credits: 3, stage: 2, status: "choice", requirement: "Writing-intensive choice", prerequisiteText: "An approved computing/Core course AND English Composition II. Cross-listed with CISC 2820W; the published entry-course lists differ, so confirm other equivalents with advisement.", choiceLabel: "2820W or PHIL 3318W", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1000", "CISC 1110", "CORC 1312"] }, { anyOf: ["ENGL 1012"] }], prerequisiteNote: "Legacy Core Studies 5.1 is also accepted for the computing/Core group.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3318W&div=U&dsc=PHIL." },
  { code: "CISC 3142", title: "Programming Paradigms in C++", credits: 3, stage: 3, status: "locked", requirement: "Required core", prerequisiteText: "An approved programming entry route, Data Structures, AND Computer Architecture.", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"]] }, { anyOf: ["CISC 3130"] }, { anyOf: ["CISC 3310"] }], prerequisiteNote: "CISC 3310 specifically is listed—not CISC 3305. Not open to students who completed CISC 3110. Confirm substitutions with the department.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3142&div=U&dsc=CISC." },
  { code: "CISC 3320", title: "Operating Systems", credits: 3, stage: 3, status: "locked", requirement: "Required core", prerequisiteText: "Data Structures AND one architecture/organization course below.", prerequisites: [{ anyOf: ["CISC 3130"] }, { anyOf: ["CISC 3310", "CISC 3305", "CISC 3315"] }], prerequisiteNote: "The catalog also accepts legacy CIS 21 for Data Structures; confirm old equivalencies with advisement.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3320&div=U&dsc=CISC." },
  { code: "CISC 3305", title: "Computer Organization", credits: 3, stage: 3, status: "choice", requirement: "Architecture choice", prerequisiteText: "Assembly Language Programming AND Discrete Structures.", choiceLabel: "3310 or 3305", prerequisites: [{ anyOf: ["CISC 1341"] }, { anyOf: ["CISC 2210"] }], prerequisiteNote: "Legacy CIS 4 also satisfies the assembly-language requirement. Not open to students enrolled in or who completed CISC 3315. Confirm availability of this route with the department.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3305&div=U&dsc=CISC." },
  { code: "CISC 3310", title: "Principles of Computer Architecture", credits: 4, stage: 3, status: "choice", requirement: "Architecture choice", prerequisiteText: "A programming entry route AND Discrete Structures. Data Structures, Calculus II, and CISC 3140 are not listed prerequisites.", choiceLabel: "3310 or 3305", prerequisites: [{ anyOf: ["CISC 1115", "CISC 1170", ["CISC 1113", "CISC 1114"], "CISC 1110", "CISC 1180"] }, { anyOf: ["CISC 2210"] }], prerequisiteNote: "Not open to students enrolled in or who completed CISC 3305 or CISC 3315.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3310&div=U&dsc=CISC." },
  { code: "CISC 3220", title: "Analysis of Algorithms", credits: 3, stage: 3, status: "choice", requirement: "Theory choice", prerequisiteText: "Discrete Structures, Data Structures, AND Calculus I. Calculus II and CISC 3140 are not listed prerequisites.", choiceLabel: "3220 or 3230", prerequisites: [{ anyOf: ["CISC 2210"] }, { anyOf: ["CISC 3130"] }, { anyOf: ["MATH 1201"] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3220&div=U&dsc=CISC." },
  { code: "CISC 3230", title: "Theoretical Computer Science", credits: 3, stage: 3, status: "choice", requirement: "Theory choice", prerequisiteText: "Discrete Structures, Data Structures, AND Calculus I. Calculus II and CISC 3140 are not listed prerequisites.", choiceLabel: "3220 or 3230", prerequisites: [{ anyOf: ["CISC 2210"] }, { anyOf: ["CISC 3130"] }, { anyOf: ["MATH 1201"] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3230&div=U&dsc=CISC." },
  { code: "MATH 2501", title: "Elementary Probability and Statistics", credits: 3, stage: 3, status: "choice", requirement: "Probability choice", prerequisiteText: "Calculus II is the standard prerequisite route.", choiceLabel: "2501 or 3501", prerequisites: [{ anyOf: ["MATH 1206", "MATH 1211"] }], prerequisiteNote: "Legacy MATH 5.10 / 5.20 are also accepted. Not open to students enrolled in or who completed MATH 3501.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=2501&div=U&dsc=MATH." },
  { code: "MATH 3501", title: "Probability and Statistics I", credits: 3, stage: 3, status: "choice", requirement: "Probability choice", prerequisiteText: "This alternative requires Multivariable Calculus, not just Calculus II.", choiceLabel: "2501 or 3501", prerequisites: [{ anyOf: ["MATH 2201"] }], prerequisiteNote: "MATH 2201 is extra preparation for this option, not a new requirement for every path. Not open to students enrolled in or who completed MATH 2501.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3501&div=U&dsc=MATH." },
  { code: "CISC 3410", title: "Artificial Intelligence", credits: 3, stage: 3, status: "choice", requirement: "Upper-level CISC elective", prerequisiteText: "One possible choice for the three additional CISC electives. This does not replace a required core or choose-one course.", prerequisites: [{ anyOf: ["CISC 3130"] }], prerequisiteNote: "The catalog also accepts legacy CIS 21. That older equivalency needs confirmation and is not automatically checked here.", catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3410&div=U&dsc=CISC." },
  { code: "CISC 3440", title: "Machine Learning", credits: 3, stage: 3, status: "choice", requirement: "Upper-level CISC elective", prerequisiteText: "One possible choice for the three additional CISC electives. Complete one option in each prerequisite group below. This does not replace a required core or choose-one course.", prerequisites: [{ anyOf: ["CISC 3130", "CISC 3225"] }, { anyOf: ["MATH 2501", "MATH 3501", "CISC 2210"] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3440&div=U&dsc=CISC." },
  { code: "CISC 3171", title: "Introduction to Software Engineering", credits: 3, stage: 3, status: "choice", requirement: "Upper-level CISC elective", prerequisiteText: "The third course in your elective plan. This fills an additional elective slot, not a required core or choose-one requirement.", prerequisites: [{ anyOf: ["CISC 3130"] }], catalogUrl: "https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3171&div=U&dsc=CISC." },
  { code: "CISC 4900", title: "Independent Group Study", credits: 3, stage: 4, status: "choice", requirement: "Capstone choice", prerequisiteText: "Department approval", choiceLabel: "4900 or 5001" },
  { code: "CISC 5001", title: "Independent Study", credits: 3, stage: 4, status: "choice", requirement: "Capstone choice", prerequisiteText: "Department approval", choiceLabel: "4900 or 5001" },
];

// Prerequisite alternatives can be recognized in an audit without becoming
// additional required courses or being counted as part of the elective plan.
export const degreeAuditCourses: { code: string; title: string }[] = [
  ...degreeCourses,
  { code: "CISC 3225", title: "Data Tools and Algorithms" },
  { code: "CISC 1110", title: "Introduction to Programming Using C++" },
  { code: "CISC 1113", title: "Basic Principles of Java Programming with Science Applications I" },
  { code: "CISC 1114", title: "Basic Principles of Java Programming with Science Applications II" },
  { code: "CISC 1180", title: "Introduction to C++ for Programmers" },
  { code: "CISC 1215", title: "Introduction to Programming Using Python" },
  { code: "CISC 3110", title: "Advanced Programming Techniques" },
  { code: "CISC 1341", title: "Assembly Language Programming for Microcomputers" },
  { code: "CISC 3315", title: "Digital Computer Systems" },
  { code: "CISC 1000", title: "Computing: Its Nature, Power, and Limits" },
  { code: "CORC 1312", title: "Legacy Core course" },
  { code: "ENGL 1012", title: "English Composition II: Seminar in Expository Writing" },
  { code: "MATH 1012", title: "Precalculus with Recitation" },
  { code: "MATH 1026", title: "Precalculus Mathematics B" },
  { code: "MATH 1211", title: "Infinite Series" },
  { code: "MATH 2201", title: "Multivariable Calculus" },
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

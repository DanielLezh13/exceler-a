import { validateComparisonProgram, type ComparisonCase } from "../comparisonPracticeValidation.ts";
import type { CoursePracticeQuestion } from "./cisc1115Course.ts";

const writingTask = (
  id: string, title: string, situation: string, code: string, answer: string,
  hint: string, types: Record<string, "int" | "double">, cases: ComparisonCase[],
): CoursePracticeQuestion => ({
  id, level: "Apply", kind: "Write comparison code", title,
  prompt: `${situation} Print only true or false. The variables shown are already declared; write the code that comes after them without changing their values. Use a comparison, either printed directly or stored in a new boolean first.`,
  code, answer, hint,
  placeholder: "Write the comparison and output code",
  success: "Correct. Your comparison handles matching values and values on either side of the boundary.",
  multiline: true, productionStage: 3,
  validate: (submitted) => validateComparisonProgram(submitted, types, cases),
});

// One writing task per operator, paired with its existing recognition question.
// Only Unit I arithmetic/declarations/output and this section's comparisons are
// required. No if/else, logical combinations, methods, or loops are introduced.
export const comparisonWritingQuestions: CoursePracticeQuestion[] = [
  writingTask(
    "comparison-write-equal", "Check a Locker Code",
    "A locker opens only when the entered code matches its stored code. Report whether enteredCode matches lockerCode.",
    "int enteredCode = 4821;\nint lockerCode = 4821;",
    "boolean matches = enteredCode == lockerCode;\nSystem.out.println(matches);",
    "Both codes already exist. Ask whether their values are equal; do not assign a new value to either code.",
    { enteredCode: "int", lockerCode: "int" },
    [0, 17, 4820, 4821, 4822, 9000].flatMap((enteredCode) => [0, 17, 4820, 4821, 4822, 9000].map((lockerCode) => ({ values: { enteredCode, lockerCode }, expected: enteredCode === lockerCode }))),
  ),
  writingTask(
    "comparison-write-not-equal", "Find a Delivery Mismatch",
    "A delivery needs checking whenever the number received differs from the number ordered. Report whether this delivery needs checking.",
    "int received = 11;\nint ordered = 12;",
    "boolean mismatch = received != ordered;\nSystem.out.println(mismatch);",
    "A mismatch includes receiving too few or too many, but not exactly the ordered number.",
    { received: "int", ordered: "int" },
    [0, 1, 11, 12, 13, 25].flatMap((received) => [0, 1, 11, 12, 13, 25].map((ordered) => ({ values: { received, ordered }, expected: received !== ordered }))),
  ),
  writingTask(
    "comparison-write-greater", "Check a Speed Limit",
    "The speed limit is 55. A reading exactly at the limit is allowed. Report whether speed is over the limit.",
    "int speed = 55;",
    "boolean overLimit = speed > 55;\nSystem.out.println(overLimit);",
    "Exactly 55 must produce false. The comparison should become true only above 55.",
    { speed: "int" },
    [0, 1, 25, 54, 55, 56, 57, 70, 120].map((speed) => ({ values: { speed }, expected: speed > 55 })),
  ),
  writingTask(
    "comparison-write-less", "Check the Shelf Stock",
    "A shop restocks when fewer than 10 items remain. Having exactly 10 does not trigger restocking. Report whether stock is low enough to restock.",
    "int stock = 10;",
    "boolean restock = stock < 10;\nSystem.out.println(restock);",
    "Compare the remaining stock with 10. Exactly 10 is not fewer than 10.",
    { stock: "int" },
    [0, 1, 5, 8, 9, 10, 11, 12, 50].map((stock) => ({ values: { stock }, expected: stock < 10 })),
  ),
  writingTask(
    "comparison-write-at-least", "Reach a Game Target",
    "A player earns a badge by reaching or passing the game's target. Report whether points is enough for the badge. The target can change between games.",
    "int points = 70;\nint target = 70;",
    "boolean earned = points >= target;\nSystem.out.println(earned);",
    "Reaching the target counts, and so does going beyond it. Use target rather than assuming it will always be 70.",
    { points: "int", target: "int" },
    [0, 1, 20, 69, 70, 71, 100].flatMap((points) => [0, 1, 20, 69, 70, 71, 100].map((target) => ({ values: { points, target }, expected: points >= target }))),
  ),
  writingTask(
    "comparison-write-at-most", "Keep a Basket Within Budget",
    "A basket contains quantity items costing price each. There are no extra charges. Report whether the whole basket fits within budget. Spending exactly the budget is allowed.",
    "int quantity = 3;\ndouble price = 2.5;\ndouble budget = 7.5;",
    "double total = quantity * price;\nboolean affordable = total <= budget;\nSystem.out.println(affordable);",
    "The comparison needs the cost of the whole basket, not just one item. Equality with the budget still counts as affordable.",
    { quantity: "int", price: "double", budget: "double" },
    [0, 1, 3, 5].flatMap((quantity) => [0, 0.5, 2.5, 4.25].flatMap((price) => [0, 1, 2.5, 7.5, 12, 50].map((budget) => ({ values: { quantity, price, budget }, expected: quantity * price <= budget })))),
  ),
];

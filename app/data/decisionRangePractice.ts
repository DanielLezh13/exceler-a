import { validateDecisionProgram, type DecisionCase } from "../decisionPracticeValidation.ts";
import type { CoursePracticeQuestion } from "./cisc1115Course.ts";

type Inputs = Record<string, "int" | "double" | "boolean">;
type Placement = { chapterId: string; sectionId: string; question: CoursePracticeQuestion };

function task(
  chapterId: string, sectionId: string, id: string,
  level: CoursePracticeQuestion["level"], title: string, prompt: string,
  code: string, answer: string, hint: string, success: string,
  inputs: Inputs, cases: DecisionCase[], options: { requireTernary?: boolean; requireNestedBranches?: boolean } = {},
): Placement {
  return { chapterId, sectionId, question: {
    id, level, kind: level === "Challenge" ? "Independent build" : "Write from requirements",
    title, prompt, code, answer, hint, success,
    placeholder: "Write Java that produces the required result",
    multiline: true, productionStage: level === "Challenge" ? 4 : 3,
    validate: (submitted) => validateDecisionProgram(submitted, inputs, cases, options),
  } };
}

const levels = [-1, 0, 19, 20, 21, 50, 79, 80, 81, 100];

// Each family changes a rule that matters: an inclusive boundary, a failed
// branch's implied range, an invalid value, or an exception with higher priority.
// The examples in `code` supply only already-declared inputs; later prompts
// specify behavior and leave the control structure to the learner.
export const decisionRangePractice: Placement[] = [
  task("comparisons-booleans", "booleans-or-not", "decision-range-outside", "Apply",
    "Detect an Unsafe Storage Reading",
    "A storage reading is safe from 2 through 8 inclusive. Print true when temperature is outside that range and false otherwise. Write code after the shown declaration; the reading may change.",
    "int temperature = 8;", "boolean unsafe = temperature < 2 || temperature > 8;\nSystem.out.println(unsafe);",
    "Outside means below the lower boundary or above the upper boundary.", "You represented both ways a value can leave the safe range.",
    { temperature: "int" }, [-5, 1, 2, 3, 7, 8, 9, 20].map((temperature) => ({ values: { temperature }, expected: temperature < 2 || temperature > 8 }))),

  task("comparisons-booleans", "booleans-combining", "decision-range-exception-expression", "Challenge",
    "Combine an Exception and a Prohibition",
    "A player qualifies when their level is 20 through 80 inclusive. A VIP may ignore the level rule. A banned player never qualifies, including a banned VIP. Using the existing values, print only true or false for whether this player qualifies.",
    "int level = 20;\nboolean vip = false;\nboolean banned = false;",
    "boolean qualifies = !banned && (vip || (level >= 20 && level <= 80));\nSystem.out.println(qualifies);",
    "Work out which rule overrides the others, then group the two ways an unbanned player can qualify.",
    "Your expression handles the range, VIP exception, and ban priority.",
    { level: "int", vip: "boolean", banned: "boolean" },
    levels.flatMap((level) => [false, true].flatMap((vip) => [false, true].map((banned) => ({ values: { level, vip, banned }, expected: !banned && (vip || (level >= 20 && level <= 80)) }))))),

  task("comparisons-booleans", "booleans-conditional", "decision-range-conditional-label", "Apply",
    "Choose a Range Label",
    "A reading from 15 through 25 inclusive is Comfortable; every other reading is Adjust. Use the conditional operator to choose a String label from the existing temperature, then print the label. Do not change temperature.",
    "int temperature = 25;",
    "String label = temperature >= 15 && temperature <= 25 ? \"Comfortable\" : \"Adjust\";\nSystem.out.println(label);",
    "Make one boolean range question choose between two String values.",
    "The conditional expression chooses the right label at both boundaries.",
    { temperature: "int" }, [-10, 14, 15, 16, 24, 25, 26, 50].map((temperature) => ({ values: { temperature }, expected: temperature >= 15 && temperature <= 25 ? "Comfortable" : "Adjust" })), { requireTernary: true }),

  task("if-else", "if-else-pair", "decision-range-two-requirements", "Apply",
    "Decide Whether a Visit Can Begin",
    "A visitor may begin only when age is at least 18 and hasTicket is true. Print Begin for an eligible visitor and Wait otherwise. Use the existing values and write the decision.",
    "int age = 18;\nboolean hasTicket = true;",
    "if (age >= 18 && hasTicket) {\n    System.out.println(\"Begin\");\n} else {\n    System.out.println(\"Wait\");\n}",
    "There are only two outcomes. Ask whether both requirements hold.",
    "The two-path decision accounts for both requirements.",
    { age: "int", hasTicket: "boolean" },
    [0, 17, 18, 19, 80].flatMap((age) => [false, true].map((hasTicket) => ({ values: { age, hasTicket }, expected: age >= 18 && hasTicket ? "Begin" : "Wait" })))),

  task("if-else", "if-else-if", "decision-range-three-outcomes", "Apply",
    "Classify Ranked Entry",
    "Ranked entry requires a level from 20 through 80 inclusive. Print Too low below that range, Too high above it, or Eligible inside it. The existing level may have any whole-number value.",
    "int level = 20;",
    "if (level < 20) {\n    System.out.println(\"Too low\");\n} else if (level > 80) {\n    System.out.println(\"Too high\");\n} else {\n    System.out.println(\"Eligible\");\n}",
    "Separate the values below, inside, and above the inclusive range.",
    "Every boundary and outside case reaches the intended label.",
    { level: "int" }, levels.map((level) => ({ values: { level }, expected: level < 20 ? "Too low" : level > 80 ? "Too high" : "Eligible" }))),

  task("if-else", "if-nested", "decision-nested-three-outcomes", "Apply",
    "Give a Reason for Restricted Access",
    "A members-only room prints Membership required for a nonmember. For a member, it prints Too young below age 18 and Allowed at age 18 or older. Use an outer if/else with an inner if/else in one branch. Print exactly one result for any member and age.",
    "boolean member = true;\nint age = 18;",
    "if (member) {\n    if (age >= 18) {\n        System.out.println(\"Allowed\");\n    } else {\n        System.out.println(\"Too young\");\n    }\n} else {\n    System.out.println(\"Membership required\");\n}",
    "Decide what to print for a nonmember before asking the age question that only matters for members.",
    "Both the outer and inner else paths now produce their own result.",
    { member: "boolean", age: "int" },
    [0, 17, 18, 19, 80].flatMap((age) => [false, true].map((member) => ({ values: { member, age }, expected: !member ? "Membership required" : age < 18 ? "Too young" : "Allowed" }))),
    { requireNestedBranches: true }),

  task("if-else", "if-nested", "decision-range-ban-reason", "Challenge",
    "Explain an Entry Decision",
    "Ranked entry requires level 20 through 80 inclusive and a player who is not banned. Print Too low for a level below 20, Too high above 80, Banned for a banned player in range, or Eligible otherwise. Use the existing values. Choose any clear decision structure.",
    "int level = 80;\nboolean banned = false;",
    "if (level < 20) {\n    System.out.println(\"Too low\");\n} else if (level > 80) {\n    System.out.println(\"Too high\");\n} else if (banned) {\n    System.out.println(\"Banned\");\n} else {\n    System.out.println(\"Eligible\");\n}",
    "Decide which label applies to an out-of-range banned player before coding.",
    "You distinguished failed boundaries from a ban within the eligible range.",
    { level: "int", banned: "boolean" },
    levels.flatMap((level) => [false, true].map((banned) => ({ values: { level, banned }, expected: level < 20 ? "Too low" : level > 80 ? "Too high" : banned ? "Banned" : "Eligible" })))),

  task("if-else", "if-nested", "decision-nested-submission", "Challenge",
    "Classify a Score and Submission",
    "A score outside 0 through 100 prints Invalid. A valid score below 70 prints Retry. At 70 or above, print Pass when submitted is true and Submit work otherwise. Print exactly one result. Use the existing values; choose the decision structure yourself.",
    "int score = 70;\nboolean submitted = false;",
    "if (score < 0 || score > 100) {\n    System.out.println(\"Invalid\");\n} else if (score < 70) {\n    System.out.println(\"Retry\");\n} else {\n    if (submitted) {\n        System.out.println(\"Pass\");\n    } else {\n        System.out.println(\"Submit work\");\n    }\n}",
    "Separate impossible scores from valid ones, then ask which cases still depend on submission.",
    "Your decision distinguishes validation, the passing boundary, and the submission state.",
    { score: "int", submitted: "boolean" },
    [-1, 0, 69, 70, 71, 100, 101].flatMap((score) => [false, true].map((submitted) => ({ values: { score, submitted }, expected: score < 0 || score > 100 ? "Invalid" : score < 70 ? "Retry" : submitted ? "Pass" : "Submit work" })))),

  task("if-else", "if-common-mistakes", "decision-range-repair-priority", "Challenge",
    "Repair a Priority Mistake",
    "The shown decision incorrectly admits banned players. Replace the decision code so a banned player always gets Banned, an unbanned VIP gets Eligible at any level, and other unbanned players get Eligible only from level 20 through 80 inclusive. Print Ineligible for the remaining cases. The existing values may change.",
    "int level = 19;\nboolean vip = true;\nboolean banned = true;\n\nif (vip || (level >= 20 && level <= 80)) {\n    System.out.println(\"Eligible\");\n} else if (banned) {\n    System.out.println(\"Banned\");\n} else {\n    System.out.println(\"Ineligible\");\n}",
    "if (banned) {\n    System.out.println(\"Banned\");\n} else if (vip || (level >= 20 && level <= 80)) {\n    System.out.println(\"Eligible\");\n} else {\n    System.out.println(\"Ineligible\");\n}",
    "Test a banned VIP and a banned player inside the ordinary range.",
    "The prohibition now takes priority over both ways to qualify.",
    { level: "int", vip: "boolean", banned: "boolean" },
    levels.flatMap((level) => [false, true].flatMap((vip) => [false, true].map((banned) => ({ values: { level, vip, banned }, expected: banned ? "Banned" : vip || (level >= 20 && level <= 80) ? "Eligible" : "Ineligible" }))))),

  task("decision-programs", "decision-validation", "decision-range-valid-hours", "Apply",
    "Validate an Opening-Hour Reading",
    "An hour is valid from 0 through 23. The desk is Open from hour 9 through 17 inclusive. Print Invalid for an impossible hour, Open during desk hours, and Closed for every other valid hour.",
    "int hour = 17;",
    "if (hour < 0 || hour > 23) {\n    System.out.println(\"Invalid\");\n} else if (hour >= 9 && hour <= 17) {\n    System.out.println(\"Open\");\n} else {\n    System.out.println(\"Closed\");\n}",
    "Check impossible readings before ordinary opening and closing hours.",
    "Invalid values cannot be mistaken for ordinary closed hours.",
    { hour: "int" }, [-2, -1, 0, 8, 9, 10, 16, 17, 18, 23, 24, 30].map((hour) => ({ values: { hour }, expected: hour < 0 || hour > 23 ? "Invalid" : hour >= 9 && hour <= 17 ? "Open" : "Closed" }))),

  task("decision-programs", "decision-ranges", "decision-range-fragile-parcel", "Challenge",
    "Classify a Parcel With an Exception",
    "A parcel's weight must be greater than 0. A valid fragile parcel needs Special handling at any weight. Other valid parcels are Small through weight 5 inclusive, Medium above 5 through 20 inclusive, and Large above 20. Print Invalid, Special, Small, Medium, or Large. Decide the order of the rules yourself.",
    "double weight = 5.0;\nboolean fragile = false;",
    "if (weight <= 0) {\n    System.out.println(\"Invalid\");\n} else if (fragile) {\n    System.out.println(\"Special\");\n} else if (weight <= 5) {\n    System.out.println(\"Small\");\n} else if (weight <= 20) {\n    System.out.println(\"Medium\");\n} else {\n    System.out.println(\"Large\");\n}",
    "Try an invalid fragile parcel, then a fragile parcel on each size boundary.",
    "Validation and the fragile exception take priority over ordinary size categories.",
    { weight: "double", fragile: "boolean" },
    [-1, 0, 0.1, 4.99, 5, 5.01, 19.99, 20, 20.01, 100].flatMap((weight) => [false, true].map((fragile) => ({ values: { weight, fragile }, expected: weight <= 0 ? "Invalid" : fragile ? "Special" : weight <= 5 ? "Small" : weight <= 20 ? "Medium" : "Large" })))),

  task("decision-programs", "decision-combined", "decision-range-independent-entry", "Challenge",
    "Design a Ranked Entry Decision",
    "A player enters with a level and two statuses. A banned player can never enter, even with VIP status. An unbanned VIP may enter at any level. Everyone else may enter only at level 20 through 80 inclusive. Print Banned when banned, Eligible when permitted, Too low below the range, or Too high above it. Use the existing values and choose the structure yourself.",
    "int level = 20;\nboolean vip = false;\nboolean banned = false;",
    "if (banned) {\n    System.out.println(\"Banned\");\n} else if (vip) {\n    System.out.println(\"Eligible\");\n} else if (level < 20) {\n    System.out.println(\"Too low\");\n} else if (level > 80) {\n    System.out.println(\"Too high\");\n} else {\n    System.out.println(\"Eligible\");\n}",
    "List the cases that overlap. Consider a banned VIP below 20 and an unbanned VIP above 80.",
    "Your program resolves overlapping rules and both range boundaries.",
    { level: "int", vip: "boolean", banned: "boolean" },
    levels.flatMap((level) => [false, true].flatMap((vip) => [false, true].map((banned) => ({ values: { level, vip, banned }, expected: banned ? "Banned" : vip || (level >= 20 && level <= 80) ? "Eligible" : level < 20 ? "Too low" : "Too high" }))))),
];

export const decisionRangeQuestionsFor = (chapterId: string, sectionId?: string) => decisionRangePractice
  .filter((entry) => entry.chapterId === chapterId && (sectionId === undefined || entry.sectionId === sectionId))
  .map((entry) => entry.question);

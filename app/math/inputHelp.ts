import type { MathField, MathQuestion } from "./types.ts";

// Input notation only: never derive a hint from the reference answer.
export function mathInputHelp(question: MathQuestion, field: MathField): string | undefined {
  if (field.kind === "choice") return;
  if (field.machine) return `Teaching assembly: one instruction per line, optional commas, labels ending in :, and ; comments. Registers R0–R7 hold signed 32-bit integers and start at zero except specified inputs. Memory has 256 word-indexed cells. Available instructions: ${field.machine.allowed.join(", ")}. Equivalent programs are checked by execution across multiple inputs.`;
  if (field.kind === "code") return field.language === "java" ? "Write the requested Java fragment or program. Spacing and indentation may vary; names, syntax, and behavior must match the prompt." : "Write the requested code exactly enough to preserve its names, syntax, and behavior. Spacing and indentation may vary.";
  if (field.kind === "logic") return `Type letters with not, and, or, xor${question.requires.includes("implication") ? ", -> (implies), or <-> (if and only if)" : ""}. Example: p and (not q). Parentheses make grouping explicit; equivalent formulas are accepted.`;
  if (field.kind === "pairs") return "List ordered pairs like {(1,2), (2,3)}; use none for the empty relation. Pair order in the list does not matter, but the two entries inside a pair do.";
  if (field.kind === "sequence") return "Separate entries with commas in the requested order, like 2, 5, 8. Fractions such as 3/4 are allowed.";
  if (field.kind === "bits") return "Type the requested 0/1 digits, keeping leading zeros when a width is specified. Spaces between groups are optional.";
  if (field.kind === "function") return "Use x^2, sqrt(x), sin(x), cos(x), exp(x) or e^x, and ln(x). Type inverse trig as asin(x), acos(x), atan(x); squared sine as sin(x)^2. Use parentheses around function inputs and fractions. Trig inputs are radians.";
  if (field.kind === "interval") return "Type intervals like (-inf, 2] U (5, inf). Use ( ) for excluded endpoints and [ ] for included endpoints.";
  if (field.kind === "expression") return "Use x^2 for powers, 2*x or 2x for multiplication, and parentheses for fractions: (x+1)/(x-1).";

  const topics = question.requires.join(" ");
  const tips: string[] = [];
  if (/counting|probability|expectation|error/.test(topics)) tips.push("You may type fractions or arithmetic, such as 3/4 or 6*5*4. For factorials, calculate the value or type the multiplied factors.");
  if (field.kind === "set") tips.push("Separate values with commas, like -2, 5. Type none for an empty set.");
  if (/fractions|rational|radicals|quadratic|trig|unit-circle/.test(topics)) tips.push("Fractions: 3/4.");
  if (/radicals|quadratic|pythagorean|distance-formula/.test(topics)) tips.push("Square roots: sqrt(2).");
  if (/radians|unit-circle|sinusoidal|trig/.test(topics)) tips.push("Use pi, as in pi/4, for radian answers.");
  if (/log-laws|exp-log-equations/.test(topics)) tips.push("Logarithms: ln(3) or log(3); other bases: ln(3)/ln(2).");
  return tips.length ? tips.join(" ") : undefined;
}

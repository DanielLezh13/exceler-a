import type { MathField, MathGrade, MathQuestion, MathResponse } from "./types.ts";
import { equivalentFunctions } from "./functionEquivalence.ts";
import { gradeDiscreteField } from "./discreteGrading.ts";
import { gradeMachine } from "./teachingMachine.ts";

// Deliberately small, non-executing mathematical parser. Never eval learner input.
type Node = { kind: "number"; value: number } | { kind: "variable" } | { kind: "unary"; op: string; value: Node } | { kind: "binary"; op: string; left: Node; right: Node } | { kind: "call"; name: string; value: Node };
export type MathNode = Node;
const funcs: Record<string, (x: number) => number> = { sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, ln: Math.log, log: Math.log10, exp: Math.exp };
Object.assign(funcs, { sec: (x:number)=>1/Math.cos(x), csc: (x:number)=>1/Math.sin(x), cot: (x:number)=>1/Math.tan(x) });
export function normalizeMath(value: string) {
  return value.trim().toLowerCase().replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/²/g, "^2").replace(/³/g, "^3").replace(/∞/g, "inf").replace(/\binfinity\b/g, "inf");
}
function parse(source: string): Node {
  const s = normalizeMath(source);
  if (!s || s.length > 600) throw Error("Enter a mathematical expression of at most 600 characters.");
  const tokens = s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+*/^%-]/g) ?? [];
  if (tokens.join("") !== s.replace(/\s+/g, "")) throw Error("Use numbers, x, parentheses, + - * / ^, sqrt(...), or the supported functions.");
  let index = 0;
  const take = () => tokens[index++];
  const peek = () => tokens[index];
  const atom = (): Node => {
    const t = take();
    if (t === "(") { const v = sum(); if (take() !== ")") throw Error("Close each parenthesis."); return v; }
    if (/^(?:\d|\.)/.test(t ?? "")) return { kind: "number", value: Number(t) };
    if (t === "x") return { kind: "variable" };
    if (t === "pi" || t === "e") return { kind: "number", value: t === "pi" ? Math.PI : Math.E };
    if (Object.hasOwn(funcs, t)) { if (take() !== "(") throw Error("Put function inputs in parentheses, for example sqrt(2)."); const value = sum(); if (take() !== ")") throw Error("Close each function parenthesis."); return { kind: "call", name: t, value }; }
    throw Error("This notation is not supported. Use the input guide; this is not a verdict on your mathematics.");
  };
  const power = (): Node => { let left = atom(); if (peek() === "^") { take(); left = { kind: "binary", op: "^", left, right: unary() }; } if (peek() === "%") { take(); left = { kind: "binary", op: "/", left, right: { kind: "number", value: 100 } }; } return left; };
  const unary = (): Node => peek() === "+" || peek() === "-" ? { kind: "unary", op: take(), value: unary() } : power();
  const product = (): Node => {
    let left = unary();
    while (peek() === "*" || peek() === "/" || (peek() && /^(?:\d|\.|[a-z]|\()/.test(peek()))) {
      const op = peek() === "*" || peek() === "/" ? take() : "*";
      left = { kind: "binary", op, left, right: unary() };
    }
    return left;
  };
  const sum = (): Node => { let left = product(); while (peek() === "+" || peek() === "-") left = { kind: "binary", op: take(), left, right: product() }; return left; };
  const node = sum();
  if (index !== tokens.length) throw Error("Check parentheses and operators.");
  return node;
}
function valueOf(node: Node, x?: number): number {
  if (node.kind === "number") return node.value;
  if (node.kind === "variable") { if (x === undefined) throw Error("Give a numerical value, not an expression containing x."); return x; }
  if (node.kind === "unary") return (node.op === "-" ? -1 : 1) * valueOf(node.value, x);
  if (node.kind === "call") return funcs[node.name](valueOf(node.value, x));
  const a = valueOf(node.left, x), b = valueOf(node.right, x);
  switch (node.op) { case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return a / b; default: return a ** b; }
}
export function evaluateMath(source: string, x?: number): number {
  const value = valueOf(parse(source), x);
  if (!Number.isFinite(value)) throw Error("This expression is undefined as a finite real number.");
  return value;
}
const near = (a: number, b: number, tolerance = 1e-9) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

function compactCode(value: string) {
  let result = "", quote = "", escaped = false;
  for (const raw of value.trim().replace(/\r/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')) {
    if (quote) {
      result += raw;
      if (escaped) escaped = false;
      else if (raw === "\\") escaped = true;
      else if (raw === quote) quote = "";
      continue;
    }
    if (raw === '"' || raw === "'" || raw === "`") { quote = raw; result += raw; }
    else if (!/\s/.test(raw)) result += raw;
  }
  return result;
}

// Compare rational functions by polynomial cross multiplication, not spot checks.
// Explicit domains/restrictions are separate answer fields when they are assessed.
type Polynomial = number[];
type Rational = { numerator: Polynomial; denominator: Polynomial };
const add = (a: Polynomial, b: Polynomial, sign = 1): Polynomial => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + sign * (b[i] ?? 0));
function mul(a: Polynomial, b: Polynomial): Polynomial {
  if (a.length + b.length > 66) throw Error("This expression exceeds the supported polynomial degree.");
  const out = Array(a.length + b.length - 1).fill(0);
  a.forEach((v, i) => b.forEach((w, j) => { out[i + j] += v * w; }));
  if (out.some(v => !Number.isFinite(v))) throw Error("Expression is too large.");
  return out;
}
function rational(node: Node): Rational {
  if (node.kind === "variable") return { numerator: [0, 1], denominator: [1] };
  if (node.kind === "number" || node.kind === "call") return { numerator: [valueOf(node)], denominator: [1] };
  if (node.kind === "unary") { const a = rational(node.value); return { ...a, numerator: a.numerator.map(v => v * (node.op === "-" ? -1 : 1)) }; }
  const a = rational(node.left);
  if (node.op === "^") {
    const exponent = valueOf(node.right);
    if (!Number.isInteger(exponent) || Math.abs(exponent) > 16) throw Error("For expressions in x, use integer powers from -16 to 16.");
    let result: Rational = { numerator: [1], denominator: [1] };
    for (let i = 0; i < Math.abs(exponent); i++) result = { numerator: mul(result.numerator, exponent < 0 ? a.denominator : a.numerator), denominator: mul(result.denominator, exponent < 0 ? a.numerator : a.denominator) };
    return result;
  }
  const b = rational(node.right);
  if (node.op === "+" || node.op === "-") return { numerator: add(mul(a.numerator, b.denominator), mul(b.numerator, a.denominator), node.op === "+" ? 1 : -1), denominator: mul(a.denominator, b.denominator) };
  if (node.op === "*") return { numerator: mul(a.numerator, b.numerator), denominator: mul(a.denominator, b.denominator) };
  return { numerator: mul(a.numerator, b.denominator), denominator: mul(a.denominator, b.numerator) };
}
function equivalent(a: string, b: string) {
  const stripLabel = (s: string) => s.replace(/^\s*(?:y|[fg]\s*\(\s*x\s*\))\s*=\s*/i, "");
  const x = rational(parse(stripLabel(a))), y = rational(parse(stripLabel(b)));
  if (x.denominator.every(v => v === 0) || y.denominator.every(v => v === 0)) throw Error("An expression cannot divide by zero.");
  const left = mul(x.numerator, y.denominator), right = mul(y.numerator, x.denominator);
  return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => near(left[i] ?? 0, right[i] ?? 0)).every(Boolean);
}
function polynomialDegree(node: Node) {
  const r = rational(node);
  if (r.denominator.slice(1).some(v => v !== 0)) return Infinity;
  return r.numerator.reduce((degree, coefficient, index) => coefficient !== 0 ? index : degree, 0);
}
function factorDegrees(node: Node): number[] {
  if (node.kind === "unary") return factorDegrees(node.value);
  if (node.kind === "binary" && node.op === "*") return [...factorDegrees(node.left), ...factorDegrees(node.right)];
  if (node.kind === "binary" && node.op === "^" && valueOf(node.right) > 0) return factorDegrees(node.left);
  return [polynomialDegree(node)];
}
function expanded(node: Node): boolean {
  if (node.kind === "unary") return expanded(node.value);
  if (node.kind === "binary" && (node.op === "+" || node.op === "-")) return expanded(node.left) && expanded(node.right);
  const r = rational(node);
  return r.denominator.slice(1).every(v => v === 0) && r.numerator.filter(v => v !== 0).length <= 1;
}
function numericSet(s: string) {
  const normalized = normalizeMath(s).replace(/^x\s*=\s*/, "").replace(/[{}]/g, "");
  if (["none", "no solution", "no real solutions", "empty", "∅"].includes(normalized)) return [];
  const expanded = normalized.includes("±") ? [normalized.replace("±", "+"), normalized.replace("±", "-")].join(",") : normalized;
  const values = expanded.split(/[,;]|\bor\b/).map(v => evaluateMath(v.replace(/^\s*x\s*=\s*/, ""))).sort((a, b) => a - b);
  return values.filter((v, i) => i === 0 || !near(v, values[i - 1]));
}
type Interval = { lo: number; hi: number; closedLo: boolean; closedHi: boolean };
function intervals(s: string): Interval[] {
  const input = normalizeMath(s).replace(/\s+/g, "");
  if (["r", "allreals", "allrealnumbers"].includes(input)) return [{ lo: -Infinity, hi: Infinity, closedLo: false, closedHi: false }];
  if (["none", "∅", "empty"].includes(input)) return [];
  const parts = input.split(/∪|union|\bu\b/).map(part => {
    const match = part.match(/^([[(])(.+),(.+)([)\]])$/);
    if (!match) throw Error("Use interval notation, for example (-inf, 2] U (4, inf).");
    const endpoint = (v: string) => v === "inf" || v === "+inf" ? Infinity : v === "-inf" ? -Infinity : evaluateMath(v);
    const lo = endpoint(match[2]), hi = endpoint(match[3]);
    const closedLo = match[1] === "[", closedHi = match[4] === "]";
    if (lo > hi || (lo === hi && !(closedLo && closedHi)) || (!Number.isFinite(lo) && closedLo) || (!Number.isFinite(hi) && closedHi)) throw Error("Check interval order and endpoints. Infinity always uses parentheses.");
    return { lo, hi, closedLo, closedHi };
  }).sort((a, b) => a.lo - b.lo || Number(b.closedLo) - Number(a.closedLo));
  const result: Interval[] = [];
  parts.forEach(part => {
    const previous = result.at(-1);
    if (!previous || part.lo > previous.hi || (part.lo === previous.hi && !part.closedLo && !previous.closedHi)) result.push({ ...part });
    else if (part.hi > previous.hi) { previous.hi = part.hi; previous.closedHi = part.closedHi; }
    else if (part.hi === previous.hi) previous.closedHi ||= part.closedHi;
  });
  return result;
}
export function gradeField(field: MathField, answer: string): { passed: boolean; feedback: string } {
  if (!answer.trim()) return { passed: false, feedback: "No answer submitted for this part." };
  try {
    if (field.kind === "code" && field.machine) return gradeMachine(answer, field.machine);
    if (["logic", "pairs", "sequence", "bits"].includes(field.kind)) return gradeDiscreteField(field, answer, evaluateMath);
    let passed = false;
    if (field.kind === "code") passed = compactCode(answer) === compactCode(field.answer);
    else if (field.kind === "choice") passed = normalizeMath(answer) === normalizeMath(field.answer);
    else if (field.kind === "function") {
      const strip=(s:string)=>s.replace(/^\s*(?:y'?|[fg]'?\s*\(\s*x\s*\))\s*=\s*/i, "");
      const verdict=equivalentFunctions(parse(strip(answer)),parse(strip(field.answer)),valueOf);
      if(verdict===null)return {passed:false,feedback:"The checker could not confirm this equivalent form. Try rewriting it with the displayed notation; this is not a confirmed mathematical error."};
      passed=verdict;
    }
    else if (field.kind === "expression") {
      const expressionAnswer = answer.replace(/^\s*(?:y|[fg]\s*\(\s*x\s*\))\s*=\s*/i, "");
      passed = equivalent(expressionAnswer, field.answer);
      if (passed && field.form === "factored" && Math.max(...factorDegrees(parse(expressionAnswer))) > Math.max(...factorDegrees(parse(field.answer)))) return { passed: false, feedback: "The value is equivalent, but the requested factoring is not complete. Factor the remaining polynomial rather than leaving it expanded." };
      if (passed && field.form === "expanded" && !expanded(parse(expressionAnswer))) return { passed: false, feedback: "The value is equivalent, but this question asks for expansion. Multiply out the grouped sums and combine like terms." };
    }
    else if (field.kind === "set") { const a = numericSet(answer), b = numericSet(field.answer); passed = a.length === b.length && a.every((v, i) => near(v, b[i], field.tolerance)); }
    else if (field.kind === "interval") { const a = intervals(answer), b = intervals(field.answer); passed = a.length === b.length && a.every((v, i) => (v.lo === b[i].lo || near(v.lo, b[i].lo)) && (v.hi === b[i].hi || near(v.hi, b[i].hi)) && v.closedLo === b[i].closedLo && v.closedHi === b[i].closedHi); }
    else passed = near(evaluateMath(answer.replace(/^\s*(?:x|y)\s*=\s*/, "")), evaluateMath(field.answer), field.tolerance);
    return { passed, feedback: passed ? field.kind === "code" ? "Accepted: the required code structure is present." : "Accepted: your answer is mathematically equivalent to the required result." : field.kind === "code" ? "The code does not yet match the exact structure requested. Recheck names, syntax, and required behavior." : field.kind === "set" ? "The solution set differs: check for missing, extra, or extraneous solutions." : field.kind === "interval" ? "The set differs: check boundaries, open/closed endpoints, and excluded values." : "This result does not match the required value or relationship. Recheck the calculation and the question's conditions." };
  } catch (error) { return { passed: false, feedback: error instanceof Error ? error.message : "Unable to interpret this notation; consult the input guide." }; }
}
export function gradeMath(question: MathQuestion, response: MathResponse): MathGrade {
  const fields = question.fields.map((field, i) => gradeField(field, response.values[i] ?? ""));
  return { passed: fields.every(f => f.passed), fields };
}

// Keep legacy snapshots intact: derive the distinction from their saved feedback.
// Unconfirmed answers earn no automatic credit, but are not called proven wrong.
export function mathGradeStatus(grade: MathGrade): "passed" | "unverified" | "incorrect" {
  if (grade.passed) return "passed";
  const failed = grade.fields.filter(field => !field.passed);
  return failed.length > 0 && failed.every(field => /not a confirmed mathematical error|not supported|not a verdict|unable to interpret|symbolic.*limit|symbolic.*size|use powers between|exceeds the supported|beyond the symbolic/i.test(field.feedback)) ? "unverified" : "incorrect";
}

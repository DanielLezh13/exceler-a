/** A bounded, non-eval runner for the straight-line Java taught in Unit I.
 * This is not a Java compiler. Unsupported syntax is reported as unverified,
 * never silently stripped or interpreted as proof of a wrong algorithm.
 */
export type PurchaseGrade = {
  correct: boolean;
  category: "not_applicable" | "missing_answer" | "input_mismatch" | "output_mismatch" | "invalid_code" | "unsupported_code";
  feedback: string;
};

type Value = { type: "int" | "double" | "String"; value: number | string };
type Variable = { type: Value["type"]; value: Value | null; constant: boolean };
class CheckError extends Error {
  category: PurchaseGrade["category"];
  constructor(category: PurchaseGrade["category"], message: string) {
    super(message);
    this.category = category;
  }
}
const invalid = (message: string): never => { throw new CheckError("invalid_code", message); };
const unsupported = (message: string): never => { throw new CheckError("unsupported_code", message); };
const identifier = /^[A-Za-z_$][\w$]*$/;
const reserved = new Set(["int", "double", "String", "public", "class", "static", "void", "final", "new", "return", "true", "false", "if", "else", "while", "for", "boolean", "char", "null", "import"]);
const number = (value: number, type: "int" | "double" = "int"): Value => ({ value, type });
const javaText = (value: Value) => value.type === "double" && Number.isInteger(value.value) ? `${value.value}.0` : String(value.value);

function tokensOf(source: string): string[] {
  if (source.length > 20_000) return unsupported("This answer is too long for the current straight-line checker.");
  const tokens: string[] = [];
  const pattern = /\s+|\/\/[^\n\r]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n\r])*"|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[dD]?|[A-Za-z_$][\w$]*|\+\+|--|[+\-*/%]=|[+\-*/%=;().,{}[\]]/y;
  let position = 0;
  while (position < source.length) {
    pattern.lastIndex = position;
    const match = pattern.exec(source);
    if (!match) return unsupported(`The current checker cannot verify syntax near ${JSON.stringify(source.slice(position, position + 24))}. This does not establish that your solution is wrong.`);
    position = pattern.lastIndex;
    if (!/^\s|^\/\//.test(match[0]) && !match[0].startsWith("/*")) tokens.push(match[0]);
  }
  if (tokens.length > 3_000) return unsupported("This answer exceeds the current checker's size limit.");
  return tokens;
}

function runPurchase(source: string, quantity: number, price: number) {
  const tokens = tokensOf(source);
  let index = 0;
  let inputIndex = 0;
  let depth = 0;
  let output = "";
  let wrapped = false;
  const variables = new Map<string, Variable>();
  const scanners = new Set(["input"]);
  const peek = () => tokens[index];
  const take = () => tokens[index++] ?? invalid("Unexpected end of code.");
  const expect = (token: string) => { if (take() !== token) invalid(`Expected ${JSON.stringify(token)} here. Check the statement's syntax.`); };
  const name = () => { const value = take(); if (!identifier.test(value) || reserved.has(value)) invalid(`Expected a variable name, found ${JSON.stringify(value)}.`); return value; };
  const numeric = (value: Value) => { if (typeof value.value !== "number") invalid("An arithmetic operation used text instead of a number."); return value.value as number; };
  const convert = (value: Value, type: Value["type"]): Value => {
    if (type === value.type) return { ...value };
    if (type === "double" && value.type === "int") return number(numeric(value), "double");
    return invalid(`Cannot store a ${value.type} value in ${type} without the required conversion.`);
  };
  const calculate = (left: Value, op: string, right: Value): Value => {
    if (op === "+" && (left.type === "String" || right.type === "String")) return { type: "String", value: javaText(left) + javaText(right) };
    const a = numeric(left), b = numeric(right);
    const type = left.type === "double" || right.type === "double" ? "double" : "int";
    if ((op === "/" || op === "%") && b === 0 && type === "int") invalid("Integer division by zero.");
    const result = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? (type === "int" ? Math.imul(a, b) : a * b) : op === "/" ? a / b : a % b;
    return number(type === "int" ? Math.trunc(result) | 0 : result, type);
  };
  const primary = (): Value => {
    if (++depth > 100) return unsupported("This expression is too deeply nested for the current checker.");
    try {
      const token = take();
      if (token === "+" || token === "-") {
        const operand = primary();
        return number((token === "-" ? -1 : 1) * numeric(operand), operand.type as "int" | "double");
      }
      if (token === "(") {
        if (["double", "int"].includes(peek()) && tokens[index + 1] === ")") {
          const type = take() as "double" | "int";
          expect(")");
          const value = numeric(primary());
          return number(type === "int" ? Math.max(-2147483648, Math.min(2147483647, Math.trunc(value))) : value, type);
        }
        const value = expression();
        expect(")");
        return value;
      }
      if (token.startsWith('"')) {
        try { return { type: "String", value: JSON.parse(token) as string }; }
        catch { return unsupported("This string escape is not supported by the current checker."); }
      }
      if (/^(\d|\.\d)/.test(token)) {
        if (/^0\d/.test(token)) return unsupported("Octal literals are not supported by this checker.");
        const value = Number(token.replace(/[dD]$/, ""));
        const type = /[.eEdD]/.test(token) ? "double" : "int";
        if (!Number.isFinite(value) || (type === "int" && value > 2147483647)) return unsupported("This numeric literal is outside the checker's supported range.");
        return number(value, type);
      }
      if (scanners.has(token) && peek() === ".") {
        take();
        const method = take(); expect("("); expect(")");
        const expected = inputIndex === 0 ? "nextInt" : "nextDouble";
        if (inputIndex > 1 || method !== expected) throw new CheckError("input_mismatch", "Read a whole-number quantity first with nextInt(), then a decimal unit price with nextDouble(). The order provides only these two values; the fee is fixed at 5.");
        return inputIndex++ === 0 ? number(quantity) : number(price, "double");
      }
      if ([".", "("].includes(peek())) return unsupported("This method or member expression is outside the current checker's supported Java subset. Ask the tutor to review it.");
      const variable = variables.get(token);
      if (!variable?.value) return invalid(`Variable ${JSON.stringify(token)} has no value here, or uses syntax this checker does not support.`);
      return { ...variable.value };
    } finally { depth -= 1; }
  };
  const product = (): Value => {
    let value = primary();
    while (["*", "/", "%"].includes(peek())) value = calculate(value, take(), primary());
    return value;
  };
  const expression = (): Value => {
    let value = product();
    while (["+", "-"].includes(peek())) value = calculate(value, take(), product());
    return value;
  };

  if (peek() === "import") {
    for (const token of ["import", "java", ".", "util", ".", "Scanner", ";"]) expect(token);
  }
  if (peek() === "public") {
    wrapped = true;
    expect("public"); expect("class"); name(); expect("{");
    for (const token of ["public", "static", "void", "main", "(", "String", "[", "]"]) expect(token);
    name(); expect(")"); expect("{");
    scanners.clear();
  }
  while (index < tokens.length && !(wrapped && peek() === "}")) {
    if (peek() === ";") { take(); continue; }
    if (peek() === "Scanner") {
      take(); const scanner = name();
      for (const token of ["=", "new", "Scanner", "(", "System", ".", "in", ")", ";"]) expect(token);
      if (scanners.has(scanner) || variables.has(scanner)) invalid("The same variable was declared twice.");
      scanners.add(scanner); continue;
    }
    if (peek() === "System" && tokens[index + 1] === ".") {
      expect("System"); expect("."); expect("out"); expect(".");
      const method = take();
      if (!["print", "println"].includes(method)) return unsupported("This checker currently supports print and println, not this output method.");
      expect("(");
      const value = peek() === ")" && method === "println" ? { type: "String", value: "" } as Value : expression();
      expect(")"); expect(";");
      output += javaText(value) + (method === "println" ? "\n" : "");
      continue;
    }
    const constant = peek() === "final";
    if (constant) take();
    if (["int", "double", "String"].includes(peek())) {
      const type = take() as Value["type"];
      const variable = name();
      if (variables.has(variable) || scanners.has(variable)) invalid("The same variable was declared twice.");
      let value: Value | null = null;
      if (peek() === "=") { take(); value = convert(expression(), type); }
      expect(";");
      variables.set(variable, { type, value, constant });
      continue;
    }
    if (constant || ["if", "for", "while", "return", "{"].includes(peek())) return unsupported("This answer uses a construct the straight-line checker cannot verify. It needs review, not an automatic claim that the algorithm is wrong.");
    const variableName = name();
    const variable = variables.get(variableName);
    if (!variable) return invalid(`Declare ${variableName} before assigning to it.`);
    if (variable.constant && variable.value) return invalid(`The final variable ${variableName} cannot be reassigned.`);
    const op = take();
    if (!["=", "+=", "-=", "*=", "/=", "%="].includes(op)) return unsupported("This update form is not yet supported by the straight-line checker.");
    let value = expression(); expect(";");
    if (op !== "=") {
      if (!variable.value) invalid(`Initialize ${variableName} before updating it.`);
      value = calculate(variable.value!, op[0], value);
      if (variable.type === "int" && value.type === "double") value = number(Math.max(-2147483648, Math.min(2147483647, Math.trunc(numeric(value)))));
    }
    variable.value = convert(value, variable.type);
  }
  if (wrapped) { expect("}"); expect("}"); }
  if (index !== tokens.length) invalid("Unexpected code after the program's closing braces.");
  if (inputIndex !== 2) throw new CheckError("input_mismatch", "Use the supplied quantity and decimal unit price. A fixed output or a calculation that never reads both inputs does not satisfy the question.");
  return output.replace(/\r?\n$/, "");
}

export function gradeBoothPurchase(answer: string): PurchaseGrade {
  if (!answer.trim()) return { correct: false, category: "missing_answer", feedback: "No answer was submitted for this question." };
  const cases = [[3, 2.5], [1, 0.75], [0, 8.25], [7, 1.2], [2, 0], [13, 4.35]];
  try {
    for (const [quantity, price] of cases) {
      const output = runPurchase(answer, quantity, price);
      const expected = quantity * price + 5;
      const match = /^Total: ([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)$/.exec(output);
      if (!match || !Number.isFinite(Number(match[1])) || Math.abs(Number(match[1]) - expected) > 1e-9) {
        return { correct: false, category: "output_mismatch", feedback: `With quantity ${quantity} and unit price ${price}, expected "Total: ${expected}" but your code produced ${JSON.stringify(output)}. Multiply quantity by price, add the fixed 5 once, and print that numeric total after "Total: ".` };
      }
    }
    return { correct: true, category: "not_applicable", feedback: `Accepted on ${cases.length} input/output checks: quantity × unit price + 5, with the required label. Named fee variables, different result names, equivalent arithmetic, and print or println are accepted. Checked with the supported straight-line Java evaluator, not a full Java compiler.` };
  } catch (error) {
    if (error instanceof CheckError) return { correct: false, category: error.category, feedback: error.message };
    return { correct: false, category: "unsupported_code", feedback: "The current checker could not verify this answer. That is not proof that your solution is wrong; review it with the tutor." };
  }
}

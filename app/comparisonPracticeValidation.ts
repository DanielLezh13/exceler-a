import { javaLanguage } from "@codemirror/lang-java";

type Node = ReturnType<typeof javaLanguage.parser.parse>["topNode"];
type Value = { type: "int" | "double" | "boolean"; value: number | boolean };
export type ComparisonCase = { values: Record<string, number>; expected: boolean };
type Variable = { type: Value["type"]; value: Value | null };
const fail = (): never => { throw new Error("Unsupported or invalid comparison fragment"); };
const children = (node: Node) => {
  const result: Node[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (!["LineComment", "BlockComment"].includes(child.name)) result.push(child);
  }
  return result;
};
const numeric = (value: Value) => typeof value.value === "number" ? value.value : fail();
const boolean = (value: Value) => typeof value.value === "boolean" ? value.value : fail();
const bool = (value: boolean): Value => ({ type: "boolean", value });

/** Bounded checks of straight-line comparison fragments, not a Java compiler.
 * Parse Java syntax rather than matching reference-code spelling. Evaluate only
 * declarations, assignments, arithmetic/comparisons and boolean output; never
 * execute submitted source. Given variables cannot be changed or redeclared.
 */
export function validateComparisonProgram(answer: string, types: Record<string, "int" | "double">, cases: ComparisonCase[]): boolean {
  if (!answer.trim() || answer.length > 8_000 || cases.length === 0) return false;
  const prefix = "class ComparisonCheck { void run() {";
  const source = `${prefix}${answer}}}`;
  try {
    const tree = javaLanguage.parser.parse(source);
    tree.iterate({ enter: (node) => { if (node.type.isError) fail(); } });
    const classNode = tree.topNode.getChild("ClassDeclaration");
    const classBody = classNode?.getChild("ClassBody");
    const method = classBody?.getChild("MethodDeclaration");
    const block = method?.getChild("Block");
    // Reject attempts to close the wrapper or append additional declarations.
    if (!block || children(tree.topNode).length !== 1 || !classBody || children(classBody).length !== 3 || block.from !== prefix.length - 1 || block.to !== source.length - 1) return false;
    const statements = children(block).slice(1, -1);
    const text = (node: Node) => source.slice(node.from, node.to);

    for (const sample of cases) {
      const variables = new Map<string, Variable>(Object.entries(types).map(([name, type]) => [name, { type, value: { type, value: sample.values[name] } }]));
      const printed: boolean[] = [];
      const convert = (value: Value, type: Value["type"]): Value => {
        if (value.type === type) return { ...value };
        if (type === "double" && value.type === "int") return { type, value: numeric(value) };
        return fail();
      };
      const arithmetic = (left: Value, op: string, right: Value): Value => {
        const a = numeric(left), b = numeric(right);
        if (!["+", "-", "*", "/", "%"].includes(op)) return fail();
        const type = left.type === "double" || right.type === "double" ? "double" : "int";
        if ((op === "/" || op === "%") && b === 0 && type === "int") return fail();
        const result = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? (type === "int" ? Math.imul(a, b) : a * b) : op === "/" ? a / b : a % b;
        return { type, value: type === "int" ? Math.trunc(result) | 0 : result };
      };
      const evaluate = (node: Node, depth = 0): Value => {
        if (depth > 80) return fail();
        const parts = children(node);
        const next = (child: Node) => evaluate(child, depth + 1);
        if (node.name === "Identifier") return variables.get(text(node))?.value ?? fail();
        if (node.name === "BooleanLiteral") return bool(text(node) === "true");
        if (node.name === "IntegerLiteral" || node.name === "FloatingPointLiteral") {
          const literal = text(node);
          if (!/^(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?[dD]?$|^\.\d+(?:[eE][+-]?\d+)?[dD]?$/.test(literal)) return fail();
          const value = Number(literal.replace(/[dD]$/, ""));
          const type = node.name === "IntegerLiteral" ? "int" : "double";
          if (!Number.isFinite(value) || (type === "int" && value > 2147483647)) return fail();
          return { type, value };
        }
        if (node.name === "ParenthesizedExpression" && parts.length === 3) return next(parts[1]);
        if (node.name === "UnaryExpression" && parts.length === 2) {
          const value = next(parts[1]), op = text(parts[0]);
          if (op === "!") return bool(!boolean(value));
          if (op !== "+" && op !== "-") return fail();
          const result = (op === "-" ? -1 : 1) * numeric(value);
          return { type: value.type, value: value.type === "int" ? result | 0 : result };
        }
        if (node.name !== "BinaryExpression" || parts.length !== 3) return fail();
        const left = next(parts[0]), right = next(parts[2]), op = text(parts[1]);
        if (["&&", "||"].includes(op)) {
          const a = boolean(left), b = boolean(right);
          return bool(op === "&&" ? a && b : a || b);
        }
        if (["==", "!="].includes(op)) {
          if ((left.type === "boolean") !== (right.type === "boolean")) return fail();
          return bool(op === "==" ? left.value === right.value : left.value !== right.value);
        }
        const a = numeric(left), b = numeric(right);
        if (op === ">") return bool(a > b);
        if (op === "<") return bool(a < b);
        if (op === ">=") return bool(a >= b);
        if (op === "<=") return bool(a <= b);
        return arithmetic(left, op, right);
      };
      for (const statement of statements) {
        if (statement.name === "LocalVariableDeclaration") {
          const declaration = children(statement);
          if (declaration.length !== 3 || declaration[0].name !== "PrimitiveType" || declaration[1].name !== "VariableDeclarator") return false;
          const type = text(declaration[0]) as Value["type"];
          if (!["int", "double", "boolean"].includes(type)) return false;
          const parts = children(declaration[1]), name = text(parts[0]);
          if (variables.has(name) || ![1, 3].includes(parts.length)) return false;
          variables.set(name, { type, value: null });
          if (parts.length === 3) variables.get(name)!.value = convert(evaluate(parts[2]), type);
          continue;
        }
        if (statement.name !== "ExpressionStatement") return false;
        const expression = statement.firstChild!;
        const parts = children(expression);
        if (expression.name === "AssignmentExpression") {
          const name = text(parts[0]), variable = variables.get(name);
          const op = text(parts[1]);
          if (parts[0].name !== "Identifier" || Object.hasOwn(types, name) || !variable || !["=", "+=", "-=", "*=", "/=", "%="].includes(op)) return false;
          let value = evaluate(parts[2]);
          if (op !== "=") {
            value = arithmetic(variable.value ?? fail(), op[0], value);
            // Java compound assignment converts the result back to the left type.
            if (variable.type === "int" && value.type === "double") value = { type: "int", value: Number.isNaN(numeric(value)) ? 0 : Math.max(-2147483648, Math.min(2147483647, Math.trunc(numeric(value)))) };
          }
          variable.value = convert(value, variable.type);
          continue;
        }
        if (expression.name !== "MethodInvocation") return false;
        const args = expression.getChild("ArgumentList");
        if (!args) return false;
        // Read the parsed receiver/method, ignoring comments and whitespace.
        const receiver = parts[0];
        const receiverParts = children(receiver);
        if (receiver.name !== "FieldAccess" || receiverParts.length !== 3 || text(receiverParts[0]) !== "System" || text(receiverParts[2]) !== "out" || variables.has("System")) return false;
        const methodName = expression.getChild("MethodName")?.getChild("Identifier");
        if (!methodName || !["print", "println"].includes(text(methodName))) return false;
        const values = children(args).slice(1, -1);
        if (values.length !== 1) return false;
        printed.push(boolean(evaluate(values[0])));
      }
      if (printed.length !== 1 || printed[0] !== sample.expected) return false;
    }
    return true;
  } catch {
    return false;
  }
}

import { javaLanguage } from "@codemirror/lang-java";

type Node = ReturnType<typeof javaLanguage.parser.parse>["topNode"];
type Value = { type: "int" | "double" | "boolean" | "String"; value: number | boolean | string };
export type DecisionCase = { values: Record<string, number | boolean | string>; expected: string | boolean };
type Variable = { type: Value["type"]; value: Value | null };
const fail = (): never => { throw new Error("Unsupported decision fragment"); };
const children = (node: Node) => {
  const result: Node[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (!["LineComment", "BlockComment"].includes(child.name)) result.push(child);
  }
  return result;
};

/** Checks a deliberately small, loop-free Java subset against varied cases.
 * It parses source but never executes learner Java or claims to be a compiler.
 */
export function validateDecisionProgram(
  answer: string,
  types: Record<string, "int" | "double" | "boolean" | "String">,
  cases: DecisionCase[],
  options: { requireTernary?: boolean; requireNestedBranches?: boolean; requireSingleIfElseChain?: boolean; requireParenthesizedAnd?: boolean; requiredVariableTypes?: Record<string, "int" | "double" | "boolean" | "String">; resultVariable?: string } = {},
): boolean {
  if (!answer.trim() || answer.length > 8_000 || cases.length === 0) return false;
  const prefix = "class DecisionCheck { void run() {";
  const source = `${prefix}${answer}}}`;
  try {
    const tree = javaLanguage.parser.parse(source);
    tree.iterate({ enter: (node) => { if (node.type.isError) fail(); } });
    const classBody = tree.topNode.getChild("ClassDeclaration")?.getChild("ClassBody");
    const block = classBody?.getChild("MethodDeclaration")?.getChild("Block");
    if (!block || children(tree.topNode).length !== 1 || !classBody || children(classBody).length !== 3 || block.from !== prefix.length - 1 || block.to !== source.length - 1) return false;
    const statements = children(block).slice(1, -1);
    if (statements.length > 80) return false;
    if (options.requireParenthesizedAnd) {
      const containsAnd = (node: Node): boolean => node.name === "BinaryExpression"
        && children(node).some((child) => source.slice(child.from, child.to) === "&&")
        || children(node).some(containsAnd);
      let grouped = false;
      tree.iterate({ enter: (node) => { if (node.type.name === "ParenthesizedExpression" && containsAnd(node.node)) grouped = true; } });
      if (!grouped) return false;
    }
    if (options.requiredVariableTypes) {
      const found = new Map<string, string>();
      tree.iterate({ enter: (node) => {
        if (node.type.name !== "LocalVariableDeclaration") return;
        const parts = children(node.node);
        const declaration = parts[1] && children(parts[1]);
        if (parts[0] && declaration?.[0]) found.set(source.slice(declaration[0].from, declaration[0].to), source.slice(parts[0].from, parts[0].to));
      } });
      if (Object.entries(options.requiredVariableTypes).some(([name, type]) => found.get(name) !== type)) return false;
    }
    if (options.requireSingleIfElseChain) {
      if (statements.length !== 1 || statements[0].name !== "IfStatement") return false;
      let branch = statements[0];
      let conditionCount = 0;
      while (branch.name === "IfStatement") {
        const parts = children(branch);
        if (parts.length !== 5 || parts[2].name !== "Block") return false;
        conditionCount += 1;
        branch = parts[4];
      }
      if (conditionCount < 2 || branch.name !== "Block") return false;
    }
    const hasInnerIfElse = (branch: Node) => branch.name === "Block"
      && children(branch).slice(1, -1).some((statement) => statement.name === "IfStatement" && children(statement).length === 5);
    const hasNestedBranches = (node: Node): boolean => {
      if (node.name === "IfStatement") {
        const parts = children(node);
        if (parts.length === 5 && (hasInnerIfElse(parts[2]) || hasInnerIfElse(parts[4]))) return true;
      }
      return children(node).some(hasNestedBranches);
    };
    if (options.requireNestedBranches && !statements.some(hasNestedBranches)) return false;
    const text = (node: Node) => source.slice(node.from, node.to);
    let hasTernary = false;

    for (const sample of cases) {
      const variables = new Map<string, Variable>();
      for (const [name, type] of Object.entries(types)) {
        const value = sample.values[name];
        if (value === undefined || (type === "boolean" ? typeof value !== "boolean" : type === "String" ? typeof value !== "string" : typeof value !== "number")) return false;
        variables.set(name, { type, value: { type, value } });
      }
      let output = "";
      let steps = 0;
      const number = (value: Value) => typeof value.value === "number" ? value.value : fail();
      const bool = (value: Value) => typeof value.value === "boolean" ? value.value : fail();
      const makeBool = (value: boolean): Value => ({ type: "boolean", value });
      const javaString = (value: Value) => value.type === "double" && Number.isInteger(value.value)
        ? `${value.value}.0` : String(value.value);
      const convert = (value: Value, type: Value["type"]): Value => {
        if (value.type === type) return value;
        if (type === "double" && value.type === "int") return { type, value: number(value) };
        return fail();
      };
      const evaluate = (node: Node, depth = 0): Value => {
        if (depth > 80) return fail();
        const parts = children(node);
        const next = (child: Node) => evaluate(child, depth + 1);
        if (node.name === "Identifier") return variables.get(text(node))?.value ?? fail();
        if (node.name === "BooleanLiteral") return makeBool(text(node) === "true");
        if (node.name === "StringLiteral") return { type: "String", value: JSON.parse(text(node)) as string };
        if (node.name === "IntegerLiteral" || node.name === "FloatingPointLiteral") {
          const literal = text(node);
          if (!/^(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?[dD]?$|^\.\d+(?:[eE][+-]?\d+)?[dD]?$/.test(literal)) return fail();
          const value = Number(literal.replace(/[dD]$/, ""));
          const type = node.name === "IntegerLiteral" ? "int" : "double";
          if (!Number.isFinite(value) || (type === "int" && value > 2147483647)) return fail();
          return { type, value };
        }
        if (node.name === "ParenthesizedExpression" && parts.length === 3) return next(parts[1]);
        if (node.name === "CastExpression" && parts.length === 4) {
          const type = text(parts[1]);
          if (type === "double") return convert(next(parts[3]), "double");
          if (type === "int") {
            const value = next(parts[3]);
            return { type: "int", value: Math.trunc(number(value)) | 0 };
          }
          return fail();
        }
        if (node.name === "UnaryExpression" && parts.length === 2) {
          const value = next(parts[1]);
          if (text(parts[0]) === "!") return makeBool(!bool(value));
          if (!["+", "-"].includes(text(parts[0]))) return fail();
          const result = text(parts[0]) === "-" ? -number(value) : number(value);
          return { type: value.type, value: value.type === "int" ? result | 0 : result };
        }
        if (node.name === "TernaryExpression" && parts.length === 5) {
          hasTernary = true;
          return next(bool(next(parts[0])) ? parts[2] : parts[4]);
        }
        if (node.name !== "BinaryExpression" || parts.length !== 3) return fail();
        const left = next(parts[0]), op = text(parts[1]);
        if (op === "&&") return makeBool(bool(left) && bool(next(parts[2])));
        if (op === "||") return makeBool(bool(left) || bool(next(parts[2])));
        const right = next(parts[2]);
        if (op === "==" || op === "!=") {
          if (left.type !== right.type && !(["int", "double"].includes(left.type) && ["int", "double"].includes(right.type))) return fail();
          return makeBool(op === "==" ? left.value === right.value : left.value !== right.value);
        }
        if ([">", "<", ">=", "<="].includes(op)) {
          const a = number(left), b = number(right);
          return makeBool(op === ">" ? a > b : op === "<" ? a < b : op === ">=" ? a >= b : a <= b);
        }
        if (!["+", "-", "*", "/", "%"].includes(op)) return fail();
        if (op === "+" && (left.type === "String" || right.type === "String")) return { type: "String", value: javaString(left) + javaString(right) };
        const a = number(left), b = number(right);
        const type = left.type === "double" || right.type === "double" ? "double" : "int";
        if ((op === "/" || op === "%") && b === 0) return fail();
        const result = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? a / b : a % b;
        return { type, value: type === "int" ? Math.trunc(result) | 0 : result };
      };
      const run = (statement: Node, depth = 0): void => {
        if (++steps > 200 || depth > 40) return fail();
        const parts = children(statement);
        if (statement.name === "Block") {
          const namesBefore = new Set(variables.keys());
          for (const child of parts.slice(1, -1)) run(child, depth + 1);
          for (const name of variables.keys()) if (!namesBefore.has(name)) variables.delete(name);
          return;
        }
        if (statement.name === "IfStatement") {
          if (parts.length !== 3 && parts.length !== 5) return fail();
          if (bool(evaluate(parts[1]))) run(parts[2], depth + 1);
          else if (parts.length === 5) run(parts[4], depth + 1);
          return;
        }
        if (statement.name === "LocalVariableDeclaration") {
          if (parts.length !== 3 || !["PrimitiveType", "TypeName"].includes(parts[0].name) || parts[1].name !== "VariableDeclarator") return fail();
          const type = text(parts[0]) as Value["type"];
          if (!["int", "double", "boolean", "String"].includes(type)) return fail();
          const declaration = children(parts[1]), name = text(declaration[0]);
          if (variables.has(name) || ![1, 3].includes(declaration.length)) return fail();
          variables.set(name, { type, value: declaration.length === 3 ? convert(evaluate(declaration[2]), type) : null });
          return;
        }
        if (statement.name !== "ExpressionStatement") return fail();
        const expression = parts[0], expressionParts = children(expression);
        if (expression.name === "AssignmentExpression") {
          const name = text(expressionParts[0]), variable = variables.get(name);
          if (expressionParts[0].name !== "Identifier" || Object.hasOwn(types, name) || !variable) return fail();
          const operator = text(expressionParts[1]);
          const right = evaluate(expressionParts[2]);
          if (operator === "=") variable.value = convert(right, variable.type);
          else if (["+=", "-=", "*=", "/=", "%="].includes(operator) && variable.value) {
            const leftNumber = number(variable.value), rightNumber = number(right);
            if ((operator === "/=" || operator === "%=") && rightNumber === 0) return fail();
            const result = operator === "+=" ? leftNumber + rightNumber : operator === "-=" ? leftNumber - rightNumber : operator === "*=" ? leftNumber * rightNumber : operator === "/=" ? leftNumber / rightNumber : leftNumber % rightNumber;
            variable.value = { type: variable.type, value: variable.type === "int" ? Math.trunc(result) | 0 : result };
          } else return fail();
          return;
        }
        if (expression.name !== "MethodInvocation") return fail();
        const receiver = expressionParts[0], receiverParts = children(receiver);
        const methodName = expression.getChild("MethodName")?.getChild("Identifier");
        const args = expression.getChild("ArgumentList");
        if (receiver.name !== "FieldAccess" || receiverParts.length !== 3 || text(receiverParts[0]) !== "System" || text(receiverParts[2]) !== "out" || !methodName || !args || !["print", "println"].includes(text(methodName))) return fail();
        const values = children(args).slice(1, -1);
        if (values.length !== 1) return fail();
        output += javaString(evaluate(values[0])) + (text(methodName) === "println" ? "\n" : "");
      };
      for (const statement of statements) run(statement);
      if (options.resultVariable) {
        if (variables.get(options.resultVariable)?.value?.value !== sample.expected) return false;
      } else if (output.replace(/\n$/, "") !== String(sample.expected)) return false;
    }
    return !options.requireTernary || hasTernary;
  } catch {
    return false;
  }
}

import { javaLanguage } from "@codemirror/lang-java";

type Node = ReturnType<typeof javaLanguage.parser.parse>["topNode"];
type Shape = string | number | Shape[];
export type RetrievalSyntaxOptions = {
  members?: boolean;
  fixedNames?: string[];
  singleOutput?: boolean;
  integerBounds?: boolean;
};
const children = (node: Node) => {
  const result: Node[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (!["LineComment", "BlockComment"].includes(child.name)) result.push(child);
  }
  return result;
};
const same = (a: Shape, b: Shape) => JSON.stringify(a) === JSON.stringify(b);
const localDefinition = (node: Node) => node.name === "Definition" && ["VariableDeclarator", "FormalParameter", "ForSpec"].includes(node.parent?.name ?? "");

/** Syntax-retrieval checks for explicitly scoped statements/constructs.
 * This is not a compiler or a general behavioral grader. Compare parsed Java
 * with authored alternatives, allowing local-name changes, harmless grouping,
 * reversed comparisons and equivalent standalone updates. Never eval code.
 */
export function javaRetrievalShape(answer: string, options: RetrievalSyntaxOptions = {}): string | null {
  if (!answer.trim() || answer.length > 12_000) return null;
  const source = options.members ? `class Practice {\n${answer}\n}` : `class Practice {void exercise(){\n${answer}\n}}`;
  const tree = javaLanguage.parser.parse(source);
  let invalid = false;
  tree.iterate({ enter: (node) => { if (node.type.isError) invalid = true; } });
  if (invalid) return null;
  const text = (node: Node) => source.slice(node.from, node.to);
  const locals = new Map<string, string>();
  const fixed = new Set(options.fixedNames ?? []);
  tree.iterate({ enter: (ref) => {
    if (!localDefinition(ref.node)) return;
    const name = text(ref.node);
    if (!fixed.has(name) && !locals.has(name)) locals.set(name, `$local${locals.size}`);
  } });
  const integer = (node: Node) => node.name === "IntegerLiteral" && /^(0|[1-9]\d*)$/.test(text(node)) ? Number(text(node)) : null;
  const shape = (node: Node, depth = 0): Shape => {
    if (depth > 100) throw new Error("Expression too deep");
    const parts = children(node);
    const child = (node: Node) => shape(node, depth + 1);
    if (node.name === "ParenthesizedExpression") return child(parts[1]);
    if (["Identifier", "Definition"].includes(node.name)) return ["Name", (node.name === "Identifier" || localDefinition(node) ? locals.get(text(node)) : undefined) ?? text(node)];
    if (node.name === "MethodName" && options.singleOutput && ["println", "print"].includes(text(node))) return ["OutputMethod"];
    if (node.name === "Block") return ["Block", ...parts.slice(1, -1).map(child)];
    const asBlock = (node: Node): Shape => node.name === "Block" ? child(node) : ["Block", child(node)];
    if (node.name === "IfStatement") return ["If", child(parts[1]), asBlock(parts[2]), ...(parts.length > 3 ? [asBlock(parts[4])] : [])];
    if (["ForStatement", "EnhancedForStatement", "WhileStatement"].includes(node.name)) return [node.name, child(parts[1]), asBlock(parts[2])];
    if (node.name === "BinaryExpression" && parts.length === 3) {
      let left = child(parts[0]), right = child(parts[2]), op = text(parts[1]);
      let leftInteger = integer(parts[0]);
      let rightInteger = integer(parts[2]);
      if (op === ">" || op === ">=") {
        [left, right] = [right, left];
        op = op === ">" ? "<" : "<=";
        leftInteger = integer(parts[2]);
        rightInteger = integer(parts[0]);
      }
      if (options.integerBounds && op === "<=" && rightInteger !== null && rightInteger < 2147483647) {
        op = "<"; right = ["IntegerLiteral", String(rightInteger + 1)];
      } else if (options.integerBounds && op === "<=" && leftInteger !== null && leftInteger > 0) {
        op = "<"; left = ["IntegerLiteral", String(leftInteger - 1)];
      }
      if (["==", "!=", "*"].includes(op) && JSON.stringify(left) > JSON.stringify(right)) [left, right] = [right, left];
      return ["Binary", op, left, right];
    }
    // Prefix/postfix are interchangeable only when their produced value is
    // discarded (a statement or a for-loop update), never inside an expression.
    if (["ExpressionStatement", "ForSpec"].includes(node.parent?.name ?? "")) {
      if (node.name === "UpdateExpression") {
        const target = parts.find((part) => part.name !== "UpdateOp")!;
        const op = parts.find((part) => part.name === "UpdateOp")!;
        return ["Update", child(target), text(op) === "++" ? "+" : "-", ["IntegerLiteral", "1"]];
      }
      if (node.name === "AssignmentExpression" && parts.length === 3) {
        const target = child(parts[0]), op = text(parts[1]);
        if (["+=", "-=", "*=", "/=", "%="].includes(op)) return ["Update", target, op[0], child(parts[2])];
        const right = children(parts[2]);
        if (op === "=" && parts[2].name === "BinaryExpression" && right.length === 3 && same(target, child(right[0])) && ["+", "-", "*", "/", "%"].includes(text(right[1]))) {
          return ["Update", target, text(right[1]), child(right[2])];
        }
      }
    }
    return parts.length ? [node.name, ...parts.map(child)] : [node.name, text(node)];
  };
  try { return JSON.stringify(shape(tree.topNode)); }
  catch { return null; }
}

export function retrievalValidator(answers: string[], options: RetrievalSyntaxOptions = {}) {
  const accepted = new Set(answers.map((answer) => javaRetrievalShape(answer, options)).filter((value): value is string => value !== null));
  return (answer: string) => {
    const candidate = javaRetrievalShape(answer, options);
    return candidate !== null && accepted.has(candidate);
  };
}

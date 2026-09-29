import { javaLanguage } from "@codemirror/lang-java";
import { validateDecisionProgram } from "./decisionPracticeValidation.ts";

type InputKind = "int" | "double";
type ProgramCase = { input: number[]; expected: string };

/** Checks a bounded, loop-free complete Java program against several input cases.
 * The full wrapper and Scanner reads are parsed, then the taught decision subset
 * is evaluated. Learner Java is never run in the browser.
 */
export function validateFullInputProgram(
  answer: string,
  className: string,
  inputKinds: InputKind[],
  cases: ProgramCase[],
): boolean {
  if (!answer.trim() || answer.length > 10_000 || !cases.length) return false;
  try {
    const tree = javaLanguage.parser.parse(answer);
    tree.iterate({ enter: (node) => { if (node.type.isError) throw new Error("Invalid syntax"); } });
    const nodes = [];
    for (let child = tree.topNode.firstChild; child; child = child.nextSibling) nodes.push(child);
    const classes = nodes.filter((node) => node.name === "ClassDeclaration");
    if (classes.length !== 1 || !new RegExp(`^\\s*public\\s+class\\s+${className}\\b`).test(answer.slice(classes[0].from, classes[0].to))) return false;
    const classBody = classes[0].getChild("ClassBody");
    if (!classBody) return false;
    const methods = [];
    for (let child = classBody.firstChild; child; child = child.nextSibling) if (child.name === "MethodDeclaration") methods.push(child);
    const main = methods.find((node) => /^\s*public\s+static\s+void\s+main\s*\(\s*String\s*(?:\[\s*\]\s+[A-Za-z_$][\w$]*|[A-Za-z_$][\w$]*\s*\[\s*\])\s*\)/.test(answer.slice(node.from, node.to)));
    const block = main?.getChild("Block");
    if (!block || methods.length !== 1) return false;

    let body = answer.slice(block.from + 1, block.to - 1);
    const scannerSetup = /\b(?:java\.util\.)?Scanner\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(?:java\.util\.)?Scanner\s*\(\s*System\.in\s*\)\s*;/;
    const scanner = body.match(scannerSetup);
    if (!scanner) return false;
    if (!/\bimport\s+java\.util\.Scanner\s*;/.test(answer) && !/java\.util\.Scanner/.test(scanner[0])) return false;
    body = body.replace(scannerSetup, "");

    const readPattern = new RegExp(`\\b(?:(int|double)\\s+)?([A-Za-z_$][\\w$]*)\\s*=\\s*${scanner[1]}\\.next(Int|Double)\\s*\\(\\s*\\)\\s*;`, "g");
    const reads = [...body.matchAll(readPattern)];
    if (reads.length !== inputKinds.length) return false;
    const declaredTypes = reads.map((match) => {
      if (match[1]) return match[1] as InputKind;
      const declaration = body.slice(0, match.index).match(new RegExp(`\\b(int|double)\\s+${match[2]}\\s*;`));
      return declaration?.[1] as InputKind | undefined;
    });
    if (reads.some((match, index) => !declaredTypes[index]
      || (declaredTypes[index] === "int" && match[3] !== "Int")
      || (inputKinds[index] === "double" && match[3] !== "Double"))) return false;
    const lastReadEnd = reads.at(-1)?.index ?? -1;
    if (lastReadEnd < 0) return false;
    // Prompts printed before the last input are UI text, not the requested result.
    const prefix = body.slice(0, lastReadEnd).replace(/System\.out\.(?:print|println)\s*\(\s*"(?:[^"\\]|\\.)*"\s*\)\s*;/g, "");
    body = prefix + body.slice(lastReadEnd);
    reads.forEach((match, index) => {
      if (!match[1]) body = body.replace(new RegExp(`\\b${declaredTypes[index]}\\s+${match[2]}\\s*;`), "");
    });
    body = body.replace(readPattern, "");
    if (new RegExp(`\\b${scanner[1]}\\.next(?:Int|Double)\\s*\\(`).test(body)) return false;

    const types = Object.fromEntries(reads.map((match, index) => [match[2], declaredTypes[index]])) as Record<string, InputKind>;
    if (Object.keys(types).length !== reads.length) return false;
    const decisionCases = cases.map((sample) => ({
      values: Object.fromEntries(reads.map((match, index) => [match[2], sample.input[index]])),
      expected: sample.expected,
    }));
    return cases.every((sample) => sample.input.length === inputKinds.length)
      && validateDecisionProgram(body, types, decisionCases);
  } catch {
    return false;
  }
}

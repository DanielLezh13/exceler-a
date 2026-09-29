import { javaLanguage } from "@codemirror/lang-java";

// Code-pattern graders still need to reject malformed submissions and must
// never count required text that appears only in a comment.
export function withoutJavaComments(source: string): string {
  let result = "";
  let state: "code" | "string" | "character" | "line" | "block" = "code";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "line") {
      if (char === "\n") { result += char; state = "code"; }
      continue;
    }
    if (state === "block") {
      if (char === "*" && next === "/") { index += 1; state = "code"; }
      else if (char === "\n") result += char;
      continue;
    }
    if (state === "string" || state === "character") {
      result += char;
      if (char === "\\" && next !== undefined) result += source[++index];
      else if (char === (state === "string" ? '"' : "'")) state = "code";
      continue;
    }
    if (char === "/" && next === "/") { result += " "; index += 1; state = "line"; }
    else if (char === "/" && next === "*") { result += " "; index += 1; state = "block"; }
    else { result += char; if (char === '"') state = "string"; else if (char === "'") state = "character"; }
  }
  return result;
}

// A comparison can be written from either side: score >= 70 and 70 <= score
// mean the same thing. Keep the original source and offer flipped spellings to
// legacy pattern checks without changing the learner's submitted program.
export function equivalentComparisonForms(source: string): string[] {
  const uncommented = withoutJavaComments(source);
  const masked = uncommented.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (literal) => " ".repeat(literal.length));
  const flipped: Record<string, string> = { ">": "<", "<": ">", ">=": "<=", "<=": ">=" };
  const comparisons = [...masked.matchAll(/([A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)\s*(>=|<=|>|<)\s*([A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)/g)]
    .filter((match) => !/(?:[.(>]|\[)/.test(masked[match.index! + match[0].length] ?? "") && !/[.\w$]/.test(masked[match.index! - 1] ?? ""))
    .slice(0, 12);
  const swap = (indexes: number[]) => {
    let result = uncommented;
    for (const index of indexes.sort((a, b) => b - a)) {
      const match = comparisons[index];
      result = result.slice(0, match.index) + `${match[3]} ${flipped[match[2]]} ${match[1]}` + result.slice(match.index! + match[0].length);
    }
    return result;
  };
  const forms = [uncommented];
  for (let index = 0; index < comparisons.length; index += 1) forms.push(swap([index]));
  for (let first = 0; first < comparisons.length; first += 1) {
    for (let second = first + 1; second < comparisons.length; second += 1) forms.push(swap([first, second]));
  }
  return forms;
}

const parses = (source: string) => {
  const tree = javaLanguage.parser.parse(source);
  let error = false;
  tree.iterate({ enter: (node) => { if (node.type.isError) error = true; } });
  return !error;
};

export function hasJavaFragmentSyntax(source: string): boolean {
  if (!source.trim() || source.length > 20_000) return false;
  if (parses(source) || parses(`class Practice { ${source} }`) || parses(`class Practice { void check() { ${source} } }`)) return true;

  // Some prompts ask for a method followed by a call. Such fragments are
  // valid in the exercise even though the two parts occupy different Java
  // scopes, so place the trailing statements in a small test method.
  const cleaned = withoutJavaComments(source).replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (literal) => " ".repeat(literal.length));
  let depth = 0;
  for (let index = 0; index < cleaned.length; index += 1) {
    if (cleaned[index] === "{") depth += 1;
    else if (cleaned[index] === "}" && --depth === 0) {
      const members = source.slice(0, index + 1);
      const statements = source.slice(index + 1);
      if (statements.trim() && parses(`class Practice { ${members} void check() { ${statements} } }`)) return true;
    }
  }
  return false;
}

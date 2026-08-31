import type { MathField } from "./types.ts";
type Logic = {
    op: "variable";
    name: string;
} | {
    op: "constant";
    value: boolean;
} | {
    op: "not";
    child: Logic;
} | {
    op: "and" | "or" | "xor" | "implies" | "iff";
    left: Logic;
    right: Logic;
};
function parseLogic(source: string): Logic {
    if (source.length > 600)
        throw Error("This logic notation is not supported beyond 600 characters.");
    const s = source.toLowerCase().replace(/↔|⟷|<=>/g, "<->").replace(/→|⇒|=>/g, "->").replace(/¬|~/g, "!").replace(/∧|&&/g, "&").replace(/∨|\|\|/g, "|").replace(/⊕|\^/g, " xor ").replace(/\bnot\b/g, "!").replace(/\band\b/g, "&").replace(/\bor\b/g, "|").replace(/\bimplies\b/g, "->").replace(/\biff\b/g, "<->");
    const tokens = s.match(/<->|->|xor|true|false|[a-z]|[01!&|()]/g) ?? [];
    if (tokens.join("") !== s.replace(/\s+/g, "") || !tokens.length || tokens.length > 200)
        throw Error("This logic notation is not supported. Use letters, not, and, or, xor, ->, <-> and parentheses.");
    let i = 0, depth = 0;
    const atom = (): Logic => {
        if (++depth > 60)
            throw Error("This logic notation is not supported at this nesting depth.");
        const t = tokens[i++];
        let node: Logic;
        if (t === "!")
            node = { op: "not", child: atom() };
        else if (t === "(") {
            node = iff();
            if (tokens[i++] !== ")")
                throw Error("Close each logic parenthesis.");
        }
        else if (t === "true" || t === "1" || t === "false" || t === "0")
            node = { op: "constant", value: t === "true" || t === "1" };
        else if (/^[a-z]$/.test(t ?? ""))
            node = { op: "variable", name: t };
        else
            throw Error("This logic notation is not supported. Check operands and operators.");
        depth--;
        return node;
    };
    const chain = (next: () => Logic, token: string, op: "and" | "or" | "xor"): Logic => { let left = next(); while (tokens[i] === token) {
        i++;
        left = { op, left, right: next() };
    } return left; };
    const and = (): Logic => chain(atom, "&", "and"), xor = (): Logic => chain(and, "xor", "xor"), or = (): Logic => chain(xor, "|", "or");
    const implication = (): Logic => { const left = or(); if (tokens[i] !== "->")
        return left; i++; return { op: "implies", left, right: implication() }; };
    const iff = (): Logic => { let left = implication(); while (tokens[i] === "<->") {
        i++;
        left = { op: "iff", left, right: implication() };
    } return left; };
    const result = iff();
    if (i !== tokens.length)
        throw Error("This logic notation is not supported. Add an operator between statements.");
    return result;
}
function variables(node: Logic): string[] { return node.op === "variable" ? [node.name] : node.op === "constant" ? [] : node.op === "not" ? variables(node.child) : [...variables(node.left), ...variables(node.right)]; }
function evaluate(node: Logic, values: Record<string, boolean>): boolean {
    if (node.op === "variable")
        return values[node.name];
    if (node.op === "constant")
        return node.value;
    if (node.op === "not")
        return !evaluate(node.child, values);
    const a = evaluate(node.left, values), b = evaluate(node.right, values);
    switch (node.op) {
        case "and": return a && b;
        case "or": return a || b;
        case "xor": return a !== b;
        case "implies": return !a || b;
        case "iff": return a === b;
    }
}
export function compareLogic(expected: string, actual: string) {
    const a = parseLogic(expected), b = parseLogic(actual), names = [...new Set([...variables(a), ...variables(b)])].sort();
    if (names.length > 8)
        throw Error("This logic notation is not supported beyond eight distinct variables.");
    for (let mask = 0; mask < 2 ** names.length; mask++) {
        const values = Object.fromEntries(names.map((name, i) => [name, Boolean(mask & (1 << i))]));
        if (evaluate(a, values) !== evaluate(b, values))
            return { passed: false, feedback: `The statements differ when ${names.map(name => `${name}=${values[name] ? "true" : "false"}`).join(", ") || "evaluating their constants"}. Check the logical relationship.` };
    }
    return { passed: true, feedback: "Accepted: equivalent on every truth-table row, not just one example." };
}
function splitTop(source: string): string[] {
    let depth = 0, start = 0;
    const parts: string[] = [];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === "(")
            depth++;
        if (source[i] === ")")
            depth--;
        if (depth < 0)
            throw Error("Check the parentheses in your list.");
        if ((source[i] === "," || source[i] === ";") && depth === 0) {
            parts.push(source.slice(start, i).trim());
            start = i + 1;
        }
    }
    if (depth !== 0)
        throw Error("Close each list parenthesis.");
    parts.push(source.slice(start).trim());
    return parts;
}
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
export function gradeDiscreteField(field: MathField, answer: string, number: (s: string) => number): {
    passed: boolean;
    feedback: string;
} {
    if (answer.length > 600)
        throw Error("This notation is not supported beyond 600 characters.");
    if (field.kind === "logic")
        return compareLogic(field.answer, answer);
    if (field.kind === "bits") {
        const clean = (s: string) => s.replace(/[\s_]/g, "");
        if (!/^[01]+$/.test(clean(answer)))
            throw Error("Use only 0 and 1 for this bit string; spaces may separate groups.");
        const passed = clean(answer) === clean(field.answer);
        return { passed, feedback: passed ? "Accepted: the bits and required width match." : "Check each bit and the required width, including leading zeros." };
    }
    if (field.kind === "sequence") {
        const list = (s: string) => splitTop(s.trim().replace(/^\[([\s\S]*)\]$/, "$1")).map(number);
        const a = list(answer), b = list(field.answer), passed = a.length === b.length && a.every((v, i) => close(v, b[i]));
        return { passed, feedback: passed ? "Accepted: every entry is correct in the requested order." : "Check the number of entries and their order; this is a sequence, not a set." };
    }
    const pairs = (source: string) => {
        const s = source.trim().replace(/^\{([\s\S]*)\}$/, "$1").trim();
        if (!s || /^(none|empty|∅)$/i.test(s))
            return [];
        const list = splitTop(s).map(part => { if (!part.startsWith("(") || !part.endsWith(")"))
            throw Error("This pair notation is not supported. Use {(1,2), (2,3)} or none."); const entries = splitTop(part.slice(1, -1)); if (entries.length !== 2)
            throw Error("Each ordered pair needs exactly two entries."); return entries.map(number); });
        return list.filter((pair, i) => !list.slice(0, i).some(p => close(p[0], pair[0]) && close(p[1], pair[1])));
    };
    const a = pairs(answer), b = pairs(field.answer), passed = a.length === b.length && a.every(pair => b.some(p => close(pair[0], p[0]) && close(pair[1], p[1])));
    return { passed, feedback: passed ? "Accepted: the set of ordered pairs matches; listing order does not matter." : "Check for missing, extra, or reversed ordered pairs. Order within each pair matters." };
}

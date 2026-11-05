import { chapter, mc, section } from "./anth1200Authoring.ts";
import type { MathQuestion, MathSection } from "../math/types.ts";

// Authored contrasts, not generated distractors. Every item has one checked answer.
export type Item = [prompt: string, answer: string, distractors: string[], explanation: string, hint?: string];
export function items(prefix: string, rows: Item[]): MathQuestion[] {
  return rows.map(([prompt, answer, distractors, explanation, hint], i) =>
    mc(`pm-${prefix}-${i + 1}`, prompt, answer, distractors, hint ?? "Compare the evidence in the question with the lesson's distinctions.", explanation));
}
export function lesson(id: string, title: string, requires: string[], teaches: string[], paragraphs: string[], rules: string[], examples: MathSection["examples"], misconception: string, rows: Item[]): MathSection {
  return section({ id: `anth-pm-${id}`, title, requires, teaches, paragraphs, rules, examples, misconception, questions: items(id, rows) });
}
export { chapter };

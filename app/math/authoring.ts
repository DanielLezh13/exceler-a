import type { MathAnswerKind, MathChapter, MathField, MathQuestion, MathSection, MathUnit } from "./types.ts";

export const field = (label: string, answer: string, kind: MathAnswerKind = "number", tolerance?: number): MathField => ({ label, answer, kind, tolerance });
export const choice = (label: string, answer: string, options: string[]): MathField => ({ label, answer, kind: "choice", options });
export const q = (id: string, prompt: string, fields: MathField[], hint: string, solution: string[], requires: string[] = []): MathQuestion => ({ id, prompt, fields, hint, solution, requires });
export const n = (id: string, prompt: string, answer: string, hint: string, solution: string[], requires: string[] = []): MathQuestion => q(id, prompt, [field("Answer", answer)], hint, solution, requires);
export const e = (id: string, prompt: string, answer: string, hint: string, solution: string[], requires: string[] = []): MathQuestion => {
  const form = /^factor\b/i.test(prompt) ? "factored" : /^expand\b/i.test(prompt) ? "expanded" : undefined;
  return q(id, prompt, [{ ...field("Expression in x", answer, "expression"), form }], hint, solution, requires);
};
export const roots = (id: string, prompt: string, answer: string, hint: string, solution: string[], requires: string[] = []): MathQuestion => q(id, prompt, [field("All solutions (separate with commas; use none if empty)", answer, "set")], hint, solution, requires);
export const interval = (id: string, prompt: string, answer: string, hint: string, solution: string[], requires: string[] = []): MathQuestion => q(id, prompt, [field("Interval notation", answer, "interval")], hint, solution, requires);
export const section = (spec: MathSection): MathSection => ({ ...spec, questions: spec.questions.map(question => ({ ...question, requires: [...new Set([...spec.requires, ...spec.teaches, ...question.requires])] })) });
export const chapter = (id: string, title: string, description: string, sections: MathSection[], review: MathQuestion[]): MathChapter => ({ id, title, description, sections, review: review.map(question => ({ ...question, requires: [...new Set([...sections.flatMap(s => [...s.requires, ...s.teaches]), ...question.requires])] })) });
export const unit = (id: string, title: string, chapters: MathChapter[], questions: MathQuestion[]): MathUnit => ({ id, title, chapters, assessment: { id: `${id}-mastery`, title: `${title} · Mastery Test`, questions: questions.map(question => ({ ...question, requires: [...new Set([...chapters.flatMap(c => c.sections.flatMap(s => [...s.requires, ...s.teaches])), ...question.requires])] })) } });

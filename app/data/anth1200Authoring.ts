import { chapter, q, section, unit } from "../math/authoring.ts";
import type { MathField, MathQuestion } from "../math/types.ts";

export { chapter, section, unit };
export const term = (label: string, answer: string, acceptedAnswers: string[] = [], caseSensitive = false): MathField => ({ label, answer, kind: "text", acceptedAnswers, caseSensitive });
export const count = (label: string, answer: number): MathField => ({ label, answer: String(answer), kind: "number" });
export function pick(label: string, answer: string, distractors: string[]): MathField {
  const options = [answer, ...distractors];
  return { label, answer, kind: "choice", options };
}
export function ask(id: string, prompt: string, fields: MathField[], hint: string, explanation: string, requires: string[] = []): MathQuestion {
  // Stable option placement without making the correct answer consistently A.
  const offset = [...id].reduce((total, c) => total + c.charCodeAt(0), 0);
  return q(`anth-${id}`, prompt, fields.map(f => {
    if (!f.options) return f;
    const at = offset % f.options.length;
    return { ...f, options: [...f.options.slice(at), ...f.options.slice(0, at)] };
  }), hint, [explanation], requires);
}
export const mc = (id: string, prompt: string, answer: string, distractors: string[], hint: string, explanation: string, requires: string[] = []) => ask(id, prompt, [pick("Your answer", answer, distractors)], hint, explanation, requires);
export const recall = (id: string, prompt: string, answer: string, hint: string, explanation: string, aliases: string[] = [], requires: string[] = []) => ask(id, prompt, [term("Your answer", answer, aliases)], hint, explanation, requires);
export const number = (id: string, prompt: string, answer: number, hint: string, explanation: string, requires: string[] = []) => ask(id, prompt, [count("Your answer", answer)], hint, explanation, requires);

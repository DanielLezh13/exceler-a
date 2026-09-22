import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import * as course from "../../app/data/cisc1115Course.ts";
import * as professorTrack from "../../app/data/cisc1115ProfessorTrack.ts";
import * as validation from "../../app/practiceValidation.ts";
import * as retrieval from "../../app/data/sectionRetrievalPractice.ts";

// Inspect the actual curriculum and placement functions used by the reader,
// including the first two chapters and fallback placement of review exercises.
export async function loadCourseModel() {
  const source = await readFile(new URL("../../app/CommandCenter.tsx", import.meta.url), "utf8");
  const slice = (start, end) => {
    const from = source.indexOf(start), to = source.indexOf(end, from);
    assert.ok(from >= 0 && to > from, `Missing source boundary: ${start}`);
    return source.slice(from, to);
  };
  const script = [
    slice("const learningChapters:", "const authoredChapters"),
    slice("const normalizeLines", "type AuditSnapshot"),
    slice("const foundationalPracticePlans", "function chapterProgress"),
    slice("function questionUsesJavaEditor", "const learningChapters:"),
  ].join("\n");
  const compiled = ts.transpileModule(script, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = { ...course, ...professorTrack, ...validation, ...retrieval };
  return new Function(...Object.keys(dependencies), `${compiled}\nreturn { learningChapters, practiceQuestions, chapterPracticePlan, requiredChapterPracticeQuestions, questionUsesJavaEditor };`)(...Object.values(dependencies));
}

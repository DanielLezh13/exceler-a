import { math1006 } from "../data/math1006.ts";
import { math1011 } from "../data/math1011.ts";
import { math1201 } from "../data/math1201.ts";
import { cisc2210 } from "../data/cisc2210.ts";
import type { MathCourse, MathQuestion } from "./types.ts";

// Shared written-answer engine: subject placement is determined by course.code.
export const mathCourses: MathCourse[] = [math1006, math1011, math1201, cisc2210];
export const courseChapters = (course: MathCourse) => course.units.flatMap(unit => unit.chapters);
export const chapterQuestions = (chapter: ReturnType<typeof courseChapters>[number]) => [...chapter.sections.flatMap(section => section.questions), ...chapter.review];
export const courseQuestions = (course: MathCourse): MathQuestion[] => course.units.flatMap(unit => [...unit.chapters.flatMap(chapterQuestions), ...unit.assessment.questions]);

export function auditMathCourses() {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const course of mathCourses) {
    const available = new Set(course.prerequisites);
    const checkQuestion = (q: MathQuestion) => {
      if (ids.has(q.id)) errors.push(`Duplicate question ${q.id}`);
      ids.add(q.id);
      q.requires.forEach(r => { if (!available.has(r)) errors.push(`${q.id} requires untaught ${r}`); });
      if (!q.prompt || !q.fields.length || !q.hint || !q.solution.length) errors.push(`Incomplete question ${q.id}`);
    };
    course.units.forEach(unit => {
      unit.chapters.forEach(chapter => {
        chapter.sections.forEach(section => {
          section.requires.forEach(r => { if (!available.has(r)) errors.push(`${section.id} requires untaught ${r}`); });
          if (!section.paragraphs.length || !section.examples.length || !section.rules.length || !section.misconception || section.questions.length < 3) errors.push(`Incomplete section ${section.id}`);
          section.teaches.forEach(r => available.add(r));
          section.questions.forEach(checkQuestion);
        });
        if (chapter.review.length < 3) errors.push(`Missing mixed review ${chapter.id}`);
        chapter.review.forEach(checkQuestion);
      });
      if (unit.assessment.questions.length < 5) errors.push(`Insufficient mastery assessment ${unit.id}`);
      unit.assessment.questions.forEach(checkQuestion);
    });
  }
  const algebraKnowledge = new Set(math1006.units.flatMap(u => u.chapters.flatMap(c => c.sections.flatMap(s => s.teaches))));
  math1011.prerequisites.forEach(r => { if (!algebraKnowledge.has(r)) errors.push(`Algebra does not supply prerequisite ${r}`); });
  const precalculusKnowledge = new Set([...algebraKnowledge, ...math1011.units.flatMap(u => u.chapters.flatMap(c => c.sections.flatMap(s => s.teaches)))]);
  math1201.prerequisites.forEach(r => { if (!precalculusKnowledge.has(r)) errors.push(`Earlier math does not supply Calculus I prerequisite ${r}`); });
  return errors;
}

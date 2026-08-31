import { auditMathCourses, courseChapters, courseQuestions, mathCourses } from "../app/math/courses.ts";
import { gradeMath } from "../app/math/grading.ts";
const errors=auditMathCourses();
for(const course of mathCourses) {
  const questions=courseQuestions(course);
  for(const question of questions) if(!gradeMath(question,{values:question.fields.map(f=>f.answer),working:""}).passed) errors.push(`Reference rejected: ${question.id}`);
  console.log(`${course.code}: ${courseChapters(course).length} chapters, ${courseChapters(course).reduce((n,c)=>n+c.sections.length,0)} lessons, ${questions.length} problems, ${course.units.length} mastery tests`);
}
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("Math prerequisites, unique question IDs, lesson/review/test coverage, and reference-answer checks passed.");

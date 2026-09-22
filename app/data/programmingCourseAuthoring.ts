import { choice, field, q } from "../math/authoring.ts";
import type { MathQuestion, MathSection } from "../math/types.ts";

export type CodeLanguage = "java" | "javascript" | "html" | "css" | "sql" | "text";

export const code = (id:string,prompt:string,answer:string,language:CodeLanguage,hint:string,solution:string[],requires:string[]=[]):MathQuestion =>
  q(id,prompt,[{...field("Code",answer,"code"),language}],hint,solution,requires);

export const pick = (id:string,prompt:string,answer:string,options:string[],hint:string,solution:string[],requires:string[]=[]):MathQuestion =>
  q(id,prompt,[choice("Your answer",answer,options)],hint,solution,requires);

export const output = (id:string,prompt:string,answer:string,options:string[],hint:string,solution:string[],requires:string[]=[]):MathQuestion =>
  q(id,prompt,[choice("Exact output",answer,options)],hint,solution,requires);

export const lesson = (spec:MathSection):MathSection => ({...spec,questions:spec.questions.map(question=>({...question,requires:[...new Set([...spec.requires,...spec.teaches,...question.requires])]}))});

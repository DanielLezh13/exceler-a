export type MathAnswerKind = "number" | "expression" | "function" | "set" | "interval" | "choice" | "logic" | "pairs" | "sequence" | "bits" | "code" | "text";
export type MathField = {
  label: string;
  answer: string;
  kind: MathAnswerKind;
  options?: string[];
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  tolerance?: number;
  form?: "factored" | "expanded";
  language?: "java" | "javascript" | "html" | "css" | "sql" | "text";
  machine?: import("./teachingMachine.ts").MachineSpec;
};
export type MathQuestion = {
  id: string;
  prompt: string;
  fields: MathField[];
  hint: string;
  solution: string[];
  requires: string[];
};
export type MathPlot = {
  label: string;
  xRange: [number, number];
  yRange: [number, number];
  curves?: { expression: string; label: string }[];
  points?: { x: number; y: number; label?: string }[];
};
export type MathSection = {
  id: string;
  title: string;
  teaches: string[];
  requires: string[];
  paragraphs: string[];
  rules: string[];
  examples: { problem: string; steps: string[] }[];
  misconception: string;
  questions: MathQuestion[];
  plot?: MathPlot;
};
export type MathChapter = {
  id: string;
  title: string;
  description: string;
  sections: MathSection[];
  review: MathQuestion[];
};
export type MathUnit = {
  id: string;
  title: string;
  chapters: MathChapter[];
  assessment: { id: string; title: string; questions: MathQuestion[] };
};
export type MathCourse = {
  id: string;
  code: string;
  title: string;
  description: string;
  prerequisites: string[];
  sources: { title: string; url?: string }[];
  units: MathUnit[];
};
export type MathResponse = { values: string[]; working: string };
export type MathGrade = { passed: boolean; fields: { passed: boolean; feedback: string }[] };
export type MathAttempt = {
  id: string;
  submittedAt: string;
  kind: "full" | "retry";
  sourceId?: string;
  results: { question: MathQuestion; response: MathResponse; grade: MathGrade }[];
  score: number;
};
export type MathProgress = {
  responses: Record<string, MathResponse>;
  checked: Record<string, MathGrade>;
  passed: string[];
  history: Record<string, MathAttempt[]>;
  drafts: Record<string, { sourceId?: string; questionIds: string[] }>;
  position?: string;
  questions?: Record<string, string>;
};
export type MathRecords = Record<string, MathProgress>;
export type MathTutorContext = {
  courseCode: string;
  courseTitle: string;
  courseProgress: number;
  chapterTitle: string;
  sectionTitle: string;
  lessonReference: unknown;
  activePractice: unknown;
  masteryAssessment: unknown;
};

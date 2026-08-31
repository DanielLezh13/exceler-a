import { gradeBoothPurchase, type PurchaseGrade } from "./purchaseValidation.ts";

export type MasteryQuestionDefinition = {
  id: string;
  title: string;
  prompt: string;
  starterCode?: string;
  referenceSolution: string;
  validate: (answer: string) => boolean;
};

export type MasteryQuestionResult = {
  questionId: string;
  questionNumber: number;
  title: string;
  prompt: string;
  starterCode: string | null;
  submittedAnswer: string;
  correct: boolean;
  earnedPoints: number;
  possiblePoints: number;
  gradingMethod: "behavioral-validator" | "pattern-validator" | "input-output-checks";
  failureCategory: "not_applicable" | "not_determined" | PurchaseGrade["category"];
  feedback: string;
  referenceSolution: string;
};

export type MasteryAttempt = {
  id: string;
  testId: string;
  attemptNumber: number;
  submittedAt: string | null;
  recoveredFromLegacy: boolean;
  score: number;
  total: number;
  questionResults: MasteryQuestionResult[];
  kind?: "full-test" | "question-retry" | "regrade";
  sourceAttemptId?: string;
  reassessedQuestionIds?: string[];
};

const acceptedFeedback = "Accepted by the current code-pattern checker. This check does not compile or execute arbitrary Java.";
const rejectedFeedback = "Not verified by the current code-pattern checker. It could not identify a specific error, so this is not proof that your approach is wrong. Check the required input order, calculation, and output against the prompt, or ask the tutor to review this saved answer.";

export function currentMasteryGrade(question: MasteryQuestionDefinition, answer: string) {
  if (question.id === "unit1-build-purchase") {
    const grade = gradeBoothPurchase(answer);
    return { correct: grade.correct, failureCategory: grade.category, feedback: grade.feedback, gradingMethod: "input-output-checks" as const };
  }
  const correct = question.validate(answer);
  return {
    correct,
    failureCategory: correct ? "not_applicable" as const : answer.trim() ? "not_determined" as const : "missing_answer" as const,
    feedback: correct ? acceptedFeedback : answer.trim() ? rejectedFeedback : "No answer was submitted for this question.",
    gradingMethod: "pattern-validator" as const,
  };
}

export function masteryResultLabel(result: Pick<MasteryQuestionResult, "correct" | "failureCategory">) {
  return result.correct ? "Correct" : ["not_determined", "unsupported_code"].includes(result.failureCategory) ? "Needs review" : "Incorrect";
}

function snapshotQuestion(question: MasteryQuestionDefinition, questionNumber: number, submittedAnswer: string, correct: boolean): MasteryQuestionResult {
  return {
    questionId: question.id,
    questionNumber,
    title: question.title,
    prompt: question.prompt,
    starterCode: question.starterCode ?? null,
    submittedAnswer,
    correct,
    earnedPoints: correct ? 1 : 0,
    possiblePoints: 1,
    gradingMethod: "behavioral-validator",
    failureCategory: correct ? "not_applicable" : "not_determined",
    feedback: correct ? acceptedFeedback : rejectedFeedback,
    referenceSolution: question.referenceSolution,
  };
}

export function createMasteryAttempt({
  testId,
  attemptNumber,
  questions,
  answers,
  submittedQuestionIds,
  submittedAt = new Date().toISOString(),
}: {
  testId: string;
  attemptNumber: number;
  questions: MasteryQuestionDefinition[];
  answers: Record<string, string>;
  submittedQuestionIds?: string[];
  submittedAt?: string;
}): MasteryAttempt {
  const submittedIds = new Set(submittedQuestionIds ?? questions.map((question) => question.id));
  const submittedQuestions = questions.filter((question) => submittedIds.has(question.id));
  const questionResults = submittedQuestions.map((question) => {
    const answer = answers[question.id] ?? "";
    const grade = currentMasteryGrade(question, answer);
    return { ...snapshotQuestion(question, questions.findIndex((item) => item.id === question.id) + 1, answer, grade.correct), ...grade };
  });

  return {
    id: `${testId}-attempt-${attemptNumber}-${submittedAt}`,
    testId,
    attemptNumber,
    submittedAt,
    recoveredFromLegacy: false,
    score: questionResults.filter((result) => result.correct).length,
    total: questionResults.length,
    questionResults,
    kind: "full-test",
  };
}

/** A follow-up is a NEW snapshot. Unchecked siblings and all prior attempts stay exact. */
export function createMasteryFollowUp({ source, attemptNumber, questions, questionIds, answers, kind = "question-retry", submittedAt = new Date().toISOString() }: {
  source: MasteryAttempt;
  attemptNumber: number;
  questions: MasteryQuestionDefinition[];
  questionIds: string[];
  answers: Record<string, string>;
  kind?: "question-retry" | "regrade";
  submittedAt?: string;
}): MasteryAttempt {
  const selected = new Set(questionIds);
  const definitions = new Map(questions.map((question) => [question.id, question]));
  if (!selected.size || [...selected].some((id) => !definitions.has(id) || !source.questionResults.some((result) => result.questionId === id))) {
    throw new Error("Choose a question preserved in this test attempt.");
  }
  const questionResults = source.questionResults.map((result) => {
    if (!selected.has(result.questionId)) return { ...result };
    const definition = definitions.get(result.questionId)!;
    // Rechecking always uses the saved answer, never a possibly edited draft.
    const submittedAnswer = kind === "regrade" ? result.submittedAnswer : answers[result.questionId] ?? "";
    const grade = currentMasteryGrade(definition, submittedAnswer);
    return { ...result, ...grade, submittedAnswer, earnedPoints: grade.correct ? 1 : 0 };
  });
  return {
    id: `${source.testId}-attempt-${attemptNumber}-${submittedAt}`,
    testId: source.testId,
    attemptNumber,
    submittedAt,
    recoveredFromLegacy: false,
    score: questionResults.filter((result) => result.correct).length,
    total: questionResults.length,
    questionResults,
    kind,
    sourceAttemptId: source.id,
    reassessedQuestionIds: source.questionResults.filter((result) => selected.has(result.questionId)).map((result) => result.questionId),
  };
}

const objectValue = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const finiteNumber = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function readMasteryAttempts(value: unknown, testId: string, validIds: Set<string>): MasteryAttempt[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): MasteryAttempt[] => {
    const attempt = objectValue(item);
    if (!attempt || attempt.testId !== testId || typeof attempt.id !== "string") return [];
    const rawResults = Array.isArray(attempt.questionResults) ? attempt.questionResults : [];
    const questionResults = rawResults.flatMap((rawResult) => {
      const result = objectValue(rawResult);
      if (!result || typeof result.questionId !== "string" || !validIds.has(result.questionId)) return [];
      if (typeof result.title !== "string" || typeof result.prompt !== "string" || typeof result.submittedAnswer !== "string" || typeof result.referenceSolution !== "string" || typeof result.correct !== "boolean") return [];
      return [{
        questionId: result.questionId,
        questionNumber: Math.max(1, Math.floor(finiteNumber(result.questionNumber, 1))),
        title: result.title.slice(0, 500),
        prompt: result.prompt.slice(0, 20_000),
        starterCode: typeof result.starterCode === "string" ? result.starterCode.slice(0, 20_000) : null,
        submittedAnswer: result.submittedAnswer.slice(0, 20_000),
        correct: result.correct,
        earnedPoints: finiteNumber(result.earnedPoints, result.correct ? 1 : 0),
        possiblePoints: finiteNumber(result.possiblePoints, 1),
        gradingMethod: (["behavioral-validator", "pattern-validator", "input-output-checks"].includes(String(result.gradingMethod)) ? result.gradingMethod : "behavioral-validator") as MasteryQuestionResult["gradingMethod"],
        failureCategory: (["not_applicable", "not_determined", "missing_answer", "input_mismatch", "output_mismatch", "invalid_code", "unsupported_code"].includes(String(result.failureCategory)) ? result.failureCategory : result.correct ? "not_applicable" : "not_determined") as MasteryQuestionResult["failureCategory"],
        feedback: typeof result.feedback === "string" ? result.feedback.slice(0, 2_000) : result.correct ? "Accepted by the saved validator result." : "Not accepted by the saved validator result.",
        referenceSolution: result.referenceSolution.slice(0, 20_000),
      }];
    });
    if (!questionResults.length) return [];
    return [{
      id: attempt.id.slice(0, 300),
      testId,
      attemptNumber: Math.max(1, Math.floor(finiteNumber(attempt.attemptNumber, 1))),
      submittedAt: typeof attempt.submittedAt === "string" ? attempt.submittedAt.slice(0, 80) : null,
      recoveredFromLegacy: Boolean(attempt.recoveredFromLegacy),
      score: Math.max(0, Math.floor(finiteNumber(attempt.score, questionResults.filter((result) => result.correct).length))),
      total: Math.max(1, Math.floor(finiteNumber(attempt.total, questionResults.length))),
      questionResults,
      kind: attempt.kind === "question-retry" || attempt.kind === "regrade" ? attempt.kind : "full-test",
      sourceAttemptId: typeof attempt.sourceAttemptId === "string" ? attempt.sourceAttemptId.slice(0, 300) : undefined,
      reassessedQuestionIds: Array.isArray(attempt.reassessedQuestionIds) ? [...new Set(attempt.reassessedQuestionIds.filter((id): id is string => typeof id === "string" && validIds.has(id)))] : undefined,
    }];
  });
}

export function masteryAttemptLabel(attempt: MasteryAttempt) {
  return `${attempt.kind === "question-retry" ? "Question retry" : attempt.kind === "regrade" ? "Recheck" : "Attempt"} ${attempt.attemptNumber}`;
}

export function recoverLegacyMasteryAttempt({
  testId,
  questions,
  answers,
  passedQuestionIds,
  submissionCount,
  lastScore,
}: {
  testId: string;
  questions: MasteryQuestionDefinition[];
  answers: Record<string, string>;
  passedQuestionIds: string[];
  submissionCount: number;
  lastScore: number;
}): MasteryAttempt {
  const passed = new Set(passedQuestionIds);
  const questionResults = questions.map((question, index) => snapshotQuestion(question, index + 1, answers[question.id] ?? "", passed.has(question.id)));
  return {
    id: `${testId}-legacy-attempt-${Math.max(1, submissionCount)}`,
    testId,
    attemptNumber: Math.max(1, submissionCount),
    submittedAt: null,
    recoveredFromLegacy: true,
    score: Math.max(0, Math.min(questions.length, Math.floor(lastScore))),
    total: questions.length,
    questionResults,
  };
}

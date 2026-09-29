import { validateDecisionProgram } from "./decisionPracticeValidation.ts";
import { hasJavaFragmentSyntax, withoutJavaComments } from "./javaSubmissionSyntax.ts";

const compact = (source: string) => withoutJavaComments(source).replace(/\s+/g, "");
const identifier = "[A-Za-z_$][\\w$]*";

export function validateTournamentCheckIn(answer: string): boolean {
  if (!hasJavaFragmentSyntax(answer)) return false;
  const code = compact(answer);
  const declarations = [
    new RegExp(`String(${identifier})="Maya";`),
    new RegExp(`int(${identifier})=120;`),
    new RegExp(`double(${identifier})=92\\.5;`),
    new RegExp(`boolean(${identifier})=true;`),
  ].map((pattern) => code.match(pattern)?.[1]);
  if (declarations.some((name) => !name)) return false;
  if (!declarations.every((name) => code.includes(`+${name}`))) return false;
  return validateDecisionProgram(answer, {}, [{ values: {}, expected: "Player: Maya\nScore: 120\nAccuracy: 92.5\nQualified: true" }]);
}

export function validateInventoryDeclarations(answer: string): boolean {
  if (!hasJavaFragmentSyntax(answer)) return false;
  const code = compact(answer);
  return new RegExp(`String${identifier}="Notebook";`).test(code)
    && new RegExp(`int${identifier}=3;`).test(code)
    && new RegExp(`double${identifier}=4\\.5;`).test(code);
}

export function validateInventoryLabel(answer: string): boolean {
  return validateDecisionProgram(answer, { item: "String", quantity: "int" }, [
    { values: { item: "Pen", quantity: 2 }, expected: "Pen: 2" },
    { values: { item: "Notebook", quantity: 10 }, expected: "Notebook: 10" },
  ]);
}

export function validateVideoDuration(answer: string): boolean {
  return validateDecisionProgram(answer, { totalMinutes: "int" }, [
    { values: { totalMinutes: 0 }, expected: "0 hours and 0 minutes" },
    { values: { totalMinutes: 60 }, expected: "1 hours and 0 minutes" },
    { values: { totalMinutes: 125 }, expected: "2 hours and 5 minutes" },
    { values: { totalMinutes: 1439 }, expected: "23 hours and 59 minutes" },
  ]);
}

export function validateHelloWithSpace(answer: string): boolean {
  return validateDecisionProgram(answer, { name: "String" }, [
    { values: { name: "Daniel" }, expected: "Hello Daniel" },
    { values: { name: "Maya" }, expected: "Hello Maya" },
  ]);
}

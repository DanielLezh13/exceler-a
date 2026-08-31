import { gradeBoothPurchase } from "./purchaseValidation.ts";

export const compactJavaCode = (value: string) => value
  .replace(/\s+/g, "")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"');

const removeWholeExpressionParentheses = (value: string) => {
  let expression = value;

  while (expression.startsWith("(") && expression.endsWith(")")) {
    let depth = 0;
    let wrapsWholeExpression = true;

    for (let index = 0; index < expression.length; index += 1) {
      const character = expression[index];
      if (character === "(") depth += 1;
      if (character === ")") depth -= 1;
      if (depth === 0 && index < expression.length - 1) {
        wrapsWholeExpression = false;
        break;
      }
    }

    if (!wrapsWholeExpression || depth !== 0) break;
    expression = expression.slice(1, -1);
  }

  return expression;
};

// Production questions should judge the Java behavior the learner assembled,
// not require one canonical spelling of an update. Keep the submitted code and
// append equivalent forms that validators can inspect: x += y and x = x + y,
// plus a typed expression for solutions that update an existing result instead
// of declaring a separate intermediate variable.
export const javaValidationCode = (value: string) => {
  const code = compactJavaCode(value);
  const equivalentStatements: string[] = [];
  let equivalentIndex = 0;

  for (const match of code.matchAll(/([A-Za-z_$][\w$]*)([+\-*/%])=([^;]+);/g)) {
    const [, name, operator, rawExpression] = match;
    const expression = removeWholeExpressionParentheses(rawExpression);
    equivalentStatements.push(`${name}=${name}${operator}${expression};`);
    equivalentStatements.push(`int$equivalent${equivalentIndex}=${name}${operator}${expression};`);
    equivalentIndex += 1;
  }

  for (const match of code.matchAll(/([A-Za-z_$][\w$]*)=\1([+\-*/%])([^;]+);/g)) {
    const [, name, operator, expression] = match;
    equivalentStatements.push(`${name}${operator}=${removeWholeExpressionParentheses(expression)};`);
  }

  return `${code}${equivalentStatements.join("")}`;
};

export const validateArcadePrizePurchase = (answer: string) => {
  const code = javaValidationCode(answer);

  return /int[A-Za-z_$][\w$]*=137;/.test(code)
    && /int[A-Za-z_$][\w$]*=12;/.test(code)
    && /int[A-Za-z_$][\w$]*=7;/.test(code)
    && /int[A-Za-z_$][\w$]*=4;/.test(code)
    && /int[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*-[A-Za-z_$][\w$]*\*[A-Za-z_$][\w$]*;/.test(code)
    && /int[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*\/[A-Za-z_$][\w$]*;/.test(code)
    && /int[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*%[A-Za-z_$][\w$]*;/.test(code)
    && /System\.out\.println\("Apples:"\+[A-Za-z_$][\w$]*\);/.test(code)
    && /System\.out\.println\("Ticketsleft:"\+[A-Za-z_$][\w$]*\);/.test(code);
};

const identifier = "[A-Za-z_$][\\w$]*";

export const validateMasteryAlternative = (questionId: string, answer: string) => {
  const code = javaValidationCode(answer);

  if (questionId === "unit1-build-time") {
    const totalMatch = code.match(new RegExp(`int(${identifier})=input\\.nextInt\\(\\);`));
    if (!totalMatch) return false;
    const total = totalMatch[1];
    const minutesMatch = code.match(new RegExp("int(" + identifier + ")=" + total + "/60;"));
    const remainderMatch = code.match(new RegExp("int(" + identifier + ")=" + total + "%60;"));
    const mutatedTotal = new RegExp("(?:" + total + "%=60;|" + total + "=" + total + "%60;)").test(code);
    if (minutesMatch && (remainderMatch || mutatedTotal)) {
      const remaining = mutatedTotal ? total : remainderMatch![1];
      if (new RegExp("System\\.out\\.println\\(" + minutesMatch[1] + "\\+\"minutesand\"\\+" + remaining + "\\+\"seconds\"\\);").test(code)) return true;
    }
    const minutes = `\\(?${total}\\/60\\)?`;
    const seconds = `\\(?${total}%60\\)?`;
    return new RegExp(`System\\.out\\.println\\(${minutes}\\+"minutesand"\\+${seconds}\\+"seconds"\\);`).test(code);
  }

  if (questionId === "unit1-build-purchase") {
    return gradeBoothPurchase(answer).correct;
  }

  if (questionId === "unit1-build-credits") {
    const inputs = [...code.matchAll(new RegExp(`int(${identifier})=input\\.nextInt\\(\\);`, "g"))].map((match) => match[1]);
    if (inputs.length < 2) return false;
    const [missions, reward] = inputs;
    const baseMatch = code.match(new RegExp(`int(${identifier})=50;`));
    const base = baseMatch?.[1] ?? "50";
    const expression = `(?:${base}\\+${missions}\\*${reward}|${missions}\\*${reward}\\+${base}|50\\+${missions}\\*${reward}|${missions}\\*${reward}\\+50)`;
    const resultMatch = code.match(new RegExp(`int(${identifier})=${expression};`));
    if (!resultMatch) return false;
    return new RegExp(`System\\.out\\.println\\("Finalcredits:"\\+${resultMatch[1]}\\);`).test(code);
  }

  if (questionId === "unit1-build-complete-program") {
    if (!code.includes("importjava.util.Scanner;") || !new RegExp(`publicclass${identifier}\\{publicstaticvoidmain\\(String\\[\\]args\\)\\{`).test(code)) return false;
    const scannerMatch = code.match(new RegExp(`Scanner(${identifier})=newScanner\\(System\\.in\\);`));
    if (!scannerMatch) return false;
    const scanner = scannerMatch[1];
    const dimensions = [...code.matchAll(new RegExp(`double(${identifier})=${scanner}\\.nextDouble\\(\\);`, "g"))].map((match) => match[1]);
    if (dimensions.length < 2) return false;
    const [width, height] = dimensions;
    return new RegExp(`System\\.out\\.println\\("Area:"\\+\\(?(?:${width}\\*${height}|${height}\\*${width})\\)?\\);`).test(code);
  }

  return false;
};

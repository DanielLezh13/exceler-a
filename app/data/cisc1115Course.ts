import { javaValidationCode, validateMasteryAlternative } from "../practiceValidation.ts";
import { validateLaterMasteryAlternative } from "../laterMasteryValidation.ts";
import { gradeBoothPurchase } from "../purchaseValidation.ts";
import { comparisonWritingQuestions } from "./comparisonWritingPractice.ts";
import { decisionRangeQuestionsFor } from "./decisionRangePractice.ts";
import { javaDeepQuestionsFor } from "./javaDeepPractice.ts";
import { retrievalQuestionsFor } from "./sectionRetrievalPractice.ts";
import { validateDecisionProgram } from "../decisionPracticeValidation.ts";
import { equivalentComparisonForms, hasJavaFragmentSyntax, withoutJavaComments } from "../javaSubmissionSyntax.ts";

export type CourseLearningSection = {
  id: string;
  title: string;
};

export type CourseLearningChapter = {
  id: string;
  unit: string;
  title: string;
  description: string;
  status: "authored";
  sections: CourseLearningSection[];
};

export type LessonConcept = {
  label: string;
  detail: string;
  code?: string;
};

export type LessonExample = {
  label: string;
  code: string;
  note?: string;
  language?: string;
};

export type StructuredLessonSection = {
  id: string;
  title: string;
  eyebrow: string;
  lead: string;
  concepts?: LessonConcept[];
  examples?: LessonExample[];
  rules?: string[];
  callout?: { title: string; body: string; tone?: "idea" | "warning" };
  output?: string;
  takeaways?: string[];
};

export type CourseChapterSpec = {
  id: string;
  unit: string;
  title: string;
  description: string;
  sections: StructuredLessonSection[];
};

export type CoursePracticeQuestion = {
  id: string;
  level: "Warm-up" | "Apply" | "Challenge";
  kind: string;
  title: string;
  prompt: string;
  code?: string;
  placeholder: string;
  hint: string;
  answer?: string;
  success: string;
  options?: string[];
  auditRequirements?: string[];
  multiline?: boolean;
  productionStage?: 1 | 2 | 3 | 4 | 5;
  validate: (answer: string) => boolean;
};

export type UnitMasteryTest = {
  id: string;
  unit: string;
  title: string;
  description: string;
  afterChapterId: string;
  sectionId: string;
  questions: CoursePracticeQuestion[];
};

export type CourseContinuityChapter = {
  chapterId: string;
  entry: string[];
  introduces: string[];
  exit: string[];
};

const normalizeLines = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");
const compactCode = (value: string) => value.replace(/\s+/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const promoteFinalPrintToPrintln = (value: string) => {
  const marker = "System.out.print(";
  const index = value.lastIndexOf(marker);
  if (index < 0) return value;
  return `${value.slice(0, index)}System.out.println(${value.slice(index + marker.length)}`;
};

const finalShownOutputRepeats = (sample: string) => {
  const outputIndex = sample.lastIndexOf("System.out.println");
  if (outputIndex < 0) return false;

  const stack: boolean[] = [];
  let segmentStart = 0;
  let parentheses = 0;

  for (let index = 0; index < outputIndex; index += 1) {
    const character = sample[index];
    if (character === "(") {
      parentheses += 1;
    } else if (character === ")") {
      parentheses = Math.max(0, parentheses - 1);
    } else if (character === "{") {
      const header = sample.slice(segmentStart, index).trim();
      const repeatedBlock = /(?:^|\s)(?:for|while)\s*\(|(?:^|\s)do\s*$/.test(header);
      const reusableMethod = /(?:void|int|double|boolean|String|char|long)\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*$/.test(header)
        && !/\bmain\s*\(/.test(header);
      stack.push(Boolean(stack.at(-1)) || repeatedBlock || reusableMethod);
      segmentStart = index + 1;
    } else if (character === "}") {
      stack.pop();
      segmentStart = index + 1;
    } else if (character === ";" && parentheses === 0) {
      segmentStart = index + 1;
    }
  }

  return Boolean(stack.at(-1));
};

const validateWithOptionalTerminalNewline = (submitted: string, sample: string | undefined, validate: (answer: string) => boolean) => {
  if (validate(submitted)) return true;
  if (!sample || finalShownOutputRepeats(sample)) return false;
  return validate(promoteFinalPrintToPrintln(submitted));
};

const exact = (id: string, level: CoursePracticeQuestion["level"], kind: string, title: string, prompt: string, code: string, expected: string, hint: string, success: string, multiline = expected.includes("\n")): CoursePracticeQuestion => ({
  id, level, kind, title, prompt, code, placeholder: multiline ? "Type the exact output, one line at a time" : "Type the exact answer", hint, answer: expected, success, multiline, validate: (answer) => normalizeLines(answer) === expected,
});

const codeExact = (id: string, level: CoursePracticeQuestion["level"], kind: string, title: string, prompt: string, shownCode: string, expectedCode: string, hint: string, success: string, multiline = false): CoursePracticeQuestion => ({
  id, level, kind, title, prompt, code: shownCode, placeholder: multiline ? "Write the required Java code" : "Write the corrected code", hint, answer: expectedCode, success, auditRequirements: [expectedCode], multiline, validate: (answer) => compactCode(answer) === compactCode(expectedCode),
});

// Flexible editor challenges accept more than one implementation, but Show
// Answer still needs one concrete, readable solution instead of falling back
// to the hint. Keeping the examples keyed by question also makes omissions
// auditable whenever another challenge is added.
const containsCodeSampleAnswers: Record<string, string> = {
  "input-pattern-q6": `int quantity = input.nextInt();
double price = input.nextDouble();
double subtotal = quantity * price;
double total = subtotal;
total += 5;
System.out.println("Total: " + total);`,
  "input-complete-q1": `Scanner input = new Scanner(System.in);
double width = input.nextDouble();
double height = input.nextDouble();
double area = width * height;
System.out.println("Area: " + area);`,
  "input-complete-q2": `int age = input.nextInt();
boolean enrolled = input.nextBoolean();
input.nextLine();
String name = input.nextLine();
System.out.println(name + " | " + age + " | " + enrolled);`,
  "input-complete-q3": `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.print("Quantity: ");
        int quantity = input.nextInt();
        System.out.print("Price: ");
        double price = input.nextDouble();
        double total = quantity * price;
        total += 2.5;
        System.out.println("Total: " + total);
    }
}`,
  "input-review-q5": `String destination = input.nextLine();
int miles = input.nextInt();
double gallons = input.nextDouble();
double milesPerGallon = miles / gallons;
miles += 1;
System.out.println("Destination: " + destination);
System.out.println("MPG: " + milesPerGallon);`,
  "bool-q8": `boolean allowed = admin || (age >= 18 && hasId);`,
  "if-q7": `if (score < 0 || score > 100) {
    System.out.println("Invalid");
} else if (score >= 90) {
    System.out.println("A");
} else if (score >= 80) {
    System.out.println("B");
} else if (score >= 70) {
    System.out.println("C");
} else {
    System.out.println("Below C");
}`,
  "if-q8": `double price;
if (age < 5) {
    price = 0.0;
} else if (member || age >= 65) {
    price = 8.0;
} else {
    price = 12.0;
}
System.out.println("Price: " + price);`,
  "decision-q7": `int max = a;
if (b > max) {
    max = b;
}
if (c > max) {
    max = c;
}
System.out.println("Max: " + max);`,
  "decision-q8": `int age = input.nextInt();
boolean hasId = input.nextBoolean();
if (age < 0) {
    System.out.println("Invalid age");
} else if (age >= 18 && hasId) {
    System.out.println("Entry approved");
} else if (age >= 18) {
    System.out.println("ID required");
} else {
    System.out.println("Entry denied");
}`,
  "while-q7": `int score = input.nextInt();
while (score < 0 || score > 100) {
    score = input.nextInt();
}
System.out.println("Accepted: " + score);`,
  "while-q8": `int sum = 0;
int count = 0;
int value = input.nextInt();
while (value != -1) {
    sum += value;
    count++;
    value = input.nextInt();
}
if (count > 0) {
    System.out.println((double) sum / count);
} else {
    System.out.println("No data");
}`,
  "for-q7": `for (int factor = 1; factor <= 10; factor++) {
    int product = number * factor;
    System.out.println(number + " x " + factor + " = " + product);
}`,
  "for-q8": `int sum = 0;
int evenCount = 0;
for (int n = 1; n <= limit; n++) {
    sum += n;
    if (n % 2 == 0) {
        evenCount++;
    }
}
System.out.println("Sum: " + sum);
System.out.println("Even count: " + evenCount);`,
  "nested-q7": `for (int row = 1; row <= 5; row++) {
    for (int col = 1; col <= 5; col++) {
        System.out.print(row * col + " ");
    }
    System.out.println();
}`,
  "nested-q8": `int matches = 0;
for (int row = 1; row <= 4; row++) {
    for (int col = 1; col <= 4; col++) {
        if ((row + col) % 2 == 0) {
            matches++;
        }
    }
}
System.out.println(matches);`,
  "methods-q7": `public static void printLine(String item, int quantity, double price) {
    double total = quantity * price;
    System.out.println(item + ": " + total);
}`,
  "methods-q8": `public static void main(String[] args) {
    printHeader();
    printItem("Notebook", 4);
    printItem("Pen", 2);
    printFooter();
}

public static void printHeader() {
    System.out.println("Receipt");
}

public static void printItem(String name, int price) {
    System.out.println(name + ": " + price);
}

public static void printFooter() {
    System.out.println("Thank you");
}`,
  "returns-q7": `public static boolean isPassing(int score) {
    return score >= 70;
}`,
  "returns-q8": `public static double subtotal(int quantity, double price) {
    return quantity * price;
}

public static double withTax(double amount) {
    return amount * 1.08875;
}

public static void main(String[] args) {
    double total = withTax(subtotal(3, 10.0));
    System.out.println(total);
}`,
  "arrays-q7": `double[] prices = {2.5, 4.0, 6.5};
prices[1] = 4.5;
System.out.println(prices.length);
System.out.println(prices[0]);
System.out.println(prices[prices.length - 1]);`,
  "arrays-q8": `public static boolean sameEnds(int[] values) {
    return values[0] == values[values.length - 1];
}`,
  "arrayloop-q7": `int[] squares = new int[6];
for (int i = 0; i < squares.length; i++) {
    squares[i] = i * i;
}
for (int i = 0; i < squares.length; i++) {
    System.out.println(squares[i]);
}`,
  "arrayloop-q8": `int sum = 0;
int max = scores[0];
int passed = 0;
for (int score : scores) {
    sum += score;
    if (score > max) {
        max = score;
    }
    if (score >= 70) {
        passed++;
    }
}
double average = (double) sum / scores.length;
System.out.println("Sum: " + sum);
System.out.println("Average: " + average);
System.out.println("Maximum: " + max);
System.out.println("Passed: " + passed);`,
  "arrayloop-q10-copy": `int[] copy = new int[source.length];
for (int i = 0; i < source.length; i++) {
    copy[i] = source[i];
}`,
  "arrayloop-q11-pair": `int[] sums = new int[first.length];
for (int i = 0; i < first.length; i++) {
    sums[i] = first[i] + second[i];
}`,
  "strings-q7": `String result = "";
for (int i = 0; i < text.length(); i++) {
    char current = text.charAt(i);
    if (current != ' ') {
        result += current;
    }
}
System.out.println(result);`,
  "strings-q8": `text = text.toLowerCase();
boolean palindrome = true;
for (int i = 0; i < text.length() / 2; i++) {
    if (text.charAt(i) != text.charAt(text.length() - 1 - i)) {
        palindrome = false;
    }
}
System.out.println(palindrome);`,
  "list-q7": `ArrayList<Integer> values = new ArrayList<>();
int value = input.nextInt();
while (value != -1) {
    values.add(value);
    value = input.nextInt();
}
System.out.println(values.size());`,
  "list-q8": `for (int i = values.size() - 1; i >= 0; i--) {
    if (values.get(i) < 0) {
        values.remove(i);
    }
}
for (int value : values) {
    System.out.println(value);
}`,
  "search-q7": `public static int findIndex(int[] values, int target) {
    for (int i = 0; i < values.length; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
}`,
  "search-q8": `public static int firstPassing(int[] scores) {
    for (int i = 0; i < scores.length; i++) {
        if (scores[i] >= 70) {
            return i;
        }
    }
    return -1;
}

int result = firstPassing(scores);
if (result == -1) {
    System.out.println("Not found");
} else {
    System.out.println("Found at " + result);
}`,
  "sort-q7": `int minIndex = start;
for (int i = start + 1; i < values.length; i++) {
    if (values[i] < values[minIndex]) {
        minIndex = i;
    }
}
int temp = values[start];
values[start] = values[minIndex];
values[minIndex] = temp;`,
  "sort-q8": `public static void selectionSort(int[] values) {
    for (int start = 0; start < values.length - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < values.length; i++) {
            if (values[i] < values[minIndex]) {
                minIndex = i;
            }
        }
        int temp = values[start];
        values[start] = values[minIndex];
        values[minIndex] = temp;
    }
}

selectionSort(values);
for (int value : values) {
    System.out.println(value);
}`,
  "trace-q7": `public static int largestEven(int[] values) {
    int best = -1;
    for (int value : values) {
        if (value % 2 == 0 && value > best) {
            best = value;
        }
    }
    return best;
}`,
  "trace-q8": `int bestIndex = 0;
for (int i = 1; i < scores.length; i++) {
    if (scores[i] > scores[bestIndex]) {
        bestIndex = i;
    }
}
System.out.println(names[bestIndex] + ": " + scores[bestIndex]);`,
  "io-q7": `int count = 0;
int sum = 0;
int max = 0;
while (input.hasNextInt()) {
    int value = input.nextInt();
    sum += value;
    if (count == 0 || value > max) {
        max = value;
    }
    count++;
}
if (count == 0) {
    System.out.println("No values");
} else {
    System.out.println("Count: " + count);
    System.out.println("Average: " + (double) sum / count);
    System.out.println("Maximum: " + max);
}`,
  "io-q8": `int passed = 0;
while (input.hasNext()) {
    String name = input.next();
    int score = input.nextInt();
    if (score >= 70) {
        System.out.println(name + " Pass");
        passed++;
    } else {
        System.out.println(name + " Retry");
    }
}
System.out.println("Passed: " + passed);`,
  "debug-q7": `int[] tests = {50, 1, 100, 0};
for (int value : tests) {
    System.out.println(value);
}`,
  "debug-q8": `public static double average(int[] values) {
    if (values.length == 0) {
        return 0.0;
    }
    int sum = 0;
    for (int value : values) {
        sum += value;
    }
    return (double) sum / values.length;
}`,
  "foundations-q6": `int max = values[0];
for (int i = 1; i < values.length; i++) {
    if (values[i] > max) {
        max = values[i];
    }
}
System.out.println(max);`,
  "context-q6": `int flagged = 0;
for (int score : scores) {
    if (score < 70) {
        flagged++;
    }
}
boolean needsReview = flagged > scores.length / 2;
System.out.println("Flagged: " + flagged);
System.out.println(needsReview);`,
  "challenge-q1": `public static String classify(int score) {
    if (score < 0 || score > 100) {
        return "Invalid";
    }
    if (score >= 70) {
        return "Pass";
    }
    return "Retry";
}

System.out.println(classify(70));`,
  "challenge-q2": `public static double average(int[] values) {
    if (values.length == 0) {
        return 0.0;
    }
    int sum = 0;
    for (int value : values) sum += value;
    return (double) sum / values.length;
}

public static int maximum(int[] values) {
    int max = values[0];
    for (int value : values) if (value > max) max = value;
    return max;
}

int[] values = {4, 8, 2};
System.out.println(average(values));
System.out.println(maximum(values));`,
  "challenge-q3": `public static int findStudent(String[] names, String target) {
    for (int i = 0; i < names.length; i++) {
        if (names[i].equalsIgnoreCase(target)) return i;
    }
    return -1;
}

int index = findStudent(names, target);
if (index >= 0) {
    System.out.println(names[index] + ": " + scores[index]);
} else {
    System.out.println("Not found");
}`,
  "challenge-q4": `int count = 0;
String lowerLetter = letter.toLowerCase();
for (String word : words) {
    if (!word.isEmpty()) {
        String lowerWord = word.toLowerCase();
        if (lowerWord.charAt(0) == lowerLetter.charAt(0)) {
            count++;
        }
    }
}
System.out.println(count);`,
  "challenge-q5": `ArrayList<Integer> values = new ArrayList<>();
int value = input.nextInt();
while (value != -1) {
    values.add(value);
    value = input.nextInt();
}
if (values.isEmpty()) {
    System.out.println("No values");
} else {
    int min = values.get(0);
    int max = values.get(0);
    int sum = 0;
    for (int number : values) {
        sum += number;
        if (number < min) min = number;
        if (number > max) max = number;
    }
    System.out.println("Count: " + values.size());
    System.out.println("Sum: " + sum);
    System.out.println("Average: " + (double) sum / values.size());
    System.out.println("Minimum: " + min);
    System.out.println("Maximum: " + max);
}`,
  "challenge-q6": `int sum = 0;
int bestIndex = 0;
for (int i = 0; i < scores.length; i++) {
    sum += scores[i];
    if (scores[i] >= 70) {
        System.out.println(names[i] + " Pass");
    } else {
        System.out.println(names[i] + " Retry");
    }
    if (scores[i] > scores[bestIndex]) bestIndex = i;
}
System.out.println("Average: " + (double) sum / scores.length);
System.out.println("Highest: " + names[bestIndex]);`,
  "challenge-q7": `public static int[] copyAndSort(int[] values) {
    int[] copy = new int[values.length];
    for (int i = 0; i < values.length; i++) copy[i] = values[i];
    for (int start = 0; start < copy.length - 1; start++) {
        int minIndex = start;
        for (int i = start + 1; i < copy.length; i++) {
            if (copy[i] < copy[minIndex]) minIndex = i;
        }
        int temp = copy[start];
        copy[start] = copy[minIndex];
        copy[minIndex] = temp;
    }
    return copy;
}`,
  "challenge-q8": `public static int countVowels(String text) {
    text = text.toLowerCase();
    int count = 0;
    for (int i = 0; i < text.length(); i++) {
        char c = text.charAt(i);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') count++;
    }
    return count;
}

public static String reversed(String text) {
    String result = "";
    for (int i = text.length() - 1; i >= 0; i--) result += text.charAt(i);
    return result;
}

System.out.println(countVowels(text));
System.out.println(reversed(text));`,
  "challenge-q9": `ArrayList<String> names = new ArrayList<>();
ArrayList<Integer> scores = new ArrayList<>();
while (input.hasNext()) {
    names.add(input.next());
    scores.add(input.nextInt());
}
if (scores.isEmpty()) {
    System.out.printf("Passing: %.2f%%\\n", 0.0);
} else {
    int passed = 0;
    for (int i = 0; i < scores.size(); i++) {
        int score = scores.get(i);
        System.out.println(names.get(i) + ": " + score);
        if (score >= 70) passed++;
    }
    double percentage = 100.0 * passed / scores.size();
    System.out.printf("Passing: %.2f%%\\n", percentage);
}`,
  "challenge-q10": `ArrayList<String> tasks = new ArrayList<>();
int choice = input.nextInt();
while (choice != 0) {
    if (choice == 1) {
        tasks.add(input.next());
    } else if (choice == 2) {
        for (int i = 0; i < tasks.size(); i++) {
            System.out.println((i + 1) + ". " + tasks.get(i));
        }
    } else {
        System.out.println("Invalid");
    }
    choice = input.nextInt();
}`,
  "final-q8": `public static int readScore(Scanner input) {
    int score = input.nextInt();
    while (score < 0 || score > 100) {
        score = input.nextInt();
    }
    return score;
}`,
  "final-q9": `public static int lastIndexOf(String[] values, String target) {
    int result = -1;
    for (int i = 0; i < values.length; i++) {
        if (values[i].equalsIgnoreCase(target)) {
            result = i;
        }
    }
    return result;
}`,
  "final-q10": `public static int countOccurrences(int[] values, int target) {
    int count = 0;
    for (int value : values) {
        if (value == target) count++;
    }
    return count;
}

int count = countOccurrences(values, target);
System.out.println("Target " + target + " occurs " + count + " times");`,
  "final-q11": `public static int minimum(int[] scores) {
    int min = scores[0];
    for (int score : scores) if (score < min) min = score;
    return min;
}

public static int maximum(int[] scores) {
    int max = scores[0];
    for (int score : scores) if (score > max) max = score;
    return max;
}

public static double average(int[] scores) {
    int sum = 0;
    for (int score : scores) sum += score;
    return (double) sum / scores.length;
}

System.out.println("Minimum: " + minimum(scores));
System.out.println("Maximum: " + maximum(scores));
System.out.printf("Average: %.2f%n", average(scores));`,
  "final-q12": `ArrayList<String> names = new ArrayList<>();
ArrayList<Integer> scores = new ArrayList<>();
String name = input.next();
while (!name.equals("END")) {
    names.add(name);
    scores.add(input.nextInt());
    name = input.next();
}
if (scores.isEmpty()) {
    System.out.println("No records");
} else {
    int sum = 0;
    int bestIndex = 0;
    for (int i = 0; i < scores.size(); i++) {
        int score = scores.get(i);
        sum += score;
        if (score >= 70) System.out.println(names.get(i) + " Pass");
        else System.out.println(names.get(i) + " Retry");
        if (score > scores.get(bestIndex)) bestIndex = i;
    }
    System.out.println("Average: " + (double) sum / scores.size());
    System.out.println("Highest: " + names.get(bestIndex));
}`,
};

const containsCode = (id: string, level: CoursePracticeQuestion["level"], title: string, prompt: string, required: Array<string | RegExp>, hint: string, success: string): CoursePracticeQuestion => ({
  id, level, kind: "Editor challenge", title, prompt, placeholder: "Write Java code that satisfies every requirement", hint, answer: containsCodeSampleAnswers[id], success, auditRequirements: required.map((requirement) => typeof requirement === "string" ? requirement : requirement.source.replaceAll("\\", "")), multiline: true, productionStage: 3,
  validate: (answer) => validateWithOptionalTerminalNewline(answer, containsCodeSampleAnswers[id], (candidate) => {
    if (!hasJavaFragmentSyntax(candidate)) return false;
    const forms = equivalentComparisonForms(candidate).map(compactCode);
    return required.every((requirement) => forms.some((code) => typeof requirement === "string" ? code.includes(compactCode(requirement)) : requirement.test(code)));
  }),
});

// Production prompts describe the problem before the implementation. Early
// subsection tasks may still name the newly taught structure; later builds and
// mastery work leave the modeling and decomposition to the learner.
const productionScenarioOverrides: Record<string, { title?: string; prompt: string }> = {
  "input-write-number-task": { title: "Calibrate a Weather Reading", prompt: "A weather station reports temperatures 2.5 degrees too low. Its next decimal reading arrives through the existing Scanner named input. Read that value and display the corrected result as Adjusted: VALUE." },
  "input-write-text-task": { title: "Assemble a Badge Name", prompt: "A badge station receives a one-word first name followed by a one-word last name through the existing Scanner named input. Display the complete name with one space between the two words." },
  "input-independent-build": { title: "Estimate a Delivery Drone's Range", prompt: "A delivery drone operator enters the drone's decimal speed followed by the whole number of hours it will fly through the existing Scanner named input. Read those values and report Distance: VALUE." },

  "bool-write-comparison": { title: "Check for Freezing Weather", prompt: "An outdoor sensor has already stored its whole-number reading in int temperature. Represent whether the reading is freezing—32 or below—and print that result." },
  "bool-write-combined": { title: "Check Assignment Completion", prompt: "A submission counts as complete only when int score is at least 70 and boolean submitted is true. Represent and print whether the current work is complete." },
  "bool-independent-build": { title: "Evaluate Pool Entry", prompt: "A pool admits anyone who is already a member or is at least 18 years old. A program already has int age and boolean member. Represent whether that person may enter and print the result." },

  "if-write-two-path": { title: "Choose a Weather Label", prompt: "A display has int temperature. It should show Cold below 50 and Warm for every other reading. Write the decision that prints the correct label." },
  "if-write-nested": { title: "Check Restricted Access", prompt: "A restricted room admits a person only when boolean member is true and int age is at least 18. Use one decision inside another and print Allowed only for an admitted person." },
  "if-independent-build": { title: "Choose a Shipping Rate", prompt: "An order receives Free shipping at $50 or more, Reduced shipping from $25 through $49.99, and Standard shipping below $25. The order amount is already stored in double total. Print its shipping category." },

  "decision-write-validation": { title: "Validate an Order Quantity", prompt: "An order with a negative quantity is impossible. Given int quantity, print Invalid for impossible data and Valid for every allowed quantity." },
  "decision-write-menu": { title: "Route a Kiosk Command", prompt: "A kiosk stores a customer's selection in int choice. Selection 1 starts the service, selection 2 opens help, and every other selection is unsupported. Print Start, Help, or Invalid." },
  "decision-independent-build": { title: "Classify a Submitted Score", prompt: "A score must be from 0 through 100. A valid score of 70 or more passes; every other valid score requires a retry. Given int score, print Invalid, Pass, or Retry." },

  "while-write-counter": { title: "Call Five Boarding Groups", prompt: "An airport needs to announce boarding groups 1 through 5 in order. Use a while loop to print one group number per line." },
  "while-write-accumulator": { title: "Total Ten Daily Deposits", prompt: "A savings challenge deposits $1 on day 1, $2 on day 2, and so on through day 10. Use a while loop to calculate and print the total deposited." },
  "while-independent-build": { title: "Total a Donation Session", prompt: "A volunteer enters donation amounts one at a time through the existing Scanner named input. Entering 0 closes the session. Print the total donated before the session closed." },

  "for-write-range": { title: "Print Locker Numbers", prompt: "A hallway report must list every locker number from 5 through 15, one per line. Produce the report with a for loop." },
  "for-write-total": { title: "Total a Hundred-Day Challenge", prompt: "A challenge awards 1 point on day 1, 2 on day 2, and so on through day 100. Use a for loop to calculate and print the total points." },
  "for-independent-build": { title: "Total Even Checkpoint Points", prompt: "A race awards points equal to each even-numbered checkpoint from checkpoint 2 through checkpoint 20. Calculate and print the total points available." },

  "nested-write-rectangle": { title: "Print a Light Panel", prompt: "A light panel is represented by 3 rows of 5 stars. Use nested loops to print the complete rectangular panel." },
  "nested-write-pairs": { title: "List Storage Locations", prompt: "A warehouse has rows 1–2 and columns 1–3. Use nested loops to print every location as ROW,COLUMN." },
  "nested-independent-build": { title: "Print a Seat Map", prompt: "A small theater has 3 rows with seats numbered 1 through 4 in every row. Print three lines, each containing 1 2 3 4 with a space after each number." },

  "methods-write-simple": { title: "Reuse a Ready Message", prompt: "A program displays Ready from several places. Define public static void showReady to print that message, then demonstrate one call." },
  "methods-write-parameter": { title: "Reuse a Doubling Display", prompt: "A report repeatedly displays twice a supplied whole number. Define public static void showDouble with one int parameter, then demonstrate it with 6." },
  "methods-independent-build": { title: "Build a Reusable Receipt Line", prompt: "A checkout program prints many receipt lines. Create printReceiptLine so a caller can provide an item name, quantity, and unit price and receive ITEM: TOTAL as output. Demonstrate it with 2 notebooks priced at $3.50 each." },

  "returns-write-square": { title: "Return a Square's Area", prompt: "Several calculations need the area of a square from its whole-number side length. Define public static int square, then use it with side 7 and print the returned area." },
  "returns-write-constant": { title: "Protect an Attempt Limit", prompt: "Inside showLimit, the maximum number of attempts is always 10 and must not be reassigned. Represent that local rule with final int MAX and print it." },
  "returns-independent-build": { title: "Compare Two Recorded Crowds", prompt: "Two attendance counts must be compared in several parts of a program. Create a reusable method named larger that gives its caller the greater of two integers. Use it with 840 and 915, then print the returned result." },

  "arrays-write-create": { title: "Record Three Round Scores", prompt: "A player scored 80, 90, and 100 in three rounds. Create int[] scores with exactly three positions and store each score in its matching round order." },
  "arrays-write-last": { title: "Apply a Final-Round Bonus", prompt: "A nonempty int array named values stores round scores. The final round receives a 5-point bonus. Update that last score and print its new value without assuming the array's length." },
  "arrays-independent-build": { title: "Record Boundary Checkpoints", prompt: "A four-checkpoint route needs an integer array. The first checkpoint is 10 miles from the start and the last is 40 miles from the start. Create the array, record those two known distances in their correct positions, and print them on separate lines." },

  "arrayloop-write-fill": { title: "Generate Even Position Values", prompt: "An existing int[] values should store 0 at position 0, 2 at position 1, 4 at position 2, and continue that pattern through its final position. Fill the entire array." },
  "arrayloop-write-count": { title: "Count High Readings", prompt: "An int[] values contains sensor readings. Count and print how many readings are greater than 10." },
  "arrayloop-independent-build": { title: "Report an Average Score", prompt: "A nonempty int array named values contains every score from one quiz session. Report the session's decimal average." },

  "strings-write-ends": { title: "Display a Code's Boundaries", prompt: "A nonempty shipment code is stored in String text. Print its first character and its final character on separate lines." },
  "strings-write-normalize": { title: "Detect a Java Tag", prompt: "A String text may contain JAVA with any capitalization. Create a normalized version and print whether it contains java." },
  "strings-independent-build": { title: "Count a Letter in a Shipment Code", prompt: "A shipment code is stored in String text. Report how many times the letter a appears, treating uppercase and lowercase as the same letter." },

  "list-write-create": { title: "Build a Two-Item Task List", prompt: "Create an ArrayList<String> named tasks for today's plan. Add Study first and Rest second, then print the first scheduled task." },
  "list-write-update": { title: "Correct and Trim a Reading List", prompt: "ArrayList<Integer> values contains at least one reading. Correct its first reading to 99, then discard the final reading." },
  "arraylist-independent-build": { title: "Clean Invalid Sensor Readings", prompt: "ArrayList<Integer> values contains sensor readings, where every negative number is invalid. Remove all invalid readings—even when two appear next to each other—and print the cleaned list." },

  "search-write-contains": { title: "Check an Inventory ID", prompt: "Create public static boolean contains so inventory code can give it int[] values and a target ID and learn whether that ID appears anywhere." },
  "search-write-count": { title: "Count Repeated Product IDs", prompt: "Create public static int countMatches so inventory code can give it int[] values and a target ID and receive the number of recorded matches." },
  "search-independent-build": { title: "Find the First Product Match", prompt: "A store may record the same product ID more than once. Create findFirst so it receives the array of IDs and a requested ID, then gives the caller the first matching position or -1 when the product never appears." },

  "sort-write-swap": { title: "Swap the First Two Race Times", prompt: "An int[] values stores race times. Exchange the times at positions 0 and 1 without losing either value." },
  "sort-write-verify": { title: "Verify a Ranked Score List", prompt: "Create public static boolean isSorted so a caller can determine whether an int[] values is already in ascending order." },
  "sorting-independent-build": { title: "Move the Fastest Time First", prompt: "A nonempty int array named values stores race times, where a smaller time is better. Locate the fastest time and move it into the first position without losing the value previously there." },

  "algorithm-write-positive-sum": { title: "Total Deposits Only", prompt: "An int array mixes deposits with withdrawals. Create public static int sumPositive so it returns the total of only the positive entries." },
  "algorithm-write-parallel": { title: "Print One Player Record", prompt: "Matching String[] names and int[] scores describe players. Given int index, print the name and score belonging to that same player as NAME: SCORE." },
  "algorithm-independent-build": { title: "Report the Tournament Leader", prompt: "Matching nonempty arrays String[] names and int[] scores describe tournament players. Determine the leader and print NAME: SCORE while preserving the relationship between both arrays." },

  "io-write-record": { title: "Read a Score Record", prompt: "The existing Scanner named input contains a one-word player name followed by a whole-number score. Read the record and display it as NAME: SCORE." },
  "io-write-format": { title: "Print a Price Tag", prompt: "A product is stored in String item and its cost in double price. Print ITEM $PRICE with exactly two digits after the decimal point." },
  "io-independent-build": { title: "Summarize an Unknown Sensor Stream", prompt: "The existing Scanner named input may contain any number of integer sensor readings, including none. Consume every available reading. Report No values for an empty stream; otherwise report its decimal average as Average: VALUE." },

  "debug-write-safe-loop": { title: "Rebuild a Complete Array Report", prompt: "A report must print every element of int[] values exactly once and must work for an empty array. Write a safe traversal from scratch." },
  "debug-write-tests": { title: "Exercise a Passing Boundary", prompt: "A passing rule changes at 70. Create int[] tests containing the most useful values immediately below, at, and above that boundary, then print every test value." },
  "debug-independent-build": { title: "Rebuild a Reliable Average Method", prompt: "A broken reporting system needs a replacement average method. It receives an int array, must produce 0.0 for an empty array, and must otherwise produce the true decimal average. Write the corrected method from an empty editor." },

  "foundations-write-steps": { title: "Implement a Totaling Algorithm", prompt: "A prepared int[] values contains transaction amounts. Implement an algorithm that reports their total and still produces 0 for an empty array." },
  "foundations-write-model": { title: "Represent a Weather Observation", prompt: "A weather observation records the location Lab and a temperature of 21.5. Represent both facts in Java and print LABELED_LOCATION: TEMPERATURE as Lab: 21.5." },
  "foundations-independent-build": { title: "Count Failed Temperature Readings", prompt: "A monitoring system treats every temperature below zero as a failed reading. Create countNegatives so other code can give it an integer array and receive the number of failed readings. Demonstrate it with {-2, 4, -1} and print the result." },

  "context-write-bits": { title: "Count Unset Status Flags", prompt: "An int[] bits represents status flags using only 0 and 1. Count and print how many flags are unset, represented by 0." },
  "context-write-boundary": { title: "Implement a Published Score Range", prompt: "A published data rule accepts scores from 0 through 100 inclusive. Given int score, represent and print whether the value satisfies that rule." },
  "context-independent-build": { title: "Implement a Visible Selection Policy", prompt: "Matching arrays String[] labels and int[] values describe submitted entries. The published selection rule accepts values of at least 50. Print every accepted label, followed by Matches: COUNT, so the result can be checked against the policy." },

  "unit1-build-profile": { title: "Create an Event Check-In", prompt: "The existing Scanner named input receives a one-word name followed by a whole-number age. Read the entry and print NAME is AGE." },
  "unit1-build-time": { title: "Convert a Parking-Meter Duration", prompt: "The existing Scanner named input receives a duration in total seconds. Report it as complete minutes and leftover seconds using MINUTES minutes and SECONDS seconds." },
  "unit1-build-purchase": { title: "Calculate an Event-Booth Total", prompt: "At an event booth, the existing Scanner named input receives a whole-number quantity followed by a decimal unit price. Every purchase also has a $5 service fee. Read the order and print Total: VALUE." },
  "unit1-build-full-line": { title: "Read a Full Registration Name", prompt: "The existing Scanner named input receives a whole-number age, then a full name that may contain spaces. Read both and print NAME is AGE without losing the name." },
  "unit1-build-credits": { title: "Calculate a Player's Final Credits", prompt: "A player begins with 50 credits. The existing Scanner named input receives a completed-mission count followed by the credits awarded per mission. Print Final credits: VALUE." },
  "unit1-build-complete-program": { title: "Build a Room-Area Program", prompt: "Write a complete Java program for a flooring kiosk. It reads a room's decimal width and height from the keyboard and reports Area: VALUE." },

  "unit2-build-admission": { title: "Decide Venue Admission", prompt: "The existing Scanner named input receives a whole-number age followed by whether the customer has a ticket. Admission requires both a ticket and an age of at least 18. Print Enter or Denied." },
  "unit2-build-shipping": { title: "Classify an Order's Shipping", prompt: "A store rejects negative order totals. Valid orders receive Free shipping at $75 or more, Reduced shipping from $40 through $74.99, and Standard shipping below $40. Given double total, print the correct result." },
  "unit2-build-menu": { title: "Operate a Two-Function Calculator", prompt: "A calculator has double first, double second, and int choice. Choice 1 requests their sum, choice 2 requests first minus second, and every other choice is unsupported. Print the requested result or Invalid." },
  "unit2-build-grade": { title: "Build a Grade-Reporting Program", prompt: "Write a complete Java program that reads a score. Scores outside 0–100 are Invalid. Valid scores produce A at 90, B at 80, C at 70, and Retry below 70." },

  "unit3-build-sentinel": { title: "Average a Practice Session", prompt: "A coach enters whole-number results through the existing Scanner named input until entering 0 to close the session. Do not treat 0 as a result. Print No values if the session was empty; otherwise print its decimal average." },
  "unit3-build-range": { title: "Print a Countdown by Fives", prompt: "A display must show 30, 25, 20, 15, 10, and 5 on separate lines, followed by Done. Produce the sequence with repetition." },
  "unit3-build-pattern": { title: "Print a Four-Step Staircase", prompt: "A text display needs a staircase with one star on its first row, two on its second, three on its third, and four on its fourth. Produce the pattern with nested repetition." },
  "unit3-build-statistics": { title: "Summarize a Fixed-Size Reading Set", prompt: "Write a complete Java program that first reads how many decimal readings will follow from the keyboard, then consumes exactly that many readings and prints their total and average." },

  "unit4-build-maximum": { title: "Find the Largest Attendance", prompt: "Several reports need the largest of three whole-number attendance counts. Create public static int maximum so callers can supply the three counts and receive the greatest one without a library method." },
  "unit4-build-receipt": { title: "Create a Receipt Printer", prompt: "A checkout system needs public static void printReceipt to receive an item, quantity, and unit price and print ITEM: TOTAL. Demonstrate it with 2 notebooks priced at $3.50." },
  "unit4-build-composition": { title: "Compose a Quadrupling Calculation", prompt: "Create doubleValue to return twice an integer. Then create quadruple by reusing doubleValue rather than repeating its multiplication logic. Use quadruple with 5 and print the result." },
  "unit4-build-complete": { title: "Build a Score-Validation Program", prompt: "Write a complete Java program with reusable isValidScore behavior for the inclusive range 0–100. Main reads one score and prints Valid or Invalid based on that method's result." },

  "unit5-build-array-summary": { title: "Average Positive Account Changes", prompt: "Create averagePositive for an int array of account changes. It must average only deposits above zero and produce 0.0 when no deposits exist." },
  "unit5-build-string": { title: "Count a Letter in a Message", prompt: "Create countLetterA so callers can supply any String and receive the number of a characters, regardless of capitalization." },
  "unit5-build-list": { title: "Remove Blank Names", prompt: "ArrayList<String> names contains imported names and possibly adjacent empty Strings. Remove every empty entry without skipping any and print the cleaned list." },
  "unit5-build-parallel": { title: "Report the Highest-Scoring Player", prompt: "Matching nonempty String[] names and int[] scores describe players. Determine and print NAME: SCORE for the highest-scoring player." },

  "unit6-build-last-search": { title: "Find the Most Recent Product Match", prompt: "Create findLast so callers can search an int array of product IDs and receive the final matching position, or -1 when the requested ID never appears." },
  "unit6-build-sort": { title: "Arrange Recorded Times", prompt: "Create selectionSort so callers can arrange an int array of recorded times from smallest to largest." },
  "unit6-build-binary": { title: "Search a Sorted Inventory", prompt: "Create binarySearch for a sorted int array of product IDs. It should return a matching position when found and -1 when absent." },
  "unit6-build-ranked-report": { title: "Rank Players Without Breaking Their Records", prompt: "Matching String[] names and int[] scores describe players. Arrange the records from highest score to lowest while keeping every name attached to its score, then print each NAME: SCORE line." },

  "unit7-build-stream": { title: "Summarize an Incoming Number Stream", prompt: "The existing Scanner named input may contain any number of integers, including none. Consume every available value and print Count: N and Sum: N with correct zero results for an empty stream." },
  "unit7-build-formatted": { title: "Print a Formatted Purchase Record", prompt: "The existing Scanner named input contains a one-word item, whole-number quantity, and decimal unit price. Read it and print ITEM x QUANTITY = $TOTAL with exactly two decimal places." },
  "unit7-build-repair": { title: "Replace a Broken Average Method", prompt: "Create a reliable average method for int arrays. It must produce 0.0 for an empty array and the true decimal average otherwise." },
  "unit7-build-tests": { title: "Test a Passing-Score Boundary", prompt: "A provided isPassing(int score) should change from false to true at 70. Write calls that print its results for the three most useful values immediately below, at, and above that boundary." },

  "unit8-build-maximum": { title: "Implement a Direct Maximum Algorithm", prompt: "Create maximum for a nonempty int array. It must return the greatest value without rearranging the data." },
  "unit8-build-representation": { title: "Count Active Binary Flags", prompt: "An int[] bits represents system flags using only 0 and 1. Count and print how many flags are active, represented by 1." },
  "unit8-build-transparent-rule": { title: "Implement a Published Selection Rule", prompt: "Matching String[] names and int[] scores describe applicants. The published rule selects scores of at least 80. Print every selected name, followed by Selected: COUNT." },
  "unit8-build-application": { title: "Build a Freeze-Monitoring Program", prompt: "Write a complete Java program that consumes every available integer temperature from the keyboard and reports Frozen readings: COUNT for values below 32. Empty input must report 0." },
};

const independentBuild = (id: string, title: string, prompt: string, answer: string, required: Array<string | RegExp>, hint: string, success: string, productionStage: 3 | 4 | 5 = 4): CoursePracticeQuestion => {
  const scenario = productionScenarioOverrides[id];
  return {
    id,
    level: "Challenge",
    kind: productionStage === 5 ? "Blank-editor mastery" : productionStage === 4 ? "Independent build" : "Write from requirements",
    title: scenario?.title ?? title,
    prompt: scenario?.prompt ?? prompt,
    placeholder: "Build the solution from an empty editor",
    hint,
    answer,
    success,
    auditRequirements: required.map((requirement) => typeof requirement === "string" ? requirement : requirement.source),
    multiline: true,
    productionStage,
    validate: (answerValue) => validateWithOptionalTerminalNewline(answerValue, answer, (candidate) => {
      if (!hasJavaFragmentSyntax(candidate)) return false;
      const uncommented = withoutJavaComments(candidate);
      if (id === "unit1-build-purchase") return gradeBoothPurchase(uncommented).correct;
      const forms = equivalentComparisonForms(uncommented).map(javaValidationCode);
      return required.every((requirement) => forms.some((code) => typeof requirement === "string" ? code.includes(compactCode(requirement)) : requirement.test(code)))
        || validateMasteryAlternative(id, uncommented)
        || validateLaterMasteryAlternative(id, uncommented);
    }),
  };
};

const multipleChoice = (id: string, title: string, prompt: string, options: string[], answer: string, hint: string, success: string): CoursePracticeQuestion => ({
  id,
  level: "Warm-up",
  kind: "Multiple choice",
  title,
  prompt,
  placeholder: "Choose one answer",
  options,
  answer,
  hint,
  success,
  validate: (value) => value.trim() === answer,
});

const groundedChoice = (id: string, title: string, prompt: string, code: string, options: string[], answer: string, hint: string, success: string): CoursePracticeQuestion => ({
  id,
  level: "Warm-up",
  kind: "Code association",
  title,
  prompt,
  code,
  placeholder: "Choose one answer",
  options,
  answer,
  hint,
  success,
  validate: (value) => value.trim() === answer,
});

const chapterSpecs: CourseChapterSpec[] = [
  {
    id: "input-basic-programs",
    unit: "Unit I · Java Fundamentals",
    title: "Input & Basic Programs",
    description: "Read console input with Scanner and turn a sequence of statements into a complete useful program.",
    sections: [
      { id: "input-execution", title: "How a Basic Program Runs", eyebrow: "Sequential execution", lead: "Java runs ordinary statements in order from top to bottom. A basic program can ask for input, store it, calculate a result, and print output without making any decisions yet.", concepts: [{ label: "Input", detail: "input.nextInt() reads a whole number entered by the user." }, { label: "Store", detail: "int price = ... stores the read value in price; int total = ... stores the calculated result in total." }, { label: "Calculate", detail: "price * quantity uses the currently stored values and produces a new value." }, { label: "Output", detail: "System.out.println(total) displays the value currently stored in total." }], examples: [{ label: "Point to every stage", code: "Scanner input = new Scanner(System.in); // create the reader\nint price = input.nextInt();           // INPUT + STORE\nint quantity = input.nextInt();        // INPUT + STORE\nint total = price * quantity;          // CALCULATE + STORE\nSystem.out.println(total);              // OUTPUT", note: "If the user enters 12 and then 3, Java stores those values, calculates 36, stores 36 in total, and finally displays 36. Scanner setup is explained next; focus here on how values move through the program." }], callout: { title: "One line can perform more than one job", body: "In int total = price * quantity;, price * quantity performs the calculation and total = stores the result. Read the expression on the right first, then the assignment on the left." } },
      { id: "input-scanner-setup", title: "Importing and Creating Scanner", eyebrow: "Connect to the keyboard", lead: "Java's library is reusable code provided for common tasks. Scanner is one library type that reads input. Import it above the class, then create one Scanner inside main that reads from System.in.", concepts: [{ label: "import", detail: "Makes the library type available by its short name.", code: "import java.util.Scanner;" }, { label: "Scanner", detail: "The type of value that can read input." }, { label: "input", detail: "The variable name that stores the Scanner." }, { label: "new Scanner(...)", detail: "Creates a Scanner value. You will learn the general meaning of new and objects in a later course." }, { label: "System.in", detail: "The program's standard keyboard input source." }], examples: [{ label: "Required setup", code: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n    }\n}" }], callout: { title: "Copy the wrapper; understand the input line", body: "The class and main headers remain boilerplate for now. Read Scanner input = new Scanner(System.in); as: create one keyboard reader and store it under the name input. Create it once and reuse it." } },
      { id: "input-reading-numbers", title: "Reading Numbers and Booleans", eyebrow: "Match method to type", lead: "A method is a named action a value can perform. The dot selects that action, and parentheses run it. Scanner has a different reading method for each kind of value; store the returned value in a matching variable type.", concepts: [{ label: "nextInt()", detail: "Reads a whole number.", code: "int age = input.nextInt();" }, { label: "nextDouble()", detail: "Reads a decimal number.", code: "double price = input.nextDouble();" }, { label: "nextBoolean()", detail: "Reads true or false.", code: "boolean hasId = input.nextBoolean();" }], examples: [{ label: "Read and calculate", code: "System.out.print(\"Enter quantity: \" );\nint quantity = input.nextInt();\n\nSystem.out.print(\"Enter price: \" );\ndouble price = input.nextDouble();\n\ndouble total = quantity * price;\nSystem.out.println(\"Total: \" + total);", note: "print displays a prompt without ending the line; println displays output and then moves to the next line." }], rules: ["The user types the value while the program is running.", "A prompt should explain what input is expected.", "The exact writing rules of Java are called syntax.", "Compilation is Java's check-and-translation step before a program runs; invalid syntax prevents compilation.", "Runtime means the period while a compiled program is running.", "nextInt cannot read a decimal such as 3.5.", "nextBoolean accepts the words true or false without quotation marks."] },
      { id: "input-reading-text", title: "Reading Text", eyebrow: "Words and full lines", lead: "next() reads one whitespace-separated word. nextLine() reads the rest of an entire line, including spaces between words.", concepts: [{ label: "next()", detail: "Useful for one word such as a username.", code: "String user = input.next();" }, { label: "nextLine()", detail: "Useful for a full name or sentence.", code: "String name = input.nextLine();" }], examples: [{ label: "Read a full name", code: "System.out.print(\"Full name: \" );\nString name = input.nextLine();\nSystem.out.println(\"Hello \" + name);" }], callout: { title: "The leftover-newline trap", body: "After nextInt or nextDouble, the Enter key remains unread. Call input.nextLine() once to consume that leftover newline before reading a full line.", tone: "warning" } },
      { id: "input-program-pattern", title: "Input → Store → Calculate → Output", eyebrow: "Reusable program pattern", lead: "Most beginner programs follow the same data path. Keeping the stages visible makes code easier to trace and debug.", examples: [{ label: "Convert minutes", code: "Scanner input = new Scanner(System.in);\n\nSystem.out.print(\"Minutes: \" );\nint minutes = input.nextInt();\n\nint hours = minutes / 60;\nint remaining = minutes % 60;\n\nSystem.out.println(hours + \" hours and \" + remaining + \" minutes\");", note: "For 135, integer division produces 2 hours and modulus produces 15 remaining minutes." }], output: "2 hours and 15 minutes" },
      { id: "input-common-mistakes", title: "Common Input Mistakes", eyebrow: "Debug the sequence", lead: "Scanner errors usually come from using the wrong reading method, storing into the wrong type, or forgetting what input remains unread.", rules: ["Import Scanner before using its name.", "Include parentheses when calling a method: nextInt().", "Store nextDouble() in a double when decimals matter.", "Do not place quotation marks around input.nextInt().", "Remember the leftover newline before nextLine()."], examples: [{ label: "Wrong type", code: "int price = input.nextDouble(); // invalid: possible decimal" }, { label: "Correct type", code: "double price = input.nextDouble();" }], callout: { title: "Read the error from the value backward", body: "Ask: what method produced this value, what type did it return, and what variable is trying to store it?", tone: "warning" } },
      { id: "input-complete-program", title: "A Complete Input Program", eyebrow: "Put every piece together", lead: "This program imports Scanner, creates one keyboard reader, reads two values, calculates with them, and prints a labeled result.", examples: [{ label: "Rectangle calculator", code: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n\n        System.out.print(\"Width: \" );\n        double width = input.nextDouble();\n        System.out.print(\"Height: \" );\n        double height = input.nextDouble();\n\n        double area = width * height;\n        System.out.println(\"Area: \" + area);\n    }\n}" }], takeaways: ["Scanner reads values from System.in.", "Use nextInt for whole numbers, nextDouble for decimals, nextBoolean for true or false, next for one word, and nextLine for a full line.", "A basic program can follow input, store, calculate, output.", "One Scanner can read every value in the program.", "Track the leftover newline when mixing number methods with nextLine."] },
    ],
  },
  {
    id: "comparisons-booleans",
    unit: "Unit II · Decision Making",
    title: "Comparisons & Boolean Logic",
    description: "Build and trace true-or-false expressions that programs can use to make decisions.",
    sections: [
      { id: "booleans-questions", title: "Boolean Questions", eyebrow: "True or false", lead: "A boolean expression asks a question that Java can answer with exactly true or false. Conditions are built from values, comparison operators, and logical operators.", examples: [{ label: "Store a comparison result", code: "int age = 20;\nboolean adult = age >= 18;\nSystem.out.println(adult);", note: "20 is at least 18, so adult stores true." }], concepts: [{ label: "expression", detail: "Code that produces a value." }, { label: "boolean expression", detail: "An expression whose value is true or false." }] },
      { id: "booleans-comparisons", title: "Comparison Operators", eyebrow: "Compare two values", lead: "Comparison operators relate a left value to a right value. Read each expression as a complete question.", concepts: [{ label: "==", detail: "Is equal to", code: "score == 10" }, { label: "!=", detail: "Is not equal to", code: "lives != 0" }, { label: ">", detail: "Is greater than", code: "speed > 55" }, { label: "<", detail: "Is less than", code: "temp < 32" }, { label: ">=", detail: "Is at least", code: "age >= 18" }, { label: "<=", detail: "Is at most", code: "items <= 5" }], examples: [{ label: "A comparison produces a value", code: "int score = 10;\nboolean perfect = score == 10;\nSystem.out.println(perfect); // true", note: "score == 10 asks the question and produces true. perfect = stores that result. The single = and double == perform different jobs on the same line." }, { label: "Boundary changes the answer", code: "int age = 18;\nSystem.out.println(age > 18);  // false\nSystem.out.println(age >= 18); // true", note: "The added equals sign includes the boundary value 18." }], callout: { title: "= assigns; == compares", body: "Use = when storing a value. Use == when asking whether two primitive values are equal.", tone: "warning" } },
      { id: "booleans-and", title: "Logical AND", eyebrow: "Both requirements", lead: "The && operator is true only when its left condition and its right condition are both true.", examples: [{ label: "Check a range", code: "int age = 25;\nboolean workingAge = age >= 18 && age <= 65;" }, { label: "Trace both sides", code: "age >= 18  // true\nage <= 65  // true\ntrue && true // true" }], rules: ["AND is useful when every requirement must be satisfied.", "If either side is false, the entire && expression is false."] },
      { id: "booleans-or-not", title: "Logical OR and NOT", eyebrow: "Alternatives and reversal", lead: "The || operator accepts at least one true condition. The ! operator reverses a boolean value.", concepts: [{ label: "||", detail: "True when either or both sides are true.", code: "day == 6 || day == 7" }, { label: "!", detail: "Turns true into false and false into true.", code: "!gameOver" }], examples: [{ label: "Allow either condition", code: "boolean freeEntry = age < 5 || hasPass;" }, { label: "Reverse a stored state", code: "boolean loggedIn = false;\nSystem.out.println(!loggedIn); // true" }] },
      { id: "booleans-combining", title: "Combining Conditions", eyebrow: "Control the grouping", lead: "Longer boolean expressions follow precedence rules, but parentheses make the intended grouping visible and safer to trace.", examples: [{ label: "Member or qualifying adult", code: "boolean allowed = member || (age >= 18 && hasId);" }, { label: "Trace in groups", code: "member             // false\nage >= 18 && hasId // true && true → true\nfalse || true      // true" }], callout: { title: "Evaluate comparisons before logical operators", body: "Resolve each comparison to true or false, then combine those boolean results.", tone: "idea" } },
      { id: "booleans-truth", title: "Tracing Truth", eyebrow: "Do not guess", lead: "Replace each smaller condition with true or false. Work inside parentheses, then evaluate !, followed by &&, followed by ||.", concepts: [{ label: "!", detail: "First: reverse one boolean." }, { label: "&&", detail: "Next: require both." }, { label: "||", detail: "Last: allow either." }], examples: [{ label: "A longer evaluation", code: "int score = 82;\nboolean result = score >= 70 && score < 90 || score == 100;\n\n// true && true || false\n// true || false\n// true" }, { label: "Parentheses before NOT", code: "boolean paused = false;\nboolean blocked = true;\nboolean signedIn = true;\nboolean ready = !(paused || blocked) && signedIn;\n\n// !(false || true) && true\n// !true && true\n// false && true\n// false" }], rules: ["Resolve comparisons such as age >= 18 into true or false before combining them.", "Finish the innermost parentheses before applying an operator outside them.", "Apply ! to the boolean value or grouped result immediately after it.", "After parentheses and !, evaluate && before ||."] },
      { id: "booleans-conditional", title: "The Conditional Operator", eyebrow: "Choose one value", lead: "The conditional operator chooses between two values using a boolean condition. It is also called the ternary operator because it has three parts: condition, value when true, and value when false.", concepts: [{ label: "condition ?", detail: "Ask a boolean question." }, { label: "valueIfTrue :", detail: "Produce this value when the condition is true." }, { label: "valueIfFalse", detail: "Otherwise produce this value." }], examples: [{ label: "Choose a label", code: "int score = 84;\nString result = score >= 70 ? \"Pass\" : \"Retry\";\nSystem.out.println(result); // Pass" }, { label: "Choose a numeric value", code: "int larger = first > second ? first : second;" }], rules: ["The conditional operator produces one value; it does not replace a multi-statement if/else block.", "The true and false choices must have compatible types.", "Use parentheses around a long condition when they make the three parts easier to see."], callout: { title: "Read it as a sentence", body: "If score >= 70 is true, use Pass; otherwise, use Retry." } },
      { id: "booleans-takeaways", title: "Key Takeaways", eyebrow: "Chapter summary", lead: "Boolean expressions are the questions that future if statements and loops will answer.", takeaways: ["Comparisons produce true or false.", "Use == for equality and = for assignment.", "&& requires both conditions; || requires at least one.", "! reverses a boolean.", "Parentheses make combined conditions easier to read.", "The conditional operator chooses one of two values with condition ? trueValue : falseValue.", "Trace long conditions by reducing smaller expressions first."] },
    ],
  },
  {
    id: "if-else",
    unit: "Unit II · Decision Making",
    title: "If / Else",
    description: "Choose one path from several alternatives with conditions, branches, and clear braces.",
    sections: [
      { id: "if-branch", title: "The if Statement", eyebrow: "Run code conditionally", lead: "An if statement runs its block only when the condition inside parentheses is true. When the condition is false, Java skips the block.", concepts: [{ label: "if", detail: "Begins the decision." }, { label: "(condition)", detail: "Must produce true or false." }, { label: "{ block }", detail: "Statements controlled by the decision." }], examples: [{ label: "One possible action", code: "if (temperature < 32) {\n    System.out.println(\"Freezing\");\n}" }] },
      { id: "if-else-pair", title: "if / else", eyebrow: "Exactly one of two paths", lead: "else provides a fallback block. For one if/else pair, exactly one branch runs.", examples: [{ label: "Pass or retry", code: "if (score >= 70) {\n    System.out.println(\"Pass\");\n} else {\n    System.out.println(\"Retry\");\n}" }], callout: { title: "else has no condition", body: "else means every remaining case where the preceding if was false." } },
      { id: "if-else-if", title: "else if Chains", eyebrow: "Several alternatives", lead: "An else-if chain tests conditions from top to bottom. Java runs the first true branch and skips the rest of the chain.", examples: [{ label: "Choose one letter grade", code: "if (score >= 90) {\n    System.out.println(\"A\");\n} else if (score >= 80) {\n    System.out.println(\"B\");\n} else if (score >= 70) {\n    System.out.println(\"C\");\n} else {\n    System.out.println(\"Below C\");\n}" }], rules: ["Order conditions from most restrictive to least restrictive when ranges overlap.", "Only the first true branch in one chain runs."] },
      { id: "if-nested", title: "Nested Conditions", eyebrow: "A decision inside a decision", lead: "Nesting is useful when a second question matters only after the first requirement is satisfied.", examples: [{ label: "Check access in stages", code: "if (age >= 18) {\n    if (hasId) {\n        System.out.println(\"Allowed\");\n    } else {\n        System.out.println(\"ID required\");\n    }\n} else {\n    System.out.println(\"Too young\");\n}" }], callout: { title: "Prefer a combined condition when the result is simple", body: "if (age >= 18 && hasId) may be clearer when you do not need different messages for each failed requirement." } },
      { id: "if-braces", title: "Braces and Branch Boundaries", eyebrow: "Make control visible", lead: "Braces show exactly which statements belong to a branch. Always using braces prevents later edits from silently changing the logic.", examples: [{ label: "Misleading indentation", code: "if (score >= 70)\n    System.out.println(\"Pass\");\n    System.out.println(\"Recorded\"); // always runs" }, { label: "Clear branch", code: "if (score >= 70) {\n    System.out.println(\"Pass\");\n    System.out.println(\"Recorded\");\n}" }], rules: ["Indentation helps humans; braces control Java.", "Do not place a semicolon directly after an if condition.", "Match each else with the intended if."] },
      { id: "if-common-mistakes", title: "Common Logic Mistakes", eyebrow: "Debug the decision", lead: "A program can compile and still choose the wrong branch. Trace concrete boundary values instead of trusting how a condition looks.", examples: [{ label: "Missing boundary", code: "if (age > 18) { // excludes exactly 18" }, { label: "Correct boundary", code: "if (age >= 18) {" }], rules: ["Test the exact boundary, one below it, and one above it.", "Use == when comparing primitive values.", "Check the order of overlapping else-if ranges.", "Use && for a range, not ||."] },
      { id: "if-complete-program", title: "A Complete Decision Program", eyebrow: "Input to one clear result", lead: "This program reads a value, validates the range, and then classifies the valid input.", examples: [{ label: "Temperature category", code: "Scanner input = new Scanner(System.in);\nSystem.out.print(\"Temperature: \" );\nint temp = input.nextInt();\n\nif (temp < -100 || temp > 150) {\n    System.out.println(\"Invalid temperature\");\n} else if (temp < 32) {\n    System.out.println(\"Freezing\");\n} else if (temp < 70) {\n    System.out.println(\"Cool\");\n} else {\n    System.out.println(\"Warm\");\n}" }], takeaways: ["if runs a block only when its condition is true.", "else handles the remaining case.", "An else-if chain runs the first matching branch.", "Braces define branch boundaries.", "Condition order and boundary values determine correctness.", "Trace decisions with concrete inputs."] },
    ],
  },
  {
    id: "decision-programs",
    unit: "Unit II · Decision Making",
    title: "Decision-Making Programs",
    description: "Combine input, operators, boolean logic, and branches in increasingly independent programs.",
    sections: [
      { id: "decision-program-shape", title: "From Requirement to Branches", eyebrow: "Plan before coding", lead: "A decision program begins with cases, not syntax. A finite, ordered set of steps for solving a problem is called an algorithm. Identify the inputs, valid ranges, possible outcomes, and exact conditions before translating that algorithm into if statements.", concepts: [{ label: "Inputs", detail: "What values does the program receive?" }, { label: "Cases", detail: "What different outcomes are possible?" }, { label: "Conditions", detail: "What makes each case true?" }, { label: "Outputs", detail: "What exactly should each case produce?" }], examples: [{ label: "Eligibility plan", code: "Input: age, hasId\nInvalid: age < 0\nEligible: age >= 18 && hasId\nOtherwise: not eligible" }] },
      { id: "decision-validation", title: "Validate Before Classifying", eyebrow: "Reject impossible input", lead: "Validation should happen before ordinary categories. Otherwise an impossible value may accidentally enter a real branch.", examples: [{ label: "Validate a percentage", code: "if (score < 0 || score > 100) {\n    System.out.println(\"Invalid score\");\n} else if (score >= 70) {\n    System.out.println(\"Pass\");\n} else {\n    System.out.println(\"Retry\");\n}" }], rules: ["Place invalid ranges first.", "Use || when a value can be invalid in either direction.", "Do not calculate a category until input is known to be valid."] },
      { id: "decision-min-max", title: "Minimum and Maximum Decisions", eyebrow: "Compare stored values", lead: "A branch can choose which value to keep. Start from one candidate, then replace it only when another value is better.", examples: [{ label: "Find the larger of two values", code: "int max = first;\nif (second > max) {\n    max = second;\n}\nSystem.out.println(\"Max: \" + max);" }, { label: "Handle equality explicitly", code: "if (first == second) {\n    System.out.println(\"Tie\");\n} else if (first > second) {\n    System.out.println(first);\n} else {\n    System.out.println(second);\n}" }] },
      { id: "decision-ranges", title: "Range-Based Categories", eyebrow: "Cover every value once", lead: "A correct range chain has no accidental gaps or overlaps. After earlier cases fail, later conditions can often be simpler.", examples: [{ label: "Shipping category", code: "if (weight <= 0) {\n    System.out.println(\"Invalid\");\n} else if (weight <= 5) {\n    System.out.println(\"Small\");\n} else if (weight <= 20) {\n    System.out.println(\"Medium\");\n} else {\n    System.out.println(\"Large\");\n}" }], callout: { title: "Earlier failures carry information", body: "Inside the weight <= 20 branch, Java already knows weight is greater than 5 because the earlier branch did not run." } },
      { id: "decision-menu", title: "Simple Menu Choices", eyebrow: "Map a choice to behavior", lead: "A menu program reads one choice and performs the matching action. An else branch handles unsupported choices.", examples: [{ label: "Two-operation menu", code: "System.out.println(\"1. Add\");\nSystem.out.println(\"2. Multiply\");\nint choice = input.nextInt();\n\nif (choice == 1) {\n    System.out.println(a + b);\n} else if (choice == 2) {\n    System.out.println(a * b);\n} else {\n    System.out.println(\"Invalid choice\");\n}" }], rules: ["Print the available choices before reading the selection.", "Use exact equality for numbered choices.", "Always define what happens for an unsupported choice."] },
      { id: "decision-testing", title: "Test Every Path", eyebrow: "Evidence for the logic", lead: "One successful input proves only one branch. Choose a small test set that reaches every outcome and every boundary.", concepts: [{ label: "Typical", detail: "A normal value inside a range." }, { label: "Boundary", detail: "Exactly where behavior changes." }, { label: "Invalid", detail: "A value outside the allowed domain." }, { label: "Alternative", detail: "A value that reaches another branch." }], examples: [{ label: "Tests for score classification", code: "-1   → Invalid\n0    → Retry\n69   → Retry\n70   → Pass\n100  → Pass\n101  → Invalid" }] },
      { id: "decision-combined", title: "Combined Eligibility Program", eyebrow: "Use the full decision toolkit", lead: "This program validates input, combines two requirements, and produces one exact result.", examples: [{ label: "Event eligibility", code: "Scanner input = new Scanner(System.in);\nSystem.out.print(\"Age: \" );\nint age = input.nextInt();\nSystem.out.print(\"Has ID (true/false): \" );\nboolean hasId = input.nextBoolean();\n\nif (age < 0) {\n    System.out.println(\"Invalid age\");\n} else if (age >= 18 && hasId) {\n    System.out.println(\"Entry approved\");\n} else if (age >= 18) {\n    System.out.println(\"ID required\");\n} else {\n    System.out.println(\"Entry denied\");\n}" }], takeaways: ["Plan cases before writing branches.", "Validate impossible input first.", "Use else-if chains for mutually exclusive outcomes.", "Test every path and boundary.", "Application programs should combine earlier skills instead of reteaching one keyword."] },
    ],
  },
  {
    id: "while-loops",
    unit: "Unit III · Repetition",
    title: "While Loops",
    description: "Repeat while a condition remains true, and control the changing state that eventually stops the loop.",
    sections: [
      { id: "while-purpose", title: "Why Repetition Exists", eyebrow: "One block, many executions", lead: "A while loop repeats a block as long as its condition is true. It is useful when the number of repetitions depends on changing program state or user input.", examples: [{ label: "Count down", code: "int lives = 3;\nwhile (lives > 0) {\n    System.out.println(lives);\n    lives--;\n}" }], concepts: [{ label: "condition", detail: "Checked before every iteration." }, { label: "body", detail: "Runs only while the condition is true." }, { label: "update", detail: "Changes state so the loop can progress." }] },
      { id: "while-tracing", title: "Tracing Iterations", eyebrow: "Follow state one pass at a time", lead: "For each iteration, record the condition, the value before the body, the output, and the update. Stop when the next condition is false.", examples: [{ label: "Trace count < 4", code: "int count = 1;\nwhile (count < 4) {\n    System.out.println(count * 2);\n    count++;\n}\n\n// count 1 → prints 2\n// count 2 → prints 4\n// count 3 → prints 6\n// count 4 → condition false" }] },
      { id: "while-counters", title: "Counters", eyebrow: "Track how many", lead: "A counter changes by a fixed amount each iteration. Initialize it before the loop, test it in the condition, and update it inside the body.", examples: [{ label: "Count upward", code: "int number = 1;\nwhile (number <= 5) {\n    System.out.println(number);\n    number++;\n}" }, { label: "Count by twos", code: "int number = 2;\nwhile (number <= 10) {\n    System.out.println(number);\n    number += 2;\n}" }], rules: ["Choose the starting value deliberately.", "Check whether the boundary should use < or <=.", "Make sure the update moves toward the stopping condition."] },
      { id: "while-accumulators", title: "Accumulators", eyebrow: "Build a running result", lead: "An accumulator stores a total that changes using each new value. Its initial value must match the operation: zero for addition and usually one for multiplication.", examples: [{ label: "Sum 1 through 5", code: "int number = 1;\nint sum = 0;\n\nwhile (number <= 5) {\n    sum += number;\n    number++;\n}\nSystem.out.println(sum); // 15" }], callout: { title: "Counter and accumulator have different jobs", body: "number controls the repetitions; sum remembers the result built across those repetitions." } },
      { id: "while-sentinel", title: "Sentinel-Controlled Input", eyebrow: "Repeat until a special value", lead: "A sentinel is a special input value that means stop. Read once before the loop, process ordinary values inside, then read again before the next condition check.", examples: [{ label: "Sum until -1", code: "int sum = 0;\nSystem.out.print(\"Value (-1 to stop): \" );\nint value = input.nextInt();\n\nwhile (value != -1) {\n    sum += value;\n    value = input.nextInt();\n}\nSystem.out.println(\"Sum: \" + sum);" }], rules: ["Do not include the sentinel in the calculation.", "The input variable must be updated inside the loop.", "Choose a sentinel that cannot be confused with normal data."] },
      { id: "while-infinite", title: "Infinite Loops", eyebrow: "When progress stops", lead: "A loop is infinite when its condition never becomes false. The most common cause is a missing, reversed, or unreachable update.", examples: [{ label: "Missing update", code: "int count = 1;\nwhile (count <= 5) {\n    System.out.println(count);\n    // count never changes\n}" }, { label: "Wrong direction", code: "int count = 1;\nwhile (count <= 5) {\n    count--; // moves away from 5\n}" }], callout: { title: "Ask what changes the condition", body: "Before running a loop, identify the exact statement that moves its state toward false.", tone: "warning" } },
      { id: "while-do-while", title: "Do-While Loops", eyebrow: "Run once before checking", lead: "A do-while loop runs its body first and checks the condition afterward. Use it when the action must happen at least once, such as showing a menu before deciding whether to repeat it.", examples: [{ label: "Ask at least once", code: "int choice;\ndo {\n    System.out.print(\"Enter 1-3: \" );\n    choice = input.nextInt();\n} while (choice < 1 || choice > 3);" }, { label: "Compare zero starting values", code: "int n = 0;\nwhile (n > 0) {\n    System.out.println(n); // runs zero times\n}\n\ndo {\n    System.out.println(n); // runs once\n} while (n > 0);" }], rules: ["The body always runs at least once.", "The condition is checked after each body execution.", "A do-while statement ends with a semicolon after while (condition);.", "The body still needs an update that can make the condition false."], callout: { title: "Choose based on the first condition check", body: "Use while when zero repetitions are possible. Use do-while when one execution must happen before Java can decide whether to repeat." } },
      { id: "while-combined", title: "A Complete While-Loop Program", eyebrow: "Validate repeated input", lead: "This program keeps asking until the user supplies a valid score, then uses the accepted value after the loop.", examples: [{ label: "Input validation loop", code: "System.out.print(\"Score 0-100: \" );\nint score = input.nextInt();\n\nwhile (score < 0 || score > 100) {\n    System.out.print(\"Invalid. Enter 0-100: \" );\n    score = input.nextInt();\n}\n\nSystem.out.println(\"Accepted: \" + score);" }], takeaways: ["while checks its condition before every iteration and may run zero times.", "do-while checks after the body and therefore runs at least once.", "Loop state must change toward a stopping condition.", "Counters track repetitions; accumulators build results.", "A sentinel ends input-driven repetition.", "Trace one iteration at a time to find infinite loops and boundary errors."] },
    ],
  },
  {
    id: "for-loops",
    unit: "Unit III · Repetition",
    title: "For Loops",
    description: "Express structured counting loops with initialization, condition, and update in one header.",
    sections: [
      { id: "for-anatomy", title: "For-Loop Anatomy", eyebrow: "Three control pieces", lead: "A for loop places its starting value, continuation condition, and update together. The body runs after the condition succeeds and before the update.", concepts: [{ label: "initialization", detail: "Runs once before the loop.", code: "int i = 0" }, { label: "condition", detail: "Checked before each iteration.", code: "i < 5" }, { label: "update", detail: "Runs after each body execution.", code: "i++" }], examples: [{ label: "Print 0 through 4", code: "for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}" }] },
      { id: "for-ranges", title: "Counting Through Ranges", eyebrow: "Control endpoints", lead: "The initial value and comparison decide the first and last values. Trace the boundary rather than memorizing a pattern.", examples: [{ label: "Inclusive 1 through 5", code: "for (int i = 1; i <= 5; i++) {\n    System.out.println(i);\n}" }, { label: "Exclusive 0 through 4", code: "for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}" }], callout: { title: "< creates an excluded upper bound", body: "When i begins at 0, the condition i < 5 visits 0, 1, 2, 3, and 4, then stops before 5." } },
      { id: "for-directions", title: "Counting Up, Down, and by Steps", eyebrow: "Choose the update", lead: "The update can add or subtract any fixed step as long as it moves toward the stopping condition.", examples: [{ label: "Count down", code: "for (int i = 5; i >= 1; i--) {\n    System.out.println(i);\n}" }, { label: "Even numbers", code: "for (int i = 2; i <= 10; i += 2) {\n    System.out.println(i);\n}" }], rules: ["A downward loop needs a condition such as i >= end.", "A positive update with a downward condition can create an infinite loop.", "Confirm whether the endpoint belongs in the range."] },
      { id: "for-accumulation", title: "Accumulation with for", eyebrow: "Process every counter value", lead: "A for loop is a natural choice when the values being accumulated follow a known range.", examples: [{ label: "Sum 1 through 100", code: "int sum = 0;\nfor (int number = 1; number <= 100; number++) {\n    sum += number;\n}\nSystem.out.println(sum);" }, { label: "Product 1 through 5", code: "int product = 1;\nfor (int number = 1; number <= 5; number++) {\n    product *= number;\n}" }] },
      { id: "for-vs-while", title: "Choosing for or while", eyebrow: "Match loop to the problem", lead: "Both loops can express the same repetition. Choose the form that makes the controlling idea easiest to see.", concepts: [{ label: "for", detail: "Best when initialization, condition, and update form a clear counting pattern." }, { label: "while", detail: "Best when repetition depends on input, validation, or a condition without a fixed count." }], examples: [{ label: "Equivalent loops", code: "for (int i = 0; i < 3; i++) {\n    System.out.println(i);\n}\n\nint i = 0;\nwhile (i < 3) {\n    System.out.println(i);\n    i++;\n}" }] },
      { id: "for-off-by-one", title: "Off-by-One Errors", eyebrow: "One iteration too many or too few", lead: "An off-by-one error occurs when a loop starts, stops, or updates one position away from the intended range.", examples: [{ label: "Intended: five outputs", code: "for (int i = 1; i < 5; i++) { // only 1,2,3,4" }, { label: "Correct inclusive endpoint", code: "for (int i = 1; i <= 5; i++) {" }], rules: ["List the first two and final two values before running the loop.", "Count how many values the range contains.", "Test an empty or smallest range when the bounds come from input."] },
      { id: "for-combined", title: "A Complete For-Loop Program", eyebrow: "Calculate across a range", lead: "This program prints a multiplication table row and accumulates its total in the same loop.", examples: [{ label: "Table and total", code: "int number = 6;\nint total = 0;\n\nfor (int factor = 1; factor <= 5; factor++) {\n    int product = number * factor;\n    total += product;\n    System.out.println(number + \" x \" + factor + \" = \" + product);\n}\nSystem.out.println(\"Total: \" + total);" }], takeaways: ["A for header contains initialization, condition, and update.", "The condition is checked before each iteration.", "Use for when repetition follows a clear range.", "The comparison controls whether the endpoint is included.", "Trace boundaries to prevent off-by-one errors."] },
    ],
  },
  {
    id: "nested-loops",
    unit: "Unit III · Repetition",
    title: "Nested Loops & Loop Problems",
    description: "Coordinate outer and inner repetitions to build grids, tables, patterns, and repeated calculations.",
    sections: [
      { id: "nested-structure", title: "A Loop Inside a Loop", eyebrow: "Repeated groups", lead: "For every one outer-loop iteration, the inner loop runs through all of its iterations. The outer loop controls groups; the inner loop controls work inside each group.", examples: [{ label: "Three rows, four columns", code: "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= 4; col++) {\n        System.out.print(\"*\");\n    }\n    System.out.println();\n}" }], output: "****\n****\n****" },
      { id: "nested-count", title: "Counting Total Iterations", eyebrow: "Multiply the dimensions", lead: "When the inner loop always runs the same number of times, total body executions equal outer iterations multiplied by inner iterations.", examples: [{ label: "Count pairs", code: "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= 4; col++) {\n        System.out.println(row + \",\" + col);\n    }\n}\n// 3 × 4 = 12 lines" }], callout: { title: "The inner loop restarts for every outer iteration", body: "col is created again at 1 each time a new row begins." } },
      { id: "nested-tracing", title: "Tracing Nested Loops", eyebrow: "Freeze the outer value", lead: "Hold the outer variable fixed and trace the complete inner loop. Only then advance the outer variable and repeat.", examples: [{ label: "Trace row and column", code: "row = 1: col 1, 2, 3\nrow = 2: col 1, 2, 3" }], concepts: [{ label: "Step 1", detail: "Write the current outer value." }, { label: "Step 2", detail: "Run every inner value." }, { label: "Step 3", detail: "Apply output or calculation for each pair." }, { label: "Step 4", detail: "Advance the outer loop." }] },
      { id: "nested-patterns", title: "Growing Patterns", eyebrow: "Let one loop depend on the other", lead: "The inner loop can use the outer variable in its condition, producing a different number of inner iterations for each row.", examples: [{ label: "Growing triangle", code: "for (int row = 1; row <= 4; row++) {\n    for (int col = 1; col <= row; col++) {\n        System.out.print(\"#\");\n    }\n    System.out.println();\n}" }], output: "#\n##\n###\n####" },
      { id: "nested-tables", title: "Tables and Coordinate Problems", eyebrow: "Process combinations", lead: "Nested loops are useful whenever a program must process every combination of two ranges, such as rows and columns or two factors.", examples: [{ label: "Small multiplication table", code: "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= 3; col++) {\n        System.out.print((row * col) + \" \");\n    }\n    System.out.println();\n}" }], output: "1 2 3\n2 4 6\n3 6 9" },
      { id: "nested-common-errors", title: "Nested-Loop Mistakes", eyebrow: "Keep responsibilities separate", lead: "Nested-loop bugs often come from updating the wrong variable, using the wrong variable in a condition, or printing the line break in the wrong location.", rules: ["The inner update should usually change the inner variable.", "Place println after the inner loop when it should end a row.", "Use different descriptive names such as row and col.", "Trace a tiny 2 × 3 case before using larger bounds."], examples: [{ label: "Wrong update", code: "for (int row = 0; row < 3; row++) {\n    for (int col = 0; col < 4; row++) { // wrong variable\n    }\n}" }] },
      { id: "nested-combined", title: "A Larger Loop Problem", eyebrow: "Count matches across a grid", lead: "This example visits every row-column pair and counts positions whose coordinates add to an even number.", examples: [{ label: "Grid condition", code: "int matches = 0;\nfor (int row = 1; row <= 4; row++) {\n    for (int col = 1; col <= 4; col++) {\n        if ((row + col) % 2 == 0) {\n            matches++;\n        }\n    }\n}\nSystem.out.println(matches); // 8" }], takeaways: ["The inner loop completes for every outer iteration.", "Use nested loops for combinations, grids, and grouped repetition.", "Trace one fixed outer value at a time.", "An inner bound can depend on the outer variable.", "Keep row breaks and variable updates in the correct loop."] },
    ],
  },
  {
    id: "methods",
    unit: "Unit IV · Methods",
    title: "Methods & Parameters",
    description: "Define reusable subtasks, pass information into them, and call them as part of larger programs.",
    sections: [
      { id: "methods-purpose", title: "Why Methods Exist", eyebrow: "Name a reusable subtask", lead: "A method groups statements that perform one job. A useful method has a clear name, can be called when needed, and lets a larger program read as a sequence of subtasks.", examples: [{ label: "Call a named task", code: "public static void main(String[] args) {\n    printWelcome();\n    printWelcome();\n}\n\npublic static void printWelcome() {\n    System.out.println(\"Welcome\");\n}" }], callout: { title: "Defining is not calling", body: "The method definition describes the task. The call printWelcome(); tells Java to run it." } },
      { id: "methods-anatomy", title: "Method Definition Anatomy", eyebrow: "Read the header", lead: "For now, methods are public static. The return type describes what comes back; void means no value comes back. Parentheses hold parameters.", concepts: [{ label: "public static", detail: "Required course-level method modifiers for these examples." }, { label: "void", detail: "This method returns no value." }, { label: "printWelcome", detail: "Descriptive method name." }, { label: "()", detail: "Parameter list; empty here." }, { label: "{ }", detail: "Method body." }], examples: [{ label: "A void method", code: "public static void printWelcome() {\n    System.out.println(\"Welcome\");\n}" }] },
      { id: "methods-calling", title: "Calling Methods", eyebrow: "Transfer control and return", lead: "When Java reaches a method call, it pauses the current method, runs the called method, then returns to the statement after the call.", examples: [{ label: "Trace call order", code: "System.out.println(\"A\");\nshowMessage();\nSystem.out.println(\"C\");\n\npublic static void showMessage() {\n    System.out.println(\"B\");\n}", note: "The output is A, B, C because control returns after showMessage finishes." }] },
      { id: "methods-parameters", title: "Parameters and Arguments", eyebrow: "Send data into a method", lead: "A parameter is a named variable in the method definition. An argument is the actual value supplied by a call.", concepts: [{ label: "parameter", detail: "Receives a value inside the method.", code: "String name" }, { label: "argument", detail: "The value sent by the caller.", code: "\"Daniel\"" }], examples: [{ label: "One parameter", code: "public static void greet(String name) {\n    System.out.println(\"Hello \" + name);\n}\n\ngreet(\"Daniel\");\ngreet(\"Maya\");" }] },
      { id: "methods-multiple", title: "Multiple Parameters", eyebrow: "Receive several values", lead: "Separate parameters and arguments with commas. Argument order, number, and types must match the definition.", examples: [{ label: "Print a labeled score", code: "public static void printScore(String name, int score) {\n    System.out.println(name + \": \" + score);\n}\n\nprintScore(\"Daniel\", 92);" }], rules: ["Each parameter declares its own type and name.", "Arguments match parameters from left to right.", "A String argument cannot fill an int parameter.", "Changing a parameter does not rename or directly replace the caller's primitive variable."] },
      { id: "methods-library", title: "Using Java Library Methods", eyebrow: "Call code Java already provides", lead: "Java's standard library contains tested methods for common tasks. A static library method is called with the class name, a dot, and the method name. The call produces a return value that you can store or use inside another expression.", concepts: [{ label: "Math.sqrt(value)", detail: "Returns the square root as a double.", code: "double root = Math.sqrt(81);" }, { label: "Math.random()", detail: "Returns a random double from 0.0 up to, but not including, 1.0.", code: "double chance = Math.random();" }, { label: "Integer.parseInt(text)", detail: "Converts valid numeric text into an int.", code: "int age = Integer.parseInt(\"25\");" }, { label: "Double.parseDouble(text)", detail: "Converts valid decimal text into a double.", code: "double price = Double.parseDouble(\"9.99\");" }, { label: "long", detail: "A primitive whole-number type with a larger range than int. It fits currentTimeMillis results.", code: "long start = System.currentTimeMillis();" }, { label: "System.currentTimeMillis()", detail: "Returns the current time count in milliseconds as a long.", code: "long start = System.currentTimeMillis();" }], examples: [{ label: "Compose method calls inside an expression", code: "String text = \"144\";\ndouble root = Math.sqrt(Integer.parseInt(text));\nSystem.out.println(root); // 12.0" }], rules: ["A method call can be used anywhere its returned type fits.", "parseInt and parseDouble require text that actually represents a number.", "Math.random() does not directly return an arbitrary whole number.", "Composition means one call's returned value becomes input to another call."] },
      { id: "methods-api-docs", title: "Reading Java API Documentation", eyebrow: "Learn an unfamiliar method", lead: "API documentation is the official reference for library classes and methods. Read a method entry by identifying its class, name, parameter list, return type, and description instead of guessing from the name alone.", concepts: [{ label: "Class", detail: "Where the method belongs, such as Math or String." }, { label: "Return type", detail: "What value the call produces, or void when it produces none." }, { label: "Method name", detail: "The action being requested." }, { label: "Parameters", detail: "The number, order, and types of required inputs." }, { label: "Description", detail: "The behavior, limits, and special cases promised by the method." }], examples: [{ label: "Read a documentation-style entry", code: "static double sqrt(double a)\nReturns the correctly rounded positive square root of a double value.", note: "This entry says to call Math.sqrt with one double-compatible argument and expect a double result." }], callout: { title: "Documentation is part of programming", body: "You do not memorize every library method. Learn to verify the exact parameter and return rules in the Java API before using an unfamiliar call." } },
      { id: "methods-decomposition", title: "Breaking a Program into Subtasks", eyebrow: "One responsibility per method", lead: "Decomposition turns a large problem into smaller named jobs. main should coordinate the program rather than contain every detail.", examples: [{ label: "Program structure", code: "public static void main(String[] args) {\n    printHeader();\n    printItem(\"Notebook\", 4);\n    printItem(\"Pen\", 2);\n    printFooter();\n}" }], concepts: [{ label: "Good method", detail: "Performs one coherent job." }, { label: "Good name", detail: "Says what that job does." }, { label: "Good caller", detail: "Combines methods to express the larger plan." }] },
      { id: "methods-combined", title: "A Complete Method-Based Program", eyebrow: "Reuse earlier concepts", lead: "This program uses parameters, operators, and output while keeping the repeated calculation in one method.", examples: [{ label: "Reusable receipt line", code: "public class Main {\n    public static void main(String[] args) {\n        printLine(\"Notebook\", 3, 4.50);\n        printLine(\"Pen\", 2, 1.25);\n    }\n\n    public static void printLine(String item, int quantity, double price) {\n        double total = quantity * price;\n        System.out.println(item + \": \" + total);\n    }\n}" }], takeaways: ["A method names and groups one subtask.", "A definition describes a method; a call runs it.", "void means the method returns no value.", "Parameters receive arguments from left to right.", "Static library methods are called through their class names and return documented value types.", "API documentation states a method's parameters, return type, and behavior.", "Methods make repeated behavior reusable and larger programs easier to trace."] },
    ],
  },
  {
    id: "returns-scope",
    unit: "Unit IV · Methods",
    title: "Return Values, Scope & Decomposition",
    description: "Move computed values out of methods, trace method calls, and keep local variables within their valid scope.",
    sections: [
      { id: "returns-purpose", title: "Returning a Value", eyebrow: "Send a result to the caller", lead: "A value-returning method calculates one result and sends it back. The caller can store, print, or use that returned value in another expression.", examples: [{ label: "Return a calculation", code: "public static int square(int number) {\n    return number * number;\n}\n\nint result = square(5);\nSystem.out.println(result);" }], concepts: [{ label: "int", detail: "The promised return type." }, { label: "return", detail: "Ends the method and sends one int back." }, { label: "result", detail: "Receives the returned value in the caller." }] },
      { id: "returns-types", title: "Return Types", eyebrow: "Keep the promise", lead: "The declared return type must match the value returned on every possible path. void methods do not return a usable value.", examples: [{ label: "Return a double", code: "public static double average(double a, double b) {\n    return (a + b) / 2;\n}" }, { label: "Return a boolean", code: "public static boolean isAdult(int age) {\n    return age >= 18;\n}" }], rules: ["Every reachable path in a non-void method must return a value.", "The returned value must fit the declared return type.", "Code after an unconditional return cannot run."] },
      { id: "returns-overloading", title: "Overloading and Method Signatures", eyebrow: "Same name, different parameter lists", lead: "After return types are understood, Java can define multiple methods that share a name when their parameter lists differ. This is method overloading. The compiler chooses the matching version from the number, order, and types of the arguments.", examples: [{ label: "Two overloads", code: "public static int area(int side) {\n    return side * side;\n}\n\npublic static int area(int width, int height) {\n    return width * height;\n}\n\nint square = area(4);       // first method\nint rectangle = area(4, 6); // second method" }], concepts: [{ label: "signature", detail: "A method's name plus its parameter types." }, { label: "overload", detail: "Another method with the same name and a different parameter list." }, { label: "method header", detail: "The declaration line containing modifiers, return type, name, and parameters." }], rules: ["Changing only the return type does not create a different signature.", "Parameter names do not distinguish overloads; their types and order do.", "Some course materials use prototype informally for a method header or declaration. Java normally discusses method declarations and signatures, not separate C-style prototypes."] },
      { id: "returns-using", title: "Using Returned Values", eyebrow: "Store, print, or compose", lead: "A method call that returns a value behaves like an expression. It can appear anywhere a value of that type is allowed.", examples: [{ label: "Three uses", code: "int area = rectangleArea(4, 6);\nSystem.out.println(rectangleArea(3, 5));\nint doubled = rectangleArea(2, 7) * 2;" }], callout: { title: "A return value is not automatically printed", body: "return sends data to the caller. println displays data. Use both when the program must calculate and show a result." } },
      { id: "scope-local", title: "Local Variables and Scope", eyebrow: "Where a name exists", lead: "A local variable exists only inside the block where it is declared. Parameters are local to their method, and variables declared inside a branch or loop stay inside that block.", examples: [{ label: "Separate local names", code: "public static void first() {\n    int score = 10;\n}\n\npublic static void second() {\n    int score = 20; // different local variable\n}" }, { label: "Outside the scope", code: "if (ready) {\n    int count = 3;\n}\nSystem.out.println(count); // error" }], rules: ["A method cannot directly use another method's local variables.", "Pass needed data as arguments.", "Return needed results to the caller."] },
      { id: "scope-constants", title: "Constants and Scope", eyebrow: "A local value that must stay fixed", lead: "After learning where a local variable exists, you can also control whether its value may change. Put final before the type when a named value should be assigned once and remain fixed throughout its scope.", concepts: [{ label: "final", detail: "Prevents another assignment after the variable receives its value." }, { label: "scope", detail: "Still controls where the name can be used; final does not make the name global." }, { label: "UPPER_SNAKE_CASE", detail: "Common naming style for constants, with capital letters and underscores." }], examples: [{ label: "A fixed local setting", code: "public static void showPolicy() {\n    final int MAX_ATTEMPTS = 3;\n    System.out.println(MAX_ATTEMPTS);\n}" }, { label: "Reassignment is rejected", code: "final double TAX_RATE = 0.08875;\nTAX_RATE = 0.09; // error: final cannot be reassigned" }], rules: ["final changes the reassignment rule, not the variable's data type or scope.", "Initialize a local constant before trying to use it.", "Use final when the program's meaning requires a value to stay fixed; ordinary changing state should remain a regular variable."], callout: { title: "Why this belongs with scope", body: "Scope answers where a name exists. final answers whether the value under that name may be replaced. Together they describe the boundaries placed on a local variable." } },
      { id: "returns-composition", title: "Method Composition", eyebrow: "Build a result from smaller results", lead: "One method can call another. Composition works best when each method has one clear responsibility and a predictable return value.", examples: [{ label: "Compose calculations", code: "public static double subtotal(int quantity, double price) {\n    return quantity * price;\n}\n\npublic static double withTax(double amount) {\n    return amount * 1.08875;\n}\n\ndouble total = withTax(subtotal(3, 10.0));" }] },
      { id: "returns-tracing", title: "Tracing Method Calls", eyebrow: "Follow arguments and returns", lead: "Write the argument values beside the parameters, run the method body with those local values, record the returned result, then resume the caller.", examples: [{ label: "Trace nested calls", code: "int answer = addOne(doubleValue(3));\n\n// doubleValue(3) returns 6\n// addOne(6) returns 7\n// answer stores 7" }], concepts: [{ label: "1", detail: "Evaluate the innermost argument expression." }, { label: "2", detail: "Bind arguments to parameters." }, { label: "3", detail: "Run until return." }, { label: "4", detail: "Replace the call with its returned value." }] },
      { id: "returns-combined", title: "A Decomposed Program", eyebrow: "Data flows through methods", lead: "This program separates validation, calculation, and output while keeping data movement explicit.", examples: [{ label: "Ticket calculation", code: "public static boolean validAge(int age) {\n    return age >= 0;\n}\n\npublic static double ticketPrice(int age) {\n    if (age < 13) {\n        return 8.0;\n    } else {\n        return 12.0;\n    }\n}\n\npublic static void main(String[] args) {\n    final int AGE = 10;\n    if (validAge(AGE)) {\n        double price = ticketPrice(AGE);\n        System.out.println(\"Price: \" + price);\n    }\n}" }], takeaways: ["A non-void method returns one value of its declared type.", "Returned values can be stored, printed, or used inside expressions.", "Local variables exist only inside their scope.", "final prevents reassignment without changing a variable's type or scope.", "Pass data in with parameters and send results out with return.", "Overloaded methods share a name but have different parameter lists and signatures.", "Trace nested calls from the innermost call outward."] },
    ],
  },
  {
    id: "arrays",
    unit: "Unit V · Arrays, Lists & Strings",
    title: "Arrays",
    description: "Create fixed-size indexed groups of values and safely read, replace, and inspect them.",
    sections: [
      { id: "arrays-purpose", title: "Why Arrays Exist", eyebrow: "One name, many related values", lead: "An array stores a fixed number of values of the same type. Each stored value is an element, and each numbered position is an index. Instead of creating score1, score2, and score3, one scores array keeps the elements together.", examples: [{ label: "Three separate variables", code: "int score1 = 88;\nint score2 = 92;\nint score3 = 75;" }, { label: "One array", code: "int[] scores = {88, 92, 75};" }], callout: { title: "Homogeneous data", body: "Homogeneous means the values share a type: every element in an int[] is an int." } },
      { id: "arrays-create", title: "Declaring and Creating Arrays", eyebrow: "Type, brackets, name", lead: "The brackets make the variable an array variable. You can create a blank array with a fixed length or use an initializer that supplies the starting values.", concepts: [{ label: "int[]", detail: "Array whose elements are ints." }, { label: "scores", detail: "Name of the array variable." }, { label: "new int[4]", detail: "Creates four int positions." }, { label: "{...}", detail: "Initializer creates and fills an array." }], examples: [{ label: "Fixed blank array", code: "int[] scores = new int[4];" }, { label: "Array initializer", code: "int[] scores = {88, 92, 75, 100};" }], rules: ["Array length is fixed when the array is created.", "New int elements begin as 0; new boolean elements begin as false."] },
      { id: "arrays-indexes", title: "Indexes and Zero-Based Positions", eyebrow: "Positions begin at zero", lead: "The first element has index 0, the second has index 1, and the final element has index length - 1.", examples: [{ label: "Read three positions", code: "int[] scores = {88, 92, 75};\nSystem.out.println(scores[0]); // 88\nSystem.out.println(scores[1]); // 92\nSystem.out.println(scores[2]); // 75" }], concepts: [{ label: "scores[0]", detail: "First element." }, { label: "scores[1]", detail: "Second element." }, { label: "scores[2]", detail: "Third and final element." }] },
      { id: "arrays-update", title: "Reading and Updating Elements", eyebrow: "Use an indexed variable", lead: "An indexed element can appear anywhere a normal variable of that type can appear. Assignment replaces only the selected element.", examples: [{ label: "Replace and calculate", code: "int[] scores = {88, 92, 75};\nscores[2] = 80;\nint total = scores[0] + scores[1] + scores[2];\nSystem.out.println(total); // 260" }], callout: { title: "One collection, one changed position", body: "scores[2] = 80 changes one stored element; every other position remains unchanged." } },
      { id: "arrays-length", title: "Array Length", eyebrow: "Ask the array how large it is", lead: "The length field reports how many elements an array contains. It has no parentheses.", examples: [{ label: "First and last", code: "int[] values = {4, 8, 12, 16};\nSystem.out.println(values.length);      // 4\nSystem.out.println(values[0]);          // 4\nSystem.out.println(values[values.length - 1]); // 16" }], rules: ["Use array.length, not array.length().", "The final valid index is length - 1.", "Length is the number of elements, not the final index."] },
      { id: "arrays-bounds", title: "Out-of-Bounds Errors", eyebrow: "Stay inside valid indexes", lead: "Java throws an ArrayIndexOutOfBoundsException when code uses a negative index or an index equal to or greater than length.", examples: [{ label: "Invalid final position", code: "int[] values = new int[3];\nvalues[3] = 10; // invalid: valid indexes are 0, 1, 2" }, { label: "Valid final position", code: "values[values.length - 1] = 10;" }], callout: { title: "Bounds are checked while the program runs", body: "The code can compile successfully and still crash when an invalid index is reached.", tone: "warning" } },
      { id: "arrays-combined", title: "A Complete Array Example", eyebrow: "Create, update, and inspect", lead: "This example creates an array, changes one element, and prints a labeled summary without hiding the index operations.", examples: [{ label: "Weekly temperatures", code: "double[] temperatures = {71.5, 69.0, 73.5};\ntemperatures[1] = 70.0;\n\nSystem.out.println(\"Days: \" + temperatures.length);\nSystem.out.println(\"First: \" + temperatures[0]);\nSystem.out.println(\"Last: \" + temperatures[temperatures.length - 1]);" }], takeaways: ["An array stores a fixed number of same-type elements.", "Indexes begin at 0.", "The final valid index is length - 1.", "Use brackets to read or replace one element.", "An invalid index causes a runtime error."] },
    ],
  },
  {
    id: "arrays-loops",
    unit: "Unit V · Arrays, Lists & Strings",
    title: "Arrays + Loops",
    description: "Traverse arrays to fill, print, summarize, count, and locate their data.",
    sections: [
      { id: "array-traversal", title: "Traversing an Array", eyebrow: "Visit every valid index", lead: "Traversal means processing elements one at a time. The standard index loop begins at 0 and continues while index is less than array.length.", examples: [{ label: "Index traversal", code: "int[] scores = {88, 92, 75};\nfor (int index = 0; index < scores.length; index++) {\n    System.out.println(scores[index]);\n}" }, { label: "For-each traversal", code: "for (int score : scores) {\n    System.out.println(score);\n}" }], concepts: [{ label: "index = 0", detail: "Begin at the first element." }, { label: "index < length", detail: "Stop before the first invalid index." }, { label: "index++", detail: "Advance one position." }, { label: "int score : scores", detail: "Read each score in order without using its index." }], callout: { title: "Choose the loop that matches the job", body: "Use an index loop when you need a position or must update an element. Use a for-each loop when you only need to read every value." } },
      { id: "array-fill", title: "Filling an Array", eyebrow: "Store a value at each index", lead: "A loop can calculate or read the value for each array position. The index identifies exactly where the current value belongs.", examples: [{ label: "Fill with squares", code: "int[] squares = new int[5];\nfor (int index = 0; index < squares.length; index++) {\n    squares[index] = index * index;\n}\n// {0, 1, 4, 9, 16}" }, { label: "Fill from input", code: "for (int index = 0; index < scores.length; index++) {\n    scores[index] = input.nextInt();\n}" }] },
      { id: "array-sum-average", title: "Sum and Average", eyebrow: "Accumulate array data", lead: "Initialize a running sum before traversal, add each element, then divide after the loop. Use decimal division when the average can contain a fraction.", examples: [{ label: "Calculate an average", code: "int[] scores = {80, 90, 100};\nint sum = 0;\nfor (int index = 0; index < scores.length; index++) {\n    sum += scores[index];\n}\ndouble average = (double) sum / scores.length;\nSystem.out.println(average); // 90.0" }], callout: { title: "Do not divide inside the loop", body: "Finish building the total first. Then divide once by the number of elements." } },
      { id: "array-min-max", title: "Minimum and Maximum", eyebrow: "Keep the best value seen so far", lead: "Initialize min or max from the first element, then compare later elements. Starting from 0 fails when the data can be entirely negative or positive in the opposite direction.", examples: [{ label: "Find the maximum", code: "int max = values[0];\nfor (int index = 1; index < values.length; index++) {\n    if (values[index] > max) {\n        max = values[index];\n    }\n}" }], rules: ["A min/max algorithm requires a nonempty array.", "Start the loop at index 1 after using element 0 as the initial candidate.", "Update only when the current element is better."] },
      { id: "array-count", title: "Counting Matches", eyebrow: "Test every element", lead: "A counting algorithm increases a counter only when the current element satisfies a condition.", examples: [{ label: "Count passing scores", code: "int passed = 0;\nfor (int index = 0; index < scores.length; index++) {\n    if (scores[index] >= 70) {\n        passed++;\n    }\n}\nSystem.out.println(passed);" }, { label: "Count even values", code: "if (values[index] % 2 == 0) {\n    evenCount++;\n}" }] },
      { id: "array-find", title: "Finding a Value", eyebrow: "Remember whether a match appears", lead: "A basic traversal can set a boolean when it encounters a target. A later Searching chapter will develop this into a reusable algorithm that returns an index.", examples: [{ label: "Record a match", code: "boolean found = false;\nfor (int index = 0; index < values.length; index++) {\n    if (values[index] == target) {\n        found = true;\n    }\n}\nSystem.out.println(found);" }] },
      { id: "array-transformations", title: "Reversing and Array-to-Array Operations", eyebrow: "Transform data by index", lead: "Some array algorithms change positions or create a related array. Use indexes when the destination position matters, and make sure paired arrays have compatible lengths before combining them.", examples: [{ label: "Reverse in place with two indexes", code: "int[] values = {4, 7, 9, 2};\nfor (int left = 0; left < values.length / 2; left++) {\n    int right = values.length - 1 - left;\n    int temp = values[left];\n    values[left] = values[right];\n    values[right] = temp;\n}\n// {2, 9, 7, 4}" }, { label: "Copy into a new array", code: "int[] copy = new int[values.length];\nfor (int i = 0; i < values.length; i++) {\n    copy[i] = values[i];\n}" }, { label: "Combine matching positions", code: "int[] first = {2, 4, 6};\nint[] second = {1, 3, 5};\nint[] sums = new int[first.length];\nfor (int i = 0; i < first.length; i++) {\n    sums[i] = first[i] + second[i];\n}\n// {3, 7, 11}" }], rules: ["A swap needs a temporary variable so the first value is not lost.", "Only the first half of an in-place reversal needs to initiate swaps.", "A copied array is a separate array whose elements initially match the source.", "Element-by-element operations require a defined rule for length differences; introductory problems usually require equal lengths."], callout: { title: "Direct indexing expresses the relationship", body: "copy[i] = source[i] preserves a position. sums[i] = first[i] + second[i] combines the two values stored at that same position." } },
      { id: "array-processing", title: "A Complete Array Processing Program", eyebrow: "One traversal, several results", lead: "This example calculates sum, maximum, and pass count while visiting each element once.", examples: [{ label: "Process score data", code: "int[] scores = {82, 67, 91, 74};\nint sum = 0;\nint max = scores[0];\nint passed = 0;\n\nfor (int score : scores) {\n    sum += score;\n    if (score > max) max = score;\n    if (score >= 70) passed++;\n}\n\ndouble average = (double) sum / scores.length;\nSystem.out.println(\"Average: \" + average);\nSystem.out.println(\"Max: \" + max);\nSystem.out.println(\"Passed: \" + passed);" }], takeaways: ["Traverse from index 0 while index < length.", "Loops can fill, print, and process arrays.", "Accumulators build sums; counters track matches.", "Initialize min/max from real array data.", "Use decimal division for a fractional average.", "Use indexed loops for reversing, copying, and element-by-element array operations."] },
    ],
  },
  {
    id: "strings",
    unit: "Unit V · Arrays, Lists & Strings",
    title: "Strings",
    description: "Treat text as programmable data by comparing, indexing, searching, and processing its characters.",
    sections: [
      { id: "strings-data", title: "Strings as Data", eyebrow: "More than a declaration", lead: "A String is an ordered sequence of characters. Java provides methods that inspect a String or produce a new String value without changing the original text.", examples: [{ label: "Store and inspect text", code: "String word = \"Java\";\nSystem.out.println(word.length()); // 4" }], callout: { title: "String length uses a method", body: "Write text.length() with parentheses. This differs from an array's length field, which has no parentheses." } },
      { id: "strings-length-char", title: "Length and Character Access", eyebrow: "Indexes begin at zero", lead: "length() returns the number of characters. charAt(index) returns one char at a valid zero-based position.", examples: [{ label: "First and last character", code: "String word = \"Brooklyn\";\nchar first = word.charAt(0);\nchar last = word.charAt(word.length() - 1);\nSystem.out.println(first); // B\nSystem.out.println(last);  // n" }], rules: ["Use text.length() with parentheses.", "The final valid character index is length() - 1.", "charAt returns a char, not a String."] },
      { id: "strings-methods", title: "Transforming and Extracting Text", eyebrow: "Methods that return new text", lead: "String methods can normalize, join, or extract text. Strings do not change in place; each transformation returns a result that you can store, compare, or print.", concepts: [{ label: "trim()", detail: "Returns text without leading or trailing whitespace." }, { label: "toLowerCase()", detail: "Returns lowercase text." }, { label: "toUpperCase()", detail: "Returns uppercase text." }, { label: "concat(text)", detail: "Returns the two Strings joined together, like String + String." }, { label: "substring(start)", detail: "Returns from start through the end." }, { label: "substring(start, end)", detail: "Returns from start through end - 1." }], examples: [{ label: "Normalize and extract", code: "String raw = \"  Brooklyn College  \";\nString clean = raw.trim();\nSystem.out.println(clean);                    // Brooklyn College\nSystem.out.println(clean.substring(9));       // College\nSystem.out.println(clean.substring(0, 8));    // Brooklyn\nSystem.out.println(clean.concat(\" CS\"));   // Brooklyn College CS" }], rules: ["The starting index is included.", "The ending index in the two-argument substring is excluded.", "Store the returned String if the transformed text must be used later."] },
      { id: "strings-search-order", title: "Searching and Ordering Strings", eyebrow: "Indexes and alphabetical order", lead: "Search methods return character positions. Comparison methods report whether one String comes before, matches, or comes after another in lexicographic order.", concepts: [{ label: "indexOf(text)", detail: "First matching index, or -1." }, { label: "indexOf(text, fromIndex)", detail: "First match at or after fromIndex." }, { label: "lastIndexOf(text)", detail: "Last matching index, or -1." }, { label: "lastIndexOf(text, fromIndex)", detail: "Searches backward starting at fromIndex." }, { label: "compareTo(other)", detail: "Negative before, zero equal, positive after." }, { label: "contains(text)", detail: "Returns whether text appears." }], examples: [{ label: "Find repeated text", code: "String text = \"banana\";\nSystem.out.println(text.indexOf(\"an\"));       // 1\nSystem.out.println(text.indexOf(\"an\", 2));    // 3\nSystem.out.println(text.lastIndexOf(\"an\"));   // 3\nSystem.out.println(text.lastIndexOf(\"an\", 2)); // 1" }, { label: "Interpret compareTo by its sign", code: "System.out.println(\"apple\".compareTo(\"banana\") < 0); // true\nSystem.out.println(\"java\".compareTo(\"java\") == 0);   // true" }], callout: { title: "Do not memorize the exact nonzero number", body: "For compareTo, the important result is negative, zero, or positive. Use equals when you only need to know whether the contents match." } },
      { id: "strings-comparison", title: "Comparing String Content", eyebrow: "Use equals, not ==", lead: "Use equals to compare the characters stored in two Strings. The == operator does not reliably answer that content question for Strings.", examples: [{ label: "Content comparison", code: "String answer = input.nextLine();\nif (answer.equals(\"yes\")) {\n    System.out.println(\"Confirmed\");\n}" }, { label: "Ignore letter case", code: "if (answer.equalsIgnoreCase(\"yes\")) {\n    System.out.println(\"Confirmed\");\n}" }], callout: { title: "Do not use == for normal text comparison", body: "Use equals when capitalization matters and equalsIgnoreCase when it does not.", tone: "warning" } },
      { id: "strings-loops", title: "Processing Characters with Loops", eyebrow: "Traverse a String", lead: "A loop can visit every character from index 0 through length() - 1, just like an array traversal.", examples: [{ label: "Print one character per line", code: "String word = \"code\";\nfor (int index = 0; index < word.length(); index++) {\n    System.out.println(word.charAt(index));\n}" }, { label: "Count vowels", code: "String normalized = text.toLowerCase();\nint vowels = 0;\nfor (int i = 0; i < normalized.length(); i++) {\n    char letter = normalized.charAt(i);\n    if (letter == 'a' || letter == 'e' || letter == 'i' || letter == 'o' || letter == 'u') {\n        vowels++;\n    }\n}" }] },
      { id: "strings-building", title: "Building New Text", eyebrow: "Accumulate a String", lead: "A program can build a result one character or piece at a time. For introductory programs, repeated concatenation clearly exposes the algorithm.", examples: [{ label: "Remove spaces", code: "String result = \"\";\nfor (int i = 0; i < text.length(); i++) {\n    char current = text.charAt(i);\n    if (current != ' ') {\n        result += current;\n    }\n}\nSystem.out.println(result);" }] },
      { id: "strings-combined", title: "A Complete Text Algorithm", eyebrow: "Normalize, count, and report", lead: "This program normalizes input, counts a target character, and reports an exact result.", examples: [{ label: "Count the letter a", code: "String text = input.nextLine();\ntext = text.toLowerCase();\nint count = 0;\nfor (int i = 0; i < text.length(); i++) {\n    if (text.charAt(i) == 'a') {\n        count++;\n    }\n}\nSystem.out.println(\"a count: \" + count);" }], takeaways: ["A String is an indexed sequence of characters.", "Use length() and charAt(index) to traverse text.", "trim, case conversion, concat, and substring return new String values.", "indexOf and lastIndexOf return positions or -1, with optional starting indexes.", "Use equals for content equality and compareTo when ordering text.", "Text algorithms combine loops, conditions, and character operations."] },
    ],
  },
  {
    id: "arraylists",
    unit: "Unit V · Arrays, Lists & Strings",
    title: "ArrayLists",
    description: "Use a resizable indexed list when a program must add or remove same-type values.",
    sections: [
      { id: "arraylist-purpose", title: "Why ArrayList Exists", eyebrow: "A list that can resize", lead: "An array has a fixed length. An ArrayList can grow when values are added and shrink when values are removed while preserving indexed access.", concepts: [{ label: "Array", detail: "Fixed length after creation." }, { label: "ArrayList", detail: "Resizable collection with methods." }], examples: [{ label: "Same values, different size behavior", code: "int[] fixed = new int[2];       // length stays 2\n\nArrayList<Integer> scores = new ArrayList<>(); // size starts 0\nscores.add(80);                 // size becomes 1\nscores.add(95);                 // size becomes 2\nscores.remove(0);               // size becomes 1", note: "The array reserves two indexed positions immediately. The ArrayList changes its size when add and remove run." }], callout: { title: "Use wrapper type names", body: "Inside ArrayList angle brackets, write Integer instead of int and Double instead of double. These capitalized wrapper names are the forms this library class requires." } },
      { id: "arraylist-create", title: "Importing and Creating an ArrayList", eyebrow: "Declare the element type", lead: "Import ArrayList, place the element type inside angle brackets, and create an empty list with new ArrayList<>().", examples: [{ label: "Create two lists", code: "import java.util.ArrayList;\n\nArrayList<String> names = new ArrayList<>();\nArrayList<Integer> scores = new ArrayList<>();" }], concepts: [{ label: "ArrayList", detail: "The resizable-list class." }, { label: "<String>", detail: "The type of every element." }, { label: "names", detail: "Variable referring to the list." }] },
      { id: "arraylist-core", title: "add, get, size, and isEmpty", eyebrow: "Grow and inspect the list", lead: "add appends a value, get reads an indexed value, size() returns the current number of elements, and isEmpty() reports whether the list contains zero elements.", examples: [{ label: "Build a list", code: "ArrayList<String> names = new ArrayList<>();\nSystem.out.println(names.isEmpty()); // true\nnames.add(\"Maya\");\nnames.add(\"Daniel\");\n\nSystem.out.println(names.get(0)); // Maya\nSystem.out.println(names.size()); // 2" }], rules: ["Indexes begin at 0.", "The final valid index is size() - 1.", "size() and isEmpty() use parentheses because they are methods."] },
      { id: "arraylist-update", title: "set and remove", eyebrow: "Replace or delete elements", lead: "set replaces the value at an index. remove deletes an element and shifts later elements one position left.", examples: [{ label: "Change and remove", code: "ArrayList<String> tasks = new ArrayList<>();\ntasks.add(\"Read\");\ntasks.add(\"Practice\");\ntasks.add(\"Review\");\n\ntasks.set(1, \"Code\");\ntasks.remove(0);\n// [Code, Review]" }], callout: { title: "Removing changes later indexes", body: "After remove(0), the old element at index 1 becomes the new element at index 0.", tone: "warning" } },
      { id: "arraylist-traverse", title: "Traversing an ArrayList", eyebrow: "Use size and get", lead: "An index loop visits each valid position. A for-each loop directly visits each element when you do not need its index.", examples: [{ label: "Index traversal", code: "for (int index = 0; index < names.size(); index++) {\n    System.out.println(index + \": \" + names.get(index));\n}" }, { label: "For-each traversal", code: "for (String name : names) {\n    System.out.println(name);\n}" }] },
      { id: "arraylist-removal-loop", title: "Removing While Traversing", eyebrow: "Indexes shift", lead: "Removing during a forward loop can skip the element that shifts into the removed position. Traverse backward when deleting by index.", examples: [{ label: "Remove negative values safely", code: "for (int index = values.size() - 1; index >= 0; index--) {\n    if (values.get(index) < 0) {\n        values.remove(index);\n    }\n}" }], callout: { title: "Backward traversal protects unvisited indexes", body: "Removing a later index does not change the earlier indexes the loop will visit next.", tone: "warning" } },
      { id: "arraylist-combined", title: "A Complete ArrayList Program", eyebrow: "Collect and process unknown quantities", lead: "This program reads values until a sentinel, stores them in a resizable list, and then processes every stored value.", examples: [{ label: "Collect nonnegative scores", code: "ArrayList<Integer> scores = new ArrayList<>();\nint value = input.nextInt();\nwhile (value != -1) {\n    scores.add(value);\n    value = input.nextInt();\n}\n\nint sum = 0;\nfor (int score : scores) {\n    sum += score;\n}\nSystem.out.println(\"Count: \" + scores.size());\nSystem.out.println(\"Sum: \" + sum);" }], takeaways: ["ArrayList can grow and shrink.", "Use wrapper types such as Integer in angle brackets.", "add, get, set, remove, size, and isEmpty are core methods.", "Indexes remain zero-based.", "Traverse backward when removing by index."] },
    ],
  },
  {
    id: "searching",
    unit: "Unit VI · Basic Algorithms",
    title: "Searching",
    description: "Trace and implement linear search across arrays, ArrayLists, and Strings.",
    sections: [
      { id: "search-purpose", title: "What Searching Means", eyebrow: "Locate a target", lead: "A search algorithm examines data to determine whether a target exists and often where it appears. The result must also represent failure clearly.", concepts: [{ label: "target", detail: "The value being sought." }, { label: "index", detail: "Where a match appears." }, { label: "-1", detail: "Conventional result meaning not found." }], examples: [{ label: "Every term points to program state", code: "int[] values = {4, 9, 2};\nint target = 9;\nint result = -1;\nfor (int i = 0; i < values.length; i++) {\n    if (values[i] == target) {\n        result = i;\n    }\n}\nSystem.out.println(result); // 1", note: "target stores what the loop seeks, i is the index currently inspected, and result stays -1 unless a matching index replaces it." }] },
      { id: "search-linear", title: "Linear Search", eyebrow: "Check in order", lead: "Linear search compares the target with elements from the beginning until it finds a match or reaches the end.", examples: [{ label: "Return an array index", code: "public static int findIndex(int[] values, int target) {\n    for (int index = 0; index < values.length; index++) {\n        if (values[index] == target) {\n            return index;\n        }\n    }\n    return -1;\n}" }], callout: { title: "Return stops the search", body: "As soon as a match is found, return sends that index to the caller and the method ends." } },
      { id: "search-trace", title: "Tracing a Search", eyebrow: "Record every comparison", lead: "Write the current index, current element, and comparison result. Stop at the first match when the algorithm returns immediately.", examples: [{ label: "Find 7 in {4, 9, 7, 2}", code: "index 0: 4 == 7 → false\nindex 1: 9 == 7 → false\nindex 2: 7 == 7 → true, return 2" }], rules: ["An early match reduces the number of comparisons.", "A missing target requires checking every element.", "Duplicate values matter: this version returns the first match."] },
      { id: "search-failure", title: "Search Success and Failure", eyebrow: "Interpret the returned index", lead: "The caller must check the search result before using it as an array index.", examples: [{ label: "Use the result safely", code: "int index = findIndex(values, target);\nif (index == -1) {\n    System.out.println(\"Not found\");\n} else {\n    System.out.println(\"Found at \" + index);\n}" }], callout: { title: "Never use -1 as an array index", body: "-1 communicates failure; values[-1] causes an out-of-bounds runtime error.", tone: "warning" } },
      { id: "search-arraylist", title: "Searching ArrayLists", eyebrow: "Same algorithm, different access", lead: "The linear-search structure stays the same. Use size() for the bound and get(index) for the current element.", examples: [{ label: "Search a list of Strings", code: "public static int findName(ArrayList<String> names, String target) {\n    for (int index = 0; index < names.size(); index++) {\n        if (names.get(index).equals(target)) {\n            return index;\n        }\n    }\n    return -1;\n}" }], rules: ["Use equals for String content.", "Use get(index) instead of bracket notation.", "Return -1 only after the loop has checked every element."] },
      { id: "search-variations", title: "Useful Search Variations", eyebrow: "Change what counts as a match", lead: "A search can look for an exact value, the first value satisfying a condition, or every matching position.", examples: [{ label: "First passing score", code: "public static int firstPassing(int[] scores) {\n    for (int i = 0; i < scores.length; i++) {\n        if (scores[i] >= 70) {\n            return i;\n        }\n    }\n    return -1;\n}" }, { label: "Count all matches", code: "int matches = 0;\nfor (int value : values) {\n    if (value == target) matches++;\n}" }] },
      { id: "search-binary", title: "Binary Search", eyebrow: "Discard half of sorted data", lead: "Binary search works only when the data is sorted. It compares the target with the middle element, then continues in only the half that could still contain the target.", concepts: [{ label: "low", detail: "First index still eligible." }, { label: "high", detail: "Last index still eligible." }, { label: "mid", detail: "Middle of the current eligible range." }], examples: [{ label: "Reusable binary search", code: "public static int binarySearch(int[] values, int target) {\n    int low = 0;\n    int high = values.length - 1;\n\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (values[mid] == target) {\n            return mid;\n        } else if (values[mid] < target) {\n            low = mid + 1;\n        } else {\n            high = mid - 1;\n        }\n    }\n    return -1;\n}" }], rules: ["The array must already be sorted in ascending order for this version.", "When the middle value is too small, move low to mid + 1.", "When the middle value is too large, move high to mid - 1.", "low > high means no eligible indexes remain, so return -1."], callout: { title: "The speed comes from elimination", body: "Linear search may inspect every element. Binary search repeatedly removes half of the remaining positions, but only because sorted order tells it which half cannot contain the target." } },
      { id: "search-binary-trace", title: "Tracing Binary Search", eyebrow: "Track the shrinking range", lead: "Record low, high, mid, and values[mid] for every iteration. Do not jump to the target by sight; follow the exact range updates the algorithm performs.", examples: [{ label: "Find 19 in {3, 7, 11, 15, 19, 24, 30}", code: "low 0, high 6 → mid 3, value 15: too small\nlow 4, high 6 → mid 5, value 24: too large\nlow 4, high 4 → mid 4, value 19: return 4" }], callout: { title: "mid is an index", body: "Compare values[mid] with target. Then update a boundary past mid so the eligible range actually becomes smaller." } },
      { id: "search-combined", title: "A Complete Search Program", eyebrow: "Search, interpret, report", lead: "This program keeps the algorithm inside a reusable method and lets main decide how to report the result.", examples: [{ label: "Course lookup", code: "public static int findCourse(String[] courses, String target) {\n    for (int i = 0; i < courses.length; i++) {\n        if (courses[i].equalsIgnoreCase(target)) return i;\n    }\n    return -1;\n}\n\nString[] courses = {\"Java\", \"Math\", \"Writing\"};\nint result = findCourse(courses, \"math\");\nif (result == -1) {\n    System.out.println(\"Not found\");\n} else {\n    System.out.println(\"Index: \" + result);\n}" }], takeaways: ["Linear search checks elements in order and works on unsorted data.", "Binary search repeatedly halves a sorted search range.", "Return an index when location matters.", "Use -1 to represent no matching index.", "Check failure before indexing.", "Adapt access syntax for arrays, ArrayLists, and Strings."] },
    ],
  },
  {
    id: "sorting",
    unit: "Unit VI · Basic Algorithms",
    title: "Sorting",
    description: "Understand sorting as a traceable sequence of comparisons, swaps, and repeated passes.",
    sections: [
      { id: "sorting-purpose", title: "What Sorting Does", eyebrow: "Arrange by an order", lead: "Sorting rearranges data into an order such as smallest to largest or alphabetical. The algorithm must explain how the positions change, not merely call a library method.", examples: [{ label: "Transformation", code: "Before: {7, 2, 5, 1}\nAfter:  {1, 2, 5, 7}" }], concepts: [{ label: "compare", detail: "Decide whether two values are out of order." }, { label: "swap", detail: "Exchange their positions." }, { label: "pass", detail: "A repeated scan that moves data toward order." }] },
      { id: "sorting-swap", title: "Swapping Two Elements", eyebrow: "Use a temporary variable", lead: "A correct swap saves one value before overwriting its position.", examples: [{ label: "Swap indexes i and j", code: "int temp = values[i];\nvalues[i] = values[j];\nvalues[j] = temp;" }], callout: { title: "Without temp, one value is lost", body: "Assigning values[i] = values[j] first destroys the original values[i] unless it was saved.", tone: "warning" } },
      { id: "sorting-selection", title: "Selection Sort Idea", eyebrow: "Select the smallest remaining value", lead: "For each starting position, scan the unsorted remainder, remember the smallest index, then swap that value into the starting position.", examples: [{ label: "Selection sort", code: "for (int start = 0; start < values.length - 1; start++) {\n    int minIndex = start;\n    for (int i = start + 1; i < values.length; i++) {\n        if (values[i] < values[minIndex]) {\n            minIndex = i;\n        }\n    }\n    int temp = values[start];\n    values[start] = values[minIndex];\n    values[minIndex] = temp;\n}" }] },
      { id: "sorting-trace", title: "Tracing Selection Sort", eyebrow: "Record the array after each pass", lead: "A pass chooses one final position. Trace start, every comparison, minIndex changes, and the resulting swap.", examples: [{ label: "Sort {7, 2, 5, 1}", code: "start 0: smallest is 1 → {1, 2, 5, 7}\nstart 1: smallest is 2 → {1, 2, 5, 7}\nstart 2: smallest is 5 → {1, 2, 5, 7}" }], rules: ["The sorted prefix grows one position per pass.", "The inner loop begins after start.", "The final element is automatically in place after earlier positions are fixed."] },
      { id: "sorting-bubble", title: "Repeated Adjacent Comparisons", eyebrow: "Another introductory strategy", lead: "Bubble sort compares neighboring elements and swaps them when they are out of order. Repeated passes move large values toward the end.", examples: [{ label: "One bubble pass", code: "for (int i = 0; i < values.length - 1; i++) {\n    if (values[i] > values[i + 1]) {\n        int temp = values[i];\n        values[i] = values[i + 1];\n        values[i + 1] = temp;\n    }\n}" }], callout: { title: "A single pass may not finish the sort", body: "Adjacent swaps usually require multiple passes before every value reaches its correct position." } },
      { id: "sorting-common-errors", title: "Sorting Mistakes", eyebrow: "Protect the indexes and state", lead: "Sorting code combines nested loops, indexed comparisons, and swaps, so small boundary mistakes can corrupt the algorithm.", rules: ["Use i < length - 1 before accessing i + 1.", "Reset minIndex for every outer pass.", "Compare values, but remember indexes for swapping.", "Trace duplicate and already sorted inputs.", "Do not claim a pass did more than it guarantees."] },
      { id: "sorting-combined", title: "Sort and Verify", eyebrow: "Use the algorithm's result", lead: "After sorting, a program can print the ordered values or verify that every adjacent pair is in order.", examples: [{ label: "Verify ascending order", code: "boolean sorted = true;\nfor (int i = 0; i < values.length - 1; i++) {\n    if (values[i] > values[i + 1]) {\n        sorted = false;\n    }\n}\nSystem.out.println(sorted);" }], takeaways: ["Sorting transforms element positions into a chosen order.", "A swap needs a temporary variable.", "Selection sort grows a sorted prefix.", "Bubble-style passes compare adjacent elements.", "Trace intermediate arrays, not only the final result."] },
    ],
  },
  {
    id: "algorithmic-problem-solving",
    unit: "Unit VI · Basic Algorithms",
    title: "Algorithmic Problem Solving & Program Tracing",
    description: "Turn requirements into steps and predict execution across variables, branches, loops, methods, arrays, and Strings.",
    sections: [
      { id: "algorithm-problem", title: "From Problem to Algorithm", eyebrow: "Solve before translating", lead: "An algorithm is a finite sequence of unambiguous steps that transforms input into the required output. Write the data flow and cases before Java syntax.", concepts: [{ label: "Input", detail: "What data is available?" }, { label: "Output", detail: "What exact result is required?" }, { label: "State", detail: "What must be remembered while processing?" }, { label: "Steps", detail: "What order produces the result?" }], examples: [{ label: "Count passing scores", code: "1. Set passed to 0.\n2. Visit every score.\n3. If a score is at least 70, add one to passed.\n4. Output passed." }] },
      { id: "algorithm-cases", title: "Examples, Constraints, and Cases", eyebrow: "Clarify the requirement", lead: "Before coding, choose examples that expose normal behavior, boundaries, empty input, and failure cases. Constraints determine which algorithms and initial values are safe.", examples: [{ label: "Search cases", code: "target at first index\ntarget at final index\ntarget absent\nduplicate target\nempty collection" }], callout: { title: "A vague requirement produces vague code", body: "Define what should happen when no result exists, when input is invalid, or when several results match." } },
      { id: "trace-variables", title: "Tracing Variables and Branches", eyebrow: "Record only state changes", lead: "A trace table lists each executed statement and the values that change. For a branch, evaluate the condition and follow only the selected path.", examples: [{ label: "Trace a branch", code: "int x = 4;\nint y = 3;\nif (x > y) {\n    x += y;\n} else {\n    y += x;\n}\nSystem.out.println(x);\n\n// x=4, y=3, condition true, x=7, output 7" }] },
      { id: "trace-loops", title: "Tracing Loops", eyebrow: "One iteration per row", lead: "Record the condition, important variables before the body, output or state changes, and the update. Check the condition again before creating the next row.", examples: [{ label: "Trace accumulation", code: "int sum = 0;\nfor (int i = 1; i <= 3; i++) {\n    sum += i * 2;\n}\n// i=1 sum=2\n// i=2 sum=6\n// i=3 sum=12" }] },
      { id: "trace-methods-arrays", title: "Tracing Methods and Arrays", eyebrow: "Follow calls and indexed state", lead: "For a method call, bind arguments to parameters and trace the local body. For arrays, record indexes and any element that changes.", examples: [{ label: "Trace an array method", code: "public static void addOne(int[] values) {\n    for (int i = 0; i < values.length; i++) {\n        values[i]++;\n    }\n}\n\nint[] data = {2, 4};\naddOne(data);\n// data becomes {3, 5}" }], callout: { title: "Arrays can be changed by a method", body: "The parameter and the caller both access the same array, so indexed updates remain visible after the method finishes." } },
      { id: "algorithm-refine", title: "Refining and Debugging an Algorithm", eyebrow: "Compare prediction with result", lead: "When output is wrong, find the first trace step where actual state differs from expected state. Repair the smallest responsible rule, then rerun the same test.", concepts: [{ label: "Predict", detail: "Write the expected state or output." }, { label: "Run", detail: "Observe the actual behavior." }, { label: "Locate", detail: "Find the first divergence." }, { label: "Repair", detail: "Change the responsible statement or condition." }, { label: "Retest", detail: "Use the original and boundary cases." }], examples: [{ label: "Find the first wrong state", code: "int[] values = {2, 4, 6};\nint sum = 0;\nfor (int value : values) {\n    sum = value; // actual states: 2, 4, 6\n}\n// expected states: 2, 6, 12\n// repair: sum += value;", note: "The first iteration matches by accident. The second exposes the first divergence: expected 6, actual 4. That evidence points directly to replacement instead of accumulation." }] },
      { id: "algorithm-combined", title: "Combined Tracing Example", eyebrow: "Use the full course toolkit", lead: "This method searches for the largest even number and returns -1 when no even value exists. Trace candidate changes rather than guessing the final result.", examples: [{ label: "Largest even value", code: "public static int largestEven(int[] values) {\n    int best = -1;\n    for (int value : values) {\n        if (value % 2 == 0 && value > best) {\n            best = value;\n        }\n    }\n    return best;\n}\n\nint[] data = {3, 8, 5, 12, 10};\nint answer = largestEven(data);\nSystem.out.println(answer); // 12" }], takeaways: ["An algorithm is a finite, precise procedure.", "Clarify inputs, outputs, constraints, and failure cases first.", "Trace only executed paths and record state changes.", "Follow method calls with local parameters and returned values.", "Debug from the first divergence between expected and actual state."] },
    ],
  },
  {
    id: "input-output",
    unit: "Unit VII · Program Development",
    title: "Input & Output",
    description: "Process structured streams of console and introductory file data, then produce clear formatted output.",
    sections: [
      { id: "io-streams", title: "Input and Output Streams", eyebrow: "Data enters and leaves", lead: "A stream is an ordered flow of data. System.in supplies console input, while System.out receives program output. Programs usually read one piece, interpret it, update state, and continue.", concepts: [{ label: "System.in", detail: "Standard input, usually the keyboard." }, { label: "System.out", detail: "Standard output, usually the console." }, { label: "Scanner", detail: "Breaks incoming text into useful values." }], examples: [{ label: "Follow one value through both streams", code: "Scanner input = new Scanner(System.in);\nint score = input.nextInt();  // Scanner takes the next int from System.in\nscore += 5;                   // program state changes\nSystem.out.println(score);    // the result is sent through System.out", note: "The ordered input stream supplies the value once; the variable stores and changes it; the ordered output stream exposes the final state." }] },
      { id: "io-structured-console", title: "Structured Console Input", eyebrow: "Read repeated records", lead: "Structured input has a known order. The program must read fields in the same order and store each field with a matching type.", examples: [{ label: "Read three item records", code: "double total = 0;\nfor (int item = 1; item <= 3; item++) {\n    String name = input.next();\n    int quantity = input.nextInt();\n    double price = input.nextDouble();\n    total += quantity * price;\n    System.out.println(name + \": \" + (quantity * price));\n}\nSystem.out.println(\"Total: \" + total);" }], callout: { title: "The input contract matters", body: "If the program expects name, quantity, price, then supplying those fields in another order causes incorrect reads or input errors." } },
      { id: "io-formatting", title: "Formatting Output", eyebrow: "Make results readable", lead: "printf uses a format String with placeholders. %s displays text, %d displays an integer, %.2f displays a decimal with two digits after the point, and %n ends the line. Values after the format String fill the placeholders from left to right.", concepts: [{ label: "%s", detail: "String value." }, { label: "%d", detail: "Whole-number value." }, { label: "%.2f", detail: "Decimal rounded to two places." }, { label: "%n", detail: "Portable line break." }], examples: [{ label: "Format a receipt line", code: "String item = \"Notebook\";\nint quantity = 3;\ndouble total = 13.5;\nSystem.out.printf(\"%s %d $%.2f%n\", item, quantity, total);" }] },
      { id: "io-file-basics", title: "Introductory File Input", eyebrow: "Read a stored data source", lead: "A File value identifies a stored file, and Scanner can read from that file instead of System.in. File access can fail when a path is missing, so this introductory example adds one required header phrase.", concepts: [{ label: "new File(\"scores.txt\")", detail: "Identifies the file named scores.txt." }, { label: "new Scanner(...)", detail: "Creates a Scanner that reads from that file." }, { label: "hasNextInt()", detail: "Checks whether another integer is available before reading." }, { label: "close()", detail: "Releases the file input source after processing." }], examples: [{ label: "Read integers from a file", code: "import java.io.File;\nimport java.io.FileNotFoundException;\nimport java.util.Scanner;\n\npublic static void main(String[] args) throws FileNotFoundException {\n    File source = new File(\"scores.txt\");\n    Scanner fileInput = new Scanner(source);\n    int sum = 0;\n    while (fileInput.hasNextInt()) {\n        sum += fileInput.nextInt();\n    }\n    fileInput.close();\n    System.out.println(sum);\n}" }], callout: { title: "One new boilerplate phrase", body: "For this chapter, copy throws FileNotFoundException after the main header. It allows this small program to stop if the file cannot be opened; a later Java course can teach full exception handling. The loops and calculations are already familiar." } },
      { id: "io-has-next", title: "Reading Until Input Ends", eyebrow: "No sentinel required", lead: "hasNextInt() asks whether another integer is available before reading it. This supports files or pasted data whose record count is not known in advance.", examples: [{ label: "Count and average all values", code: "int count = 0;\nint sum = 0;\nwhile (fileInput.hasNextInt()) {\n    sum += fileInput.nextInt();\n    count++;\n}\nif (count > 0) {\n    System.out.println((double) sum / count);\n}" }], rules: ["Check hasNextInt before nextInt when input may end.", "Protect division when zero values were read.", "Close a file Scanner after processing."] },
      { id: "io-record-processing", title: "Processing Multiple Data Fields", eyebrow: "One record at a time", lead: "For repeated records, read every field for one record, validate or calculate with that record, then move to the next. hasNext() checks whether any next whitespace-separated value is available; unlike hasNextInt(), it does not require that value to be an integer.", examples: [{ label: "Process names and scores", code: "while (fileInput.hasNext()) {\n    String name = fileInput.next();\n    int score = fileInput.nextInt();\n    String result;\n    if (score >= 70) {\n        result = \"Pass\";\n    } else {\n        result = \"Retry\";\n    }\n    System.out.printf(\"%s %d %s%n\", name, score, result);\n}" }], callout: { title: "Do not mix record boundaries", body: "Complete the fields for the current record before reading the next record's first field.", tone: "warning" } },
      { id: "io-combined", title: "A Complete Data-Processing Program", eyebrow: "Read, summarize, format", lead: "This program reads an unknown quantity of scores, calculates summary statistics, and formats the result using only previously learned initialization rules.", examples: [{ label: "Score summary", code: "int count = 0;\nint sum = 0;\nint max = 0;\n\nwhile (input.hasNextInt()) {\n    int score = input.nextInt();\n    sum += score;\n    if (count == 0 || score > max) {\n        max = score;\n    }\n    count++;\n}\n\nif (count == 0) {\n    System.out.println(\"No scores\");\n} else {\n    double average = (double) sum / count;\n    System.out.printf(\"Count: %d%nAverage: %.2f%nMax: %d%n\", count, average, max);\n}" }], takeaways: ["Input and output are ordered streams of data.", "Read structured fields in the expected order.", "printf produces controlled labeled output.", "Scanner can process keyboard or introductory file input.", "Use hasNext methods when the amount of input is unknown.", "Clearly label copied boilerplate that is not yet part of the independent toolkit."] },
    ],
  },
  {
    id: "debugging-testing",
    unit: "Unit VII · Program Development",
    title: "Debugging, Testing & Program Design",
    description: "Classify failures, isolate their cause, design boundary tests, and repair programs systematically.",
    sections: [
      { id: "debug-error-types", title: "When Failures Appear", eyebrow: "Classify before fixing", lead: "Different failures require different evidence. A program can fail before it runs, crash while running, or finish while producing the wrong result. A syntax error is one kind of compile-time error.", concepts: [{ label: "Compile-time", detail: "Java cannot translate the source because syntax, types, names, or required returns are invalid." }, { label: "Syntax error", detail: "A compile-time error caused by breaking Java's writing rules." }, { label: "Runtime", detail: "Valid code starts, then reaches an illegal operation." }, { label: "Logic", detail: "The program finishes, but its algorithm produces the wrong result." }], examples: [{ label: "Examples", code: "missing ;                 // compile-time syntax error\nint x = \"five\";        // compile-time type error\nvalues[values.length]    // runtime error\nage > 18 when 18 counts // logic error" }] },
      { id: "debug-messages", title: "Reading Error Information", eyebrow: "Start at the first useful location", lead: "Compiler and runtime messages identify an error category, file, and line. The reported line is evidence, not always the entire cause.", concepts: [{ label: "What", detail: "The error type or message." }, { label: "Where", detail: "The reported line and nearby code." }, { label: "State", detail: "The values or indexes present at failure." }, { label: "Cause", detail: "The violated rule that explains the message." }], examples: [{ label: "Turn a message into a cause", code: "int[] values = {10, 20};\nint index = 2;\nSystem.out.println(values[index]);\n// ArrayIndexOutOfBoundsException at this line", note: "What: an invalid array index. Where: values[index]. State: index is 2 while length is 2. Cause: valid indexes stop at length - 1, so the first repair target is the value or rule that produced index 2." }], callout: { title: "Fix the first compiler error first", body: "One missing brace or semicolon can create many later messages that disappear after the original error is repaired." } },
      { id: "debug-isolate", title: "Isolating a Bug", eyebrow: "Shrink the search area", lead: "Find the first point where program state differs from the expected state. Inspect the smallest expression, condition, loop, or method responsible for that change.", examples: [{ label: "Trace a wrong average", code: "int sum = 5;\nint count = 2;\ndouble average = sum / count; // stores 2.0, expected 2.5\n\n// first divergence: integer division\ndouble average = (double) sum / count;" }], rules: ["Reproduce the failure with a small input.", "Write expected intermediate values.", "Print or trace actual intermediate values.", "Change one responsible rule at a time."] },
      { id: "testing-cases", title: "Designing Test Cases", eyebrow: "Choose evidence deliberately", lead: "A useful test set covers ordinary values, boundaries, invalid input, empty or smallest collections, and cases that reach every branch.", concepts: [{ label: "Typical", detail: "Normal expected use." }, { label: "Boundary", detail: "Exactly where behavior changes." }, { label: "Outside", detail: "Just beyond a valid boundary." }, { label: "Structural", detail: "Empty, one element, duplicates, already sorted." }], examples: [{ label: "Tests for age >= 18", code: "17 → false\n18 → true\n19 → true\n-1 → invalid if age validation exists" }] },
      { id: "testing-expected", title: "Expected vs Actual", eyebrow: "Make tests checkable", lead: "Every test needs a known expected result. Otherwise running the program only proves that it produced something.", examples: [{ label: "Test table", code: "Input         Expected\n{3,1,2}       {1,2,3}\n{}            {}\n{5}           {5}\n{2,2,1}       {1,2,2}" }], callout: { title: "A test passes only when actual equals expected", body: "Write expected output before running the code whenever possible." } },
      { id: "design-increments", title: "Build Programs in Working Increments", eyebrow: "Reduce the size of failures", lead: "Implement and test one coherent layer at a time: input, one calculation, one branch, one loop, then method extraction. A small broken step is easier to diagnose than a complete broken program.", concepts: [{ label: "1", detail: "Make input and output work." }, { label: "2", detail: "Add one calculation or decision." }, { label: "3", detail: "Test normal and boundary cases." }, { label: "4", detail: "Add the next requirement." }, { label: "5", detail: "Refactor repeated logic into methods." }], examples: [{ label: "Grow one verified layer at a time", code: "// Step 1: read and echo\nint score = input.nextInt();\nSystem.out.println(score);\n\n// Step 2: add classification\nif (score >= 70) {\n    System.out.println(\"Pass\");\n}\n\n// Step 3 tests: 69, 70, 71", note: "If the first layer fails, Scanner or storage is responsible. If only the boundary test fails after Step 2, the new condition is responsible. Incremental work keeps the search area small." }] },
      { id: "debug-combined", title: "A Systematic Repair", eyebrow: "Trace, fix, retest", lead: "This broken loop intends to average every array value. Identify each independent defect, repair it, then verify with an array whose average is fractional.", examples: [{ label: "Broken version", code: "int[] values = {2, 3, 5};\nint sum = 0;\nfor (int i = 0; i <= values.length; i++) {\n    sum = values[i];\n}\ndouble average = sum / values.length;" }, { label: "Repaired version", code: "int sum = 0;\nfor (int i = 0; i < values.length; i++) {\n    sum += values[i];\n}\ndouble average = (double) sum / values.length;" }], takeaways: ["Classify the failure before choosing a fix.", "Use messages and trace state as evidence.", "Locate the first divergence from expected behavior.", "Test typical, boundary, invalid, and structural cases.", "Build and verify programs in small working increments."] },
    ],
  },
  {
    id: "computers-programs-algorithms",
    unit: "Unit VIII · CS Foundations",
    title: "Algorithms, Programs & Computers",
    description: "Connect source code and algorithms to the hardware and software process that executes a program.",
    sections: [
      { id: "foundations-program", title: "What a Program Is", eyebrow: "Instructions plus data", lead: "A program is an organized sequence of instructions that a computer executes to transform input and stored state into output. The computer follows the instructions precisely; it does not infer missing intent.", concepts: [{ label: "Instructions", detail: "Operations and control flow." }, { label: "Data", detail: "Values being stored and processed." }, { label: "State", detail: "Current values at one moment of execution." }, { label: "Output", detail: "Observable result of the computation." }], examples: [{ label: "Point to the program parts", code: "int score = input.nextInt(); // instruction reads data; score becomes current state\nscore += 5;                  // instruction changes that state\nSystem.out.println(score);   // instruction makes the final state observable", note: "The source contains instructions. The entered and calculated values are data. score's current value is state. println creates output." }] },
      { id: "foundations-algorithm", title: "What an Algorithm Is", eyebrow: "A language-independent procedure", lead: "An algorithm describes a finite, unambiguous solution procedure. Java is one way to implement that procedure.", examples: [{ label: "Algorithm then Java", code: "Algorithm: keep the largest value seen so far.\n\nJava:\nint max = values[0];\nfor (int value : values) {\n    if (value > max) max = value;\n}" }], rules: ["An algorithm must eventually stop.", "Each step must be precise enough to execute.", "The same algorithm can be implemented in different programming languages."] },
      { id: "foundations-translation", title: "From Source Code to Execution", eyebrow: "Compile, load, run", lead: "Java source code is checked and compiled into bytecode. The Java Virtual Machine loads and executes that bytecode on the computer.", concepts: [{ label: ".java source", detail: "Human-readable Java code." }, { label: "compiler", detail: "Checks and translates source into bytecode." }, { label: ".class bytecode", detail: "Portable instructions for the JVM." }, { label: "JVM", detail: "Executes bytecode on a specific system." }], examples: [{ label: "The same line at different stages", code: "Main.java source: System.out.println(2 + 3);\n        ↓ compiler checks and translates\nMain.class bytecode\n        ↓ JVM executes\nConsole output: 5", note: "The source line is what you write. Compilation must succeed before bytecode exists. Only execution by the JVM produces the output." }], callout: { title: "Compile-time and runtime are different stages", body: "A compiler error prevents execution. A runtime error occurs after valid code has started running." } },
      { id: "foundations-hardware", title: "Hardware and Software Roles", eyebrow: "Physical system and instructions", lead: "Hardware performs physical computation and storage. Software provides instructions and organized data that direct the hardware.", concepts: [{ label: "CPU", detail: "Executes low-level instructions." }, { label: "Memory", detail: "Holds active program instructions and data." }, { label: "Storage", detail: "Keeps files and programs beyond one run." }, { label: "I/O devices", detail: "Move data between the system and its environment." }, { label: "Operating system", detail: "Coordinates programs and hardware resources." }], examples: [{ label: "One program run through the system", code: "Storage: Main.class exists between runs\nMemory: Main.class instructions and int score are active now\nCPU: executes score += 5\nKeyboard: supplies Scanner input\nDisplay: shows System.out output\nOperating system: gives the process access to these resources", note: "These are different responsibilities around the same Java program, not interchangeable vocabulary." }] },
      { id: "foundations-languages", title: "Programming Languages", eyebrow: "Different levels of expression", lead: "Programming languages provide syntax and semantics for expressing algorithms. Higher-level languages such as Java hide many hardware details while still requiring exact rules.", concepts: [{ label: "Syntax", detail: "How valid code is written." }, { label: "Semantics", detail: "What valid code means when executed." }, { label: "Library", detail: "Reusable code supplied for common tasks." }, { label: "Abstraction", detail: "Use a simpler interface without handling every lower-level detail." }], examples: [{ label: "Four ideas in familiar Java", code: "Scanner input = new Scanner(System.in);\nint age = input.nextInt();", note: "Parentheses and semicolons are syntax. The line's meaning—read an int and store it in age—is semantics. Scanner comes from a library. nextInt is an abstraction: you use typed input without controlling keyboard hardware yourself." }] },
      { id: "foundations-model", title: "Modeling a Problem", eyebrow: "Choose data and operations", lead: "Programming begins by deciding which parts of a real situation matter, how to represent them as data, and what operations produce the required result.", examples: [{ label: "Model a grade report", code: "Relevant data: student name, scores\nRepresentation: String and int[]\nOperations: sum, average, min, max\nOutput: formatted summary" }], callout: { title: "A model is intentionally selective", body: "A program does not reproduce reality; it represents the details needed for one computational goal." } },
      { id: "foundations-combined", title: "Problem to Running Program", eyebrow: "The complete chain", lead: "A reliable solution moves through requirements, algorithm, implementation, compilation, tests, and execution rather than jumping directly to syntax.", concepts: [{ label: "1", detail: "Clarify inputs, outputs, and constraints." }, { label: "2", detail: "Write and test an algorithm with examples." }, { label: "3", detail: "Represent the data and implement in Java." }, { label: "4", detail: "Compile and repair language errors." }, { label: "5", detail: "Run test cases and debug behavior." }], examples: [{ label: "A boundary requirement through the chain", code: "Requirement: 70 and above passes\nAlgorithm: if score >= 70, report Pass; otherwise Retry\nJava: String result = score >= 70 ? \"Pass\" : \"Retry\";\nCompile: repair syntax or type errors\nTests: 69 → Retry, 70 → Pass, 71 → Pass\nRun: compare actual output with those predictions", note: "Each stage creates evidence for the next. The boundary tests verify that the implementation matches the original requirement." }], takeaways: ["A program is executable instructions operating on data.", "An algorithm is a finite precise procedure independent of Java syntax.", "Java source is compiled to bytecode executed by the JVM.", "Hardware executes; software organizes instructions and data.", "Good programs begin with a deliberate model of the problem."] },
    ],
  },
  {
    id: "cs-context-applications",
    unit: "Unit VIII · CS Foundations",
    title: "CS Applications, Concepts & History",
    description: "Place introductory programming inside the broader development, applications, and responsibilities of computer science.",
    sections: [
      { id: "cs-discipline", title: "Computer Science as a Discipline", eyebrow: "More than writing code", lead: "Computer science studies computation: what can be represented, how problems can be solved, how efficiently solutions work, and how computing systems affect the world.", concepts: [{ label: "Algorithms", detail: "Procedures for solving problems." }, { label: "Data", detail: "Representations programs operate on." }, { label: "Systems", detail: "Hardware and software working together." }, { label: "Human context", detail: "People, institutions, and consequences around computing." }], examples: [{ label: "One familiar program, four CS questions", code: "int index = linearSearch(scores, target);\nSystem.out.println(index);", note: "Algorithm: why does linear search find the first match? Data: why is an int[] appropriate? Systems: what executes the compiled instructions? Human context: what does -1 mean to the person using the result? Writing the two lines is programming; studying all four questions is computer science." }] },
      { id: "cs-history", title: "A Practical Computing Timeline", eyebrow: "Ideas became programmable machines", lead: "Computing developed through mathematical algorithms, mechanical calculation, electronic stored-program computers, high-level languages, personal computers, networks, and today's large-scale data and AI systems.", concepts: [{ label: "Algorithms", detail: "Step-based calculation predates electronic computers." }, { label: "Stored program", detail: "Instructions and data can both live in memory." }, { label: "High-level languages", detail: "Programs became more portable and expressive." }, { label: "Networks", detail: "Computers began exchanging data globally." }, { label: "Modern computing", detail: "Cloud, mobile, data science, and AI combine earlier foundations." }], examples: [{ label: "What changed—and what stayed", code: "Algorithm: search the records for a matching name\nJava source: for (...) { ... }\nStored program: instructions and records are loaded into memory\nNetworked system: records may arrive from another computer", note: "The search procedure is an old idea. Java, stored-program hardware, and networks change how and where that procedure is expressed and executed." }], callout: { title: "History is cumulative", body: "Modern tools still rely on representation, algorithms, memory, control flow, and testing—the same core ideas practiced in this course." } },
      { id: "cs-applications", title: "Applications Across Disciplines", eyebrow: "Computing serves many domains", lead: "The same programming structures support scientific measurement, business records, media, public services, health data, language analysis, and creative systems.", concepts: [{ label: "Science", detail: "Simulation, measurement, and data processing." }, { label: "Health", detail: "Records, imaging, monitoring, and research." }, { label: "Business", detail: "Transactions, forecasting, and logistics." }, { label: "Media", detail: "Graphics, audio, video, and interaction." }, { label: "Humanities", detail: "Text analysis, archives, and cultural research." }], examples: [{ label: "The domain changes; the structures remain", code: "for (int value : measurements) {\n    if (value > limit) {\n        flagged++;\n    }\n}", note: "measurements might be temperatures, heart rates, transaction totals, audio levels, or word counts. The variable meanings and responsibility change, while the loop, comparison, and counter work the same way." }] },
      { id: "cs-representation", title: "Representation and Abstraction", eyebrow: "Turn phenomena into data", lead: "Computers process representations: numbers for quantities, Strings for text, booleans for conditions, arrays for collections, and methods for named operations. Every representation preserves some details and omits others.", examples: [{ label: "One event, several representations", code: "String eventName = \"Workshop\";\nint seats = 30;\nboolean registrationOpen = true;\nString[] attendees = new String[seats];" }] },
      { id: "cs-limits", title: "Correctness, Limits, and Responsibility", eyebrow: "Programs act inside human systems", lead: "A program can be syntactically correct and still use incomplete data, encode a flawed rule, expose private information, or create unequal outcomes.", concepts: [{ label: "Correctness", detail: "Does the program satisfy its stated requirements?" }, { label: "Data quality", detail: "Are inputs accurate and appropriate?" }, { label: "Privacy", detail: "Should this data be collected or exposed?" }, { label: "Impact", detail: "Who benefits, fails, or bears risk?" }], examples: [{ label: "Correct execution does not prove a good rule", code: "boolean accepted = score >= 70;", note: "Java can execute this line exactly as written. That proves only implementation correctness. You must separately ask whether score is accurate, whether 70 is the right boundary, whether other evidence matters, and what happens to people near the boundary." }], callout: { title: "Testing code is not the same as validating the goal", body: "A perfectly implemented rule can still be the wrong rule for the people affected." } },
      { id: "cs-career-foundations", title: "Foundations for Later Study", eyebrow: "Where CISC 1115 leads", lead: "This course establishes procedural programming and problem-solving foundations. Later courses deepen objects, data structures, architecture, systems, algorithms, software design, and specialized applications.", examples: [{ label: "Concept progression", code: "CISC 1115: procedural Java and basic algorithms\nLater: object-oriented design, data structures, systems, theory, applications" }], rules: ["Do not confuse introductory exposure with mastery of an advanced field.", "Strong later work depends on tracing, decomposition, testing, and data representation learned here."] },
      { id: "cs-context-takeaways", title: "Key Takeaways", eyebrow: "Chapter summary", lead: "Programming is one practical entry point into a broader discipline shaped by mathematical ideas, machines, applications, and human choices.", takeaways: ["Computer science studies computation, data, algorithms, systems, and their contexts.", "Modern computing builds on a long development of representation and programmable machines.", "The same core structures support applications across disciplines.", "Representations and models always select which details matter.", "Correctness includes requirements, evidence, data quality, and human impact."] },
    ],
  },
  {
    id: "cumulative-challenges",
    unit: "Final · Course Synthesis",
    title: "Cumulative Programming Challenges",
    description: "Solve substantial programs that require choosing and combining the full CISC 1115 toolkit.",
    sections: [
      { id: "challenges-briefing", title: "Challenge Briefing", eyebrow: "Demonstrate, do not review", lead: "This chapter is a programming campaign rather than another reading lesson. Each challenge supplies requirements and tests; you decide which variables, conditions, loops, methods, collections, and algorithms belong in the solution.", concepts: [{ label: "Interpret", detail: "Extract inputs, outputs, constraints, and cases." }, { label: "Design", detail: "Choose data structures and method boundaries." }, { label: "Implement", detail: "Build in testable increments." }, { label: "Verify", detail: "Trace and test boundaries before submitting." }], examples: [{ label: "Turn one requirement into a work plan", code: "Requirement: print the average of entered scores; print No scores when none were entered.\n\nInterpret: input is an unknown number of scores; output has two cases\nDesign: Scanner + loop + count + sum\nImplement: read first, then calculate, then branch\nVerify: test no scores, one score, and a fractional average", note: "The challenge will not name every Java feature. Your job is to select already-learned tools from the required behavior." }], callout: { title: "Guidance deliberately decreases", body: "Later challenges name the behavior, not the Java features. Selecting an appropriate approach is part of the work." } },
      { id: "challenges-standard", title: "Submission Standard", eyebrow: "What a cleared challenge proves", lead: "A successful solution must satisfy the exact output and structural constraints, handle stated edge cases, and use readable decomposition rather than only matching one example.", rules: ["Match exact required output.", "Do not hard-code a result that should be calculated.", "Use methods for repeated or clearly separate subtasks.", "Protect indexes and invalid input.", "Test the provided case plus at least one boundary case."] },
    ],
  },
  {
    id: "final-assessment",
    unit: "Final · Course Synthesis",
    title: "CISC 1115 Final Assessment",
    description: "Demonstrate course-level tracing, debugging, algorithm choice, and programming without relying on reading completion.",
    sections: [
      { id: "final-instructions", title: "Assessment Instructions", eyebrow: "Cumulative demonstration", lead: "The assessment mixes exact-output tracing, missing code, debugging, algorithm explanation, and larger editor problems. Completion comes only from passing every assessment item.", concepts: [{ label: "Trace", detail: "Predict the exact executed behavior." }, { label: "Repair", detail: "Correct broken syntax or logic." }, { label: "Choose", detail: "Select an appropriate algorithm or structure." }, { label: "Build", detail: "Write code from requirements." }], examples: [{ label: "Match the evidence to the task", code: "Trace → write each changed value in execution order\nRepair → locate the first divergence from expected behavior\nChoose → justify the loop, collection, or search from the requirement\nBuild → implement and test one requirement at a time", note: "Every assessment action has already appeared in earlier lessons and practice. The final changes the amount of guidance, not the available toolkit." }], callout: { title: "Use evidence, not guessing", body: "For difficult items, write a trace table, test boundary cases, and reduce the problem into smaller methods before entering the final answer." } },
    ],
  },
];

// Internal prerequisite contract used to keep the 24 chapters cumulative.
// Entry lists only independently usable knowledge from earlier chapters;
// boilerplate is called out in the chapter that displays it.
export const courseContinuityModel: CourseContinuityChapter[] = [
  { chapterId: "variables-data-types", entry: ["No Java or programming knowledge assumed"], introduces: ["variables and assignment", "statements", "primitive and reference type labels", "int, double, boolean, char, and String", "declaration and reassignment", "println", "basic String concatenation", "semicolon and variable naming", "class and main as labeled boilerplate"], exit: ["Declare, update, and print basic typed values", "Join labels and values in output"] },
  { chapterId: "operators-expressions", entry: ["Variables, assignment, basic types, println, and concatenation"], introduces: ["operators, operands, and expressions", "arithmetic and modulus", "integer and decimal division", "double casts", "precedence and parentheses", "increment, decrement, prefix and postfix expression timing, and compound assignment", "line comments"], exit: ["Evaluate and trace numeric expressions", "Preserve fractional division intentionally", "Distinguish the expression value and final stored value of prefix and postfix updates", "Update stored numeric state"] },
  { chapterId: "input-basic-programs", entry: ["Variables, types, operators, comments, and sequential statements"], introduces: ["sequential program flow", "syntax, compilation, and runtime terminology", "Java library terminology", "import", "Scanner creation as labeled library-use syntax", "method calls and dot syntax", "nextInt, nextDouble, nextBoolean, next, and nextLine", "print versus println", "leftover newline behavior"], exit: ["Read typed console input", "Build input-store-calculate-output programs", "Explain each non-boilerplate Scanner line"] },
  { chapterId: "comparisons-booleans", entry: ["Typed input, arithmetic expressions, and boolean values"], introduces: ["comparison operators", "boolean expressions", "logical AND, OR, and NOT", "logical precedence", "conditional ternary operator"], exit: ["Build and trace compound true-or-false conditions", "Choose one of two compatible values with a conditional expression"] },
  { chapterId: "if-else", entry: ["Boolean expressions and typed input"], introduces: ["if, else, and else-if chains", "branches and blocks", "nesting", "boundary ordering and braces"], exit: ["Implement and trace multi-path decisions"] },
  { chapterId: "decision-programs", entry: ["Input, operators, comparisons, and branches"], introduces: ["algorithm as a finite ordered solution", "requirements-to-cases planning", "validation before classification", "menus and path testing"], exit: ["Plan and build validated decision programs", "Test every reachable branch"] },
  { chapterId: "while-loops", entry: ["Algorithms, conditions, branches, input, and variable updates"], introduces: ["iteration", "while and do-while loops", "pre-test versus post-test repetition", "loop control variables", "counters and accumulators", "sentinels", "infinite-loop diagnosis"], exit: ["Implement and trace condition-controlled repetition", "Choose whether zero or at least one execution is required"] },
  { chapterId: "for-loops", entry: ["while loops, counters, and accumulators"], introduces: ["for-loop initialization, condition, and update", "known-count repetition", "inclusive and exclusive ranges", "off-by-one reasoning"], exit: ["Choose and trace for loops over numeric ranges"] },
  { chapterId: "nested-loops", entry: ["for and while loops"], introduces: ["outer and inner loops", "nested-iteration tracing", "row/column patterns and tables"], exit: ["Build and trace two-dimensional repetition"] },
  { chapterId: "methods", entry: ["Variables, decisions, loops, input, output, casts, and basic String method calls"], introduces: ["method definitions and calls", "void", "parameters and arguments", "public static as course-level method syntax", "standard-library static calls", "Math.sqrt, Math.random, numeric parsing, and currentTimeMillis", "long as the whole-number return type of currentTimeMillis", "method-call composition", "reading Java API documentation", "decomposition"], exit: ["Extract and call reusable void methods with parameters", "Use documented standard-library methods and their return values"] },
  { chapterId: "returns-scope", entry: ["Method definitions, calls, parameters, arguments, and documented return types"], introduces: ["return values and return types", "method overloading and signatures", "local scope", "final local constants", "method composition", "early return"], exit: ["Write value-returning methods", "Select an overload from its argument list and distinguish its signature", "Trace local variables and nested calls", "Declare a scoped value that cannot be reassigned"] },
  { chapterId: "arrays", entry: ["Variables, methods, return values, and basic types"], introduces: ["fixed-size same-type arrays", "array declaration and creation", "zero-based indexes", "length field", "element access and update", "default values and out-of-bounds errors"], exit: ["Create, inspect, update, and pass arrays safely"] },
  { chapterId: "arrays-loops", entry: ["Arrays and for loops"], introduces: ["traversal", "for-each loops", "filling arrays", "sum and decimal average", "minimum, maximum, counting, and finding patterns", "in-place reversal and swapping", "array copying and corresponding-element operations"], exit: ["Process complete arrays with index or for-each traversal", "Reverse, copy, and combine arrays by index"] },
  { chapterId: "strings", entry: ["String variables, methods, arrays, indexes, loops, and conditions"], introduces: ["String length and charAt", "trim, concat, toLowerCase, and toUpperCase", "one- and two-argument substring", "indexOf and lastIndexOf with optional starting indexes", "contains, equals, equalsIgnoreCase, and compareTo", "character traversal and text accumulation"], exit: ["Compare, order, index, normalize, search, extract, and transform text"] },
  { chapterId: "arraylists", entry: ["Arrays, traversal, Strings, methods, and sentinels"], introduces: ["resizable ArrayList collections", "generic element type notation", "Integer and Double wrapper types", "add, get, set, remove, size, and isEmpty", "backward removal traversal"], exit: ["Collect, update, remove, and traverse a variable quantity of values"] },
  { chapterId: "searching", entry: ["Arrays, ArrayLists, Strings, loops, methods, and returns", "Ability to recognize when a provided array is already in ascending order"], introduces: ["linear search", "binary search", "sorted-order prerequisite for binary search", "target and search result terminology", "-1 failure convention", "first-match early return", "safe result handling", "low, high, mid, and half-range elimination"], exit: ["Implement and adapt reusable linear searches", "Trace and implement binary search when sorted input is provided"] },
  { chapterId: "sorting", entry: ["Nested loops, arrays, comparisons, and tracing"], introduces: ["sorting, comparison, swap, and pass terminology", "selection sort", "adjacent bubble-style passes", "sorted-order verification"], exit: ["Trace and implement introductory in-place sorting"] },
  { chapterId: "algorithmic-problem-solving", entry: ["Full procedural toolkit through searching and sorting"], introduces: ["formal algorithm constraints", "trace tables", "expected-versus-actual divergence", "array mutation through method parameters", "parallel-array reasoning"], exit: ["Design, trace, refine, and debug multi-step algorithms"] },
  { chapterId: "input-output", entry: ["Scanner, loops, methods, casts, records, and summaries"], introduces: ["input and output streams", "printf format placeholders", "File as an input source", "hasNext and close", "FileNotFoundException as labeled boilerplate", "unknown-length record processing"], exit: ["Process structured console or introductory file streams and format results"] },
  { chapterId: "debugging-testing", entry: ["Complete procedural Java toolkit and tracing"], introduces: ["compile-time, syntax, runtime, and logic failure categories", "compiler/runtime message evidence", "systematic isolation", "typical, boundary, invalid, and structural tests", "incremental development"], exit: ["Classify, isolate, repair, and retest program failures systematically"] },
  { chapterId: "computers-programs-algorithms", entry: ["Practical experience with programs, algorithms, syntax, libraries, compilation errors, and runtime errors"], introduces: ["formal program and algorithm definitions", "source, compiler, bytecode, and JVM execution chain", "hardware and software roles", "semantics and abstraction", "computational modeling"], exit: ["Explain how a Java solution moves from problem model to executing system"] },
  { chapterId: "cs-context-applications", entry: ["Procedural programming plus formal computer-science foundations"], introduces: ["computer science as a discipline", "historical and application context", "representation tradeoffs", "correctness, data quality, privacy, and impact"], exit: ["Connect implementation choices to broader computational and human contexts"] },
  { chapterId: "cumulative-challenges", entry: ["Every taught CISC 1115 programming and problem-solving tool"], introduces: ["No new Java syntax", "Independent selection and combination of the accumulated toolkit"], exit: ["Design and implement cumulative programs with minimal guidance"] },
  { chapterId: "final-assessment", entry: ["Cleared cumulative toolkit and challenges"], introduces: ["No new Java syntax or required terminology", "Independent course-level demonstration"], exit: ["Demonstrate CISC 1115 tracing, debugging, algorithm choice, and implementation independently"] },
];

export const additionalLearningChapters: CourseLearningChapter[] = chapterSpecs.map((chapter) => ({
  id: chapter.id,
  unit: chapter.unit,
  title: chapter.title,
  description: chapter.description,
  status: "authored",
  sections: [...chapter.sections.map(({ id, title }) => ({ id, title })), { id: `${chapter.id}-practice`, title: "Chapter Review" }],
}));

export const structuredLessonContent: Record<string, StructuredLessonSection[]> = Object.fromEntries(chapterSpecs.map((chapter) => [chapter.id, chapter.sections]));

const authoredPracticeQuestions: Record<string, CoursePracticeQuestion[]> = {
  "input-basic-programs": [
    exact("input-exec-q1", "Warm-up", "Trace statements", "Run from top to bottom", "What is the exact output?", "int score = 4;\nscore = score + 3;\nSystem.out.println(score);", "7", "Finish each line before moving to the next one.", "Correct. score stores 4, then 7, and only then prints."),
    exact("input-exec-q2", "Warm-up", "Trace reassignment", "Keep the newest stored value", "What is the exact output?", "int tickets = 5;\nSystem.out.println(tickets);\ntickets += 2;\nSystem.out.println(tickets);", "5\n7", "The first output happens before the update; the second happens after it.", "Correct. Sequential execution exposes the value before and after reassignment.", true),
    codeExact("input-exec-q3", "Apply", "Complete a sequence", "Calculate before output", "Replace the blank with one declaration so the program prints 24.", "int price = 8;\nint quantity = 3;\n___\nSystem.out.println(total);", "int total = price * quantity;", "Create total after both source values exist and before println uses it.", "Correct. The value is stored before the output statement runs."),
    exact("input-exec-q4", "Apply", "Trace precedence", "Follow the calculation line", "What is the exact output?", "int base = 10;\nint total = base + 2 * 3;\ntotal--;\nSystem.out.println(total);", "15", "Multiplication happens first, then subtraction by the standalone decrement.", "Correct. The calculation makes 16 and the next statement changes it to 15."),
    exact("input-exec-q5", "Challenge", "Trace text and numbers", "Respect left-to-right output", "What is the exact output?", "int first = 2;\nint second = 5;\nint sum = first + second;\nSystem.out.println(\"Values: \" + first + second);\nSystem.out.println(\"Sum: \" + sum);", "Values: 25\nSum: 7", "The first println begins with a String; the arithmetic was stored separately in sum.", "Correct. This separates concatenation order from numeric calculation.", true),

    codeExact("input-setup-q1", "Warm-up", "Write an import", "Make Scanner available", "Replace the blank with the exact import statement.", "___\n\npublic class Main {", "import java.util.Scanner;", "The package path is java.util and the statement ends with a semicolon.", "Correct. Scanner can now be named by its short type name."),
    codeExact("input-setup-q2", "Warm-up", "Create a Scanner", "Connect one reader to the keyboard", "Replace the blank with the complete Scanner creation statement.", "import java.util.Scanner;\n\n___\nint age = input.nextInt();", "Scanner input = new Scanner(System.in);", "Use Scanner as the type and constructor name; System.in is inside the parentheses.", "Correct. One Scanner named input now reads standard keyboard input."),
    multipleChoice("input-setup-q3", "Interpret System.in", "In Scanner input = new Scanner(System.in);, what does System.in represent at this point in the course?", ["The program's standard keyboard input source", "A String named in", "The value the user typed most recently", "A command that prints to the screen"], "The program's standard keyboard input source", "Focus on where the Scanner receives its data.", "Correct. System.in supplies the keyboard input stream to Scanner."),
    multipleChoice("input-setup-q4", "Reuse the same Scanner", "Which snippet follows the chapter's setup rule for reading two values?", ["Scanner input = new Scanner(System.in);\nint age = input.nextInt();\ndouble height = input.nextDouble();", "Scanner first = new Scanner(System.in);\nScanner second = new Scanner(System.in);", "int input = new Scanner(System.in);", "Scanner input = System.out.println();"], "Scanner input = new Scanner(System.in);\nint age = input.nextInt();\ndouble height = input.nextDouble();", "Create one reader, then call different reading methods on that same variable.", "Correct. One Scanner can read every value in this basic program."),
    codeExact("input-setup-q5", "Apply", "Repair setup", "Restore the Scanner type", "Rewrite only the broken Scanner creation line.", "String input = new Scanner(System.in);", "Scanner input = new Scanner(System.in);", "The created Scanner value must be stored in a Scanner variable.", "Correct. The variable type now matches the value created by new Scanner."),

    exact("input-number-q1", "Warm-up", "Trace an integer read", "Store a whole number", "The user enters 25. What value is stored in age? Type only the value.", "int age = input.nextInt();", "25", "nextInt reads the user's whole-number token and returns it.", "Correct. Scanner reads 25 and the assignment stores it in age."),
    exact("input-number-q2", "Warm-up", "Trace a decimal read", "Store a decimal", "The user enters 9.75. What value is stored in price? Type only the value.", "double price = input.nextDouble();", "9.75", "nextDouble returns the decimal value entered at runtime.", "Correct. The double variable stores 9.75."),
    exact("input-number-q3", "Warm-up", "Trace a boolean read", "Store true or false", "The user enters false without quotation marks. What value is stored in subscribed?", "boolean subscribed = input.nextBoolean();", "false", "nextBoolean reads the boolean word itself, not a quoted String.", "Correct. subscribed stores the boolean value false."),
    codeExact("input-number-q4", "Apply", "Match methods to types", "Read three correctly typed values", "Replace the three blanks with complete declarations named count, cost, and ready, in that order.", "___\n___\n___", "int count = input.nextInt();\ndouble cost = input.nextDouble();\nboolean ready = input.nextBoolean();", "Match int with nextInt, double with nextDouble, and boolean with nextBoolean.", "Correct. Each Scanner method returns a value its variable can store.", true),
    groundedChoice("input-number-q5", "Detect a compile-time type mistake", "What happens to this program?", "int amount = input.nextDouble();", ["It does not compile because nextDouble may return a decimal that int cannot store", "It compiles and rounds the value", "It compiles and discards the decimal part", "It waits for two inputs"], "It does not compile because nextDouble may return a decimal that int cannot store", "Work backward from the value returned by nextDouble to the variable type.", "Correct. This is a type error found before the program runs."),
    groundedChoice("input-number-q6", "Detect a runtime input mismatch", "The code compiles. The user then enters 3.5. What happens when this line runs?", "int amount = input.nextInt();", ["The Scanner cannot read 3.5 as an int, so input fails at runtime", "amount stores 3", "amount stores 4", "The compiler changes nextInt to nextDouble"], "The Scanner cannot read 3.5 as an int, so input fails at runtime", "Compilation checks Java code structure and types; the actual typed value arrives later.", "Correct. Valid Java can still receive incompatible input while running."),
    exact("input-number-q7", "Apply", "Trace prompts and output", "Keep print on the current line", "The user enters 4 and then 2.5. What exact console text appears?", "System.out.print(\"Quantity: \" );\nint quantity = input.nextInt();\nSystem.out.print(\"Price: \" );\ndouble price = input.nextDouble();\nSystem.out.println(\"Total: \" + quantity * price);", "Quantity: Price: Total: 10.0", "print does not add a newline. Treat the entered keystrokes as input, not program output.", "Correct. Both prompts stay on the current output line until println finishes it."),
    exact("input-number-q8", "Challenge", "Trace typed input and updates", "Calculate from three input types", "The user enters 3, 4.5, and true. What is the exact output?", "int quantity = input.nextInt();\ndouble price = input.nextDouble();\nboolean member = input.nextBoolean();\ndouble total = quantity * price;\ntotal += 2;\nSystem.out.println(\"Member: \" + member);\nSystem.out.println(\"Total: \" + total);", "Member: true\nTotal: 15.5", "Store each entered value, multiply quantity and price, then apply += 2.", "Correct. The program combines typed reads, a calculation, an update, and labeled output.", true),

    exact("input-text-q1", "Warm-up", "Trace next", "Read one word", "The user enters Daniel Lezhanskiy on one line. What value is stored in firstName?", "String firstName = input.next();", "Daniel", "next stops when it reaches whitespace.", "Correct. next reads the first whitespace-separated word."),
    exact("input-text-q2", "Warm-up", "Trace nextLine", "Read the full line", "The user enters Daniel Lezhanskiy on one line. What value is stored in fullName?", "String fullName = input.nextLine();", "Daniel Lezhanskiy", "nextLine reads all remaining text on the current line.", "Correct. The space remains part of the String."),
    multipleChoice("input-text-q3", "Choose the text method", "The program must store New York City as one String. Which declaration does that when the user types the phrase on one line?", ["String city = input.nextLine();", "String city = input.next();", "char city = input.next();", "int city = input.nextInt();"], "String city = input.nextLine();", "The required value contains spaces.", "Correct. nextLine reads the complete line rather than only New."),
    exact("input-text-q4", "Apply", "Trace the leftover newline", "See the empty String", "The user types 25, presses Enter, then types Daniel Lezhanskiy. What is stored in name immediately after these two statements? Type EMPTY if it is the empty String.", "int age = input.nextInt();\nString name = input.nextLine();", "EMPTY", "nextInt leaves the Enter newline unread; the next nextLine consumes that remainder immediately.", "Correct. name receives an empty String because the leftover newline ends the line at once."),
    codeExact("input-text-q5", "Apply", "Consume the newline", "Read the intended full name", "Insert the one Scanner call needed so fullName reads the next complete line.", "int age = input.nextInt();\n___\nString fullName = input.nextLine();", "input.nextLine();", "Use one nextLine to consume the remainder of the numeric input line.", "Correct. The extra read consumes Enter before the real full-line read."),
    codeExact("input-text-q6", "Apply", "Repair decimal then text input", "Handle the same trap after nextDouble", "Replace the blank so description reads the user's next full line after price.", "double price = input.nextDouble();\n___\nString description = input.nextLine();", "input.nextLine();", "nextDouble leaves the line-ending character just as nextInt does.", "Correct. The newline is consumed before description is read."),
    exact("input-text-q7", "Challenge", "Compare token and line reads", "Track what remains unread", "The user enters Ada Lovelace and presses Enter. What exact output is produced?", "String first = input.next();\nString rest = input.nextLine();\nSystem.out.println(first);\nSystem.out.println(rest);", "Ada\n Lovelace", "next reads Ada but leaves the space and remaining text for nextLine.", "Correct. nextLine receives the rest of that same line, including the leading space.", true),

    exact("input-pattern-q1", "Warm-up", "Trace the data path", "Convert minutes", "The user enters 135. What is the exact output?", "int minutes = input.nextInt();\nint hours = minutes / 60;\nint remaining = minutes % 60;\nSystem.out.println(hours + \" hours and \" + remaining + \" minutes\");", "2 hours and 15 minutes", "Integer division finds full hours; modulus finds the leftover minutes.", "Correct. The input flows through two calculations into labeled output."),
    exact("input-pattern-q2", "Apply", "Trace precedence with input", "Calculate the expression in order", "The user enters 4. What is the exact output?", "int value = input.nextInt();\nint result = value + 3 * 2;\nSystem.out.println(\"Result: \" + result);", "Result: 10", "Multiplication happens before addition.", "Correct. 3 * 2 is 6, then the entered 4 makes 10."),
    exact("input-pattern-q3", "Apply", "Trace compound assignment", "Add a fee after calculating", "The user enters 3 and 5.0. What is the exact output?", "int quantity = input.nextInt();\ndouble price = input.nextDouble();\ndouble total = quantity * price;\ntotal += 2.5;\nSystem.out.println(\"Total: \" + total);", "Total: 17.5", "Calculate quantity times price, then update total with the fee.", "Correct. Stored input feeds the calculation and the later compound update."),
    exact("input-pattern-q4", "Apply", "Trace incremented input", "Update after storing", "The user enters 7. What is the exact output?", "int guests = input.nextInt();\nguests++;\nSystem.out.println(\"Guests: \" + guests);", "Guests: 8", "The entered value is stored before the standalone increment runs.", "Correct. Input is ordinary stored data and can be updated like any other variable."),
    exact("input-pattern-q5", "Challenge", "Catch concatenation order", "Separate text joining from addition", "The user enters 2 and 3. What is the exact output?", "int first = input.nextInt();\nint second = input.nextInt();\nSystem.out.println(\"Raw: \" + first + second);\nSystem.out.println(\"Sum: \" + (first + second));", "Raw: 23\nSum: 5", "The first line joins from left to right; parentheses force arithmetic in the second.", "Correct. The nearly identical output statements intentionally follow different rules.", true),
    containsCode("input-pattern-q6", "Challenge", "Build a purchase calculation", "Given Scanner input, read int quantity and double price. Calculate double subtotal, add 5 with +=, and print exactly: Total: VALUE using total.", ["int quantity=input.nextInt();", "double price=input.nextDouble();", "double subtotal=quantity*price;", "double total=subtotal;", "total+=5;", /System\.out\.println\("Total:"\+total\);/], "Follow input, store, calculate, update, output. Do not hard-code the result.", "Correct. The complete data path reuses typed input and Chapter 2 updates."),

    codeExact("input-mistake-q1", "Warm-up", "Fix method syntax", "Call nextInt", "Rewrite only the broken declaration as valid Java.", "int age = input.nextInt;", "int age = input.nextInt();", "A method call needs parentheses even when nothing is written between them.", "Correct. Parentheses run the Scanner method."),
    groundedChoice("input-mistake-q2", "Distinguish text from a method call", "Why does this declaration not compile?", "int amount = \"input.nextInt()\";", ["Quotation marks make input.nextInt() a String, which int cannot store", "nextInt can only be used inside println", "The user must enter quotation marks", "Scanner cannot read whole numbers"], "Quotation marks make input.nextInt() a String, which int cannot store", "Quotation marks create text instead of running the code inside them.", "Correct. The broken line stores text where an int is required."),
    groundedChoice("input-mistake-q3", "Classify compile time", "What kind of failure is shown here?", "int amount = input.nextDouble();", ["A compile-time type error", "A runtime input mismatch", "A correct decimal read", "A leftover-newline problem"], "A compile-time type error", "The mismatch is already visible from nextDouble's return type and the int variable.", "Correct. Java can reject this before any user input is read."),
    groundedChoice("input-mistake-q4", "Classify runtime", "This line compiles. The user enters hello. What kind of failure occurs?", "int amount = input.nextInt();", ["A runtime input mismatch", "A missing import", "A compile-time type error", "Integer division"], "A runtime input mismatch", "The Java statement is valid; the incompatible value arrives only after execution begins.", "Correct. Scanner encounters invalid runtime data for nextInt."),
    codeExact("input-mistake-q5", "Apply", "Repair two linked mistakes", "Match the decimal type and method", "Rewrite the full declaration so a decimal price is stored correctly.", "int price = input.nextDouble;", "double price = input.nextDouble();", "Repair both the receiving type and the method-call parentheses.", "Correct. The declaration now compiles and can store decimal input."),

    containsCode("input-complete-q1", "Apply", "Build a rectangle calculator", "Create one Scanner named input, read double width and height, calculate double area, and print exactly: Area: VALUE.", ["Scanner input=new Scanner(System.in);", "double width=input.nextDouble();", "double height=input.nextDouble();", "double area=width*height;", /System\.out\.print(ln|)\("Area:"\+area\);/], "Create one reader, reuse it twice, calculate from the stored values, then label the result.", "Correct. The rectangle calculator completes the full basic-program path."),
    containsCode("input-complete-q2", "Challenge", "Build a labeled profile reader", "Given Scanner input, read int age, boolean enrolled, and a full String name on the next line. Consume the leftover newline, then print exactly: NAME | AGE | ENROLLED using the variables.", ["int age=input.nextInt();", "boolean enrolled=input.nextBoolean();", "input.nextLine();", "String name=input.nextLine();", /System\.out\.println\(name\+"\|"\+age\+"\|"\+enrolled\);/], "Read the two token values, consume the remaining newline once, then read the full line.", "Correct. The program coordinates three types and safely crosses from token input to line input."),
    containsCode("input-complete-q3", "Challenge", "Build a complete receipt program", "Write a complete Java program with the Scanner import and existing class/main wrapper. Create one Scanner, prompt for int quantity and double price with print, calculate total, add a 2.5 fee, and print exactly: Total: VALUE.", ["importjava.util.Scanner;", "publicclassMain", "publicstaticvoidmain(String[]args)", "Scanner input=new Scanner(System.in);", /System\.out\.print\("Quantity:"\);/, "int quantity=input.nextInt();", /System\.out\.print\("Price:"\);/, "double price=input.nextDouble();", "double total=quantity*price;", "total+=2.5;", /System\.out\.println\("Total:"\+total\);/], "Use the chapter's wrapper, one Scanner, two prompts and reads, then calculate before output.", "Chapter program constructed. Every required setup, input, calculation, update, and output piece is present."),

    exact("input-review-q1", "Apply", "Cumulative trace", "Track a complete numeric program", "The user enters 8 and 3. What is the exact output?", "int total = input.nextInt();\nint groups = input.nextInt();\nint each = total / groups;\nint leftover = total % groups;\neach += 1;\nSystem.out.println(\"Each: \" + each);\nSystem.out.println(\"Left: \" + leftover);", "Each: 3\nLeft: 2", "Calculate integer division and remainder from the original values, then update only each.", "Correct. The trace preserves separate stored results through a later update.", true),
    exact("input-review-q2", "Apply", "Cumulative text trace", "Follow token, newline, and full-line input", "The user enters 21, presses Enter, then enters Daniel Lezhanskiy. What is the exact output?", "int age = input.nextInt();\ninput.nextLine();\nString name = input.nextLine();\nSystem.out.println(name + \" is \" + age);", "Daniel Lezhanskiy is 21", "The extra nextLine discards only the leftover Enter before name is read.", "Correct. The numeric and full-line values both reach the labeled output."),
    codeExact("input-review-q3", "Apply", "Repair a broken read", "Fix type, method, and parentheses", "Rewrite only the broken declaration so it reads a decimal cost.", "int cost = input.nextInt;", "double cost = input.nextDouble();", "The result must support decimals and the Scanner method must be called.", "Correct. All three linked syntax/type choices now agree."),
    exact("input-review-q4", "Challenge", "Trace combined rules", "Keep calculation and concatenation separate", "The user enters 5, 2.0, and false. What is the exact output?", "int count = input.nextInt();\ndouble price = input.nextDouble();\nboolean sale = input.nextBoolean();\ndouble total = count * price;\ntotal *= 2;\ncount--;\nSystem.out.println(\"Sale: \" + sale);\nSystem.out.println(\"Data: \" + count + total);\nSystem.out.println(\"Total: \" + total);", "Sale: false\nData: 420.0\nTotal: 20.0", "After the updates, count is 4 and total is 20.0. The Data line starts with text.", "Correct. You traced three input types, two updates, and left-to-right concatenation.", true),
    containsCode("input-review-q5", "Challenge", "Build a complete trip summary", "Given Scanner input, read a full String destination, int miles, and double gallons in that order. Calculate double milesPerGallon using decimal division, add 1 to miles with +=, and print exactly two lines: Destination: NAME and MPG: VALUE.", ["String destination=input.nextLine();", "int miles=input.nextInt();", "double gallons=input.nextDouble();", "double milesPerGallon=miles/gallons;", "miles+=1;", /System\.out\.println\("Destination:"\+destination\);/, /System\.out\.println\("MPG:"\+milesPerGallon\);/], "Read the full line first, then the numeric tokens. Calculate MPG before changing miles so the update does not alter the result.", "Chapter 3 review cleared. The program combines line input, typed numeric input, decimal calculation, reassignment, and labeled output."),
  ],
  "comparisons-booleans": [
    exact("bool-q1", "Warm-up", "Predict output", "Evaluate a comparison", "What prints?", "int age = 18;\nSystem.out.println(age >= 18);", "true", "At least includes the boundary value.", "Correct. Exactly 18 satisfies >= 18."),
    codeExact("bool-q2", "Warm-up", "Fill missing operator", "Compare for equality", "Replace the blank so the expression asks whether score equals 100.", "boolean perfect = score ___ 100;", "boolean perfect = score == 100;", "Assignment uses one equals sign; equality comparison uses two.", "Correct. == asks an equality question."),
    exact("bool-q3", "Apply", "Trace AND", "Require both conditions", "What is the exact output?", "int age = 20;\nboolean hasId = false;\nSystem.out.println(age >= 18 && hasId);", "false", "AND requires both sides to be true.", "Correct. The age condition is true, but hasId is false."),
    exact("bool-q4", "Apply", "Trace OR and NOT", "Combine alternatives", "What prints?", "boolean member = false;\nint age = 10;\nboolean free = member || age < 12;\nSystem.out.println(!free);", "false", "First determine free, then reverse it with !.", "Correct. free is true because age < 12, so !free is false."),
    {
      ...codeExact("bool-q5", "Apply", "Write a range", "Keep a score in range", "Write one boolean declaration named valid that is true when score is from 0 through 100 inclusive.", "int score = 72;", "boolean valid = score >= 0 && score <= 100;", "Both the lower and upper boundary must be satisfied.", "Correct. && combines the inclusive boundaries."),
      validate: (answer: string) => validateDecisionProgram(answer, { score: "int" }, [-1, 0, 1, 99, 100, 101].map((score) => ({ values: { score }, expected: score >= 0 && score <= 100 })), { requiredVariableTypes: { valid: "boolean" }, resultVariable: "valid" }),
    },
    exact("bool-q6", "Apply", "Trace precedence", "Reduce a long condition", "What is the exact output?", "int score = 85;\nboolean result = score >= 70 && score < 90 || score == 100;\nSystem.out.println(result);", "true", "Resolve the comparisons, then &&, then ||.", "Correct. true && true becomes true, and true || false remains true."),
    {
      ...codeExact("bool-q7", "Challenge", "Repair logic", "Fix the impossible range", "Rewrite the declaration so inside is true for values from 10 through 20 inclusive.", "boolean inside = value >= 10 || value <= 20;", "boolean inside = value >= 10 && value <= 20;", "A single value must satisfy both boundaries.", "Correct. && expresses membership inside one range."),
      validate: (answer: string) => validateDecisionProgram(answer, { value: "int" }, [9, 10, 11, 19, 20, 21].map((value) => ({ values: { value }, expected: value >= 10 && value <= 20 })), { requiredVariableTypes: { inside: "boolean" }, resultVariable: "inside" }),
    },
    {
      ...containsCode("bool-q8", "Challenge", "Build an access expression", "Declare boolean allowed. It must be true when the user is an admin OR when the user is at least 18 AND hasId is true. Preserve that grouping with parentheses.", [], "Group the two ordinary-user requirements before combining them with admin.", "The expression clearly preserves the admin alternative and both ordinary requirements."),
      auditRequirements: ["boolean allowed", "admin exception", "adult with ID", "parentheses around combined ordinary-user requirements"],
      validate: (answer: string) => validateDecisionProgram(answer, { admin: "boolean", age: "int", hasId: "boolean" },
        [false, true].flatMap((admin) => [17, 18, 19].flatMap((age) => [false, true].map((hasId) => ({
          values: { admin, age, hasId }, expected: admin || (age >= 18 && hasId),
        })))), { requiredVariableTypes: { allowed: "boolean" }, resultVariable: "allowed", requireParenthesizedAnd: true }),
    },
    exact("bool-q9-ternary", "Apply", "Trace a conditional expression", "Choose one String value", "What is the exact output?", "int score = 68;\nString result = score >= 70 ? \"Pass\" : \"Retry\";\nSystem.out.println(result);", "Retry", "Evaluate the condition first, then use exactly one of the two values.", "Correct. The false condition selects the value after the colon."),
    codeExact("bool-q10-ternary", "Apply", "Write a conditional expression", "Choose the larger value", "Write the complete declaration using the conditional operator so larger stores first when first > second, otherwise second.", "int first = 12;\nint second = 19;\n// write the declaration", "int larger = first > second ? first : second;", "Use condition ? valueWhenTrue : valueWhenFalse.", "Correct. The expression produces exactly one int value."),
  ],
  "if-else": [
    exact("if-q1", "Warm-up", "Predict output", "Choose one branch", "What prints?", "int score = 68;\nif (score >= 70) {\n    System.out.println(\"Pass\");\n} else {\n    System.out.println(\"Retry\");\n}", "Retry", "68 does not satisfy score >= 70.", "Correct. The false condition selects else."),
    codeExact("if-q2", "Warm-up", "Fill a condition", "Include the boundary", "Rewrite the first line so age 18 and older enter the branch.", "if (age > 18) {", "if (age >= 18) {", "At least means >=.", "Correct. The boundary value 18 is included."),
    exact("if-q3", "Apply", "Trace an else-if chain", "Stop at the first match", "What prints?", "int score = 84;\nif (score >= 90) {\n    System.out.println(\"A\");\n} else if (score >= 80) {\n    System.out.println(\"B\");\n} else if (score >= 70) {\n    System.out.println(\"C\");\n} else {\n    System.out.println(\"D\");\n}", "B", "Java tests from the top and stops at the first true branch.", "Correct. 84 misses A and enters B."),
    codeExact("if-q4", "Apply", "Fix equality", "Repair the choice check", "Rewrite the first line as a valid condition that checks choice equals 2.", "if (choice = 2) {", "if (choice == 2) {", "Use comparison, not assignment.", "Correct. == compares the stored choice with 2."),
    exact("if-q5", "Apply", "Trace nested conditions", "Follow the reached path", "What prints?", "int age = 20;\nboolean hasId = false;\nif (age >= 18) {\n    if (hasId) {\n        System.out.println(\"Allowed\");\n    } else {\n        System.out.println(\"ID required\");\n    }\n} else {\n    System.out.println(\"Too young\");\n}", "ID required", "The outer condition succeeds; trace only its nested decision.", "Correct. Adult age reaches the inner branch, where hasId is false."),
    codeExact("if-q6", "Apply", "Repair braces", "Keep both statements conditional", "Rewrite the code so both println statements run only when score is at least 70.", "if (score >= 70)\n    System.out.println(\"Pass\");\nSystem.out.println(\"Recorded\");", "if (score >= 70) {\nSystem.out.println(\"Pass\");\nSystem.out.println(\"Recorded\");\n}", "Braces must surround both controlled statements.", "Correct. Both statements now belong to the same branch.", true),
    {
      ...containsCode("if-q7", "Challenge", "Build a validated grade decision", "For int score, print Invalid when score is outside 0-100, A for 90+, B for 80+, C for 70+, and Below C otherwise. Use one ordered if/else-if/else chain.", [], "Place invalid input first, then order valid thresholds from highest to lowest.", "The chain validates, classifies every valid score, and covers the remaining case."),
      auditRequirements: ["one if/else-if/else chain", "Invalid outside 0-100", "A at 90-100", "B at 80-89", "C at 70-79", "Below C at 0-69"],
      validate: (answer: string) => validateDecisionProgram(answer, { score: "int" }, [
        { values: { score: -1 }, expected: "Invalid" },
        { values: { score: 0 }, expected: "Below C" },
        { values: { score: 69 }, expected: "Below C" },
        { values: { score: 70 }, expected: "C" },
        { values: { score: 79 }, expected: "C" },
        { values: { score: 80 }, expected: "B" },
        { values: { score: 89 }, expected: "B" },
        { values: { score: 90 }, expected: "A" },
        { values: { score: 100 }, expected: "A" },
        { values: { score: 101 }, expected: "Invalid" },
      ], { requireSingleIfElseChain: true }),
    },
    {
      ...containsCode("if-q8", "Challenge", "Build a ticket decision", "Given int age and boolean member, store double price as 0.0 for age under 5, 8.0 for members or age 65+, and 12.0 otherwise. Then print Price: followed by price.", [], "Declare price once, assign it in every branch, then print after the chain.", "The program selects one price from three mutually exclusive cases."),
      auditRequirements: ["double price", "0.0 for age under 5", "8.0 for member or age 65+", "12.0 otherwise", "print Price: followed by price"],
      validate: (answer: string) => validateDecisionProgram(answer, { age: "int", member: "boolean" },
        [0, 4, 5, 64, 65, 90].flatMap((age) => [false, true].map((member) => ({
          values: { age, member }, expected: `Price: ${age < 5 ? "0.0" : member || age >= 65 ? "8.0" : "12.0"}`,
        }))), { requiredVariableTypes: { price: "double" } }),
    },
  ],
  "decision-programs": [
    exact("decision-q1", "Warm-up", "Trace validation", "Reject impossible input", "What prints?", "int score = 105;\nif (score < 0 || score > 100) {\n    System.out.println(\"Invalid\");\n} else if (score >= 70) {\n    System.out.println(\"Pass\");\n} else {\n    System.out.println(\"Retry\");\n}", "Invalid", "Validation runs before classification.", "Correct. 105 is outside the allowed range."),
    codeExact("decision-q2", "Apply", "Write validation", "Validate quantity", "Write one if header that enters the branch when quantity is 1 through 10 inclusive.", "// write the if header", "if (quantity >= 1 && quantity <= 10) {", "A valid range requires both boundaries.", "Correct. The condition accepts exactly 1 through 10."),
    exact("decision-q3", "Apply", "Trace min/max", "Keep the larger value", "What prints?", "int first = 12;\nint second = 19;\nint max = first;\nif (second > max) {\n    max = second;\n}\nSystem.out.println(max);", "19", "max begins as first and is replaced only if second is larger.", "Correct. 19 replaces the initial candidate 12."),
    codeExact("decision-q4", "Apply", "Fix a range chain", "Remove the gap", "Rewrite only the second condition so every valid value above 5 and through 20 is Medium.", "if (weight <= 5) {\n    System.out.println(\"Small\");\n} else if (weight > 6 && weight <= 20) {\n    System.out.println(\"Medium\");\n}", "else if (weight <= 20) {", "The failed first branch already tells Java weight is greater than 5.", "Correct. The simplified condition covers 6 through 20 with no gap."),
    exact("decision-q5", "Apply", "Trace a menu", "Choose the operation", "What prints when choice is 2?", "int a = 4;\nint b = 3;\nint choice = 2;\nif (choice == 1) {\n    System.out.println(a + b);\n} else if (choice == 2) {\n    System.out.println(a * b);\n} else {\n    System.out.println(\"Invalid\");\n}", "12", "Choice 2 selects multiplication.", "Correct. The second branch prints 4 × 3."),
    codeExact("decision-q6", "Apply", "Repair branch order", "Make A reachable", "Rewrite the chain headers in the correct order so scores 90+ receive A and scores 70-89 receive Pass.", "if (score >= 70) {\n    System.out.println(\"Pass\");\n} else if (score >= 90) {\n    System.out.println(\"A\");\n}", "if (score >= 90) {\nSystem.out.println(\"A\");\n} else if (score >= 70) {\nSystem.out.println(\"Pass\");\n}", "Test the most restrictive overlapping threshold first.", "Correct. Scores 90+ no longer get captured by the broader 70+ branch.", true),
    {
      ...containsCode("decision-q7", "Challenge", "Build a three-value maximum", "Given int a, b, and c, calculate int max without using Math.max. Initialize one candidate, compare the other two, and print Max: followed by max.", [], "Keep one best-so-far variable and update it independently for b and c.", "The program correctly keeps the largest of all three values."),
      auditRequirements: ["int max", "compare all three values", "print Max: followed by max"],
      validate: (answer: string) => validateDecisionProgram(answer, { a: "int", b: "int", c: "int" }, [
        { values: { a: 3, b: 2, c: 1 }, expected: "Max: 3" },
        { values: { a: 1, b: 3, c: 2 }, expected: "Max: 3" },
        { values: { a: 1, b: 2, c: 3 }, expected: "Max: 3" },
        { values: { a: -5, b: -2, c: -7 }, expected: "Max: -2" },
        { values: { a: 4, b: 4, c: 4 }, expected: "Max: 4" },
        { values: { a: 9, b: -9, c: 9 }, expected: "Max: 9" },
      ], { requiredVariableTypes: { max: "int" } }),
    },
    containsCode("decision-q8", "Challenge", "Build an eligibility program", "Read int age and boolean hasId. Print Invalid age for age below 0, Entry approved for age 18+ with ID, ID required for age 18+ without ID, and Entry denied otherwise.", ["int age=input.nextInt();", "boolean hasId=input.nextBoolean();", /if\(age<0\)/, /elseif\(age>=18&&hasId\)/, /elseif\(age>=18\)/, /else\{/], "Order the cases so invalid input is rejected before valid eligibility decisions.", "The program distinguishes all four required outcomes."),
  ],
  "while-loops": [
    exact("while-q1", "Warm-up", "Predict output", "Trace a countdown", "Write the exact output.", "int n = 3;\nwhile (n > 0) {\n    System.out.println(n);\n    n--;\n}", "3\n2\n1", "Print before subtracting one.", "Correct. The condition fails after n becomes 0."),
    codeExact("while-q2", "Warm-up", "Fill the update", "Make progress", "Replace the blank so the loop prints 1 through 5 and stops.", "int number = 1;\nwhile (number <= 5) {\n    System.out.println(number);\n    ___\n}", "number++;", "Move the counter one step toward a false condition.", "Correct. The counter eventually becomes 6."),
    exact("while-q3", "Apply", "Trace accumulation", "Build the running sum", "What prints?", "int n = 1;\nint sum = 0;\nwhile (n <= 4) {\n    sum += n;\n    n++;\n}\nSystem.out.println(sum);", "10", "Track sum after adding 1, 2, 3, and 4.", "Correct. The running total reaches 10."),
    codeExact("while-q4", "Apply", "Fix an infinite loop", "Update the right direction", "Rewrite only the update so the loop terminates after printing 5 through 1.", "int count = 5;\nwhile (count >= 1) {\n    System.out.println(count);\n    count++;\n}", "count--;", "The state must move downward toward the condition becoming false.", "Correct. The loop now reaches 0 and stops."),
    exact("while-q5", "Apply", "Trace a step size", "Count by threes", "Write the exact output.", "int n = 2;\nwhile (n < 10) {\n    System.out.println(n);\n    n += 3;\n}", "2\n5\n8", "Add three after every printed value.", "Correct. The next value 11 fails n < 10."),
    codeExact("while-q6", "Apply", "Protect a sentinel", "Exclude the stop value", "Complete the loop header so -1 stops the loop and is not added.", "int value = input.nextInt();\nint sum = 0;\nwhile (___) {\n    sum += value;\n    value = input.nextInt();\n}", "value != -1", "Continue only while the current value is ordinary data.", "Correct. The sentinel is checked before the body."),
    containsCode("while-q7", "Challenge", "Build an input-validation loop", "Given Scanner input, read int score. While score is outside 0-100, read another score. After the loop print Accepted: followed by score.", ["int score=input.nextInt();", /while\(score<0\|\|score>100\)/, "score=input.nextInt();", /System\.out\.println\("Accepted:"\+score\);/], "The same invalid condition belongs in the while header, and score must be reread inside.", "The loop rejects every invalid score and preserves the first valid one."),
    containsCode("while-q8", "Challenge", "Build a sentinel average", "Read ints until -1. Track sum and count without including -1. If at least one value was read, print the decimal average; otherwise print No data.", ["int sum=0;", "int count=0;", /while\(value!=-1\)/, "sum+=value;", "count++;", /if\(count>0\)/, /\(double\)sum\/count/, /else\{System\.out\.println\("Nodata"\);/], "Use both an accumulator and counter, then guard the division.", "The program handles ordinary values, the sentinel, and empty input safely."),
    exact("while-q9-do", "Apply", "Trace a do-while loop", "Run before checking", "What is the exact output?", "int n = 0;\ndo {\n    System.out.println(n);\n    n--;\n} while (n > 0);", "0", "The body runs once before Java checks n > 0.", "Correct. do-while guarantees the first body execution."),
    codeExact("while-q10-do", "Apply", "Fix do-while syntax", "End the condition correctly", "Rewrite only the final line as valid Java.", "do {\n    choice = input.nextInt();\n} while (choice != 0)", "} while (choice != 0);", "A do-while statement needs punctuation after the closing condition.", "Correct. The semicolon ends the do-while statement."),
  ],
  "for-loops": [
    exact("for-q1", "Warm-up", "Predict output", "Trace the range", "Write the exact output.", "for (int i = 0; i < 4; i++) {\n    System.out.println(i);\n}", "0\n1\n2\n3", "The condition is checked before i reaches 4.", "Correct. The valid counter values are 0 through 3."),
    codeExact("for-q2", "Warm-up", "Write a header", "Count one through five", "Write the complete for header that counts 1, 2, 3, 4, 5.", "// for header", "for (int i = 1; i <= 5; i++) {", "Start at 1 and include 5.", "Correct. The header expresses the full inclusive range."),
    exact("for-q3", "Apply", "Trace a downward loop", "Count down by two", "Write the exact output.", "for (int n = 7; n >= 1; n -= 2) {\n    System.out.println(n);\n}", "7\n5\n3\n1", "Subtract two after every body execution.", "Correct. The next value -1 fails the condition."),
    exact("for-q4", "Apply", "Trace accumulation", "Sum a range", "What prints?", "int total = 0;\nfor (int n = 2; n <= 8; n += 2) {\n    total += n;\n}\nSystem.out.println(total);", "20", "Add 2, 4, 6, and 8.", "Correct. The even values total 20."),
    codeExact("for-q5", "Apply", "Fix an off-by-one error", "Include the final value", "Rewrite only the loop header so it prints 1 through 10 inclusive.", "for (int i = 1; i < 10; i++) {", "for (int i = 1; i <= 10; i++) {", "The endpoint belongs in the range.", "Correct. <= includes 10."),
    codeExact("for-q6", "Apply", "Translate while to for", "Express the same repetition", "Rewrite this while control as one equivalent for header.", "int i = 0;\nwhile (i < 5) {\n    System.out.println(i);\n    i++;\n}", "for (int i = 0; i < 5; i++) {", "Move initialization, condition, and update into the header.", "Correct. The for loop controls the same five counter values."),
    containsCode("for-q7", "Challenge", "Build a multiplication row", "Given int number, use one for loop from factor 1 through 10 and print lines in the form number x factor = product using calculated values.", [/for\(intfactor=1;factor<=10;factor\+\+\)/, /intproduct=number\*factor;/, /System\.out\.println\(number\+"x"\+factor\+"="\+product\);/], "Calculate product inside the loop and concatenate the three values with text separators.", "The loop produces all ten calculated table lines."),
    containsCode("for-q8", "Challenge", "Build a range summary", "Given positive int limit, use a for loop to calculate the sum of every number from 1 through limit and count how many are even. Print Sum: and Even count: on separate lines.", ["int sum=0;", "int evenCount=0;", /for\(intn=1;n<=limit;n\+\+\)/, "sum+=n;", /if\(n%2==0\)/, "evenCount++;", /System\.out\.println\("Sum:"\+sum\);/, /System\.out\.println\("Evencount:"\+evenCount\);/], "The same loop can update both an accumulator and a conditional counter.", "The program summarizes the entire range in one loop."),
  ],
  "nested-loops": [
    exact("nested-q1", "Warm-up", "Count executions", "Multiply the dimensions", "How many times does the println run?", "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= 4; col++) {\n        System.out.println(row + col);\n    }\n}", "12", "The inner body runs four times for each of three outer iterations.", "Correct. 3 × 4 gives 12 executions."),
    exact("nested-q2", "Warm-up", "Predict output", "Trace two small loops", "Write the exact output.", "for (int row = 1; row <= 2; row++) {\n    for (int col = 1; col <= 3; col++) {\n        System.out.print(col);\n    }\n    System.out.println();\n}", "123\n123", "The inner col loop restarts for each row.", "Correct. Each outer iteration prints one complete 123 row."),
    exact("nested-q3", "Apply", "Trace coordinate pairs", "Freeze the outer value", "Write the exact output.", "for (int r = 1; r <= 2; r++) {\n    for (int c = 1; c <= 2; c++) {\n        System.out.println(r + \",\" + c);\n    }\n}", "1,1\n1,2\n2,1\n2,2", "Complete both c values before advancing r.", "Correct. Every pair in the 2 × 2 grid appears."),
    codeExact("nested-q4", "Apply", "Fix the update", "Advance the inner variable", "Rewrite only the incorrect inner-loop update.", "for (int row = 0; row < 3; row++) {\n    for (int col = 0; col < 4; row++) {\n        System.out.print(\"*\");\n    }\n}", "col++", "The inner loop must change the variable in its own condition.", "Correct. col now advances toward 4."),
    exact("nested-q5", "Apply", "Trace a growing pattern", "Use the row as the bound", "Write the exact output.", "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= row; col++) {\n        System.out.print(\"#\");\n    }\n    System.out.println();\n}", "#\n##\n###", "Row n prints n hash characters.", "Correct. The inner bound grows with row."),
    codeExact("nested-q6", "Apply", "Move the line break", "End one row at a time", "Rewrite the loop nest so it prints two rows of three stars rather than one star per line.", "for (int row = 1; row <= 2; row++) {\n    for (int col = 1; col <= 3; col++) {\n        System.out.println(\"*\");\n    }\n}", "for (int row = 1; row <= 2; row++) {\nfor (int col = 1; col <= 3; col++) {\nSystem.out.print(\"*\");\n}\nSystem.out.println();\n}", "Print stars without a line break inside; print one line break after the inner loop.", "Correct. Each inner loop now forms one row.", true),
    containsCode("nested-q7", "Challenge", "Build a multiplication grid", "Use nested loops for rows 1-5 and columns 1-5. Print each product followed by a space and print a newline after each row.", [/for\(introw=1;row<=5;row\+\+\)/, /for\(intcol=1;col<=5;col\+\+\)/, /System\.out\.print\(row\*col\+""\);/, /System\.out\.println\(\);/], "The inner loop prints products; the outer loop controls line breaks.", "The program generates all 25 products in a 5 × 5 grid."),
    containsCode("nested-q8", "Challenge", "Count grid matches", "Visit every row and column from 1 through 4. Count positions where row + col is even and print the final count.", ["int matches=0;", /for\(introw=1;row<=4;row\+\+\)/, /for\(intcol=1;col<=4;col\+\+\)/, /if\(\(row\+col\)%2==0\)/, "matches++;", "System.out.println(matches);"], "Test the coordinate sum inside the inner loop and update one counter.", "The nested loops test all 16 coordinate pairs and count eight matches."),
  ],
  "methods": [
    exact("methods-q1", "Warm-up", "Predict call order", "Follow control transfer", "Write the exact output.", "System.out.println(\"A\");\nshow();\nSystem.out.println(\"C\");\n\npublic static void show() {\n    System.out.println(\"B\");\n}", "A\nB\nC", "The caller resumes after show finishes.", "Correct. The method call inserts B between A and C."),
    codeExact("methods-q2", "Warm-up", "Write a call", "Run the method", "Write the statement that calls printWelcome with no arguments.", "public static void printWelcome() {\n    System.out.println(\"Welcome\");\n}", "printWelcome();", "A call uses the method name, parentheses, and a semicolon.", "Correct. The definition will run when the call is reached."),
    exact("methods-q3", "Apply", "Trace a parameter", "Bind the argument", "What prints?", "public static void greet(String name) {\n    System.out.println(\"Hello \" + name);\n}\n\ngreet(\"Maya\");", "Hello Maya", "The argument Maya becomes the local parameter name.", "Correct. The parameter supplies the text used inside the method."),
    codeExact("methods-q4", "Apply", "Fill parameters", "Receive two values", "Write the complete method header for a public static void method named printScore that receives String name and int score.", "// method header", "public static void printScore(String name, int score) {", "Declare the type and name of each parameter in order.", "Correct. The method can receive both values from a call."),
    codeExact("methods-q5", "Apply", "Fix argument order", "Match the parameter list", "Rewrite only the call so the arguments match the method definition.", "public static void showItem(String name, int quantity) { }\n\nshowItem(3, \"Pen\");", "showItem(\"Pen\", 3);", "Arguments match parameters from left to right.", "Correct. String fills name and int fills quantity."),
    exact("methods-q6", "Apply", "Trace repeated calls", "Reuse one method", "Write the exact output.", "public static void printDouble(int value) {\n    System.out.println(value * 2);\n}\n\nprintDouble(3);\nprintDouble(5);", "6\n10", "Trace each call with its own parameter value.", "Correct. One method produces two results from two arguments."),
    containsCode("methods-q7", "Challenge", "Write a reusable receipt method", "Define public static void printLine with String item, int quantity, and double price parameters. Inside, calculate double total = quantity * price and print item + \": \" + total.", [/publicstaticvoidprintLine\(Stringitem,intquantity,doubleprice\)\{/, "double total=quantity*price;", /System\.out\.println\(item\+":"\+total\);/], "Keep the repeated calculation and output inside the method.", "The method accepts three arguments and performs one coherent receipt-line task."),
    containsCode("methods-q8", "Challenge", "Decompose a small program", "Define void methods printHeader(), printItem(String name, int price), and printFooter(). In main, call them in that order with two printItem calls between header and footer.", [/publicstaticvoidprintHeader\(\)/, /publicstaticvoidprintItem\(Stringname,intprice\)/, /publicstaticvoidprintFooter\(\)/, /printHeader\(\);printItem\(/, /printItem\([^;]+\);printFooter\(\);/], "Definitions may appear below main, but the calls in main should express the program's structure.", "The larger program is decomposed into named reusable subtasks."),
    exact("methods-q9-library", "Apply", "Trace library calls", "Compose parseInt and sqrt", "What is the exact output?", "String text = \"81\";\ndouble result = Math.sqrt(Integer.parseInt(text));\nSystem.out.println(result);", "9.0", "Work from the innermost call outward: convert the text, then take its square root.", "Correct. parseInt returns 81 and Math.sqrt returns 9.0."),
    multipleChoice("methods-q10-api", "Read a method entry", "Given the API entry static double sqrt(double a), what does Math.sqrt(25) produce?", ["A double result", "A String result", "No value because it is void", "Two int results"], "A double result", "The word before the method name is the return type.", "Correct. The documented return type is double."),
  ],
  "returns-scope": [
    exact("returns-q1", "Warm-up", "Predict a returned value", "Replace the call with its result", "What prints?", "public static int square(int n) {\n    return n * n;\n}\n\nSystem.out.println(square(4));", "16", "Bind n to 4, calculate, and replace the call with the returned value.", "Correct. square(4) returns 16."),
    codeExact("returns-q2", "Warm-up", "Fill a return statement", "Send the result back", "Replace the blank with the complete return statement.", "public static int add(int a, int b) {\n    ___\n}", "return a + b;", "The return type is int, and the method should send the sum.", "Correct. The int sum returns to the caller."),
    exact("returns-q9-overload", "Apply", "Choose an overload", "Match the argument list", "What is the exact output?", "public static int area(int side) { return side * side; }\npublic static int area(int width, int height) { return width * height; }\nSystem.out.println(area(3, 5));", "15", "The call has two int arguments, so Java selects the overload with two int parameters.", "Correct. The two-parameter overload returns 3 * 5."),
    exact("returns-q3", "Apply", "Trace method composition", "Work inside out", "What prints?", "public static int doubleValue(int n) { return n * 2; }\npublic static int addOne(int n) { return n + 1; }\n\nSystem.out.println(addOne(doubleValue(3)));", "7", "doubleValue(3) finishes before addOne receives its argument.", "Correct. 3 becomes 6, then 7."),
    codeExact("returns-q4", "Apply", "Fix the return type", "Keep the decimal", "Rewrite only the method header so the returned decimal is valid.", "public static int average(int a, int b) {\n    return (a + b) / 2.0;\n}", "public static double average(int a, int b) {", "The declared type must match the returned double expression.", "Correct. The method promises and returns a double."),
    exact("returns-q5", "Apply", "Trace local scope", "Separate same-named variables", "What prints?", "public static void show() {\n    int score = 20;\n    System.out.println(score);\n}\n\nint score = 10;\nshow();\nSystem.out.println(score);", "20\n10", "The method's score is a separate local variable.", "Correct. show prints its local 20, then the caller prints its own 10."),
    codeExact("returns-q6", "Apply", "Repair scope", "Pass needed data", "Rewrite the method and call so printScore receives the caller's local score legally.", "public static void printScore() {\n    System.out.println(score);\n}\n\nint score = 90;\nprintScore();", "public static void printScore(int score) {\nSystem.out.println(score);\n}\n\nint score = 90;\nprintScore(score);", "A method receives caller data through a parameter.", "Correct. The local value flows into the method as an argument.", true),
    codeExact("scope-final-declare", "Warm-up", "Declare a constant", "Create one fixed local value", "Write one statement that declares an int constant named MAX_ATTEMPTS with the value 3.", "// declaration", "final int MAX_ATTEMPTS = 3;", "Place final before int. Constant names commonly use capital letters with underscores.", "Correct. MAX_ATTEMPTS is an int that cannot be reassigned."),
    multipleChoice("scope-final-effect", "Separate Final From Scope", "What does final change about a local variable?", ["It prevents reassignment but does not change the variable's type or scope", "It makes the variable available everywhere", "It converts the value to a String", "It prints the value automatically"], "It prevents reassignment but does not change the variable's type or scope", "Separate the rule about changing a value from the rule about where its name exists.", "Correct. final restricts reassignment; the declaration's location still determines scope."),
    multipleChoice("scope-final-reassign", "Protect a Fixed Value", "Given final double TAX_RATE = 0.08875;, which later statement is invalid?", ["System.out.println(TAX_RATE);", "double fee = price * TAX_RATE;", "TAX_RATE = 0.09;", "double copy = TAX_RATE;"], "TAX_RATE = 0.09;", "Reading a final value is allowed; replacing it is not.", "Correct. A final variable can be used in expressions but cannot receive another assignment."),
    containsCode("returns-q7", "Challenge", "Write a classification method", "Define public static boolean isPassing(int score) that returns true when score is at least 70 and false otherwise using one return statement.", [/publicstaticbooleanisPassing\(intscore\)\{/, /returnscore>=70;/], "A comparison already produces the boolean the method needs to return.", "The method returns a reusable boolean result directly."),
    containsCode("returns-q8", "Challenge", "Compose two calculations", "Define subtotal(int quantity, double price) returning double and withTax(double amount) returning amount * 1.08875. In main, store withTax(subtotal(3, 10.0)) in double total and print it.", [/publicstaticdoublesubtotal\(intquantity,doubleprice\)/, /returnquantity\*price;/, /publicstaticdoublewithTax\(doubleamount\)/, /returnamount\*1\.08875;/, /doubletotal=withTax\(subtotal\(3,10\.0\)\);/, "System.out.println(total);"], "Build and verify each returned result, then compose the calls from inside out.", "The solution moves data through two focused value-returning methods."),
  ],
  arrays: [
    exact("arrays-q1", "Warm-up", "Predict output", "Read one element", "What prints?", "int[] values = {4, 8, 12};\nSystem.out.println(values[1]);", "8", "Index 0 is first, so index 1 is second.", "Correct. The second element is 8."),
    codeExact("arrays-q2", "Warm-up", "Declare an array", "Create four positions", "Write one declaration that creates an int array named scores with four elements.", "// declaration", "int[] scores = new int[4];", "Use brackets with the type and supply the fixed length to new int[].", "Correct. The array has valid indexes 0 through 3."),
    exact("arrays-q3", "Apply", "Predict an update", "Replace one element", "What prints?", "int[] values = {3, 6, 9};\nvalues[1] = 10;\nSystem.out.println(values[0] + values[1] + values[2]);", "22", "Only the element at index 1 changes.", "Correct. The array becomes {3, 10, 9}."),
    codeExact("arrays-q4", "Apply", "Fill an index", "Read the final element", "Replace the blank with an index expression that remains correct for any nonempty array length.", "System.out.println(values[___]);", "values.length - 1", "The last valid index is one below the number of elements.", "Correct. length - 1 identifies the final position."),
    exact("arrays-q5", "Apply", "Trace defaults", "Know blank array values", "What prints?", "boolean[] flags = new boolean[3];\nint[] counts = new int[2];\nSystem.out.println(flags[0]);\nSystem.out.println(counts[1]);", "false\n0", "New primitive arrays receive type-specific default values.", "Correct. boolean begins false and int begins 0."),
    codeExact("arrays-q6", "Apply", "Fix an out-of-bounds access", "Stay inside the array", "Rewrite only the assignment so it updates the final valid element.", "int[] data = new int[5];\ndata[5] = 99;", "data[data.length - 1] = 99;", "Length is 5, but the final valid index is 4.", "Correct. The final element is updated without a runtime error."),
    containsCode("arrays-q7", "Challenge", "Build and inspect an array", "Create double[] prices initialized to 2.5, 4.0, and 6.5. Change the second value to 4.5. Print the length, first value, and final value on separate lines.", [/double\[\]prices=\{2\.5,4\.0,6\.5\};/, "prices[1]=4.5;", "System.out.println(prices.length);", "System.out.println(prices[0]);", /System\.out\.println\(prices\[prices\.length-1\]\);/], "Indexes are zero-based; the second value is index 1.", "The array is initialized, updated, and inspected at safe positions."),
    containsCode("arrays-q8", "Challenge", "Compare both ends", "Define public static boolean sameEnds(int[] values). Assume values is nonempty. Return true when the first and last elements are equal and false otherwise.", [/publicstaticbooleansameEnds\(int\[\]values\)/, /returnvalues\[0\]==values\[values\.length-1\];/], "The first index is 0 and the final index is values.length - 1. A comparison already produces a boolean, so it can be returned directly.", "The method combines a boolean return value with safe first-and-last indexing."),
  ],
  "arrays-loops": [
    exact("arrayloop-q1", "Warm-up", "Predict traversal output", "Visit every element", "Write the exact output.", "int[] values = {2, 4, 6};\nfor (int i = 0; i < values.length; i++) {\n    System.out.println(values[i]);\n}", "2\n4\n6", "The index loop visits positions 0, 1, and 2.", "Correct. Every element prints once in order."),
    codeExact("arrayloop-q2", "Warm-up", "Fix the loop bound", "Prevent an invalid index", "Rewrite only the for header so every valid index is visited without crashing.", "for (int i = 0; i <= values.length; i++) {", "for (int i = 0; i < values.length; i++) {", "The first invalid index equals length.", "Correct. The loop stops before length."),
    exact("arrayloop-q3", "Apply", "Trace a sum", "Accumulate array values", "What prints?", "int[] values = {5, 2, 7};\nint sum = 0;\nfor (int value : values) {\n    sum += value;\n}\nSystem.out.println(sum);", "14", "Add each element to the running total.", "Correct. 5 + 2 + 7 is 14."),
    exact("arrayloop-q4", "Apply", "Trace a decimal average", "Preserve the fraction", "What prints?", "int[] values = {2, 3};\nint sum = 0;\nfor (int value : values) sum += value;\ndouble average = (double) sum / values.length;\nSystem.out.println(average);", "2.5", "The cast makes the final division decimal.", "Correct. The average keeps its fractional part."),
    codeExact("arrayloop-q5", "Apply", "Fix maximum initialization", "Handle negative data", "Rewrite only the max initialization so the algorithm works for an array containing only negative values.", "int[] values = {-8, -3, -10};\nint max = 0;", "int max = values[0];", "Initialize from real data rather than an assumed neutral value.", "Correct. -3 can now replace the initial -8 candidate."),
    exact("arrayloop-q6", "Apply", "Count matches", "Test each element", "What prints?", "int[] scores = {70, 55, 82, 69, 100};\nint passed = 0;\nfor (int score : scores) {\n    if (score >= 70) passed++;\n}\nSystem.out.println(passed);", "3", "Count 70, 82, and 100.", "Correct. Three elements satisfy the condition."),
    containsCode("arrayloop-q7", "Challenge", "Fill an array with squares", "Create int[] squares with length 6. Use an index loop to store index * index at every position, then print every element with a second loop.", ["int[] squares=new int[6];", /for\(inti=0;i<squares\.length;i\+\+\)/, "squares[i]=i*i;", /System\.out\.println\(squares\[i\]\);/], "The first loop writes every position; the second reads every position.", "The array is completely filled and traversed with safe bounds."),
    containsCode("arrayloop-q8", "Challenge", "Build a score summary", "Given nonempty int[] scores, calculate sum, decimal average, maximum, and count of scores at least 70. Print all four values with labels.", ["int sum=0;", "int max=scores[0];", "int passed=0;", /for\([^)]*:scores\)/, "sum+=", /if\([^)]*>max\)/, /if\([^)]*>=70\)/, /\(double\)sum\/scores\.length/, /System\.out\.println\("Average:"/], "One traversal can update the sum, max, and passing counter; average is calculated afterward.", "The program produces four meaningful summaries from the full array."),
    exact("arrayloop-q9-reverse", "Apply", "Trace an array reversal", "Follow two swaps", "Write the final array exactly.", "int[] values = {1, 2, 3, 4};\nfor (int left = 0; left < values.length / 2; left++) {\n    int right = values.length - 1 - left;\n    int temp = values[left];\n    values[left] = values[right];\n    values[right] = temp;\n}", "{4, 3, 2, 1}", "Swap indexes 0 and 3, then indexes 1 and 2.", "Correct. Every mirrored pair trades positions."),
    containsCode("arrayloop-q10-copy", "Apply", "Copy an array", "Given int[] source, create a separate int[] copy of the same length and use an index loop to copy every element into the matching position.", ["int[] copy=new int[source.length];", /for\(inti=0;i<source\.length;i\+\+\)/, "copy[i]=source[i];"], "The same index identifies the source position and its destination.", "The new array independently stores every source value in the matching position."),
    containsCode("arrayloop-q11-pair", "Challenge", "Add corresponding elements", "Given equal-length int[] first and second, create int[] sums and fill each position with first[i] + second[i].", ["int[] sums=new int[first.length];", /for\(inti=0;i<first\.length;i\+\+\)/, "sums[i]=first[i]+second[i];"], "Use one shared index for all three arrays.", "The element-by-element operation preserves each positional relationship."),
  ],
  strings: [
    exact("strings-q1", "Warm-up", "Predict output", "Use String length", "What prints?", "String word = \"Java\";\nSystem.out.println(word.length());", "4", "Count every character.", "Correct. Java contains four characters."),
    exact("strings-q2", "Warm-up", "Read a character", "Use zero-based text indexes", "What prints?", "String word = \"Brooklyn\";\nSystem.out.println(word.charAt(2));", "o", "Indexes 0, 1, 2 correspond to B, r, o.", "Correct. charAt(2) returns o."),
    codeExact("strings-q3", "Apply", "Write a final-character expression", "Stay inside the String", "Write the expression that returns the final char of nonempty String text.", "char last = ___;", "text.charAt(text.length() - 1)", "The final valid character index is length() - 1.", "Correct. The expression adapts to any nonempty String length."),
    exact("strings-q4", "Apply", "Trace substring", "Understand the exclusive endpoint", "What prints?", "String course = \"CISC1115\";\nSystem.out.println(course.substring(0, 4));", "CISC", "substring includes index 0 through index 3, but not 4.", "Correct. The ending index is exclusive."),
    codeExact("strings-q5", "Apply", "Fix content comparison", "Compare text correctly", "Rewrite only the condition so it checks String answer content ignoring case.", "if (answer == \"yes\") {", "if (answer.equalsIgnoreCase(\"yes\")) {", "Use a String comparison method rather than ==.", "Correct. The condition compares the characters and accepts case variations."),
    exact("strings-q6", "Apply", "Trace a character loop", "Count exact matches", "What prints?", "String text = \"banana\";\nint count = 0;\nfor (int i = 0; i < text.length(); i++) {\n    if (text.charAt(i) == 'a') count++;\n}\nSystem.out.println(count);", "3", "Inspect each character in banana.", "Correct. The letter a occurs three times."),
    containsCode("strings-q7", "Challenge", "Build a space remover", "Given String text, build String result containing every non-space character in order. Use charAt in a loop and print result.", ["String result=\"\";", /for\(inti=0;i<text\.length\(\);i\+\+\)/, "char current=text.charAt(i);", /if\(current!=''\)/, "result+=current;", "System.out.println(result);"], "Accumulate only characters that do not equal a space.", "The algorithm builds new text while preserving character order."),
    containsCode("strings-q8", "Challenge", "Build a palindrome check", "Given String text, ignore letter case and determine whether it reads the same forward and backward. Use a loop comparing mirrored charAt positions, store the result in boolean palindrome, and print it.", [/text=text\.toLowerCase\(\);/, "boolean palindrome=true;", /for\(inti=0;i<text\.length\(\)\/2;i\+\+\)/, /text\.charAt\(i\)!=text\.charAt\(text\.length\(\)-1-i\)/, "palindrome=false;", "System.out.println(palindrome);"], "Compare index i with length - 1 - i and stop needing comparisons at the midpoint.", "The program checks mirrored characters without reversing the String for free."),
    exact("strings-q9-trim-substring", "Apply", "Trace String transformations", "Trim and extract", "What is the exact output?", "String text = \"  Brooklyn College  \".trim();\nSystem.out.println(text.substring(9));", "College", "trim removes the outside spaces; substring(9) continues from index 9 through the end.", "Correct. The one-argument substring returns College."),
    exact("strings-q10-last-index", "Apply", "Search repeated text", "Find the final occurrence", "What is the exact output?", "String text = \"banana\";\nSystem.out.println(text.lastIndexOf(\"an\"));", "3", "The pair an begins at indexes 1 and 3; keep the later start.", "Correct. lastIndexOf returns the final matching starting index."),
    multipleChoice("strings-q11-compare", "Interpret compareTo", "What does a negative result from first.compareTo(second) mean?", ["first comes before second in lexicographic order", "first and second have equal contents", "first contains second", "first is longer than second"], "first comes before second in lexicographic order", "Interpret the sign, not the exact negative number.", "Correct. Negative means the first String sorts before the second."),
    codeExact("strings-q12-concat", "Apply", "Store joined text", "Use concat", "Write one declaration named full that stores first followed by one space and then last, using concat calls.", "String first = \"Daniel\";\nString last = \"Lezhanskiy\";", "String full = first.concat(\" \").concat(last);", "concat returns a new String, so the first call can be followed by another concat call.", "Correct. The composed calls create the full name with one space."),
  ],
  arraylists: [
    exact("list-q1", "Warm-up", "Predict list state", "Add two elements", "What prints?", "ArrayList<String> names = new ArrayList<>();\nnames.add(\"Maya\");\nnames.add(\"Daniel\");\nSystem.out.println(names.size());", "2", "size() reports the current number of elements.", "Correct. Two add calls produce size 2."),
    codeExact("list-q2", "Warm-up", "Declare a list", "Use a wrapper type", "Write one declaration creating an empty ArrayList of Integer values named scores.", "// declaration", "ArrayList<Integer> scores = new ArrayList<>();", "ArrayList uses Integer rather than primitive int.", "Correct. The list can now store Integer elements."),
    exact("list-q3", "Apply", "Trace get and set", "Replace one element", "What prints?", "ArrayList<String> tasks = new ArrayList<>();\ntasks.add(\"Read\");\ntasks.add(\"Practice\");\ntasks.set(0, \"Code\");\nSystem.out.println(tasks.get(0));", "Code", "set replaces the element at index 0.", "Correct. The first element is now Code."),
    exact("list-q4", "Apply", "Trace removal", "Account for shifting indexes", "What prints?", "ArrayList<String> items = new ArrayList<>();\nitems.add(\"A\");\nitems.add(\"B\");\nitems.add(\"C\");\nitems.remove(0);\nSystem.out.println(items.get(0));", "B", "After removing A, later elements shift left.", "Correct. B becomes the new element at index 0."),
    codeExact("list-q5", "Apply", "Fix the traversal bound", "Use the list method", "Rewrite only the for header so it visits every ArrayList element safely.", "for (int i = 0; i < names.length; i++) {", "for (int i = 0; i < names.size(); i++) {", "ArrayList reports its count with size().", "Correct. The loop now uses the list's current size."),
    exact("list-q6", "Apply", "Trace a for-each loop", "Sum list values", "What prints?", "ArrayList<Integer> values = new ArrayList<>();\nvalues.add(3); values.add(5); values.add(2);\nint sum = 0;\nfor (int value : values) sum += value;\nSystem.out.println(sum);", "10", "Add each stored Integer value.", "Correct. The list elements total 10."),
    containsCode("list-q7", "Challenge", "Collect values until a sentinel", "Create ArrayList<Integer> values. Read int value repeatedly until -1; add ordinary values to the list and print the final size.", ["ArrayList<Integer> values=new ArrayList<>();", "int value=input.nextInt();", /while\(value!=-1\)/, "values.add(value);", "value=input.nextInt();", "System.out.println(values.size());"], "Read before the loop and again at the end of each iteration.", "The resizable list stores an unknown quantity without including the sentinel."),
    containsCode("list-q8", "Challenge", "Remove negatives safely", "Given ArrayList<Integer> values, traverse backward by index and remove every negative value. Then print each remaining value.", [/for\(inti=values\.size\(\)-1;i>=0;i--\)/, /if\(values\.get\(i\)<0\)/, "values.remove(i);", /for\(intvalue:values\)/, "System.out.println(value);"], "Backward traversal prevents shifted elements from being skipped.", "The solution safely removes every negative and preserves the remaining order."),
  ],
  searching: [
    exact("search-q1", "Warm-up", "Trace comparisons", "Find the first match", "What index is returned?", "int[] values = {4, 9, 7, 2};\nint target = 7;\n// linear search from index 0", "2", "Compare 4, then 9, then 7.", "Correct. The first matching position is index 2."),
    codeExact("search-q2", "Warm-up", "Write failure result", "Represent not found", "Write the conventional return statement placed after a completed search loop when no index matched.", "// after the loop", "return -1;", "No valid array index is negative.", "Correct. -1 clearly represents failure."),
    exact("search-q3", "Apply", "Trace early return", "Stop at the first duplicate", "What prints?", "int[] values = {5, 2, 5, 8};\nSystem.out.println(findIndex(values, 5));\n\n// findIndex checks from index 0 and returns immediately", "0", "The first element already matches.", "Correct. Early return produces the first matching index."),
    codeExact("search-q4", "Apply", "Fix result handling", "Protect against -1", "Rewrite the condition so the program indexes values only after a successful search.", "int index = findIndex(values, target);\nif (index < 0) {\n    System.out.println(values[index]);\n}", "if (index >= 0) {\nSystem.out.println(values[index]);\n}", "A valid index is zero or positive.", "Correct. The array is accessed only when a match exists.", true),
    exact("search-q5", "Apply", "Trace a missing target", "Reach search failure", "How many element comparisons occur?", "int[] values = {3, 6, 9, 12};\nint target = 5;\n// ordinary linear search", "4", "An absent target requires checking the entire array.", "Correct. Every element is compared before failure is known."),
    codeExact("search-q6", "Apply", "Fix String search", "Compare content", "Rewrite only the condition in an ArrayList<String> linear search.", "if (names.get(index) == target) {", "if (names.get(index).equals(target)) {", "String search compares content with equals.", "Correct. Equal character sequences now match reliably."),
    containsCode("search-q7", "Challenge", "Write an array search method", "Define public static int findIndex(int[] values, int target). Return the first matching index or -1 after the loop.", [/publicstaticintfindIndex\(int\[\]values,inttarget\)/, /for\(inti=0;i<values\.length;i\+\+\)/, /if\(values\[i\]==target\)/, "return i;", "return -1;"], "Do not return -1 inside the loop; that would fail after only one nonmatch.", "The method implements complete first-match linear search."),
    containsCode("search-q8", "Challenge", "Find the first passing score", "Define public static int firstPassing(int[] scores). Return the index of the first score at least 70, or -1 when none pass. In main, print Not found for -1 and Found at INDEX otherwise.", [/publicstaticintfirstPassing\(int\[\]scores\)/, /if\(scores\[i\]>=70\)/, "return i;", "return -1;", /if\(result==-1\)/, /System\.out\.println\("Notfound"\);/, /System\.out\.println\("Foundat"\+result\);/], "Separate the reusable search from caller-specific reporting.", "The program searches by condition and handles both success and failure."),
    exact("search-q9-binary-trace", "Apply", "Trace binary search", "Shrink the sorted range", "Which index is returned?", "int[] values = {3, 7, 11, 15, 19, 24, 30};\n// binary search for 19", "4", "Trace mid indexes 3, 5, then 4.", "Correct. The target 19 is found at index 4 after the range shrinks twice."),
    multipleChoice("search-q10-binary-rule", "Check the prerequisite", "When is this introductory binary-search algorithm valid?", ["When the array is already sorted in ascending order", "Only when every value is unique", "Only when the array has an even length", "Whenever linear search has already failed"], "When the array is already sorted in ascending order", "The algorithm decides which half to discard from the ordering.", "Correct. Sorted order makes half-elimination logically safe."),
    codeExact("search-q11-binary-update", "Apply", "Repair a binary-search boundary", "Discard the middle position", "Rewrite only the update used when values[mid] is smaller than target.", "if (values[mid] < target) {\n    low = mid;\n}", "low = mid + 1;", "mid was already checked and cannot be the target.", "Correct. Moving past mid guarantees the eligible range shrinks."),
  ],
  sorting: [
    exact("sort-q1", "Warm-up", "Trace a swap", "Exchange two values", "Write the array after the swap.", "int[] values = {7, 2};\nint temp = values[0];\nvalues[0] = values[1];\nvalues[1] = temp;", "{2, 7}", "temp preserves the original first value.", "Correct. The two positions exchange values."),
    codeExact("sort-q2", "Warm-up", "Complete a swap", "Restore the saved value", "Replace the blank with the final swap statement.", "int temp = values[i];\nvalues[i] = values[j];\n___", "values[j] = temp;", "The saved original values[i] belongs at index j.", "Correct. No value is lost."),
    exact("sort-q3", "Apply", "Trace one selection pass", "Move the minimum", "What is the array after the first selection-sort pass?", "int[] values = {7, 2, 5, 1};\n// find smallest from indexes 0-3, then swap with index 0", "{1, 2, 5, 7}", "The smallest value 1 is at index 3.", "Correct. The first pass places 1 at the front."),
    exact("sort-q4", "Apply", "Trace minIndex", "Remember a position", "What final value does minIndex hold before the swap?", "int[] values = {6, 4, 9, 2};\nint minIndex = 0;\nfor (int i = 1; i < values.length; i++) {\n    if (values[i] < values[minIndex]) minIndex = i;\n}", "3", "The best candidate changes from index 0 to 1 and then to 3.", "Correct. The smallest value 2 is at index 3."),
    codeExact("sort-q5", "Apply", "Fix adjacent bounds", "Protect i + 1", "Rewrite only the loop header so values[i + 1] is always valid.", "for (int i = 0; i < values.length; i++) {\n    if (values[i] > values[i + 1]) {", "for (int i = 0; i < values.length - 1; i++) {", "The final comparison uses indexes length - 2 and length - 1.", "Correct. i + 1 never reaches the invalid length index."),
    exact("sort-q6", "Apply", "Verify order", "Test adjacent pairs", "What prints?", "int[] values = {1, 3, 3, 8};\nboolean sorted = true;\nfor (int i = 0; i < values.length - 1; i++) {\n    if (values[i] > values[i + 1]) sorted = false;\n}\nSystem.out.println(sorted);", "true", "Equal adjacent values do not violate ascending order.", "Correct. No left value is greater than its right neighbor."),
    containsCode("sort-q7", "Challenge", "Write one selection pass", "Given int[] values and int start, find the smallest index from start through the end and swap that value with values[start].", ["int minIndex=start;", /for\(inti=start\+1;i<values\.length;i\+\+\)/, /if\(values\[i\]<values\[minIndex\]\)/, "minIndex=i;", "int temp=values[start];", "values[start]=values[minIndex];", "values[minIndex]=temp;"], "Compare values but remember indexes for the final swap.", "The code correctly completes one selection-sort pass."),
    containsCode("sort-q8", "Challenge", "Implement selection sort", "Define public static void selectionSort(int[] values) using an outer start loop, inner minimum search, and swap. Then print the sorted array with a loop.", [/publicstaticvoidselectionSort\(int\[\]values\)/, /for\(intstart=0;start<values\.length-1;start\+\+\)/, "int minIndex=start;", /for\(inti=start\+1;i<values\.length;i\+\+\)/, /values\[i\]<values\[minIndex\]/, "values[minIndex]=temp;", /System\.out\.println\(value\);/], "Build the complete algorithm from the verified one-pass pattern.", "The program implements and exposes each step of introductory selection sort."),
  ],
  "algorithmic-problem-solving": [
    exact("trace-q1", "Warm-up", "Predict branch state", "Trace one decision", "What prints?", "int x = 4;\nint y = 3;\nif (x > y) {\n    x += y;\n} else {\n    y += x;\n}\nSystem.out.println(x);", "7", "The true branch changes x from 4 to 7.", "Correct. Only the executed branch affects state."),
    exact("trace-q2", "Warm-up", "Predict loop state", "Trace every iteration", "What prints?", "int sum = 0;\nfor (int i = 1; i <= 3; i++) {\n    sum += i * 2;\n}\nSystem.out.println(sum);", "12", "The additions are 2, 4, and 6.", "Correct. The accumulator reaches 12."),
    exact("trace-q3", "Apply", "Trace method and array state", "Follow an indexed mutation", "Write the final array.", "public static void addOne(int[] values) {\n    for (int i = 0; i < values.length; i++) values[i]++;\n}\nint[] data = {2, 4};\naddOne(data);", "{3, 5}", "The parameter and caller both access the same array.", "Correct. Both indexed updates remain visible to the caller."),
    codeExact("trace-q4", "Apply", "Write algorithm steps", "State a linear-search result", "Complete the final two algorithm steps exactly as Java return statements: return index i for a match; return failure only after the loop.", "for (...) {\n    if (values[i] == target) {\n        ___\n    }\n}\n___", "return i;\nreturn -1;", "Failure cannot be known until the loop finishes.", "Correct. Success returns immediately; failure returns after all comparisons.", true),
    exact("trace-q5", "Apply", "Predict nested call output", "Trace inside out", "What prints?", "public static int f(int n) { return n + 2; }\npublic static int g(int n) { return n * 3; }\nSystem.out.println(f(g(4)));", "14", "g(4) returns 12, then f(12) returns 14.", "Correct. Nested calls are evaluated from the inside outward."),
    codeExact("trace-q6", "Apply", "Repair an algorithm", "Fix first divergence", "Rewrite only the faulty update so the loop computes the sum rather than the final element.", "int sum = 0;\nfor (int value : values) {\n    sum = value;\n}", "sum += value;", "An accumulator must preserve its prior state.", "Correct. Each element is added to the running total."),
    containsCode("trace-q7", "Challenge", "Write largest-even logic", "Define public static int largestEven(int[] values). Return the largest even value, or -1 when no even value occurs. Assume all ordinary values are nonnegative.", [/publicstaticintlargestEven\(int\[\]values\)/, "int best=-1;", /for\(intvalue:values\)/, /if\(value%2==0&&value>best\)/, "best=value;", "return best;"], "One variable records the best qualifying value seen so far.", "The method combines traversal, filtering, comparison, and a failure result."),
    containsCode("trace-q8", "Challenge", "Build and trace a data algorithm", "Given String[] names and int[] scores of equal length, find the index of the highest score. Print NAME: SCORE using matching indexes. Assume arrays are nonempty.", ["int bestIndex=0;", /for\(inti=1;i<scores\.length;i\+\+\)/, /if\(scores\[i\]>scores\[bestIndex\]\)/, "bestIndex=i;", /System\.out\.println\(names\[bestIndex\]\+":"\+scores\[bestIndex\]\);/], "Remember the index so the name and score remain connected.", "The solution preserves parallel-array relationships while finding the maximum."),
  ],
  "input-output": [
    exact("io-q1", "Warm-up", "Predict formatted output", "Read a printf format", "What exact line is produced?", "String item = \"Pen\";\nint count = 3;\ndouble total = 4.5;\nSystem.out.printf(\"%s %d $%.2f%n\", item, count, total);", "Pen 3 $4.50", "Substitute each value for its matching placeholder; %.2f forces two decimal places.", "Correct. The String, integer, and two-decimal total are formatted in order."),
    codeExact("io-q2", "Warm-up", "Choose a stream check", "Read safely until input ends", "Replace the blank with the condition that verifies another integer exists.", "while (___) {\n    sum += fileInput.nextInt();\n}", "fileInput.hasNextInt()", "Ask the Scanner whether another int is available before reading it.", "Correct. hasNextInt prevents reading past the available integer data."),
    exact("io-q3", "Apply", "Trace a data stream", "Count every value", "What exact output is produced when the input contains 4 7 2?", "int count = 0;\nint sum = 0;\nwhile (input.hasNextInt()) {\n    sum += input.nextInt();\n    count++;\n}\nSystem.out.println(count + \" / \" + sum);", "3 / 13", "Each successful read increases count and adds one value to sum.", "Correct. Three integers are read and their total is 13."),
    codeExact("io-q4", "Apply", "Fix an empty-input bug", "Protect the average", "Rewrite the condition so division occurs only when at least one value was read.", "if (count >= 0) {\n    double average = (double) sum / count;\n}", "if (count > 0) {", "Zero values means count is zero, so division must not occur.", "Correct. The average is calculated only for a nonempty stream."),
    codeExact("io-q5", "Apply", "Format a decimal", "Show exactly two places", "Rewrite only the output statement so average is labeled and printed with exactly two decimal places.", "System.out.println(\"Average: \" + average);", "System.out.printf(\"Average: %.2f%n\", average);", "Use printf, %.2f, and %n.", "Correct. The formatted output has a stable label and two decimal places."),
    codeExact("io-q6", "Apply", "Repair record order", "Read matching field types", "Rewrite the two reads so an input record containing a one-word name followed by an integer score is stored correctly.", "int name = input.nextInt();\nString score = input.next();", "String name = input.next();\nint score = input.nextInt();", "The program must follow the input contract: text first, then an integer.", "Correct. Both record fields are read in order with matching types.", true),
    containsCode("io-q7", "Challenge", "Build a stream summary", "Read every available int from Scanner input. Track count, sum, and maximum. Print No values when count is zero; otherwise print count, decimal average, and maximum with labels.", ["int count=0;", "int sum=0;", "int max=0;", /while\(input\.hasNextInt\(\)\)/, "int value=input.nextInt();", "sum+=value;", /if\(count==0\|\|value>max\)/, "max=value;", "count++;", /if\(count==0\)/, /\(double\)sum\/count/, /System\.out\.println\("Novalues"\)/], "Before increasing count, use count == 0 to recognize the first value; later values replace max only when larger. Branch after the stream ends.", "The program handles empty, negative-only, and ordinary streams without future library constants or unsafe division."),
    containsCode("io-q8", "Challenge", "Process score records", "Read one-word name and int score pairs while another name is available. Print NAME Pass for scores at least 70 and NAME Retry otherwise. Count and print the number of passing records at the end.", [/while\(input\.hasNext\(\)\)/, "String name=input.next();", "int score=input.nextInt();", "int passed=0;", /if\(score>=70\)/, "passed++;", /System\.out\.println\(name\+"Pass"\)/, /System\.out\.println\(name\+"Retry"\)/, /System\.out\.println\("Passed:"\+passed\)/], "Complete one record before reading the next; update passed only in the qualifying branch.", "The solution processes an unknown number of complete records and summarizes the results."),
  ],
  "debugging-testing": [
    exact("debug-q1", "Warm-up", "Classify an error", "Identify the failure stage", "Answer with exactly: compile-time, runtime, or logic", "int score = 10\nSystem.out.println(score);", "compile-time", "The missing semicolon prevents Java from compiling the source.", "Correct. No execution begins because the syntax is invalid."),
    exact("debug-q2", "Warm-up", "Classify an error", "Separate crash from wrong result", "Answer with exactly: compile-time, runtime, or logic", "int[] values = {2, 4};\nSystem.out.println(values[2]);", "runtime", "The code can compile, but index 2 is invalid when the program runs.", "Correct. ArrayIndexOutOfBoundsException occurs during execution."),
    exact("debug-q3", "Apply", "Find the first divergence", "Trace an accumulator", "What exact output reveals the logic bug?", "int[] values = {2, 4, 6};\nint sum = 0;\nfor (int value : values) {\n    sum = value;\n}\nSystem.out.println(sum);", "6", "The assignment replaces the old state instead of accumulating it.", "Correct. Only the final element remains stored in sum."),
    codeExact("debug-q4", "Apply", "Repair an off-by-one error", "Keep every index valid", "Rewrite only the loop header.", "for (int i = 0; i <= values.length; i++) {", "for (int i = 0; i < values.length; i++) {", "The first invalid array index equals length.", "Correct. The loop visits 0 through length - 1."),
    exact("debug-q5", "Apply", "Choose a boundary test", "Expose a grading edge", "For code deciding whether score >= 70 passes, which single numeric input best tests the exact boundary?", "// score >= 70 means Pass", "70", "A boundary test uses the value exactly where behavior changes.", "Correct. 70 verifies that the inclusive comparison is implemented."),
    codeExact("debug-q6", "Apply", "Fix maximum initialization", "Test negative-only data", "Rewrite only the initialization so the maximum algorithm works for every nonempty int array.", "int max = 0;", "int max = values[0];", "Initialize from actual data instead of assuming zero is present or smaller.", "Correct. Negative-only arrays can now produce the right maximum."),
    containsCode("debug-q7", "Challenge", "Design a compact test set", "Create int[] tests containing exactly four values that test this allowed range: ordinary valid, lower boundary 1, upper boundary 100, and one invalid value. Then loop over tests and print each value.", [/int\[\]tests=\{/, /1,/, /100/, /(?:0|101|-1)/, /for\(intvalue:tests\)/, /System\.out\.println\(value\)/], "One array can document typical, boundary, and invalid cases together.", "The test set covers behavior inside, at, and outside the allowed range."),
    containsCode("debug-q8", "Challenge", "Repair a broken average method", "Define public static double average(int[] values). Return 0.0 for an empty array; otherwise sum every value and return a decimal average. Do not divide inside the loop.", [/publicstaticdoubleaverage\(int\[\]values\)/, /if\(values\.length==0\)/, "return 0.0;", "int sum=0;", /for\(intvalue:values\)/, "sum+=value;", /return\(double\)sum\/values\.length;/], "Handle the structural edge case first, accumulate fully, then divide once.", "The repaired method handles empty input and preserves fractional averages."),
  ],
  "computers-programs-algorithms": [
    exact("foundations-q1", "Warm-up", "Identify a concept", "Separate algorithm from program", "Answer with exactly: algorithm or program", "A finite, precise, language-independent procedure for finding the largest value.", "algorithm", "The procedure describes a solution without requiring Java syntax.", "Correct. An algorithm can be implemented in many languages."),
    exact("foundations-q2", "Warm-up", "Order execution stages", "Place compilation before execution", "Write these four stages in order, separated by arrows.", "JVM · bytecode · Java source · compiler", "Java source → compiler → bytecode → JVM", "Begin with the .java code and end with the system that executes the translated instructions.", "Correct. Source is compiled to bytecode, which the JVM executes."),
    exact("foundations-q3", "Apply", "Identify system roles", "Match active storage", "Which component holds active program instructions and data while the program runs? Answer with one word.", "CPU · memory · storage · compiler", "memory", "Long-term files belong to storage; active state belongs in memory.", "Correct. Memory holds the current instructions and data."),
    exact("foundations-q4", "Apply", "Distinguish language rules", "Syntax or semantics", "Answer with exactly: syntax or semantics", "The rule that * means multiplication in a Java expression.", "semantics", "The code is valid either way; the question asks what the symbol means.", "Correct. Semantics describe the meaning of valid code."),
    codeExact("foundations-q5", "Apply", "Represent a model", "Choose relevant data", "Declare a String eventName set to Workshop, int seats set to 30, and boolean registrationOpen set to true.", "// three parts of an event model", "String eventName = \"Workshop\";\nint seats = 30;\nboolean registrationOpen = true;", "Select types that match text, a count, and a yes-or-no state.", "Correct. The three variables form a small computational model.", true),
    containsCode("foundations-q6", "Challenge", "Implement a stated algorithm", "Implement this language-independent procedure as Java: start with the first int array value as max; inspect every remaining value; replace max when a larger value appears; print max. Assume the array is nonempty.", ["int max=values[0];", /for\(inti=1;i<values\.length;i\+\+\)/, /if\(values\[i\]>max\)/, "max=values[i];", "System.out.println(max);"], "Translate each algorithm step into one visible Java responsibility.", "The implementation faithfully converts the finite procedure into executable Java."),
  ],
  "cs-context-applications": [
    exact("context-q1", "Warm-up", "Identify an abstraction", "Name the simplifying idea", "What concept means using a simpler interface without managing every lower-level detail?", "algorithm · abstraction · storage · syntax", "abstraction", "Scanner lets you request typed input without controlling keyboard hardware directly.", "Correct. Abstraction hides lower-level details behind a usable interface."),
    exact("context-q2", "Warm-up", "Identify an application", "Connect computing to a domain", "Which domain is most directly described by simulation, measurement, and experimental data processing? Answer with one word.", "science · media · business · humanities", "science", "The examples focus on measurement and simulation.", "Correct. Scientific computing uses programs to model and process observations."),
    exact("context-q3", "Apply", "Evaluate representation", "Notice what a model omits", "A student record stores only name and numeric grade. Answer with exactly one missing real-world detail that could matter.", "String name;\nint grade;", "feedback", "A model preserves selected details and leaves others out. Use the requested one-word example.", "Correct. The model can store a score while omitting explanatory feedback."),
    exact("context-q4", "Apply", "Separate correctness questions", "Look beyond syntax", "Answer with exactly: implementation or goal", "The code perfectly applies a rule, but the rule unfairly excludes qualified people. Which part must be re-evaluated?", "goal", "Correct code can still implement the wrong requirement.", "Correct. Validating the goal is different from verifying its implementation."),
    codeExact("context-q5", "Apply", "Represent one event", "Use several data forms", "Declare eventName as Workshop, seats as 30, registrationOpen as true, and attendees as a String array whose length is seats.", "// event model", "String eventName = \"Workshop\";\nint seats = 30;\nboolean registrationOpen = true;\nString[] attendees = new String[seats];", "Use String, int, boolean, and an array sized from the seats variable.", "Correct. The model combines text, quantity, state, and a collection.", true),
    containsCode("context-q6", "Challenge", "Audit a decision rule", "Given int[] scores, count how many values are below 70 and print Flagged: COUNT. Also declare boolean needsReview that is true when more than half the scores are flagged, and print it. Assume scores is nonempty.", ["int flagged=0;", /for\(intscore:scores\)/, /if\(score<70\)/, "flagged++;", /booleanneedsReview=flagged>scores\.length\/2;/, /System\.out\.println\("Flagged:"\+flagged\)/, /System\.out\.println\(needsReview\)/], "Translate the policy into visible calculations so its effects can be inspected.", "The program makes both the rule's count and its review threshold observable."),
  ],
  "cumulative-challenges": [
    containsCode("challenge-q1", "Warm-up", "Build a range classifier", "Define classify(int score) returning Invalid below 0 or above 100, Pass for 70–100, and Retry otherwise. Call it with 70 and print the result.", [/publicstaticStringclassify\(intscore\)/, /score<0\|\|score>100/, /return"Invalid";/, /score>=70/, /return"Pass";/, /return"Retry";/, /System\.out\.println\(classify\(70\)\)/], "Handle invalid values before ordinary classification.", "The method covers invalid, passing, and retry ranges with a boundary call."),
    containsCode("challenge-q2", "Apply", "Summarize an array", "Define average(int[] values) returning 0.0 when empty and a decimal average otherwise. Define maximum(int[] values) assuming nonempty. Print both results for one array.", [/publicstaticdoubleaverage\(int\[\]values\)/, /values\.length==0/, /return0\.0;/, /\(double\)sum\/values\.length/, /publicstaticintmaximum\(int\[\]values\)/, /intmax=values\[0\]/, /System\.out\.println\(average\(/, /System\.out\.println\(maximum\(/], "Give each summary one method and one return value.", "Two reusable methods correctly handle their distinct structural assumptions."),
    containsCode("challenge-q3", "Apply", "Search parallel arrays", "Given String[] names and int[] scores, define findStudent(String[] names, String target) returning the first matching index ignoring case or -1. Use the result to print NAME: SCORE or Not found.", [/publicstaticintfindStudent\(String\[\]names,Stringtarget\)/, /equalsIgnoreCase\(target\)/, "return i;", "return -1;", /if\(index>=0\)/, /names\[index\]/, /scores\[index\]/, /System\.out\.println\("Notfound"\)/], "Return an index so the caller can retrieve matching information from both arrays.", "The solution searches text safely and preserves parallel-array relationships."),
    containsCode("challenge-q4", "Apply", "Count words by first letter", "Given ArrayList<String> words and a one-character String letter, count words whose first character matches letter ignoring case. Skip empty Strings and print the count. Store lowercase versions before comparing their first characters.", ["int count=0;", "String lowerLetter=letter.toLowerCase();", /for\(Stringword:words\)/, /!word\.isEmpty\(\)/, "String lowerWord=word.toLowerCase();", /lowerWord\.charAt\(0\)==lowerLetter\.charAt\(0\)/, "count++;", "System.out.println(count);"], "Create lowerLetter once. Inside the nonempty-word branch, create lowerWord, then compare lowerWord.charAt(0) with lowerLetter.charAt(0).", "The traversal handles variable list size, empty text, and case differences using only taught String tools."),
    containsCode("challenge-q5", "Challenge", "Build a sentinel statistics program", "Read integers until -1. Do not include -1. Store ordinary values in ArrayList<Integer>, then print count, sum, decimal average, minimum, and maximum. Print No values when the sentinel is entered first.", ["ArrayList<Integer> values=new ArrayList<>();", /while\(value!=-1\)/, "values.add(value);", /if\(values\.isEmpty\(\)\)/, /System\.out\.println\("Novalues"\)/, "int min=values.get(0);", "int max=values.get(0);", "int sum=0;", /\(double\)sum\/values\.size\(\)/], "Separate input collection from summary processing and protect the empty case.", "The complete program handles unknown input size, a sentinel, and five summaries."),
    containsCode("challenge-q6", "Challenge", "Create a gradebook report", "Given matching names and scores arrays, print each NAME Pass/Retry, calculate a decimal class average, and print the name of the highest-scoring student. Assume nonempty arrays.", ["int sum=0;", "int bestIndex=0;", /for\(inti=0;i<scores\.length;i\+\+\)/, "sum+=scores[i];", /scores\[i\]>=70/, /scores\[i\]>scores\[bestIndex\]/, /\(double\)sum\/scores\.length/, /names\[bestIndex\]/], "One indexed loop can keep each name connected to its score while updating summaries.", "The report combines parallel arrays, branching, an accumulator, and a maximum index."),
    containsCode("challenge-q7", "Challenge", "Repair and sort a copy", "Define copyAndSort(int[] values) that creates a separate same-length array, copies every element, selection-sorts the copy in ascending order, and returns it without modifying values.", [/publicstaticint\[\]copyAndSort\(int\[\]values\)/, /int\[\]copy=newint\[values\.length\]/, /copy\[i\]=values\[i\]/, /for\(intstart=0;start<copy\.length-1;start\+\+\)/, "int minIndex=start;", /copy\[i\]<copy\[minIndex\]/, /returncopy;/], "Copy first, then run the familiar sort using only the copy array.", "The method preserves its input and returns an independently sorted result."),
    containsCode("challenge-q8", "Challenge", "Analyze text without shortcuts", "Define countVowels(String text) that ignores case and counts a, e, i, o, u using charAt and a loop. Define reversed(String text) that builds and returns the characters in reverse order. Print both results for one String.", [/publicstaticintcountVowels\(Stringtext\)/, /text=text\.toLowerCase\(\)/, /for\(inti=0;i<text\.length\(\);i\+\+\)/, /c=='a'\|\|c=='e'/, /publicstaticStringreversed\(Stringtext\)/, /for\(inti=text\.length\(\)-1;i>=0;i--\)/, /result\+=text\.charAt\(i\)/, /System\.out\.println\(countVowels\(/], "Both methods traverse the same representation in different directions for different goals.", "The solution decomposes two String algorithms into reusable methods."),
    containsCode("challenge-q9", "Challenge", "Process a complete input stream", "Read every available name-score pair from Scanner input. Store names and scores in separate ArrayLists, print each result, then print the passing percentage with two decimal places. Handle zero records without dividing.", ["ArrayList<String> names=new ArrayList<>();", "ArrayList<Integer> scores=new ArrayList<>();", /while\(input\.hasNext\(\)\)/, "names.add(input.next());", "scores.add(input.nextInt());", /if\(scores\.isEmpty\(\)\)/, "int passed=0;", /score>=70/, /100\.0\*passed\/scores\.size\(\)/, /System\.out\.printf\(/], "Collect complete records first, then calculate a percentage only for nonempty data.", "The data-processing program combines streams, collections, decisions, and formatted output."),
    containsCode("challenge-q10", "Challenge", "Build a menu-driven tracker", "Create an ArrayList<String> tasks and a loop that repeatedly reads an int choice: 1 reads and adds a one-word task, 2 prints all numbered tasks, and 0 exits. Reject other choices with Invalid. The loop must end only on 0.", ["ArrayList<String> tasks=new ArrayList<>();", "int choice=input.nextInt();", /while\(choice!=0\)/, /if\(choice==1\)/, "tasks.add(input.next());", /elseif\(choice==2\)/, /for\(inti=0;i<tasks\.size\(\);i\+\+\)/, /System\.out\.println\(\(i\+1\)\+/, /System\.out\.println\("Invalid"\)/, "choice=input.nextInt();"], "Design one branch per command and reread choice at the bottom of the loop.", "The tracker coordinates sentinel control, branching, input, and a resizable collection."),
  ],
  "final-assessment": [
    exact("final-q1", "Warm-up", "Trace expressions", "Respect type and precedence", "What exact output is produced?", "double result = 7 / 2 + 1.5;\nSystem.out.println(result);", "4.5", "7 / 2 is integer division before the double addition occurs.", "Correct. 3 is produced first, then 1.5 is added."),
    exact("final-q2", "Warm-up", "Trace branching", "Choose one path", "What exact output is produced?", "int n = 12;\nif (n % 2 == 0 && n > 10) {\n    System.out.println(\"A\");\n} else if (n > 5) {\n    System.out.println(\"B\");\n} else {\n    System.out.println(\"C\");\n}", "A", "The first condition is fully true, so later branches are skipped.", "Correct. Exactly the first matching branch executes."),
    exact("final-q3", "Warm-up", "Trace a loop", "Follow state changes", "What exact output is produced?", "int value = 1;\nfor (int i = 0; i < 3; i++) {\n    value = value * 2 + i;\n}\nSystem.out.println(value);", "12", "Trace value after i = 0, 1, and 2.", "Correct. The states are 2, 5, and 12."),
    codeExact("final-q4", "Apply", "Repair String comparison", "Use content equality", "Rewrite only the condition so either yes or YES succeeds.", "if (answer == \"yes\") {", "if (answer.equalsIgnoreCase(\"yes\")) {", "String content is compared with a method, not ==.", "Correct. The repaired comparison checks characters regardless of case."),
    exact("final-q5", "Apply", "Trace array and method state", "Follow a shared array", "Write the final array exactly.", "public static void change(int[] data) {\n    data[0] += data[1];\n    data[1]++;\n}\nint[] values = {3, 4};\nchange(values);", "{7, 5}", "The parameter and caller both access the same array.", "Correct. Both indexed mutations remain visible."),
    codeExact("final-q6", "Apply", "Fix search failure", "Move failure after traversal", "Rewrite the method body so every element can be searched.", "for (int i = 0; i < values.length; i++) {\n    if (values[i] == target) return i;\n    return -1;\n}", "for (int i = 0; i < values.length; i++) {\nif (values[i] == target) return i;\n}\nreturn -1;", "A single nonmatch does not prove the target is absent.", "Correct. Failure is returned only after the complete search.", true),
    exact("final-q7", "Apply", "Trace a sort pass", "Track indexes and a swap", "What is the array after one pass that finds the minimum from all positions and swaps it into index 0?", "int[] values = {5, 3, 8, 1};", "{1, 3, 8, 5}", "The minimum is 1 at index 3; swap positions 0 and 3.", "Correct. One selection pass fixes the first position."),
    containsCode("final-q8", "Challenge", "Write a bounded input method", "Define readScore(Scanner input) that reads an int and keeps reading while it is below 0 or above 100, then returns the first valid score.", [/publicstaticintreadScore\(Scannerinput\)/, "int score=input.nextInt();", /while\(score<0\|\|score>100\)/, "score=input.nextInt();", "return score;"], "Use a validation loop because the number of invalid entries is unknown.", "The method guarantees its returned score satisfies the range contract."),
    containsCode("final-q9", "Challenge", "Write a reusable search", "Define lastIndexOf(String[] values, String target) returning the last case-insensitive matching index or -1. Do not return on the first match.", [/publicstaticintlastIndexOf\(String\[\]values,Stringtarget\)/, "int result=-1;", /for\(inti=0;i<values\.length;i\+\+\)/, /values\[i\]\.equalsIgnoreCase\(target\)/, "result=i;", "return result;"], "Keep replacing a remembered result as later matches appear.", "The complete traversal returns the final matching position or -1."),
    containsCode("final-q10", "Challenge", "Build a frequency method", "Define countOccurrences(int[] values, int target) returning the number of matching elements. In main, call it and print Target TARGET occurs COUNT times using variables.", [/publicstaticintcountOccurrences\(int\[\]values,inttarget\)/, "int count=0;", /for\(intvalue:values\)/, /if\(value==target\)/, "count++;", "return count;", /System\.out\.println\("Target"\+target\+"occurs"\+count\+"times"\)/], "Traversal counts every match; the caller formats the result.", "The method separates reusable counting from reporting."),
    containsCode("final-q11", "Challenge", "Build a complete grade summary", "Given a nonempty int[] scores, define minimum, maximum, and average methods. Print all three with labels and average to two decimal places. Each method must traverse the array rather than use a library shortcut.", [/publicstaticintminimum\(int\[\]scores\)/, /publicstaticintmaximum\(int\[\]scores\)/, /publicstaticdoubleaverage\(int\[\]scores\)/, /int(?:min|max)=scores\[0\]/, /for\(intscore:scores\)/, /\(double\)sum\/scores\.length/, /System\.out\.printf\(/], "Implement and verify each summary method independently before composing the report.", "The solution demonstrates decomposition, safe initialization, traversal, and formatted output."),
    exact("final-q12-prefix", "Apply", "Trace prefix and postfix", "Separate produced and stored values", "What is the exact output?", "int x = 5;\nint a = x++;\nint b = ++x;\nSystem.out.println(x + \" \" + a + \" \" + b);", "7 5 7", "Postfix gives a the old 5 before x becomes 6; prefix makes x 7 before giving b its value.", "Correct. The produced values and final stored value were traced separately."),
    exact("final-q13-do-ternary", "Apply", "Combine do-while and a conditional value", "Run once, then classify", "What is the exact output?", "int n = 0;\ndo {\n    n++;\n} while (n < 3);\nString label = n == 3 ? \"done\" : \"retry\";\nSystem.out.println(label);", "done", "The body runs for n values 0, 1, and 2; then the conditional expression classifies the final 3.", "Correct. The loop stops at 3 and the true branch produces done."),
    exact("final-q14-library-overload", "Apply", "Use documented return types", "Compose a library call with an overload", "What is the exact output?", "public static int scale(int value) { return value * 2; }\npublic static double scale(double value) { return value / 2; }\nSystem.out.println(scale(Math.sqrt(16)));", "2.0", "Math.sqrt returns double 4.0, so Java selects scale(double).", "Correct. The argument type selects the double overload, which returns 2.0."),
    exact("final-q15-binary", "Apply", "Trace binary search", "Follow the sorted range", "Which index is returned when searching for 18?", "int[] values = {2, 5, 9, 12, 18, 21, 30};", "4", "Trace mid index 3 with 12, then mid index 5 with 21, then mid index 4.", "Correct. Binary search reaches 18 at index 4."),
    containsCode("final-q12", "Challenge", "Final program: enrollment report", "Read name-score pairs until the name END. Store names and scores in ArrayLists. Print each student's Pass/Retry result, the class average, and the highest student's name. Handle END as the first input by printing No records.", ["ArrayList<String> names=new ArrayList<>();", "ArrayList<Integer> scores=new ArrayList<>();", "String name=input.next();", /while\(!name\.equals\("END"\)\)/, "names.add(name);", "scores.add(input.nextInt());", "name=input.next();", /if\(scores\.isEmpty\(\)\)/, /System\.out\.println\("Norecords"\)/, "int bestIndex=0;", /score>=70/, /\(double\)sum\/scores\.size\(\)/, /names\.get\(bestIndex\)/], "Treat input, empty-case handling, record reporting, and summaries as separate stages.", "Final assessment cleared. The program integrates sentinel input, collections, control flow, algorithms, and output."),
  ],
};

// Deliberate near-neighbor problems added during the course-wide mastery audit.
// Each small family changes one structural property at a time so the learner can
// see why a boundary, ordering choice, update location, or data shape matters.
const masteryExtensionQuestions: Record<string, CoursePracticeQuestion[]> = {
  "comparisons-booleans": [
    exact("bool-mastery-boundary-1", "Apply", "Boundary contrast", "Exclude the boundary", "What prints?", "int age = 18;\nSystem.out.println(age > 18);", "false", "> excludes 18 itself.", "Correct. Removing = changes the answer at the boundary."),
    exact("bool-mastery-boundary-2", "Apply", "Boundary contrast", "Include the boundary", "What prints?", "int age = 18;\nSystem.out.println(age >= 18);", "true", ">= includes 18 itself.", "Correct. One added character changes the boundary result."),
    exact("bool-truth-not-and", "Apply", "Truth-order trace", "Reverse Before Requiring Both", "What prints?", "boolean paused = false;\nboolean signedIn = true;\nSystem.out.println(!paused && signedIn);", "true", "Apply ! to paused before evaluating &&.", "Correct. !false becomes true, then true && true becomes true."),
    exact("bool-truth-and-before-or", "Apply", "Precedence contrast", "Let AND Finish Before OR", "What prints?", "boolean member = true;\nboolean adult = false;\nboolean hasId = false;\nSystem.out.println(member || adult && hasId);", "true", "Without parentheses, evaluate adult && hasId before ||.", "Correct. false && false becomes false, then true || false becomes true."),
    exact("bool-truth-parentheses-change", "Apply", "Grouping contrast", "Make the Group Finish First", "What prints?", "boolean member = true;\nboolean adult = false;\nboolean hasId = false;\nSystem.out.println((member || adult) && hasId);", "false", "The parentheses make member || adult finish before &&.", "Correct. The grouped OR becomes true, then true && false becomes false."),
    exact("bool-truth-negated-group-true", "Apply", "Negated-group trace", "Reverse a False Group", "What prints?", "boolean member = false;\nint age = 16;\nboolean hasId = true;\nSystem.out.println(!(member || age >= 18) && hasId);", "true", "Resolve age >= 18, finish the parenthesized OR, reverse it, and then apply &&.", "Correct. false || false is false, ! makes it true, and true && true remains true."),
    exact("bool-mastery-grouping", "Challenge", "Grouping contrast", "Trace the parentheses", "What prints?", "boolean member = false;\nint age = 20;\nboolean hasId = false;\nSystem.out.println(!(member || age >= 18) && hasId);", "false", "Evaluate the parentheses, reverse that result, then apply &&.", "Correct. The grouped OR becomes true, ! makes it false, and false && false remains false."),
    groundedChoice("bool-truth-trace-order", "Choose the Correct Reduction", "Which trace follows Java's evaluation order?", "boolean a = false;\nboolean b = true;\nboolean c = false;\nSystem.out.println(!a && b || c);", ["!false && true || false → true && true || false → true || false → true", "!false && true || false → !(false && true) || false → true", "!false && true || false → false && true || false → false", "!false && true || false → true && (true || false) → false"], "!false && true || false → true && true || false → true || false → true", "Apply ! first, then &&, then ||.", "Correct. Each step reduces only the next operation in Java's precedence order."),
    exact("bool-truth-mixed-comparisons", "Challenge", "Mixed truth trace", "Let an Alternative Rescue the Result", "What prints?", "int score = 65;\nboolean submitted = true;\nboolean override = true;\nSystem.out.println(score >= 70 && submitted || override);", "true", "Resolve the score comparison, then &&, then ||.", "Correct. false && true becomes false, then the true override makes false || true evaluate to true."),
  ],
  "if-else": [
    exact("if-mastery-order-1", "Apply", "Branch-order contrast", "Let the broad branch win", "What prints?", "int score = 95;\nif (score >= 70) {\n    System.out.println(\"Pass\");\n} else if (score >= 90) {\n    System.out.println(\"A\");\n}", "Pass", "The first true branch ends the chain.", "Correct. A broad condition placed first captures 95."),
    exact("if-mastery-order-2", "Apply", "Branch-order contrast", "Let the specific branch win", "What prints?", "int score = 95;\nif (score >= 90) {\n    System.out.println(\"A\");\n} else if (score >= 70) {\n    System.out.println(\"Pass\");\n}", "A", "The more specific threshold is now tested first.", "Correct. Reordering the same conditions changes the reached branch."),
    exact("if-mastery-independent", "Challenge", "Control-flow contrast", "Notice two independent decisions", "Write the exact output.", "int n = 8;\nif (n > 5) {\n    System.out.println(\"A\");\n}\nif (n % 2 == 0) {\n    System.out.println(\"B\");\n}", "A\nB", "These are two separate if statements, not one chain.", "Correct. Both true conditions run.", true),
  ],
  "decision-programs": [
    exact("decision-mastery-gap", "Apply", "Range boundary", "Find the uncovered value", "Which integer from 1 through 10 reaches neither branch?", "if (value <= 5) {\n    System.out.println(\"Low\");\n} else if (value > 6) {\n    System.out.println(\"High\");\n}", "6", "The first branch stops at 5 and the second begins above 6.", "Correct. The conditions leave a gap at 6."),
    exact("decision-mastery-max-tie", "Apply", "State trace", "Keep the first equal maximum", "What prints?", "int first = 9;\nint second = 9;\nint max = first;\nif (second > max) {\n    max = second;\n}\nSystem.out.println(max);", "9", "Equality does not satisfy >, but the initialized candidate is already correct.", "Correct. No update is required for an equal value."),
  ],
  "while-loops": [
    exact("while-mastery-zero", "Apply", "Zero-iteration trace", "Check before entering", "What is the exact output?", "int n = 0;\nwhile (n > 0) {\n    System.out.println(n);\n    n--;\n}\nSystem.out.println(\"Done\");", "Done", "while checks its condition before the first body execution.", "Correct. The body runs zero times."),
    exact("while-mastery-update-order", "Apply", "Update-order trace", "Update before printing", "Write the exact output.", "int n = 1;\nwhile (n < 4) {\n    n++;\n    System.out.println(n);\n}", "2\n3\n4", "The increment occurs before each println.", "Correct. Moving the update changes every displayed value.", true),
    exact("while-mastery-empty-sentinel", "Challenge", "Sentinel edge case", "Stop before any data", "The first entered value is -1. What prints?", "int value = input.nextInt();\nint count = 0;\nwhile (value != -1) {\n    count++;\n    value = input.nextInt();\n}\nSystem.out.println(count);", "0", "The sentinel fails the condition before the body runs.", "Correct. The stop value is not counted."),
  ],
  "for-loops": [
    exact("for-mastery-endpoint", "Apply", "Endpoint trace", "Step past the boundary", "Write the exact output.", "for (int i = 1; i <= 6; i += 2) {\n    System.out.println(i);\n}", "1\n3\n5", "The next value after 5 is 7, which fails <= 6.", "Correct. An included endpoint prints only when the step actually reaches it.", true),
    exact("for-mastery-empty", "Apply", "Zero-iteration trace", "Start outside the range", "What prints?", "int count = 0;\nfor (int i = 5; i < 5; i++) {\n    count++;\n}\nSystem.out.println(count);", "0", "The condition is false at the first check.", "Correct. A for loop can also execute zero times."),
    exact("for-mastery-state", "Challenge", "Multi-rule trace", "Combine step and condition", "What prints?", "int total = 0;\nfor (int i = 2; i <= 8; i += 2) {\n    if (i % 4 == 0) {\n        total += i;\n    }\n}\nSystem.out.println(total);", "12", "Only 4 and 8 satisfy the inner condition.", "Correct. The loop range and condition select 4 + 8."),
  ],
  "nested-loops": [
    exact("nested-mastery-reset", "Apply", "Loop-state trace", "Reset the inner counter", "How many times does X print?", "for (int row = 0; row < 3; row++) {\n    for (int col = 0; col < 2; col++) {\n        System.out.print(\"X\");\n    }\n}", "6", "A new col is created from 0 for every outer iteration.", "Correct. Three rows each perform two inner iterations."),
    exact("nested-mastery-dependent", "Challenge", "Dependent-bound trace", "Let the row control the work", "How many stars print in total?", "for (int row = 1; row <= 4; row++) {\n    for (int col = 1; col <= row; col++) {\n        System.out.print(\"*\");\n    }\n}", "10", "Add the inner counts 1 + 2 + 3 + 4.", "Correct. The changing inner bound produces 10 total executions."),
  ],
  methods: [
    exact("methods-mastery-copy", "Apply", "Parameter-state trace", "Change only the local parameter", "What prints?", "public static void addOne(int number) {\n    number++;\n    System.out.println(number);\n}\n\nint score = 5;\naddOne(score);\nSystem.out.println(score);", "6\n5", "The int argument supplies a value to a separate local parameter.", "Correct. The method prints its changed local value; the caller still stores 5.", true),
    exact("methods-mastery-order", "Apply", "Call-order trace", "Finish one call before the next", "Write the exact output.", "public static void show(int value) {\n    System.out.println(value);\n}\n\nshow(2);\nshow(5);\nshow(2 + 5);", "2\n5\n7", "Each call completes before execution reaches the next statement.", "Correct. The same method receives three independently evaluated arguments.", true),
    codeExact("methods-mastery-mismatch", "Challenge", "Argument repair", "Match count, order, and types", "Rewrite only the call using Maya, 90, and true so it matches the method header.", "public static void label(String name, int score, boolean passed) { }\n\nlabel(90, \"Maya\");", "label(\"Maya\", 90, true);", "The call needs three arguments matching String, int, boolean from left to right.", "Correct. Count, order, and types now match the parameters."),
  ],
  "returns-scope": [
    exact("returns-mastery-use", "Apply", "Return-value trace", "Use the result twice", "What prints?", "public static int addOne(int n) {\n    return n + 1;\n}\n\nint value = addOne(4);\nSystem.out.println(value + addOne(value));", "11", "value stores 5; addOne(value) returns 6.", "Correct. A returned value can be stored and used in another expression."),
    exact("returns-mastery-early", "Apply", "Return-flow trace", "Stop the method immediately", "What prints?", "public static int classify(int n) {\n    if (n < 0) {\n        return -1;\n    }\n    return 1;\n}\n\nSystem.out.println(classify(-3));", "-1", "Once return executes, the method is finished.", "Correct. The later return is not reached for negative input."),
    codeExact("returns-mastery-print", "Challenge", "Return-vs-output repair", "Return instead of printing", "Rewrite the complete method so the caller can store its int result.", "public static void doubleValue(int n) {\n    System.out.println(n * 2);\n}", "public static int doubleValue(int n) {\nreturn n * 2;\n}", "Change the declared return type and send the expression back with return.", "Correct. The method now produces a reusable int rather than only console output.", true),
  ],
  arrays: [
    exact("arrays-mastery-first-last", "Apply", "Index contrast", "Use both ends", "What prints?", "int[] values = {4, 8, 12, 16};\nSystem.out.println(values[0] + values[values.length - 1]);", "20", "The first value is 4 and the last is 16.", "Correct. The two endpoint indexes produce 4 + 16."),
    exact("arrays-mastery-default-update", "Apply", "State contrast", "Replace one default", "Write the exact output.", "int[] counts = new int[3];\ncounts[1] = 7;\nSystem.out.println(counts[0]);\nSystem.out.println(counts[1]);", "0\n7", "Only index 1 is assigned after creation.", "Correct. Untouched int elements remain 0 while index 1 stores 7.", true),
    exact("arrays-mastery-bound", "Challenge", "Runtime boundary", "Identify the first invalid index", "What is the first invalid index for this array?", "String[] names = new String[6];", "6", "Valid indexes run from 0 through length - 1.", "Correct. Index 6 equals the length and is outside the array."),
  ],
  "arrays-loops": [
    exact("arrayloop-mastery-empty", "Apply", "Empty traversal", "Handle zero elements", "What prints?", "int[] values = new int[0];\nint sum = 0;\nfor (int value : values) {\n    sum += value;\n}\nSystem.out.println(sum);", "0", "There are no elements, so the body never runs.", "Correct. The accumulator keeps its initial value."),
    exact("arrayloop-mastery-single", "Apply", "Single-element trace", "Initialize from real data", "What prints?", "int[] values = {-8};\nint max = values[0];\nfor (int value : values) {\n    if (value > max) {\n        max = value;\n    }\n}\nSystem.out.println(max);", "-8", "The only element is already the best candidate.", "Correct. Data-based initialization handles a one-element negative array."),
    codeExact("arrayloop-mastery-bound", "Challenge", "Traversal repair", "Visit each element exactly once", "Rewrite only the loop header so every element is updated safely.", "for (int i = 1; i <= values.length; i++) {\n    values[i] += 1;\n}", "for (int i = 0; i < values.length; i++) {", "Start at the first valid index and stop before length.", "Correct. The repaired bounds include index 0 and exclude the first invalid index."),
  ],
  strings: [
    exact("strings-mastery-concat-1", "Apply", "Concatenation contrast", "Calculate before text begins", "What prints?", "System.out.println(2 + 3 + \" points\");", "5 points", "Before Java reaches a String, + adds the two ints.", "Correct. The numeric addition happens first."),
    exact("strings-mastery-concat-2", "Apply", "Concatenation contrast", "Join after text begins", "What prints?", "System.out.println(\"Points: \" + 2 + 3);", "Points: 23", "Once the left side is a String, later + operations join text left to right.", "Correct. The same numbers become characters in the output."),
    exact("strings-mastery-empty", "Challenge", "String boundary", "Recognize an invalid character access", "Answer with exactly: valid or runtime error", "String text = \"\";\nSystem.out.println(text.charAt(0));", "runtime error", "An empty String has length 0 and therefore no valid index 0.", "Correct. charAt(0) is outside the empty String."),
  ],
  arraylists: [
    exact("list-mastery-shift", "Apply", "Removal-state trace", "Track two shifts", "What prints?", "ArrayList<String> items = new ArrayList<>();\nitems.add(\"A\");\nitems.add(\"B\");\nitems.add(\"C\");\nitems.add(\"D\");\nitems.remove(1);\nitems.remove(1);\nSystem.out.println(items.get(1));", "D", "After B is removed, C shifts to index 1; the second removal removes C.", "Correct. D becomes the element at index 1."),
    exact("list-mastery-backward", "Challenge", "Backward-removal trace", "Remove without skipping", "What is the final size?", "ArrayList<Integer> values = new ArrayList<>();\nvalues.add(-1); values.add(2); values.add(-3); values.add(4);\nfor (int i = values.size() - 1; i >= 0; i--) {\n    if (values.get(i) < 0) {\n        values.remove(i);\n    }\n}\nSystem.out.println(values.size());", "2", "Backward indexes remain safe when later elements shift left.", "Correct. Both negative values are removed and two values remain."),
    codeExact("list-mastery-size", "Apply", "Collection-bound repair", "Use the current list size", "Rewrite only the loop header.", "for (int i = 0; i <= names.size(); i++) {", "for (int i = 0; i < names.size(); i++) {", "The first invalid list index equals size().", "Correct. The loop visits 0 through size() - 1."),
  ],
  searching: [
    exact("search-mastery-duplicate-last", "Apply", "Search variation", "Keep the last match", "What index is stored?", "int[] values = {5, 2, 5, 8, 5};\nint result = -1;\nfor (int i = 0; i < values.length; i++) {\n    if (values[i] == 5) {\n        result = i;\n    }\n}\nSystem.out.println(result);", "4", "Do not stop at a match; later matches replace result.", "Correct. A complete traversal leaves the last matching index."),
    exact("search-mastery-count", "Apply", "Search variation", "Count every match", "What prints?", "int[] values = {3, 3, 1, 3};\nint count = 0;\nfor (int value : values) {\n    if (value == 3) {\n        count++;\n    }\n}\nSystem.out.println(count);", "3", "Counting deliberately continues after each match.", "Correct. Three elements match the target."),
    exact("search-mastery-binary-missing", "Challenge", "Binary-search trace", "Shrink to an empty range", "What result remains after a correct binary search?", "int[] values = {2, 5, 9, 12, 18};\nint target = 7;\nint result = -1;", "-1", "The target belongs between 5 and 9 but matches neither; failure keeps the sentinel result.", "Correct. A sorted array can still produce not found."),
  ],
  sorting: [
    exact("sort-mastery-already", "Apply", "Sort edge case", "Trace an already sorted pass", "What is the array after the first selection-sort pass?", "int[] values = {1, 3, 5, 7};", "{1, 3, 5, 7}", "The minimum of the full range is already at index 0.", "Correct. A valid pass may leave the array unchanged."),
    exact("sort-mastery-duplicates", "Apply", "Sort edge case", "Keep duplicate values", "What is the ascending result?", "int[] values = {4, 2, 4, 1};", "{1, 2, 4, 4}", "Sorting changes order, not the number of occurrences.", "Correct. Both copies of 4 remain."),
    exact("sort-mastery-one-pass", "Challenge", "Partial-sort trace", "Do not assume one pass finishes", "What is the array after only the first selection-sort pass?", "int[] values = {4, 3, 2, 1};", "{1, 3, 2, 4}", "Find the minimum 1 and swap only indexes 0 and 3.", "Correct. One fixed position does not mean the remaining suffix is sorted."),
  ],
  "algorithmic-problem-solving": [
    exact("algorithm-mastery-divergence", "Apply", "First-divergence trace", "Find the first wrong state", "On which loop value does actual first differ from expected?", "Expected running sums for values {2, 3, 4}: 2, 5, 9\n\nint sum = 0;\nfor (int value : values) {\n    sum = value;\n}", "3", "After value 2 both are 2; on value 3 the code replaces 2 instead of adding to it.", "Correct. The first divergence occurs during the second element, value 3."),
    exact("algorithm-mastery-case", "Challenge", "Case-design choice", "Choose the missing structural test", "An array-maximum method has tests for {3, 8, 2} and {5}. Which single additional input best exposes an incorrect initialization of max = 0?", "{0, 4} · {-8, -3, -10} · {1, 2, 3} · {9, 9}", "{-8, -3, -10}", "The bug is hidden whenever zero is not larger than all real values.", "Correct. Negative-only data exposes the false candidate 0."),
  ],
  "input-output": [
    exact("io-mastery-empty", "Apply", "Empty-stream edge case", "Protect the division", "No integers are available. What prints?", "int count = 0;\nint sum = 0;\nwhile (input.hasNextInt()) {\n    sum += input.nextInt();\n    count++;\n}\nif (count == 0) {\n    System.out.println(\"No values\");\n}", "No values", "hasNextInt is false before the body runs.", "Correct. The empty stream reaches the protected case."),
    exact("io-mastery-format", "Apply", "Formatting trace", "Round only the display", "What exact line prints?", "double average = 2.0 / 3.0;\nSystem.out.printf(\"Average: %.2f%n\", average);", "Average: 0.67", "%.2f displays two digits after the decimal point.", "Correct. Formatting controls the output without changing the stored double."),
  ],
  "debugging-testing": [
    exact("debug-mastery-stage", "Apply", "Failure-stage contrast", "Classify a legal program with a wrong result", "Answer with exactly: compile-time, runtime, or logic", "int total = 5;\nint count = 2;\ndouble average = total / count;\nSystem.out.println(average); // expected 2.5", "logic", "The code compiles and runs; the produced value violates the requirement.", "Correct. Integer division creates a logic error, not a crash."),
    exact("debug-mastery-boundary", "Challenge", "Boundary-test selection", "Expose the one-character condition bug", "Which single input best distinguishes age > 18 from age >= 18?", "17 · 18 · 19 · 100", "18", "Choose the exact point where inclusion changes.", "Correct. Both conditions agree away from the boundary and differ at 18."),
  ],
};

// One retrieval-first build closes every substantive programming chapter.
// These prompts state behavior and leave the implementation choices to the learner.
const independentProductionQuestions: Record<string, CoursePracticeQuestion[]> = {
  "input-basic-programs": [
    independentBuild("input-independent-build", "Build a Distance Calculator", "Given Scanner input, read a decimal speed and a whole-number number of hours. Calculate the distance and print Distance: VALUE.", "double speed = input.nextDouble();\nint hours = input.nextInt();\ndouble distance = speed * hours;\nSystem.out.println(\"Distance: \" + distance);", [/double\w+=input\.nextDouble\(\);/, /int\w+=input\.nextInt\(\);/, /double\w+=\w+\*\w+;/, /System\.out\.println\("Distance:"\+\w+\);/], "Choose a matching read and type for each input, then calculate and label the result.", "You independently assembled typed input, calculation, storage, and output."),
  ],
  "comparisons-booleans": [
    independentBuild("bool-independent-build", "Build an Eligibility Check", "Given int age and boolean member, store whether someone is either a member or is at least 18, then print the result.", "boolean eligible = member || age >= 18;\nSystem.out.println(eligible);", [/boolean\w+=/, /member\|\|age>=18|age>=18\|\|member/, /System\.out\.println\(\w+\);/], "Build one boolean expression from the two allowed paths, store it, and print that stored result.", "You retrieved and combined the comparison, logical operator, assignment, and output without starter code."),
  ],
  "if-else": [
    independentBuild("if-independent-build", "Build a Shipping Classifier", "Given double total, print Free when it is at least 50, Reduced when it is at least 25, and Standard otherwise.", "if (total >= 50) {\n    System.out.println(\"Free\");\n} else if (total >= 25) {\n    System.out.println(\"Reduced\");\n} else {\n    System.out.println(\"Standard\");\n}", [/if\(total>=50\)/, /elseif\(total>=25\)/, /else\{/, /System\.out\.println\("Free"\)/, /System\.out\.println\("Reduced"\)/, /System\.out\.println\("Standard"\)/], "Order the narrower high range before the lower boundary so only one label prints.", "You independently built a complete, correctly ordered three-path decision."),
  ],
  "decision-programs": [
    independentBuild("decision-independent-build", "Build a Validated Score Report", "Given int score, print Invalid outside 0 through 100, Pass for a valid score of at least 70, and Retry for every other valid score.", "if (score < 0 || score > 100) {\n    System.out.println(\"Invalid\");\n} else if (score >= 70) {\n    System.out.println(\"Pass\");\n} else {\n    System.out.println(\"Retry\");\n}", [/score<0\|\|score>100/, /score>=70/, /System\.out\.println\("Invalid"\)/, /System\.out\.println\("Pass"\)/, /System\.out\.println\("Retry"\)/], "Reject impossible values before classifying the valid range.", "You translated a behavior contract into ordered validation and classification paths."),
  ],
  "while-loops": [
    independentBuild("while-independent-build", "Build a Sentinel Total", "Use Scanner input to read integers until 0 is entered. Do not add 0. Print the sum of the earlier values.", "int value = input.nextInt();\nint sum = 0;\nwhile (value != 0) {\n    sum += value;\n    value = input.nextInt();\n}\nSystem.out.println(sum);", [/int\w+=input\.nextInt\(\);/, /int\w+=0;/, /while\(\w+!=0\)/, /\w+\+=\w+;/, /\w+=input\.nextInt\(\);/, /System\.out\.println\(\w+\);/], "Read once before the loop, update the total inside it, and read the next value before testing again.", "You retrieved the complete sentinel-loop pattern from behavior alone."),
  ],
  "for-loops": [
    independentBuild("for-independent-build", "Build an Even-Number Total", "Calculate and print the sum of every even whole number from 2 through 20.", "int sum = 0;\nfor (int value = 2; value <= 20; value += 2) {\n    sum += value;\n}\nSystem.out.println(sum);", [/int\w+=0;/, /for\(int\w+=2;\w+<=20;\w+\+=2\)/, /\w+\+=\w+;/, /System\.out\.println\(\w+\);/], "Choose a start, inclusive endpoint, and update that visits only the needed values.", "You independently selected the loop range, step, accumulator, and output."),
  ],
  "nested-loops": [
    independentBuild("nested-independent-build", "Build a Number Grid", "Print three rows. Each row must contain the numbers 1 through 4 with a space after each number.", "for (int row = 1; row <= 3; row++) {\n    for (int number = 1; number <= 4; number++) {\n        System.out.print(number + \" \" );\n    }\n    System.out.println();\n}", [/for\(int\w+=1;\w+<=3;\w+\+\+\)/, /for\(int\w+=1;\w+<=4;\w+\+\+\)/, /System\.out\.print\(\w+\+""\);/, /System\.out\.println\(\);/], "One loop controls rows; the other prints the four values before the line break.", "You built a two-dimensional repetition pattern without a starter structure."),
  ],
  methods: [
    independentBuild("methods-independent-build", "Build a Reusable Receipt Line", "Create a void method named printReceiptLine that receives an item name, quantity, and price. It must print the item followed by its calculated total. Call it once with any valid values.", "public static void printReceiptLine(String item, int quantity, double price) {\n    double total = quantity * price;\n    System.out.println(item + \": \" + total);\n}\n\nprintReceiptLine(\"Notebook\", 2, 3.5);", [/publicstaticvoidprintReceiptLine\(String\w+,int\w+,double\w+\)/, /double\w+=\w+\*\w+;/, /System\.out\.println\(/, /printReceiptLine\([^;]+\);/], "Decide what belongs in the parameter list, what calculation belongs inside, and how a caller supplies values.", "You independently defined and called a reusable method from its behavior contract."),
  ],
  "returns-scope": [
    independentBuild("returns-independent-build", "Build and Use a Larger-Value Method", "Create a method named larger that receives two integers and returns the greater value. Call it, store its result, and print the stored result.", "public static int larger(int first, int second) {\n    if (first > second) {\n        return first;\n    }\n    return second;\n}\n\nint result = larger(840, 915);\nSystem.out.println(result);", [/publicstaticintlarger\(int\w+,int\w+\)/, /if\(\w+>\w+\)/, /return\w+;/, /int\w+=larger\(/, /System\.out\.println\(\w+\);/], "The method must produce a value for its caller; the caller then stores and prints it.", "You retrieved return type, parameters, branching, return statements, a call, and stored output."),
  ],
  arrays: [
    independentBuild("arrays-independent-build", "Build and Update an Array", "Create an integer array with room for four values. Store 10 in its first element and 40 in its last element, then print those two values on separate lines.", "int[] values = new int[4];\nvalues[0] = 10;\nvalues[3] = 40;\nSystem.out.println(values[0]);\nSystem.out.println(values[3]);", [/int\[\]\w+=newint\[4\];/, /\w+\[0\]=10;/, /\w+\[3\]=40;/, /System\.out\.println\(\w+\[0\]\);/, /System\.out\.println\(\w+\[3\]\);/], "Translate first and last into their zero-based positions in a four-element array.", "You independently created, indexed, updated, and read an array."),
  ],
  "arrays-loops": [
    independentBuild("arrayloop-independent-build", "Build an Array Average", "Given a nonempty int array named values, calculate its decimal average and print it.", "int sum = 0;\nfor (int value : values) {\n    sum += value;\n}\ndouble average = (double) sum / values.length;\nSystem.out.println(average);", [/int\w+=0;/, /for\(int\w+:values\)/, /\w+\+=\w+;/, /double\w+=\(double\)\w+\/values\.length;/, /System\.out\.println\(\w+\);/], "Finish the traversal and total before performing one decimal division.", "You independently selected traversal, accumulation, casting, division, and output."),
  ],
  strings: [
    independentBuild("strings-independent-build", "Build a Case-Insensitive Match Counter", "Given String text, count how many characters are the letter a regardless of case, then print the count.", "text = text.toLowerCase();\nint count = 0;\nfor (int i = 0; i < text.length(); i++) {\n    if (text.charAt(i) == 'a') {\n        count++;\n    }\n}\nSystem.out.println(count);", [/toLowerCase\(\)/, /int\w+=0;/, /for\(int\w+=0;\w+<text\.length\(\);\w+\+\+\)/, /text\.charAt\(\w+\)=='a'/, /\w+\+\+;/, /System\.out\.println\(\w+\);/], "Normalize the text once, then inspect one character at a time.", "You independently combined String normalization, character traversal, a condition, and counting."),
  ],
  arraylists: [
    independentBuild("arraylist-independent-build", "Build a Safe Removal Pass", "Given ArrayList<Integer> values, remove every negative value without skipping adjacent negatives, then print the remaining list.", "for (int i = values.size() - 1; i >= 0; i--) {\n    if (values.get(i) < 0) {\n        values.remove(i);\n    }\n}\nSystem.out.println(values);", [/for\(int\w+=values\.size\(\)-1;\w+>=0;\w+--\)/, /values\.get\(\w+\)<0/, /values\.remove\(\w+\)/, /System\.out\.println\(values\);/], "Removing shifts later indexes, so choose the traversal direction that keeps unvisited positions stable.", "You independently selected safe backward traversal and mutation."),
  ],
  searching: [
    independentBuild("search-independent-build", "Build a First-Match Search", "Create a method named findFirst that receives an int array and a target. Return the first matching index, or -1 if the target is absent.", "public static int findFirst(int[] values, int target) {\n    for (int i = 0; i < values.length; i++) {\n        if (values[i] == target) {\n            return i;\n        }\n    }\n    return -1;\n}", [/publicstaticintfindFirst\(int\[\]\w+,int\w+\)/, /for\(int\w+=0;\w+<\w+\.length;\w+\+\+\)/, /if\(\w+\[\w+\]==\w+\)/, /return\w+;/, /return-1;/], "A match can return during traversal; failure is known only after traversal ends.", "You independently built the complete search contract and failure behavior."),
  ],
  sorting: [
    independentBuild("sorting-independent-build", "Build One Selection Pass", "Given a nonempty int array named values, find the smallest value and swap it into index 0.", "int minIndex = 0;\nfor (int i = 1; i < values.length; i++) {\n    if (values[i] < values[minIndex]) {\n        minIndex = i;\n    }\n}\nint temp = values[0];\nvalues[0] = values[minIndex];\nvalues[minIndex] = temp;", [/int\w+=0;/, /for\(int\w+=1;\w+<values\.length;\w+\+\+\)/, /values\[\w+\]<values\[\w+\]/, /\w+=\w+;/, /int\w+=values\[0\];/, /values\[0\]=values\[\w+\];/, /values\[\w+\]=\w+;/], "Remember the position of the smallest value, then perform one three-statement swap after the search.", "You independently composed search state and a swap into one sorting pass."),
  ],
  "algorithmic-problem-solving": [
    independentBuild("algorithm-independent-build", "Build a Parallel-Array Report", "Given nonempty matching String[] names and int[] scores, print the name and score belonging to the highest score.", "int bestIndex = 0;\nfor (int i = 1; i < scores.length; i++) {\n    if (scores[i] > scores[bestIndex]) {\n        bestIndex = i;\n    }\n}\nSystem.out.println(names[bestIndex] + \": \" + scores[bestIndex]);", [/int\w+=0;/, /for\(int\w+=1;\w+<scores\.length;\w+\+\+\)/, /scores\[\w+\]>scores\[\w+\]/, /\w+=\w+;/, /System\.out\.println\(names\[\w+\]\+":"\+scores\[\w+\]\);/], "Keep the best index rather than copying only the score so both arrays stay connected.", "You independently translated a multi-step data requirement into a working algorithm."),
  ],
  "input-output": [
    independentBuild("io-independent-build", "Build an Unknown-Length Average", "Read every available integer from Scanner input. Print No values when none exist; otherwise print the decimal average labeled Average:.", "int count = 0;\nint sum = 0;\nwhile (input.hasNextInt()) {\n    sum += input.nextInt();\n    count++;\n}\nif (count == 0) {\n    System.out.println(\"No values\");\n} else {\n    double average = (double) sum / count;\n    System.out.println(\"Average: \" + average);\n}", [/while\(input\.hasNextInt\(\)\)/, /\w+\+=input\.nextInt\(\);/, /\w+\+\+;/, /if\(\w+==0\)/, /System\.out\.println\("Novalues"\)/, /\(double\)\w+\/\w+/, /System\.out\.println\("Average:"\+\w+\)/], "Accumulate first, protect the empty case, and divide only when at least one value was read.", "You independently built a safe unknown-length stream calculation."),
  ],
  "debugging-testing": [
    independentBuild("debug-independent-build", "Repair an Average Method", "Write a corrected method named average that receives an int array, returns 0.0 for an empty array, and otherwise returns the decimal average. Build it from scratch instead of editing supplied code.", "public static double average(int[] values) {\n    if (values.length == 0) {\n        return 0.0;\n    }\n    int sum = 0;\n    for (int value : values) {\n        sum += value;\n    }\n    return (double) sum / values.length;\n}", [/publicstaticdoubleaverage\(int\[\]\w+\)/, /if\(\w+\.length==0\)/, /return0\.0;/, /int\w+=0;/, /for\(int\w+:\w+\)/, /\w+\+=\w+;/, /return\(double\)\w+\/\w+\.length;/], "Protect the structural edge case, complete the accumulation, then divide once with decimal arithmetic.", "You independently reconstructed the repaired method and its edge-case behavior."),
  ],
  "computers-programs-algorithms": [
    independentBuild("foundations-independent-build", "Build an Algorithm from a Contract", "Define public static int countNegatives that receives int[] values and returns how many elements are below zero. Then call it with an example array and print the result.", "public static int countNegatives(int[] values) {\n    int count = 0;\n    for (int value : values) {\n        if (value < 0) {\n            count++;\n        }\n    }\n    return count;\n}\n\nint[] data = {-2, 4, -1};\nSystem.out.println(countNegatives(data));", [/publicstaticintcountNegatives\(int\[\]\w+\)/, /int\w+=0;/, /for\(int\w+:\w+\)/, /if\(\w+<0\)/, /\w+\+\+;/, /return\w+;/, /int\[\]\w+=\{[^}]+\};/, /System\.out\.println\(countNegatives\(\w+\)\)/], "Translate the algorithm into state, traversal, selection, update, return, and one concrete test call.", "You independently turned an algorithm description into working Java."),
  ],
  "cs-context-applications": [
    independentBuild("context-independent-build", "Build a Transparent Data Rule", "Given matching String[] labels and int[] values, print every label whose value is at least 50, then print Matches: COUNT.", "int matches = 0;\nfor (int i = 0; i < values.length; i++) {\n    if (values[i] >= 50) {\n        System.out.println(labels[i]);\n        matches++;\n    }\n}\nSystem.out.println(\"Matches: \" + matches);", [/int\w+=0;/, /for\(int\w+=0;\w+<values\.length;\w+\+\+\)/, /if\(values\[\w+\]>=50\)/, /System\.out\.println\(labels\[\w+\]\)/, /\w+\+\+;/, /System\.out\.println\("Matches:"\+\w+\)/], "Keep the threshold visible in the condition and the parallel data connected by one index.", "You independently implemented a clear, inspectable application rule."),
  ],
};

// Distributed requirements-to-code practice. These sit inside subsection checks,
// between tracing/repair work and the chapter's independent build.
const distributedProductionQuestions: Record<string, CoursePracticeQuestion[]> = {
  "input-basic-programs": [
    independentBuild("input-write-number-task", "Write a Numeric Input Fragment", "Given Scanner input, read a decimal temperature, add 2.5, and print Adjusted: VALUE. Choose your own variable names.", "double temperature = input.nextDouble();\ndouble adjusted = temperature + 2.5;\nSystem.out.println(\"Adjusted: \" + adjusted);", [/double\w+=input\.nextDouble\(\);/, /double\w+=\w+\+2\.5;/, /System\.out\.println\("Adjusted:"\+\w+\);/], "Turn the three behaviors into read, calculate, and output statements.", "You wrote a typed input calculation from requirements.", 3),
    independentBuild("input-write-text-task", "Write a Two-Word Input Fragment", "Given Scanner input, read two separate words and print them with one space between them. Choose your own variable names.", "String first = input.next();\nString second = input.next();\nSystem.out.println(first + \" \" + second);", [/String\w+=input\.next\(\);String\w+=input\.next\(\);/, /System\.out\.println\(\w+\+""\+\w+\);/], "Each word needs its own String read before the output joins them.", "You translated a text-input behavior into Java without starter code.", 3),
  ],
  "comparisons-booleans": [
    independentBuild("bool-write-comparison", "Write a Boundary Check", "Given int temperature, store whether it is at or below 32 in a boolean, then print that boolean.", "boolean freezing = temperature <= 32;\nSystem.out.println(freezing);", [/boolean\w+=temperature<=32;/, /System\.out\.println\(\w+\);/], "The requirement at or below includes the boundary.", "You produced a comparison and stored its boolean result.", 3),
    independentBuild("bool-write-combined", "Write a Two-Requirement Check", "Given int score and boolean submitted, store whether the score is at least 70 and the work was submitted, then print the result.", "boolean passed = score >= 70 && submitted;\nSystem.out.println(passed);", [/boolean\w+=score>=70&&submitted;/, /System\.out\.println\(\w+\);/], "Both requirements must be true at the same time.", "You built a compound boolean expression from behavior.", 3),
  ],
  "if-else": [
    independentBuild("if-write-two-path", "Write a Two-Path Decision", "Given int temperature, print Cold when it is below 50 and Warm otherwise.", "if (temperature < 50) {\n    System.out.println(\"Cold\");\n} else {\n    System.out.println(\"Warm\");\n}", [/if\(temperature<50\)/, /System\.out\.println\("Cold"\)/, /else\{/, /System\.out\.println\("Warm"\)/], "Translate the boundary into one condition and one fallback path.", "You wrote a complete two-path branch from requirements.", 3),
    independentBuild("if-write-nested", "Write a Nested Access Check", "Given boolean member and int age, print Allowed only when member is true and age is at least 18. Use one if inside another.", "if (member) {\n    if (age >= 18) {\n        System.out.println(\"Allowed\");\n    }\n}", [/if\(member\)\{if\(age>=18\)/, /System\.out\.println\("Allowed"\)/], "The outer decision checks membership; the inner decision checks age.", "You constructed nested control flow from a two-stage rule.", 3),
  ],
  "decision-programs": [
    independentBuild("decision-write-validation", "Write an Input Guard", "Given int quantity, print Invalid when it is negative and Valid otherwise.", "if (quantity < 0) {\n    System.out.println(\"Invalid\");\n} else {\n    System.out.println(\"Valid\");\n}", [/if\(quantity<0\)/, /System\.out\.println\("Invalid"\)/, /System\.out\.println\("Valid"\)/], "Separate impossible input from the ordinary path.", "You turned a validation requirement into executable branches.", 3),
    independentBuild("decision-write-menu", "Write a Small Menu", "Given int choice, print Start for 1, Help for 2, and Invalid for every other value.", "if (choice == 1) {\n    System.out.println(\"Start\");\n} else if (choice == 2) {\n    System.out.println(\"Help\");\n} else {\n    System.out.println(\"Invalid\");\n}", [/choice==1/, /choice==2/, /System\.out\.println\("Start"\)/, /System\.out\.println\("Help"\)/, /System\.out\.println\("Invalid"\)/], "Each command needs one mutually exclusive path.", "You produced a menu decision from its behavior contract.", 3),
  ],
  "while-loops": [
    independentBuild("while-write-counter", "Write a Counting Loop", "Print the whole numbers 1 through 5 with a while loop.", "int number = 1;\nwhile (number <= 5) {\n    System.out.println(number);\n    number++;\n}", [/int\w+=1;/, /while\(\w+<=5\)/, /System\.out\.println\(\w+\)/, /\w+\+\+;/], "Initialize before the loop and move toward the inclusive endpoint inside it.", "You retrieved the counter-loop structure from a task.", 3),
    independentBuild("while-write-accumulator", "Write a Running Total", "Use a while loop to add the whole numbers 1 through 10 and print the final sum.", "int number = 1;\nint sum = 0;\nwhile (number <= 10) {\n    sum += number;\n    number++;\n}\nSystem.out.println(sum);", [/int\w+=1;/, /int\w+=0;/, /while\(\w+<=10\)/, /\w+\+=\w+;/, /\w+\+\+;/, /System\.out\.println\(\w+\)/], "Keep the loop-control value separate from the accumulated result.", "You assembled control state and accumulated state from requirements.", 3),
  ],
  "for-loops": [
    independentBuild("for-write-range", "Write an Inclusive Range", "Print every whole number from 5 through 15 with a for loop.", "for (int number = 5; number <= 15; number++) {\n    System.out.println(number);\n}", [/for\(int\w+=5;\w+<=15;\w+\+\+\)/, /System\.out\.println\(\w+\)/], "Put the start, inclusive condition, and update in the loop header.", "You produced a for-loop range from behavior.", 3),
    independentBuild("for-write-total", "Write a For-Loop Total", "Calculate and print the sum of the whole numbers 1 through 100 using a for loop.", "int sum = 0;\nfor (int number = 1; number <= 100; number++) {\n    sum += number;\n}\nSystem.out.println(sum);", [/int\w+=0;/, /for\(int\w+=1;\w+<=100;\w+\+\+\)/, /\w+\+=\w+;/, /System\.out\.println\(\w+\)/], "Create the accumulator outside the loop and update it once per value.", "You independently connected a known-count loop to accumulation.", 3),
  ],
  "nested-loops": [
    independentBuild("nested-write-rectangle", "Write a Rectangle Pattern", "Use nested loops to print 3 rows of 5 stars.", "for (int row = 1; row <= 3; row++) {\n    for (int col = 1; col <= 5; col++) {\n        System.out.print(\"*\");\n    }\n    System.out.println();\n}", [/for\(int\w+=1;\w+<=3;\w+\+\+\)/, /for\(int\w+=1;\w+<=5;\w+\+\+\)/, /System\.out\.print\("\*"\)/, /System\.out\.println\(\)/], "The inner loop prints one row; the outer loop repeats the row.", "You built a rectangular output pattern from dimensions alone.", 3),
    independentBuild("nested-write-pairs", "Write Coordinate Pairs", "Print every row,column pair for rows 1–2 and columns 1–3 using nested loops.", "for (int row = 1; row <= 2; row++) {\n    for (int col = 1; col <= 3; col++) {\n        System.out.println(row + \",\" + col);\n    }\n}", [/for\(int\w+=1;\w+<=2;\w+\+\+\)/, /for\(int\w+=1;\w+<=3;\w+\+\+\)/, /System\.out\.println\(\w+\+","\+\w+\)/], "Print one pair during every inner-loop iteration.", "You translated a two-dimensional range into nested loops.", 3),
  ],
  methods: [
    independentBuild("methods-write-simple", "Write and Call a Void Method", "Define a public static void method named showReady that prints Ready, then call it once.", "public static void showReady() {\n    System.out.println(\"Ready\");\n}\n\nshowReady();", [/publicstaticvoidshowReady\(\)/, /System\.out\.println\("Ready"\)/, /showReady\(\);/], "Write the definition and a separate call statement.", "You produced both sides of the definition-and-call relationship.", 3),
    independentBuild("methods-write-parameter", "Write a Parameterized Method", "Define a public static void method named showDouble that receives one int and prints twice that value. Call it with 6.", "public static void showDouble(int value) {\n    System.out.println(value * 2);\n}\n\nshowDouble(6);", [/publicstaticvoidshowDouble\(int\w+\)/, /System\.out\.println\(\w+\*2\)/, /showDouble\(6\);/], "The received value needs a typed name inside the method.", "You wrote a reusable parameterized behavior from a task.", 3),
  ],
  "returns-scope": [
    independentBuild("returns-write-square", "Write a Returning Method", "Define public static int square that receives an int and returns its square. Call it with 7, store the result, and print it.", "public static int square(int value) {\n    return value * value;\n}\n\nint result = square(7);\nSystem.out.println(result);", [/publicstaticintsquare\(int\w+\)/, /return\w+\*\w+;/, /int\w+=square\(7\);/, /System\.out\.println\(\w+\)/], "The method produces a value; the caller decides what to do with it.", "You assembled a return contract and caller use from requirements.", 3),
    independentBuild("returns-write-constant", "Write a Local Constant", "Inside a method named showLimit, declare a local constant int MAX with value 10 and print it.", "public static void showLimit() {\n    final int MAX = 10;\n    System.out.println(MAX);\n}", [/publicstaticvoidshowLimit\(\)/, /finalintMAX=10;/, /System\.out\.println\(MAX\)/], "The non-reassignable local value needs final in its declaration.", "You placed a constant inside the scope where it is used.", 3),
  ],
  arrays: [
    independentBuild("arrays-write-create", "Write Array Creation and Storage", "Create an int array named scores with three elements. Store 80, 90, and 100 in order.", "int[] scores = new int[3];\nscores[0] = 80;\nscores[1] = 90;\nscores[2] = 100;", [/int\[\]scores=newint\[3\];/, /scores\[0\]=80;/, /scores\[1\]=90;/, /scores\[2\]=100;/], "Create the fixed-size container, then use its three valid indexes.", "You constructed and populated an array from a storage requirement.", 3),
    independentBuild("arrays-write-last", "Write a Last-Element Update", "Given a nonempty int array named values, increase its last element by 5 and print the updated value.", "values[values.length - 1] += 5;\nSystem.out.println(values[values.length - 1]);", [/values\[values\.length-1\]\+=5;/, /System\.out\.println\(values\[values\.length-1\]\)/], "The last valid index is one less than the length.", "You wrote a length-based update without a supplied index.", 3),
  ],
  "arrays-loops": [
    independentBuild("arrayloop-write-fill", "Write an Indexed Fill", "Given int[] values, store twice each index in its matching element.", "for (int i = 0; i < values.length; i++) {\n    values[i] = i * 2;\n}", [/for\(inti=0;i<values\.length;i\+\+\)/, /values\[i\]=i\*2;/], "The index is both the position and the source of each calculated value.", "You built a complete indexed fill from its rule.", 3),
    independentBuild("arrayloop-write-count", "Write an Array Count", "Given int[] values, count how many elements are greater than 10 and print the count.", "int count = 0;\nfor (int value : values) {\n    if (value > 10) {\n        count++;\n    }\n}\nSystem.out.println(count);", [/int\w+=0;/, /for\(int\w+:values\)/, /if\(\w+>10\)/, /\w+\+\+;/, /System\.out\.println\(\w+\)/], "Traverse every element and update one counter only for matches.", "You produced a filter-and-count traversal from requirements.", 3),
  ],
  strings: [
    independentBuild("strings-write-ends", "Write First and Last Character Output", "Given a nonempty String text, print its first character and then its last character on separate lines.", "System.out.println(text.charAt(0));\nSystem.out.println(text.charAt(text.length() - 1));", [/System\.out\.println\(text\.charAt\(0\)\)/, /System\.out\.println\(text\.charAt\(text\.length\(\)-1\)\)/], "Use index 0 for the first character and length minus one for the last.", "You translated String boundaries into character access code.", 3),
    independentBuild("strings-write-normalize", "Write a Normalized Search", "Given String text, store a lowercase version and print whether it contains java.", "String lower = text.toLowerCase();\nSystem.out.println(lower.contains(\"java\"));", [/String\w+=text\.toLowerCase\(\);/, /System\.out\.println\(\w+\.contains\("java"\)\)/], "Create the normalized value before performing the search.", "You composed two String operations from a behavior requirement.", 3),
  ],
  arraylists: [
    independentBuild("list-write-create", "Write List Creation and Access", "Create an ArrayList<String> named tasks, add Study and Rest, then print the first task.", "ArrayList<String> tasks = new ArrayList<>();\ntasks.add(\"Study\");\ntasks.add(\"Rest\");\nSystem.out.println(tasks.get(0));", [/ArrayList<String>tasks=newArrayList<>\(\);/, /tasks\.add\("Study"\);/, /tasks\.add\("Rest"\);/, /System\.out\.println\(tasks\.get\(0\)\)/], "Create the list before adding, then retrieve by zero-based position.", "You built a small resizable collection from requirements.", 3),
    independentBuild("list-write-update", "Write List Updates", "Given ArrayList<Integer> values, replace the first element with 99 and remove the last element.", "values.set(0, 99);\nvalues.remove(values.size() - 1);", [/values\.set\(0,99\);/, /values\.remove\(values\.size\(\)-1\);/], "Use one operation to replace and another to remove by index.", "You selected and wrote two different list mutations.", 3),
  ],
  searching: [
    independentBuild("search-write-contains", "Write a Contains Search", "Define public static boolean contains that receives int[] values and int target, returning true for any match and false when no match exists.", "public static boolean contains(int[] values, int target) {\n    for (int value : values) {\n        if (value == target) {\n            return true;\n        }\n    }\n    return false;\n}", [/publicstaticbooleancontains\(int\[\]values,inttarget\)/, /for\(int\w+:values\)/, /if\(\w+==target\)/, /returntrue;/, /returnfalse;/], "Success can return during traversal; failure comes after it.", "You produced a reusable search from its result contract.", 3),
    independentBuild("search-write-count", "Write a Match Count", "Define public static int countMatches that receives int[] values and int target and returns the number of matches.", "public static int countMatches(int[] values, int target) {\n    int count = 0;\n    for (int value : values) {\n        if (value == target) {\n            count++;\n        }\n    }\n    return count;\n}", [/publicstaticintcountMatches\(int\[\]values,inttarget\)/, /int\w+=0;/, /for\(int\w+:values\)/, /if\(\w+==target\)/, /\w+\+\+;/, /return\w+;/], "Unlike first-match search, this method must finish the traversal.", "You adapted search traversal into counting from requirements.", 3),
  ],
  sorting: [
    independentBuild("sort-write-swap", "Write a Two-Element Swap", "Given int[] values, swap the elements at indexes 0 and 1.", "int temp = values[0];\nvalues[0] = values[1];\nvalues[1] = temp;", [/int\w+=values\[0\];/, /values\[0\]=values\[1\];/, /values\[1\]=\w+;/], "Preserve one value before the first assignment overwrites it.", "You retrieved the three-statement swap from a task.", 3),
    independentBuild("sort-write-verify", "Write a Sorted-Order Check", "Define public static boolean isSorted that returns true when int[] values is in ascending order and false otherwise.", "public static boolean isSorted(int[] values) {\n    for (int i = 1; i < values.length; i++) {\n        if (values[i] < values[i - 1]) {\n            return false;\n        }\n    }\n    return true;\n}", [/publicstaticbooleanisSorted\(int\[\]values\)/, /for\(inti=1;i<values\.length;i\+\+\)/, /if\(values\[i\]<values\[i-1\]\)/, /returnfalse;/, /returntrue;/], "Compare each element with the one immediately before it.", "You constructed an order-verification algorithm from behavior.", 3),
  ],
  "algorithmic-problem-solving": [
    independentBuild("algorithm-write-positive-sum", "Write a Filtered Sum Method", "Define public static int sumPositive that returns the sum of only the positive values in an int array.", "public static int sumPositive(int[] values) {\n    int sum = 0;\n    for (int value : values) {\n        if (value > 0) {\n            sum += value;\n        }\n    }\n    return sum;\n}", [/publicstaticintsumPositive\(int\[\]values\)/, /int\w+=0;/, /for\(int\w+:values\)/, /if\(\w+>0\)/, /\w+\+=\w+;/, /return\w+;/], "Separate the traversal, qualification rule, and accumulated result.", "You translated a multi-step algorithm into a method.", 3),
    independentBuild("algorithm-write-parallel", "Write a Parallel-Array Lookup", "Given matching String[] names and int[] scores plus int index, print NAME: SCORE using that same index in both arrays.", "System.out.println(names[index] + \": \" + scores[index]);", [/System\.out\.println\(names\[index\]\+":"\+scores\[index\]\)/], "The shared index preserves the relationship between the arrays.", "You wrote the essential parallel-array operation from a data relationship.", 3),
  ],
  "input-output": [
    independentBuild("io-write-record", "Write a Fixed Record Read", "Given Scanner input, read a one-word name followed by an int score and print NAME: SCORE.", "String name = input.next();\nint score = input.nextInt();\nSystem.out.println(name + \": \" + score);", [/String\w+=input\.next\(\);/, /int\w+=input\.nextInt\(\);/, /System\.out\.println\(\w+\+":"\+\w+\)/], "Follow the record's field order and matching types.", "You produced a complete typed record read from its format.", 3),
    independentBuild("io-write-format", "Write Formatted Currency Output", "Given String item and double price, print ITEM $PRICE with exactly two decimal places.", "System.out.printf(\"%s $%.2f%n\", item, price);", [/System\.out\.printf\("%s\$%\.2f%n",item,price\);/], "Use one placeholder for text and one two-decimal placeholder for the price.", "You constructed formatted output from a display contract.", 3),
  ],
  "debugging-testing": [
    independentBuild("debug-write-safe-loop", "Rebuild a Safe Array Loop", "Given int[] values, print every element exactly once without accessing an invalid index.", "for (int i = 0; i < values.length; i++) {\n    System.out.println(values[i]);\n}", [/for\(inti=0;i<values\.length;i\+\+\)/, /System\.out\.println\(values\[i\]\)/], "Valid indexes begin at zero and stop before length.", "You reconstructed correct loop boundaries from required behavior.", 3),
    independentBuild("debug-write-tests", "Write Boundary Test Data", "Create int[] tests containing 69, 70, and 71, then print each value with a loop.", "int[] tests = {69, 70, 71};\nfor (int value : tests) {\n    System.out.println(value);\n}", [/int\[\]tests=\{69,70,71\};/, /for\(int\w+:tests\)/, /System\.out\.println\(\w+\)/], "The values immediately below, at, and above the boundary belong together.", "You turned a boundary-testing plan into executable test data.", 3),
  ],
  "computers-programs-algorithms": [
    independentBuild("foundations-write-steps", "Translate Steps into Java", "Given int[] values, calculate and print the sum of every element. Write the initialization, traversal, update, and output yourself.", "int sum = 0;\nfor (int value : values) {\n    sum += value;\n}\nSystem.out.println(sum);", [/int\w+=0;/, /for\(int\w+:values\)/, /\w+\+=\w+;/, /System\.out\.println\(\w+\)/], "Turn each language-independent step into one Java structure.", "You translated an algorithm sequence into executable statements.", 3),
    independentBuild("foundations-write-model", "Write a Small Data Model", "Represent one temperature reading using a String location and double temperature, then print LOCATION: TEMPERATURE.", "String location = \"Lab\";\ndouble temperature = 21.5;\nSystem.out.println(location + \": \" + temperature);", [/String\w+="[^"]+";/, /double\w+=-?\d+(?:\.\d+)?;/, /System\.out\.println\(\w+\+":"\+\w+\)/], "Choose variables that preserve both parts of the modeled reading.", "You converted a real-world event into stored data and output.", 3),
  ],
  "cs-context-applications": [
    independentBuild("context-write-bits", "Write a Representation Counter", "Given int[] bits containing only 0 and 1, count and print how many zero values it contains.", "int zeros = 0;\nfor (int bit : bits) {\n    if (bit == 0) {\n        zeros++;\n    }\n}\nSystem.out.println(zeros);", [/int\w+=0;/, /for\(int\w+:bits\)/, /if\(\w+==0\)/, /\w+\+\+;/, /System\.out\.println\(\w+\)/], "Treat the representation as data and count only the requested symbol.", "You wrote a computation over a simple digital representation.", 3),
    independentBuild("context-write-boundary", "Write an Auditable Boundary Rule", "Given int score, store whether it is between 0 and 100 inclusive and print the stored boolean.", "boolean valid = score >= 0 && score <= 100;\nSystem.out.println(valid);", [/boolean\w+=score>=0&&score<=100;/, /System\.out\.println\(\w+\)/], "Express both visible boundaries in one boolean rule.", "You implemented a transparent validity rule from its stated limits.", 3),
  ],
};

export const unitMasteryTests: UnitMasteryTest[] = [
  {
    id: "unit-1-mastery",
    unit: "Unit I · Java Fundamentals",
    title: "Unit I Mastery Test",
    description: "Build small programs from behavior alone. No starter code and no new Java beyond Chapters 1–3.",
    afterChapterId: "input-basic-programs",
    sectionId: "unit-1-mastery-test",
    questions: [
      independentBuild(
        "unit1-build-profile",
        "Build a Profile Line",
        "Given Scanner input, read a one-word name and a whole-number age. Print them in the form NAME is AGE.",
        "String name = input.next();\nint age = input.nextInt();\nSystem.out.println(name + \" is \" + age);",
        [/String\w+=input\.next\(\);/, /int\w+=input\.nextInt\(\);/, /System\.out\.println\(\w+\+"is"\+\w+\);/],
        "Choose a matching type and Scanner read for each input, then build the labeled output.",
        "You retrieved two input patterns and assembled the required output independently.",
        5,
      ),
      independentBuild(
        "unit1-build-time",
        "Build a Time Converter",
        "Given Scanner input, read a total number of seconds. Print how many complete minutes it contains and how many seconds remain, in the form MINUTES minutes and SECONDS seconds.",
        "int totalSeconds = input.nextInt();\nint minutes = totalSeconds / 60;\nint remainingSeconds = totalSeconds % 60;\nSystem.out.println(minutes + \" minutes and \" + remainingSeconds + \" seconds\");",
        [/int\w+=input\.nextInt\(\);/, /int\w+=\w+\/60;/, /int\w+=\w+%60;/, /System\.out\.println\(\w+\+"minutesand"\+\w+\+"seconds"\);/],
        "One calculation finds complete groups of 60; another finds what remains.",
        "You independently selected input, integer division, remainder, storage, and exact output.",
        5,
      ),
      independentBuild(
        "unit1-build-purchase",
        "Build a Purchase Calculation",
        "Given Scanner input, read a whole-number quantity and a decimal price. Calculate their subtotal, add a 5-dollar fee to a separate total, and print Total: VALUE.",
        "int quantity = input.nextInt();\ndouble price = input.nextDouble();\ndouble subtotal = quantity * price;\ndouble total = subtotal;\ntotal += 5;\nSystem.out.println(\"Total: \" + total);",
        [/int\w+=input\.nextInt\(\);/, /double\w+=input\.nextDouble\(\);/, /double\w+=\w+\*\w+;/, /double\w+=\w+;/, /\w+\+=5;/, /System\.out\.println\("Total:"\+\w+\);/],
        "Follow the data path: read, calculate the subtotal, copy it into a total, update that total, then print.",
        "You built a multi-type calculation from requirements rather than visual cues.",
        5,
      ),
      independentBuild(
        "unit1-build-full-line",
        "Build Mixed Number and Line Input",
        "Given Scanner input, read a whole-number age and then a full name that may contain spaces. Print NAME is AGE. Make sure the full name is actually read.",
        "int age = input.nextInt();\ninput.nextLine();\nString name = input.nextLine();\nSystem.out.println(name + \" is \" + age);",
        [/int\w+=input\.nextInt\(\);/, /input\.nextLine\(\);String\w+=input\.nextLine\(\);/, /System\.out\.println\(\w+\+"is"\+\w+\);/],
        "After the numeric read, account for the Enter key before asking for the full line.",
        "You retrieved the complete mixed-input sequence and preserved spaces in the name.",
        5,
      ),
      independentBuild(
        "unit1-build-credits",
        "Build a Credits Calculator",
        "A player starts with 50 credits. Given Scanner input, read how many missions they completed and the credits earned per mission. Calculate and print Final credits: VALUE.",
        "int credits = 50;\nint missions = input.nextInt();\nint reward = input.nextInt();\ncredits += missions * reward;\nSystem.out.println(\"Final credits: \" + credits);",
        [/int\w+=50;/, /int\w+=input\.nextInt\(\);int\w+=input\.nextInt\(\);/, /\w+\+=\w+\*\w+;/, /System\.out\.println\("Finalcredits:"\+\w+\);/],
        "Start from the stored initial state, calculate the earned amount, update the state, and report it.",
        "You independently assembled stored state, two inputs, precedence, updating, and output.",
        5,
      ),
      independentBuild(
        "unit1-build-complete-program",
        "Build a Complete Rectangle Program",
        "Write a complete Java program that imports Scanner, creates one keyboard reader, reads decimal width and height values, calculates area, and prints Area: VALUE.",
        "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        double width = input.nextDouble();\n        double height = input.nextDouble();\n        double area = width * height;\n        System.out.println(\"Area: \" + area);\n    }\n}",
        ["import java.util.Scanner;", /publicclass\w+\{publicstaticvoidmain\(String\[\]args\)\{/, /Scanner\w+=newScanner\(System\.in\);/, /double\w+=\w+\.nextDouble\(\);double\w+=\w+\.nextDouble\(\);/, /double\w+=\w+\*\w+;/, /System\.out\.println\("Area:"\+\w+\);/],
        "Reconstruct the full wrapper first, then place the reader, inputs, calculation, and output inside main.",
        "Unit I production mastered: you retrieved and assembled a complete runnable program from behavior alone.",
        5,
      ),
    ],
  },
  {
    id: "unit-2-mastery",
    unit: "Unit II · Decision Making",
    title: "Unit II Mastery Test",
    description: "Build complete decisions from behavior alone. One final submission; every program must pass.",
    afterChapterId: "decision-programs",
    sectionId: "unit-2-mastery-test",
    questions: [
      independentBuild("unit2-build-admission", "Build an Admission Decision", "Given Scanner input, read an int age and a boolean hasTicket. Print Enter when the person is at least 18 and has a ticket; otherwise print Denied.", "int age = input.nextInt();\nboolean hasTicket = input.nextBoolean();\nif (age >= 18 && hasTicket) {\n    System.out.println(\"Enter\");\n} else {\n    System.out.println(\"Denied\");\n}", [/int\w+=input\.nextInt\(\);/, /boolean\w+=input\.nextBoolean\(\);/, /if\(\w+>=18&&\w+\)/, /System\.out\.println\("Enter"\)/, /System\.out\.println\("Denied"\)/], "Read both values, combine both requirements, and provide the fallback path.", "You built typed input and a compound two-path decision.", 5),
      independentBuild("unit2-build-shipping", "Build a Validated Shipping Classifier", "Given double total, print Invalid when it is negative, Free when it is at least 75, Reduced when it is at least 40, and Standard otherwise.", "if (total < 0) {\n    System.out.println(\"Invalid\");\n} else if (total >= 75) {\n    System.out.println(\"Free\");\n} else if (total >= 40) {\n    System.out.println(\"Reduced\");\n} else {\n    System.out.println(\"Standard\");\n}", [/total<0/, /total>=75/, /total>=40/, /System\.out\.println\("Invalid"\)/, /System\.out\.println\("Free"\)/, /System\.out\.println\("Reduced"\)/, /System\.out\.println\("Standard"\)/], "Reject invalid input first, then order the valid ranges from highest to lowest.", "You independently ordered validation and mutually exclusive ranges.", 5),
      independentBuild("unit2-build-menu", "Build a Two-Number Menu", "Given int choice and double first and second, print their sum for choice 1, their difference for choice 2, and Invalid for every other choice.", "if (choice == 1) {\n    System.out.println(first + second);\n} else if (choice == 2) {\n    System.out.println(first - second);\n} else {\n    System.out.println(\"Invalid\");\n}", [/choice==1/, /System\.out\.println\(first\+second\)/, /choice==2/, /System\.out\.println\(first-second\)/, /System\.out\.println\("Invalid"\)/], "Give each menu command one path and preserve a fallback for unsupported choices.", "You translated menu behavior into a complete decision.", 5),
      independentBuild("unit2-build-grade", "Build a Complete Grade Program", "Write a complete Java program that reads an int score. Print Invalid outside 0 through 100, A for 90 or more, B for 80 or more, C for 70 or more, and Retry otherwise.", "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int score = input.nextInt();\n        if (score < 0 || score > 100) {\n            System.out.println(\"Invalid\");\n        } else if (score >= 90) {\n            System.out.println(\"A\");\n        } else if (score >= 80) {\n            System.out.println(\"B\");\n        } else if (score >= 70) {\n            System.out.println(\"C\");\n        } else {\n            System.out.println(\"Retry\");\n        }\n    }\n}", ["import java.util.Scanner;", /publicclass\w+\{publicstaticvoidmain\(String\[\]args\)\{/, /Scanner\w+=newScanner\(System\.in\);/, /score<0\|\|score>100/, /score>=90/, /score>=80/, /score>=70/, /System\.out\.println\("Retry"\)/], "Reconstruct the program wrapper and place the validated range decision inside main.", "Unit II production mastered: you built a complete validated decision program.", 5),
    ],
  },
  {
    id: "unit-3-mastery",
    unit: "Unit III · Repetition",
    title: "Unit III Mastery Test",
    description: "Construct loop state, boundaries, accumulation, and nested output without starter code.",
    afterChapterId: "nested-loops",
    sectionId: "unit-3-mastery-test",
    questions: [
      independentBuild("unit3-build-sentinel", "Build a Sentinel Average", "Read integers from Scanner input until 0 is entered. Do not include 0. Print No values if 0 is first; otherwise print the decimal average.", "int value = input.nextInt();\nint sum = 0;\nint count = 0;\nwhile (value != 0) {\n    sum += value;\n    count++;\n    value = input.nextInt();\n}\nif (count == 0) {\n    System.out.println(\"No values\");\n} else {\n    double average = (double) sum / count;\n    System.out.println(average);\n}", [/int\w+=input\.nextInt\(\);/, /while\(\w+!=0\)/, /\w+\+=\w+;/, /\w+\+\+;/, /if\(\w+==0\)/, /\(double\)\w+\/\w+/, /System\.out\.println\("Novalues"\)/], "Track both sum and count, refresh the sentinel value, then protect the empty case.", "You built a safe unknown-length average from behavior alone.", 5),
      independentBuild("unit3-build-range", "Build a Descending Multiple Report", "Use a for loop to print 30, 25, 20, 15, 10, and 5, then print Done on a new line.", "for (int value = 30; value >= 5; value -= 5) {\n    System.out.println(value);\n}\nSystem.out.println(\"Done\");", [/for\(int\w+=30;\w+>=5;\w+-=5\)/, /System\.out\.println\(\w+\)/, /System\.out\.println\("Done"\)/], "Choose a descending start, inclusive lower boundary, and step of five.", "You independently encoded a descending range and final output.", 5),
      independentBuild("unit3-build-pattern", "Build a Staircase", "Use nested loops to print four rows of stars: one star on the first row, two on the second, three on the third, and four on the fourth.", "for (int row = 1; row <= 4; row++) {\n    for (int star = 1; star <= row; star++) {\n        System.out.print(\"*\");\n    }\n    System.out.println();\n}", [/for\(int\w+=1;\w+<=4;\w+\+\+\)/, /for\(int\w+=1;\w+<=\w+;\w+\+\+\)/, /System\.out\.print\("\*"\)/, /System\.out\.println\(\)/], "Let the outer loop choose the row and the inner loop stop at that row number.", "You created a dependent nested-loop pattern from its visual rule.", 5),
      independentBuild("unit3-build-statistics", "Build a Complete Repetition Program", "Write a complete Java program that reads a positive int count, then reads exactly that many decimal values and prints their total and decimal average.", "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int count = input.nextInt();\n        double total = 0;\n        for (int i = 0; i < count; i++) {\n            total += input.nextDouble();\n        }\n        double average = total / count;\n        System.out.println(\"Total: \" + total);\n        System.out.println(\"Average: \" + average);\n    }\n}", ["import java.util.Scanner;", /Scanner\w+=newScanner\(System\.in\);/, /int\w+=\w+\.nextInt\(\);/, /double\w+=0;/, /for\(int\w+=0;\w+<\w+;\w+\+\+\)/, /\w+\+=\w+\.nextDouble\(\);/, /double\w+=\w+\/\w+;/, /System\.out\.println\("Total:"\+\w+\)/, /System\.out\.println\("Average:"\+\w+\)/], "Use the input count as the loop boundary and as the average denominator.", "Unit III production mastered: you assembled a complete counted-input program.", 5),
    ],
  },
  {
    id: "unit-4-mastery",
    unit: "Unit IV · Methods",
    title: "Unit IV Mastery Test",
    description: "Define, call, compose, and reason about method contracts from empty editors.",
    afterChapterId: "returns-scope",
    sectionId: "unit-4-mastery-test",
    questions: [
      independentBuild("unit4-build-maximum", "Build a Maximum Method", "Define public static int maximum that receives three ints and returns the greatest value. Do not use library methods.", "public static int maximum(int first, int second, int third) {\n    int largest = first;\n    if (second > largest) {\n        largest = second;\n    }\n    if (third > largest) {\n        largest = third;\n    }\n    return largest;\n}", [/publicstaticintmaximum\(int\w+,int\w+,int\w+\)/, /int\w+=\w+;/, /if\(\w+>\w+\)/, /return\w+;/], "Begin with one valid candidate and update it for each larger parameter.", "You independently built a returning method with local state.", 5),
      independentBuild("unit4-build-receipt", "Build and Call a Receipt Method", "Define public static void printReceipt that receives a String item, int quantity, and double price and prints ITEM: TOTAL. Call it once with valid example arguments.", "public static void printReceipt(String item, int quantity, double price) {\n    double total = quantity * price;\n    System.out.println(item + \": \" + total);\n}\n\nprintReceipt(\"Notebook\", 2, 3.5);", [/publicstaticvoidprintReceipt\(String\w+,int\w+,double\w+\)/, /double\w+=\w+\*\w+;/, /System\.out\.println\(/, /printReceipt\("[^"]+",-?\d+,-?\d+(?:\.\d+)?\);/], "Put the reusable calculation inside the method, then supply matching arguments in the call.", "You defined and called a multi-parameter void method.", 5),
      independentBuild("unit4-build-composition", "Build Composed Calculations", "Define public static int doubleValue(int value), then define public static int quadruple(int value) that returns the result of calling doubleValue twice. Call quadruple with 5 and print the result.", "public static int doubleValue(int value) {\n    return value * 2;\n}\n\npublic static int quadruple(int value) {\n    return doubleValue(doubleValue(value));\n}\n\nint result = quadruple(5);\nSystem.out.println(result);", [/publicstaticintdoubleValue\(int\w+\)/, /return\w+\*2;/, /publicstaticintquadruple\(int\w+\)/, /returndoubleValue\(doubleValue\(\w+\)\);/, /int\w+=quadruple\(5\);/, /System\.out\.println\(\w+\)/], "The second method can use the first method's returned value as another argument.", "You composed returning methods and used the final result.", 5),
      independentBuild("unit4-build-complete", "Build a Complete Method Program", "Write a complete Java program with a public static boolean isValidScore(int score) method. Main must read a score and print Valid when the method returns true for 0 through 100, otherwise Invalid.", "import java.util.Scanner;\n\npublic class Main {\n    public static boolean isValidScore(int score) {\n        return score >= 0 && score <= 100;\n    }\n\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int score = input.nextInt();\n        if (isValidScore(score)) {\n            System.out.println(\"Valid\");\n        } else {\n            System.out.println(\"Invalid\");\n        }\n    }\n}", ["import java.util.Scanner;", /publicclass\w+\{/, /publicstaticbooleanisValidScore\(int\w+\)/, /return\w+>=0&&\w+<=100;/, /publicstaticvoidmain\(String\[\]args\)/, /if\(isValidScore\(\w+\)\)/, /System\.out\.println\("Valid"\)/, /System\.out\.println\("Invalid"\)/], "Separate the reusable validity rule from the input and output work in main.", "Unit IV production mastered: you organized a complete program around a method contract.", 5),
    ],
  },
  {
    id: "unit-5-mastery",
    unit: "Unit V · Arrays, Lists & Strings",
    title: "Unit V Mastery Test",
    description: "Construct programs that create, traverse, transform, and connect collection data.",
    afterChapterId: "arraylists",
    sectionId: "unit-5-mastery-test",
    questions: [
      independentBuild("unit5-build-array-summary", "Build an Array Summary Method", "Define public static double averagePositive that receives int[] values and returns the decimal average of positive elements, or 0.0 when there are none.", "public static double averagePositive(int[] values) {\n    int sum = 0;\n    int count = 0;\n    for (int value : values) {\n        if (value > 0) {\n            sum += value;\n            count++;\n        }\n    }\n    if (count == 0) {\n        return 0.0;\n    }\n    return (double) sum / count;\n}", [/publicstaticdoubleaveragePositive\(int\[\]\w+\)/, /for\(int\w+:\w+\)/, /if\(\w+>0\)/, /\w+\+=\w+;/, /\w+\+\+;/, /if\(\w+==0\)/, /return0\.0;/, /return\(double\)\w+\/\w+;/], "Traverse once, track both matching sum and matching count, then protect the empty result.", "You built a filtered array calculation with an edge case.", 5),
      independentBuild("unit5-build-string", "Build a Word Counter", "Define public static int countLetterA that receives a String and returns how many a characters it contains regardless of case.", "public static int countLetterA(String text) {\n    text = text.toLowerCase();\n    int count = 0;\n    for (int i = 0; i < text.length(); i++) {\n        if (text.charAt(i) == 'a') {\n            count++;\n        }\n    }\n    return count;\n}", [/publicstaticintcountLetterA\(String\w+\)/, /toLowerCase\(\)/, /for\(int\w+=0;\w+<\w+\.length\(\);\w+\+\+\)/, /charAt\(\w+\)=='a'/, /\w+\+\+;/, /return\w+;/], "Normalize once, then inspect every character and count matches.", "You produced a complete String traversal method.", 5),
      independentBuild("unit5-build-list", "Build a Safe List Cleanup", "Given ArrayList<String> names, remove every empty String without skipping adjacent empty values, then print the remaining list.", "for (int i = names.size() - 1; i >= 0; i--) {\n    if (names.get(i).isEmpty()) {\n        names.remove(i);\n    }\n}\nSystem.out.println(names);", [/for\(int\w+=names\.size\(\)-1;\w+>=0;\w+--\)/, /names\.get\(\w+\)\.isEmpty\(\)/, /names\.remove\(\w+\)/, /System\.out\.println\(names\)/], "Remove backward so shifting positions cannot hide an unvisited value.", "You chose a safe traversal for list mutation.", 5),
      independentBuild("unit5-build-parallel", "Build a Parallel Collection Report", "Given matching nonempty String[] names and int[] scores, find the highest score and print NAME: SCORE for that same position.", "int bestIndex = 0;\nfor (int i = 1; i < scores.length; i++) {\n    if (scores[i] > scores[bestIndex]) {\n        bestIndex = i;\n    }\n}\nSystem.out.println(names[bestIndex] + \": \" + scores[bestIndex]);", [/int\w+=0;/, /for\(int\w+=1;\w+<scores\.length;\w+\+\+\)/, /scores\[\w+\]>scores\[\w+\]/, /\w+=\w+;/, /System\.out\.println\(names\[\w+\]\+":"\+scores\[\w+\]\)/], "Track the best index so the relationship between both arrays remains available.", "Unit V production mastered: you connected traversal, selection, and parallel data.", 5),
    ],
  },
  {
    id: "unit-6-mastery",
    unit: "Unit VI · Basic Algorithms",
    title: "Unit VI Mastery Test",
    description: "Implement search, sort, and combined data algorithms without copied structures.",
    afterChapterId: "algorithmic-problem-solving",
    sectionId: "unit-6-mastery-test",
    questions: [
      independentBuild("unit6-build-last-search", "Build a Last-Match Search", "Define public static int findLast that receives int[] values and int target and returns the last matching index, or -1 when absent.", "public static int findLast(int[] values, int target) {\n    int result = -1;\n    for (int i = 0; i < values.length; i++) {\n        if (values[i] == target) {\n            result = i;\n        }\n    }\n    return result;\n}", [/publicstaticintfindLast\(int\[\]\w+,int\w+\)/, /int\w+=-1;/, /for\(int\w+=0;\w+<\w+\.length;\w+\+\+\)/, /if\(\w+\[\w+\]==\w+\)/, /\w+=\w+;/, /return\w+;/], "Keep searching after a match and replace the saved index each time.", "You adapted linear search to a different result contract.", 5),
      independentBuild("unit6-build-sort", "Build Selection Sort", "Define public static void selectionSort that rearranges an int array into ascending order.", "public static void selectionSort(int[] values) {\n    for (int start = 0; start < values.length - 1; start++) {\n        int minIndex = start;\n        for (int i = start + 1; i < values.length; i++) {\n            if (values[i] < values[minIndex]) {\n                minIndex = i;\n            }\n        }\n        int temp = values[start];\n        values[start] = values[minIndex];\n        values[minIndex] = temp;\n    }\n}", [/publicstaticvoidselectionSort\(int\[\]\w+\)/, /for\(int\w+=0;\w+<\w+\.length-1;\w+\+\+\)/, /int\w+=\w+;/, /for\(int\w+=\w+\+1;\w+<\w+\.length;\w+\+\+\)/, /if\(\w+\[\w+\]<\w+\[\w+\]\)/, /int\w+=\w+\[\w+\];/, /\w+\[\w+\]=\w+\[\w+\];/], "For each starting position, find the minimum in the remaining suffix and swap it into place.", "You reconstructed a full sorting algorithm from its invariant.", 5),
      independentBuild("unit6-build-binary", "Build Binary Search", "Define public static int binarySearch for a sorted int array. Return any matching index or -1 when the target is absent.", "public static int binarySearch(int[] values, int target) {\n    int low = 0;\n    int high = values.length - 1;\n    while (low <= high) {\n        int middle = (low + high) / 2;\n        if (values[middle] == target) {\n            return middle;\n        } else if (values[middle] < target) {\n            low = middle + 1;\n        } else {\n            high = middle - 1;\n        }\n    }\n    return -1;\n}", [/publicstaticintbinarySearch\(int\[\]\w+,int\w+\)/, /int\w+=0;/, /int\w+=\w+\.length-1;/, /while\(\w+<=\w+\)/, /int\w+=\(\w+\+\w+\)\/2;/, /return\w+;/, /\w+=\w+\+1;/, /\w+=\w+-1;/, /return-1;/], "Maintain an inclusive search range and discard the half that cannot contain the target.", "You independently implemented binary search and its failure result.", 5),
      independentBuild("unit6-build-ranked-report", "Build a Ranked Report", "Given matching String[] names and int[] scores, sort both arrays together from highest score to lowest, then print every NAME: SCORE line.", "for (int start = 0; start < scores.length - 1; start++) {\n    int bestIndex = start;\n    for (int i = start + 1; i < scores.length; i++) {\n        if (scores[i] > scores[bestIndex]) {\n            bestIndex = i;\n        }\n    }\n    int scoreTemp = scores[start];\n    scores[start] = scores[bestIndex];\n    scores[bestIndex] = scoreTemp;\n    String nameTemp = names[start];\n    names[start] = names[bestIndex];\n    names[bestIndex] = nameTemp;\n}\nfor (int i = 0; i < scores.length; i++) {\n    System.out.println(names[i] + \": \" + scores[i]);\n}", [/for\(int\w+=0;\w+<scores\.length-1;\w+\+\+\)/, /scores\[\w+\]>scores\[\w+\]/, /int\w+=scores\[\w+\];/, /String\w+=names\[\w+\];/, /names\[\w+\]=names\[\w+\];/, /for\(int\w+=0;\w+<scores\.length;\w+\+\+\)/, /System\.out\.println\(names\[\w+\]\+":"\+scores\[\w+\]\)/], "Every score swap must perform the same index swap in names before the final traversal.", "Unit VI production mastered: you preserved parallel data while sorting and reporting it.", 5),
    ],
  },
  {
    id: "unit-7-mastery",
    unit: "Unit VII · Program Development",
    title: "Unit VII Mastery Test",
    description: "Build robust input, formatted output, edge-case handling, and executable tests.",
    afterChapterId: "debugging-testing",
    sectionId: "unit-7-mastery-test",
    questions: [
      independentBuild("unit7-build-stream", "Build a Safe Stream Summary", "Read every available int from Scanner input. Print Count: N and Sum: N, including correct zero values for empty input.", "int count = 0;\nint sum = 0;\nwhile (input.hasNextInt()) {\n    sum += input.nextInt();\n    count++;\n}\nSystem.out.println(\"Count: \" + count);\nSystem.out.println(\"Sum: \" + sum);", [/int\w+=0;/, /while\(input\.hasNextInt\(\)\)/, /\w+\+=input\.nextInt\(\);/, /\w+\+\+;/, /System\.out\.println\("Count:"\+\w+\)/, /System\.out\.println\("Sum:"\+\w+\)/], "Initialize valid empty results, then update them once per available integer.", "You built an input loop that remains correct for an empty stream.", 5),
      independentBuild("unit7-build-formatted", "Build a Formatted Record Report", "Given Scanner input, read a one-word item, int quantity, and double price. Print ITEM x QUANTITY = $TOTAL with total shown to exactly two decimal places.", "String item = input.next();\nint quantity = input.nextInt();\ndouble price = input.nextDouble();\ndouble total = quantity * price;\nSystem.out.printf(\"%s x %d = $%.2f%n\", item, quantity, total);", [/String\w+=input\.next\(\);/, /int\w+=input\.nextInt\(\);/, /double\w+=input\.nextDouble\(\);/, /double\w+=\w+\*\w+;/, /System\.out\.printf\("%sx%d=\$%\.2f%n",\w+,\w+,\w+\);/], "Read the record in its stated order, calculate once, and use a matching format placeholder for each value.", "You built typed record input and exact formatted output.", 5),
      independentBuild("unit7-build-repair", "Rebuild a Correct Average Method", "Define public static double average that returns 0.0 for an empty int array and otherwise returns the decimal average. The result must not use integer division.", "public static double average(int[] values) {\n    if (values.length == 0) {\n        return 0.0;\n    }\n    int sum = 0;\n    for (int value : values) {\n        sum += value;\n    }\n    return (double) sum / values.length;\n}", [/publicstaticdoubleaverage\(int\[\]\w+\)/, /if\(\w+\.length==0\)/, /return0\.0;/, /for\(int\w+:\w+\)/, /\w+\+=\w+;/, /return\(double\)\w+\/\w+\.length;/], "Protect the empty boundary before accumulating and casting for the division.", "You reconstructed a method around its bug risks and required behavior.", 5),
      independentBuild("unit7-build-tests", "Build Boundary Tests", "Assume public static boolean isPassing(int score) already exists and should return true at 70 and above. Write code that calls it with 69, 70, and 71 and prints each returned boolean.", "System.out.println(isPassing(69));\nSystem.out.println(isPassing(70));\nSystem.out.println(isPassing(71));", [/isPassing\(69\)/, /isPassing\(70\)/, /isPassing\(71\)/, /System\.out\.println\(/], "Test immediately below, exactly at, and immediately above the decision boundary.", "Unit VII production mastered: you converted a test strategy into executable boundary checks.", 5),
    ],
  },
  {
    id: "unit-8-mastery",
    unit: "Unit VIII · CS Foundations",
    title: "Unit VIII Mastery Test",
    description: "Use the full course toolkit to turn algorithms, representations, and responsible requirements into working code.",
    afterChapterId: "cs-context-applications",
    sectionId: "unit-8-mastery-test",
    questions: [
      independentBuild("unit8-build-maximum", "Implement a Maximum Algorithm", "Define public static int maximum that returns the greatest value in a nonempty int array without sorting it.", "public static int maximum(int[] values) {\n    int largest = values[0];\n    for (int i = 1; i < values.length; i++) {\n        if (values[i] > largest) {\n            largest = values[i];\n        }\n    }\n    return largest;\n}", [/publicstaticintmaximum\(int\[\]\w+\)/, /int\w+=\w+\[0\];/, /for\(int\w+=1;\w+<\w+\.length;\w+\+\+\)/, /if\(\w+\[\w+\]>\w+\)/, /\w+=\w+\[\w+\];/, /return\w+;/], "Translate the algorithm into initialization, traversal, comparison, update, and return steps.", "You converted an abstract algorithm into executable Java.", 5),
      independentBuild("unit8-build-representation", "Build a Binary-Value Counter", "Given int[] bits containing only 0 and 1, count and print how many 1 values it contains.", "int ones = 0;\nfor (int bit : bits) {\n    if (bit == 1) {\n        ones++;\n    }\n}\nSystem.out.println(ones);", [/int\w+=0;/, /for\(int\w+:bits\)/, /if\(\w+==1\)/, /\w+\+\+;/, /System\.out\.println\(\w+\)/], "Treat each represented bit as data and count the values matching 1.", "You implemented a small computation over a digital representation.", 5),
      independentBuild("unit8-build-transparent-rule", "Build a Transparent Selection Rule", "Given matching String[] names and int[] scores, print each name whose score is at least 80, then print Selected: COUNT.", "int selected = 0;\nfor (int i = 0; i < scores.length; i++) {\n    if (scores[i] >= 80) {\n        System.out.println(names[i]);\n        selected++;\n    }\n}\nSystem.out.println(\"Selected: \" + selected);", [/int\w+=0;/, /for\(int\w+=0;\w+<scores\.length;\w+\+\+\)/, /if\(scores\[\w+\]>=80\)/, /System\.out\.println\(names\[\w+\]\)/, /\w+\+\+;/, /System\.out\.println\("Selected:"\+\w+\)/], "Encode the stated threshold directly, preserve the parallel-array relationship, and report the count.", "You implemented a visible, checkable selection rule and its result count.", 5),
      independentBuild("unit8-build-application", "Build a Complete Application", "Write a complete Java program that reads available integer temperatures, counts how many are below 32, and prints Frozen readings: COUNT. Empty input must print a count of 0.", "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        int frozen = 0;\n        while (input.hasNextInt()) {\n            int temperature = input.nextInt();\n            if (temperature < 32) {\n                frozen++;\n            }\n        }\n        System.out.println(\"Frozen readings: \" + frozen);\n    }\n}", ["import java.util.Scanner;", /publicclass\w+\{publicstaticvoidmain\(String\[\]args\)\{/, /Scanner\w+=newScanner\(System\.in\);/, /int\w+=0;/, /while\(\w+\.hasNextInt\(\)\)/, /int\w+=\w+\.nextInt\(\);/, /if\(\w+<32\)/, /\w+\+\+;/, /System\.out\.println\("Frozenreadings:"\+\w+\)/], "Build the full wrapper, preserve a valid empty-input count, and update it only for matching readings.", "Unit VIII production mastered: you built a complete data-processing application from a behavior contract.", 5),
    ],
  },
];

const masteryExtensionSectionIds: Record<string, Record<string, string[]>> = {
  "comparisons-booleans": {
    "booleans-comparisons": ["bool-mastery-boundary-1", "bool-mastery-boundary-2"],
    "booleans-truth": ["bool-truth-not-and", "bool-truth-and-before-or", "bool-truth-parentheses-change", "bool-truth-negated-group-true", "bool-mastery-grouping", "bool-truth-trace-order", "bool-truth-mixed-comparisons"],
  },
  "if-else": { "if-else-if": ["if-mastery-order-1", "if-mastery-order-2"], "if-common-mistakes": ["if-mastery-independent"] },
  "decision-programs": { "decision-ranges": ["decision-mastery-gap"], "decision-min-max": ["decision-mastery-max-tie"] },
  "while-loops": { "while-tracing": ["while-mastery-zero", "while-mastery-update-order"], "while-sentinel": ["while-mastery-empty-sentinel"] },
  "for-loops": { "for-ranges": ["for-mastery-endpoint", "for-mastery-empty"], "for-accumulation": ["for-mastery-state"] },
  "nested-loops": { "nested-count": ["nested-mastery-reset", "nested-mastery-dependent"] },
  methods: { "methods-parameters": ["methods-mastery-copy", "methods-mastery-mismatch"], "methods-calling": ["methods-mastery-order"] },
  "returns-scope": { "returns-using": ["returns-mastery-use", "returns-mastery-print"], "returns-tracing": ["returns-mastery-early"] },
  arrays: { "arrays-indexes": ["arrays-mastery-first-last", "arrays-mastery-bound"], "arrays-update": ["arrays-mastery-default-update"] },
  "arrays-loops": { "array-traversal": ["arrayloop-mastery-empty", "arrayloop-mastery-bound"], "array-min-max": ["arrayloop-mastery-single"] },
  strings: { "strings-data": ["strings-mastery-concat-1", "strings-mastery-concat-2"], "strings-length-char": ["strings-mastery-empty"] },
  arraylists: { "arraylist-update": ["list-mastery-shift"], "arraylist-removal-loop": ["list-mastery-backward"], "arraylist-traverse": ["list-mastery-size"] },
  searching: { "search-variations": ["search-mastery-duplicate-last", "search-mastery-count"], "search-binary-trace": ["search-mastery-binary-missing"] },
  sorting: { "sorting-selection": ["sort-mastery-already", "sort-mastery-duplicates"], "sorting-trace": ["sort-mastery-one-pass"] },
  "algorithmic-problem-solving": { "algorithm-refine": ["algorithm-mastery-divergence"], "algorithm-cases": ["algorithm-mastery-case"] },
  "input-output": { "io-has-next": ["io-mastery-empty"], "io-formatting": ["io-mastery-format"] },
  "debugging-testing": { "debug-error-types": ["debug-mastery-stage"], "testing-cases": ["debug-mastery-boundary"] },
};

const independentProductionSectionIds: Record<string, Record<string, string[]>> = {
  "input-basic-programs": { "input-complete-program": ["input-independent-build"] },
  "comparisons-booleans": { "booleans-combining": ["bool-independent-build"] },
  "if-else": { "if-complete-program": ["if-independent-build"] },
  "decision-programs": { "decision-combined": ["decision-independent-build"] },
  "while-loops": { "while-combined": ["while-independent-build"] },
  "for-loops": { "for-combined": ["for-independent-build"] },
  "nested-loops": { "nested-combined": ["nested-independent-build"] },
  methods: { "methods-combined": ["methods-independent-build"] },
  "returns-scope": { "returns-combined": ["returns-independent-build"] },
  arrays: { "arrays-combined": ["arrays-independent-build"] },
  "arrays-loops": { "array-processing": ["arrayloop-independent-build"] },
  strings: { "strings-combined": ["strings-independent-build"] },
  arraylists: { "arraylist-combined": ["arraylist-independent-build"] },
  searching: { "search-combined": ["search-independent-build"] },
  sorting: { "sorting-combined": ["sorting-independent-build"] },
  "algorithmic-problem-solving": { "algorithm-combined": ["algorithm-independent-build"] },
  "input-output": { "io-combined": ["io-independent-build"] },
  "debugging-testing": { "debug-combined": ["debug-independent-build"] },
  "computers-programs-algorithms": { "foundations-combined": ["foundations-independent-build"] },
  "cs-context-applications": { "cs-career-foundations": ["context-independent-build"] },
};

const distributedProductionSectionIds: Record<string, Record<string, string[]>> = {
  "input-basic-programs": { "input-reading-numbers": ["input-write-number-task"], "input-reading-text": ["input-write-text-task"] },
  "comparisons-booleans": { "booleans-comparisons": ["bool-write-comparison"], "booleans-and": ["bool-write-combined"] },
  "if-else": { "if-else-pair": ["if-write-two-path"], "if-nested": ["if-write-nested"] },
  "decision-programs": { "decision-validation": ["decision-write-validation"], "decision-menu": ["decision-write-menu"] },
  "while-loops": { "while-counters": ["while-write-counter"], "while-accumulators": ["while-write-accumulator"] },
  "for-loops": { "for-ranges": ["for-write-range"], "for-accumulation": ["for-write-total"] },
  "nested-loops": { "nested-patterns": ["nested-write-rectangle"], "nested-tables": ["nested-write-pairs"] },
  methods: { "methods-calling": ["methods-write-simple"], "methods-parameters": ["methods-write-parameter"] },
  "returns-scope": { "returns-types": ["returns-write-square"], "scope-constants": ["returns-write-constant"] },
  arrays: { "arrays-create": ["arrays-write-create"], "arrays-length": ["arrays-write-last"] },
  "arrays-loops": { "array-fill": ["arrayloop-write-fill"], "array-count": ["arrayloop-write-count"] },
  strings: { "strings-length-char": ["strings-write-ends"], "strings-methods": ["strings-write-normalize"] },
  arraylists: { "arraylist-create": ["list-write-create"], "arraylist-update": ["list-write-update"] },
  searching: { "search-linear": ["search-write-contains"], "search-variations": ["search-write-count"] },
  sorting: { "sorting-swap": ["sort-write-swap"], "sorting-common-errors": ["sort-write-verify"] },
  "algorithmic-problem-solving": { "algorithm-problem": ["algorithm-write-positive-sum"], "trace-methods-arrays": ["algorithm-write-parallel"] },
  "input-output": { "io-structured-console": ["io-write-record"], "io-formatting": ["io-write-format"] },
  "debugging-testing": { "debug-isolate": ["debug-write-safe-loop"], "testing-cases": ["debug-write-tests"] },
  "computers-programs-algorithms": { "foundations-algorithm": ["foundations-write-steps"], "foundations-model": ["foundations-write-model"] },
  "cs-context-applications": { "cs-representation": ["context-write-bits"], "cs-limits": ["context-write-boundary"] },
};

const authoredSectionPracticeQuestionIds: Record<string, Record<string, string[]>> = {
  "input-basic-programs": {
    "input-execution": ["input-exec-q1", "input-exec-q2", "input-exec-q3", "input-exec-q4", "input-exec-q5"],
    "input-scanner-setup": ["input-setup-q1", "input-setup-q2", "input-setup-q3", "input-setup-q4", "input-setup-q5"],
    "input-reading-numbers": ["input-number-q1", "input-number-q2", "input-number-q3", "input-number-q4", "input-number-q5", "input-number-q6", "input-number-q7", "input-number-q8"],
    "input-reading-text": ["input-text-q1", "input-text-q2", "input-text-q3", "input-text-q4", "input-text-q5", "input-text-q6", "input-text-q7"],
    "input-program-pattern": ["input-pattern-q1", "input-pattern-q2", "input-pattern-q3", "input-pattern-q4", "input-pattern-q5", "input-pattern-q6"],
    "input-common-mistakes": ["input-mistake-q1", "input-mistake-q2", "input-mistake-q3", "input-mistake-q4", "input-mistake-q5"],
    "input-complete-program": ["input-complete-q1", "input-complete-q2", "input-complete-q3"],
  },
  "comparisons-booleans": {
    "booleans-conditional": ["bool-q9-ternary", "bool-q10-ternary"],
  },
  "if-else": {
    "if-branch": ["if-q2"],
    "if-else-pair": ["if-q1"],
    "if-else-if": ["if-q3"],
    "if-nested": ["if-q5"],
    "if-braces": ["if-q6"],
    "if-common-mistakes": ["if-q4"],
  },
  "while-loops": {
    "while-do-while": ["while-q9-do", "while-q10-do"],
  },
  methods: {
    "methods-library": ["methods-q9-library"],
    "methods-api-docs": ["methods-q10-api"],
  },
  "returns-scope": {
    "returns-overloading": ["returns-q9-overload"],
    "scope-constants": ["scope-final-declare", "scope-final-effect", "scope-final-reassign"],
  },
  "arrays-loops": {
    "array-transformations": ["arrayloop-q9-reverse", "arrayloop-q10-copy", "arrayloop-q11-pair"],
  },
  strings: {
    "strings-methods": ["strings-q9-trim-substring", "strings-q12-concat"],
    "strings-search-order": ["strings-q10-last-index", "strings-q11-compare"],
  },
  searching: {
    "search-binary": ["search-q10-binary-rule", "search-q11-binary-update"],
    "search-binary-trace": ["search-q9-binary-trace"],
  },
};

const generatedSectionPractice = Object.fromEntries(chapterSpecs.map((chapter) => {
  if (["cumulative-challenges", "final-assessment"].includes(chapter.id)) return [chapter.id, { questions: [], sectionIds: {} }];

  const chapterConceptDetails = chapter.sections.flatMap((section) => section.concepts?.map((concept) => concept.detail) ?? []);
  const chapterLeads = chapter.sections.map((section) => section.lead);
  const chapterExampleNotes = chapter.sections.flatMap((section) => section.examples?.map((example) => example.note).filter((note): note is string => Boolean(note)) ?? []);
  const questions: CoursePracticeQuestion[] = [];
  const sectionIds: Record<string, string[]> = {};

  const choicesFor = (answer: string, pool: string[]) => {
    const alternatives = [...new Set(pool.filter((choice) => choice !== answer))].slice(0, 3);
    const choices = [answer, ...alternatives];
    const shift = answer.length % Math.max(1, choices.length);
    return [...choices.slice(shift), ...choices.slice(0, shift)];
  };

  chapter.sections.forEach((section) => {
    if (section.id.endsWith("takeaways")) return;
    const sectionQuestions: CoursePracticeQuestion[] = [];
    const concepts = section.concepts ?? [];

    if (concepts.length > 0) {
      concepts.forEach((concept, index) => {
        const id = `${section.id}-concept-${index + 1}`;
        const exampleCode = concept.code ?? section.examples?.[0]?.code;
        if (exampleCode) {
          sectionQuestions.push(groundedChoice(
            id,
            `${concept.label} in Java`,
            `In the shown Java, which explanation correctly connects ${concept.label} to what the program does?`,
            exampleCode,
            choicesFor(concept.detail, [...chapterConceptDetails, ...chapterLeads]),
            concept.detail,
            `Point to the value, operation, state change, or control structure represented by ${concept.label}.`,
            `Correct. You connected ${concept.label} to concrete Java behavior: ${concept.detail}`,
          ));
        } else {
          sectionQuestions.push(multipleChoice(
            id,
            `Apply ${concept.label}`,
            `Which concrete interpretation should guide you when using ${concept.label}?`,
            choicesFor(concept.detail, [...chapterConceptDetails, ...chapterLeads]),
            concept.detail,
            `Connect the term to the program behavior it is meant to describe.`,
            `Correct. ${concept.label}: ${concept.detail}`,
          ));
        }
        if (chapter.id === "comparisons-booleans" && section.id === "booleans-comparisons") {
          const writingQuestion = comparisonWritingQuestions[index];
          if (writingQuestion) sectionQuestions.push(writingQuestion);
        }
      });
    } else {
      const id = `${section.id}-understanding`;
      const example = section.examples?.[0];
      const answer = example?.note ?? section.lead;
      if (example) {
        sectionQuestions.push(groundedChoice(
          id,
          `Trace ${section.title}`,
          `Which explanation best describes what the shown Java demonstrates?`,
          example.code,
          choicesFor(answer, [...chapterExampleNotes, ...chapterLeads, ...chapterConceptDetails]),
          answer,
          `Trace the code in execution order and connect it to this section's main rule.`,
          `Correct. You connected the section rule to an actual Java example.`,
        ));
      } else {
        sectionQuestions.push(multipleChoice(
          id,
          `Apply ${section.title}`,
          `Which operational rule should guide code in ${section.title}?`,
          choicesFor(answer, [...chapterLeads, ...chapterConceptDetails]),
          answer,
          `Focus on what a running program must do, not only the vocabulary.`,
          `Correct. You identified the rule that governs the program behavior.`,
        ));
      }
    }

    sectionQuestions.push(...retrievalQuestionsFor(chapter.id, section.id));
    sectionQuestions.push(...decisionRangeQuestionsFor(chapter.id, section.id));
    sectionQuestions.push(...javaDeepQuestionsFor(chapter.id, section.id));
    questions.push(...sectionQuestions);
    sectionIds[section.id] = sectionQuestions.map((question) => question.id);
  });

  return [chapter.id, { questions, sectionIds }];
})) as Record<string, { questions: CoursePracticeQuestion[]; sectionIds: Record<string, string[]> }>;

export const additionalSectionPracticeQuestionIds: Record<string, Record<string, string[]>> = Object.fromEntries(
  Object.entries(generatedSectionPractice).map(([chapterId, practice]) => {
    const authored = authoredSectionPracticeQuestionIds[chapterId] ?? {};
    const mastery = masteryExtensionSectionIds[chapterId] ?? {};
    const production = independentProductionSectionIds[chapterId] ?? {};
    const distributedProduction = distributedProductionSectionIds[chapterId] ?? {};
    const sectionIds = Object.fromEntries(
      Object.entries(practice.sectionIds).map(([sectionId, ids]) => {
        const decisionIds = new Set(decisionRangeQuestionsFor(chapterId, sectionId).map((question) => question.id));
        return [
          sectionId,
          chapterId === "input-basic-programs"
            ? [...(authored[sectionId] ?? ids), ...(distributedProduction[sectionId] ?? []), ...(production[sectionId] ?? [])]
            : chapterId === "if-else"
              ? [...ids.filter((id) => !decisionIds.has(id)), ...(authored[sectionId] ?? []), ...(mastery[sectionId] ?? []), ...(distributedProduction[sectionId] ?? []), ...ids.filter((id) => decisionIds.has(id)), ...(production[sectionId] ?? [])]
              : [...ids, ...(authored[sectionId] ?? []), ...(mastery[sectionId] ?? []), ...(distributedProduction[sectionId] ?? []), ...(production[sectionId] ?? [])],
        ];
      }),
    );
    return [chapterId, sectionIds];
  }),
);

export const additionalPracticeQuestions: Record<string, CoursePracticeQuestion[]> = Object.fromEntries(
  Object.entries(authoredPracticeQuestions).map(([chapterId, questions]) => [
    chapterId,
    chapterId === "input-basic-programs"
      ? [...questions, ...(distributedProductionQuestions[chapterId] ?? []), ...(independentProductionQuestions[chapterId] ?? [])]
      : [...(generatedSectionPractice[chapterId]?.questions ?? []), ...(masteryExtensionQuestions[chapterId] ?? []), ...questions, ...(distributedProductionQuestions[chapterId] ?? []), ...(independentProductionQuestions[chapterId] ?? [])],
  ]),
);

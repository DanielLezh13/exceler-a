import type { CoursePracticeQuestion, StructuredLessonSection } from "./cisc1115Course";

const numberAnswer = (
  id: string,
  level: CoursePracticeQuestion["level"],
  title: string,
  prompt: string,
  answer: string,
  hint: string,
  success: string,
  base: 2 | 10 | 16 = 10,
): CoursePracticeQuestion => ({
  id, level, kind: "Convert or calculate", title, prompt, answer, hint, success,
  placeholder: base === 2 ? "Enter binary digits" : base === 16 ? "Enter hexadecimal digits" : "Enter a decimal number",
  validate: (value) => {
    const submitted = value.trim().replace(base === 2 ? /^0[bB]/ : base === 16 ? /^0[xX]/ : /^$/, "");
    const digits = base === 2 ? /^[01]+$/ : base === 16 ? /^[0-9a-f]+$/i : /^(0|[1-9]\d*)$/;
    return digits.test(submitted) && Number.parseInt(submitted, base) === Number.parseInt(answer, base);
  },
});

export const numberSystemsSections: StructuredLessonSection[] = [
  {
    id: "numbers-place-values", title: "Binary Place Values", eyebrow: "Base two", lead: "A binary digit is 0 or 1. From right to left, positions are worth 1, 2, 4, 8, 16, 32, 64, and 128. Add only the positions holding 1.",
    examples: [{ label: "Read the positions", language: "Binary", code: "101101₂ = 32 + 8 + 4 + 1 = 45₁₀", note: "The leading 1 uses the 32 position. The zero positions contribute nothing." }],
    rules: ["The rightmost position is worth 1, not 2.", "Each position to the left doubles the previous value.", "A leading zero does not change the value."],
  },
  {
    id: "numbers-binary-decimal", title: "Binary and Decimal", eyebrow: "Convert both ways", lead: "For binary to decimal, add the active place values. For decimal to binary, choose the largest power of two that fits, subtract it, and continue through the smaller positions.",
    examples: [{ label: "Convert 75 to binary", language: "Number systems", code: "75 = 64 + 8 + 2 + 1\n   = 1001011₂", note: "A zero marks each unused position. Check the result by adding 64 + 8 + 2 + 1 again." }],
  },
  {
    id: "numbers-hex-digits", title: "Hexadecimal Digits", eyebrow: "Base sixteen", lead: "Hexadecimal has sixteen single digits: 0–9 and A–F. A means 10, B means 11, C means 12, D means 13, E means 14, and F means 15. From right to left, places are worth 1, 16, 256, and so on.",
    examples: [{ label: "Read a two-digit hex value", language: "Hexadecimal", code: "4E₁₆ = 4 × 16 + 14 = 78₁₀", note: "The left digit counts groups of sixteen; E is fourteen." }],
  },
  {
    id: "numbers-decimal-hex", title: "Decimal and Hexadecimal", eyebrow: "Convert both ways", lead: "For a two-digit hexadecimal number, divide the decimal value by 16. The whole-number quotient is the left digit and the remainder is the right digit. Replace a remainder from 10 through 15 with A through F.",
    examples: [{ label: "Convert 175 to hexadecimal", language: "Number systems", code: "175 = 10 × 16 + 15\n10 is A, 15 is F\n175₁₀ = AF₁₆", note: "Convert back to check: A × 16 + F = 160 + 15 = 175." }],
  },
  {
    id: "numbers-binary-addition", title: "Binary Addition", eyebrow: "Carry in base two", lead: "Add from right to left as in decimal. In binary, 1 + 1 makes 10₂: write 0 and carry 1. A carry can create a new leading digit.",
    examples: [{ label: "A carry into a new place", language: "Binary", code: "  1111\n+ 0001\n------\n 10000", note: "Fifteen plus one is sixteen. Four binary 1s become a 1 in the next position." }],
  },
  {
    id: "numbers-mixed", title: "Mixed Conversion", eyebrow: "Choose a route", lead: "A problem may connect binary, decimal, and hexadecimal. You can convert through decimal or group binary bits in sets of four. Check your result in another base when possible.",
    examples: [{ label: "Two routes to the same value", language: "Number systems", code: "1100 1010₂ = 202₁₀ = CA₁₆", note: "The binary groups 1100 and 1010 represent C and A. Decimal gives a second check: 12 × 16 + 10 = 202." }],
  },
];

export const numberSystemsQuestions: CoursePracticeQuestion[] = [
  numberAnswer("numbers-place-1", "Warm-up", "Count Active Places", "What decimal value does 00101101₂ represent?", "45", "Use the 32, 8, 4, and 1 positions.", "Correct. The leading zeros do not change 32 + 8 + 4 + 1."),
  numberAnswer("numbers-place-2", "Apply", "Catch the Leftmost Place", "What decimal value does 10010001₂ represent?", "145", "The leftmost 1 is worth 128.", "Correct. 128 + 16 + 1 is 145."),
  numberAnswer("numbers-binary-decimal-1", "Apply", "Read a New Binary Pattern", "Convert 10101101₂ to decimal.", "173", "List the active powers of two from 128 down to 1.", "Correct. 128 + 32 + 8 + 4 + 1 is 173."),
  numberAnswer("numbers-decimal-binary-1", "Apply", "Write the Binary Places", "Convert 157₁₀ to binary.", "10011101", "Start at 128, then account for the remaining 29.", "Correct. 128 + 16 + 8 + 4 + 1 is 157.", 2),
  numberAnswer("numbers-decimal-binary-2", "Challenge", "Keep the Zero Places", "Convert 74₁₀ to binary. Include every position from the leftmost 1 through the rightmost digit.", "1001010", "After 64, the remainder is 10.", "Correct. 64 + 8 + 2 is 74.", 2),
  numberAnswer("numbers-hex-digit-1", "Warm-up", "Read a Hex Digit", "What decimal value does the hexadecimal digit D represent?", "13", "A starts at ten; count through D.", "Correct. D represents thirteen."),
  numberAnswer("numbers-hex-decimal-1", "Apply", "Count Sixteens and Ones", "Convert 7D₁₆ to decimal.", "125", "Seven groups of sixteen plus D more ones.", "Correct. 7 × 16 + 13 is 125."),
  numberAnswer("numbers-hex-decimal-2", "Challenge", "Read a Three-Digit Hex Value", "Convert 12F₁₆ to decimal.", "303", "The leftmost place is worth 256.", "Correct. 256 + 32 + 15 is 303."),
  numberAnswer("numbers-decimal-hex-1", "Apply", "Find Quotient and Remainder", "Convert 219₁₀ to hexadecimal.", "DB", "219 is thirteen groups of sixteen with eleven left over.", "Correct. Thirteen is D and eleven is B.", 16),
  numberAnswer("numbers-decimal-hex-2", "Challenge", "Cross a Hex Digit Boundary", "Convert 250₁₀ to hexadecimal.", "FA", "How many groups of sixteen fit, and what remains?", "Correct. 15 × 16 + 10 gives FA.", 16),
  numberAnswer("numbers-add-1", "Apply", "Carry Across Positions", "Add 101101₂ + 11011₂. Give the binary result.", "1001000", "Add from the right and carry when a column totals two or three.", "Correct. 45 + 27 = 72, which is 1001000₂.", 2),
  numberAnswer("numbers-add-2", "Challenge", "Make a New Leading Digit", "Add 11111111₂ + 1₂. Give the binary result.", "100000000", "Every column sends a carry left.", "Correct. 255 + 1 is 256, so a ninth bit appears.", 2),
  numberAnswer("numbers-mixed-1", "Challenge", "Convert Through Two Bases", "Convert 10111100₂ to hexadecimal. Choose your own route through decimal or groups of four bits.", "BC", "The groups are 1011 and 1100.", "Correct. The two groups represent B and C.", 16),
  numberAnswer("numbers-mixed-2", "Challenge", "Check a Sum in Another Base", "Add 1010101₂ + 101011₂, then give the result in hexadecimal.", "80", "You may add in binary first or convert each input to decimal.", "Correct. 85 + 43 = 128, which is 80₁₆.", 16),
];

export const numberSystemsSectionQuestionIds: Record<string, string[]> = {
  "numbers-place-values": ["numbers-place-1", "numbers-place-2"],
  "numbers-binary-decimal": ["numbers-binary-decimal-1", "numbers-decimal-binary-1", "numbers-decimal-binary-2"],
  "numbers-hex-digits": ["numbers-hex-digit-1", "numbers-hex-decimal-1", "numbers-hex-decimal-2"],
  "numbers-decimal-hex": ["numbers-decimal-hex-1", "numbers-decimal-hex-2"],
  "numbers-binary-addition": ["numbers-add-1", "numbers-add-2"],
  "numbers-mixed": ["numbers-mixed-1"],
};

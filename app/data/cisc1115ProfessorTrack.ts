import type { CoursePracticeQuestion, StructuredLessonSection } from "./cisc1115Course";
import { numberSystemsQuestions, numberSystemsSectionQuestionIds, numberSystemsSections } from "./cisc1115NumberSystems.ts";

const normalizeLines = (value: string) => value.trim().replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n");
const compactCode = (value: string) => value.replace(/\s+/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const choice = (
  id: string,
  level: CoursePracticeQuestion["level"],
  title: string,
  prompt: string,
  options: string[],
  answer: string,
  hint: string,
  success: string,
): CoursePracticeQuestion => ({
  id,
  level,
  kind: "Multiple choice",
  title,
  prompt,
  options,
  answer,
  placeholder: "Choose one answer",
  hint,
  success,
  validate: (value) => value.trim() === answer,
});

const exactOutput = (
  id: string,
  level: CoursePracticeQuestion["level"],
  title: string,
  prompt: string,
  code: string,
  answer: string,
  hint: string,
  success: string,
): CoursePracticeQuestion => ({
  id,
  level,
  kind: "Predict exact output",
  title,
  prompt,
  code,
  answer,
  placeholder: answer.includes("\n") ? "Type the exact output one line at a time" : "Type the exact output",
  hint,
  success,
  multiline: answer.includes("\n"),
  validate: (value) => normalizeLines(value) === answer,
});

const writeExact = (
  id: string,
  level: CoursePracticeQuestion["level"],
  title: string,
  prompt: string,
  code: string | undefined,
  answer: string,
  hint: string,
  success: string,
): CoursePracticeQuestion => ({
  id,
  level,
  kind: "Write code",
  title,
  prompt,
  code,
  answer,
  placeholder: answer.includes("\n") ? "Write the required Java statements" : "Write one Java statement",
  hint,
  success,
  multiline: answer.includes("\n"),
  productionStage: 3,
  auditRequirements: [answer],
  validate: (value) => compactCode(value) === compactCode(answer),
});

export type ProfessorTrackAddedChapter = {
  id: string;
  title: string;
  description: string;
  schedule: string;
  sections: StructuredLessonSection[];
  reviewQuestions: CoursePracticeQuestion[];
  sectionQuestionIds?: Record<string, string[]>;
};

export type ProfessorTrackEntry =
  | { kind: "added-chapter"; id: string }
  | { kind: "existing-chapter"; id: string };

export type ProfessorTrackUnit = {
  id: string;
  label: string;
  entries: ProfessorTrackEntry[];
};

export const cisc1115ProfessorAddedChapters: ProfessorTrackAddedChapter[] = [
  {
    id: "number-systems",
    title: "Number Systems",
    description: "Practice the binary, decimal, and hexadecimal conversions and binary addition used on the CISC 1115 quizzes.",
    schedule: "Quiz 2 · Number Systems",
    sections: numberSystemsSections,
    reviewQuestions: numberSystemsQuestions,
    sectionQuestionIds: numberSystemsSectionQuestionIds,
  },
  {
    id: "mcneill-lecture-1",
    title: "Computers & Programs",
    description: "The computer foundations Prof. McNeill teaches before the first Java coding block. This chapter builds the mental model for programming without requiring array programming.",
    schedule: "Sept. 1-3 · Introduction",
    sections: [
      {
        id: "mcneill-programming",
        eyebrow: "Why programming exists",
        title: "Programs Describe Processes",
        lead: "Software is a set of instructions that tells hardware what to do. Programming is the work of describing a process precisely enough for a computer to carry it out.",
        concepts: [
          { label: "Program", detail: "Software instructions that describe a process for a computer." },
          { label: "Programming", detail: "Creating and refining those instructions." },
          { label: "Algorithm", detail: "A precise sequence of steps for solving a problem, independent of any one programming language." },
        ],
        examples: [{
          label: "The professor's sorting problem",
          language: "Problem",
          code: "Unsorted:  [10, 2, -1, 101, 45]\nSorted:    [-1, 2, 10, 45, 101]",
          note: "A person can recognize the goal immediately. A computer still needs a precise procedure that explains how to produce the ordered result.",
        }],
      },
      {
        id: "mcneill-hardware-software",
        eyebrow: "The whole computer",
        title: "Hardware and Software",
        lead: "A computer system combines physical components with the instructions and data that direct them. The parts cooperate through communication pathways often described as buses.",
        concepts: [
          { label: "Hardware", detail: "Physical components such as the CPU, memory, storage, keyboard, and display." },
          { label: "Software", detail: "Programs and data that direct the hardware." },
          { label: "Input", detail: "Devices and data entering the system." },
          { label: "Output", detail: "Devices and data leaving the system." },
          { label: "Storage", detail: "Keeps programs and files when they are not actively running." },
        ],
      },
      {
        id: "mcneill-bits-bytes",
        eyebrow: "Digital representation",
        title: "Bits, Bytes, and Capacity",
        lead: "At the lowest level, computer information is represented with two states: 0 and 1. Storage and memory capacity are measured by grouping those binary digits.",
        concepts: [
          { label: "bit", detail: "One binary value: 0 or 1." },
          { label: "byte", detail: "A group of 8 bits." },
          { label: "KB", detail: "Approximately one thousand bytes in the decimal convention used in the lecture." },
          { label: "MB", detail: "Approximately one thousand kilobytes." },
          { label: "GB", detail: "Approximately one thousand megabytes." },
          { label: "TB", detail: "Approximately one thousand gigabytes." },
        ],
        callout: { title: "Capacity units scale upward", body: "8 bits = 1 byte, then KB → MB → GB → TB. These units describe how much information memory or storage can hold." },
      },
      {
        id: "mcneill-cpu",
        eyebrow: "Execute instructions",
        title: "CPU, Control Unit, ALU, Clock, and Cores",
        lead: "The central processing unit executes machine instructions. Its internal parts coordinate data movement, perform calculations, and synchronize work.",
        concepts: [
          { label: "CPU", detail: "Central Processing Unit; the processor that reads and executes low-level instructions." },
          { label: "Control unit", detail: "Interprets instructions and coordinates movement of data into and out of the CPU." },
          { label: "ALU", detail: "Arithmetic and Logic Unit; performs arithmetic and bitwise or logical operations." },
          { label: "Clock speed", detail: "Electronic pulses synchronize operations; it is measured in hertz, commonly GHz on modern processors." },
          { label: "Core", detail: "An independent instruction-executing part of a CPU. Modern processors commonly contain multiple cores." },
        ],
      },
      {
        id: "mcneill-memory-storage",
        eyebrow: "Active work versus lasting files",
        title: "RAM, Addresses, and Storage",
        lead: "Memory is the computer's active work area. Storage keeps files and programs for later. They are related, but they do different jobs during a program run.",
        concepts: [
          { label: "RAM", detail: "Random Access Memory holds active instructions and data while programs run." },
          { label: "Memory address", detail: "A unique location used to store or retrieve a byte in memory." },
          { label: "Random access", detail: "Memory locations can be reached directly rather than only in sequence." },
          { label: "Persistent storage", detail: "Disks and solid-state drives retain programs and files beyond the current run." },
        ],
        callout: { title: "Why more RAM can help", body: "More memory can reduce the need to repeatedly retrieve active data from slower persistent storage." },
      },
      {
        id: "mcneill-operating-system",
        eyebrow: "Manage the machine",
        title: "The Operating System's Role",
        lead: "The operating system sits between applications and hardware. It manages the computer's activities and gives programs controlled access to system resources.",
        concepts: [
          { label: "Control and monitor", detail: "Recognize input, display output, and track files and devices." },
          { label: "Resource allocation", detail: "Assign CPU time, memory, storage, and input/output devices." },
          { label: "Scheduling", detail: "Coordinate program activity so resources are used efficiently." },
          { label: "Hardware access", detail: "Applications normally reach hardware through services provided by the operating system." },
        ],
        examples: [{
          label: "One application request",
          language: "System path",
          code: "Application → operating system → hardware\nhardware result → operating system → application",
          note: "The application asks for a service; the operating system coordinates the underlying resource.",
        }],
      },
      {
        id: "mcneill-language-levels",
        eyebrow: "Layers of abstraction",
        title: "Machine, Assembly, and High-level Languages",
        lead: "Programming languages range from processor-specific instructions to forms designed mainly for human readability. Each higher layer hides more low-level detail.",
        concepts: [
          { label: "Machine language", detail: "Binary instructions for a particular processor architecture; the CPU can execute them directly." },
          { label: "Assembly language", detail: "Human-readable mnemonics that correspond closely to processor instructions." },
          { label: "High-level language", detail: "A more portable and expressive language such as Java, designed primarily for people to read and write." },
          { label: "Assembler", detail: "Translates assembly-language instructions into machine code." },
          { label: "Compiler", detail: "Translates a source program as a whole into another executable form before it runs." },
          { label: "Interpreter", detail: "Translates and executes a program as it proceeds, commonly one statement or unit at a time." },
        ],
        examples: [{
          label: "The same idea at different levels",
          language: "Language levels",
          code: "High level:       result = 2 + 3\nAssembly-style:   add 2, 3, result\nMachine language: processor-specific binary instructions",
        }],
      },
      {
        id: "mcneill-translation",
        eyebrow: "From idea to execution",
        title: "Source Code to a Running Program",
        lead: "Source code is the human-readable program. A translation tool converts it into instructions a machine or runtime can execute.",
        examples: [
          {
            label: "General translation chain",
            language: "Process",
            code: "Algorithm → source code → translator → executable form → runtime result",
          },
          {
            label: "Java's version of the chain",
            language: "Java process",
            code: ".java source → Java compiler → .class bytecode → JVM → running program",
            note: "Java uses both compilation and a runtime: javac creates bytecode, and the Java Virtual Machine executes that bytecode on the current system.",
          },
        ],
      },
      {
        id: "mcneill-pseudocode",
        eyebrow: "Plan before syntax",
        title: "Pseudocode and the Sorting Example",
        lead: "Pseudocode is a precise plan written for people rather than a specific programming language. The professor's example describes a selection-style sorting process without requiring Java arrays yet.",
        examples: [
          {
            label: "Read the professor's array diagram",
            language: "Concept",
            code: "n =      [10,  2, -1, 101, 45]\nindex:    0   1   2    3   4\n\nn[0] -> 10\nn[2] -> -1\na = 1, so n[a] -> 2",
            note: "The index names a position. A variable such as a can hold an index, so n[a] means the value at the position stored in a.",
          },
          {
            label: "Track one sorting swap",
            language: "Concept",
            code: "Before: [10, 2, -1, 101, 45]\nSwap the values at indexes 0 and 2\nAfter:  [-1, 2, 10, 101, 45]",
            note: "The values change positions; the indexes remain 0 through 4.",
          },
          {
            label: "Conceptual sorting procedure",
            language: "Pseudocode",
            code: "For each position i in the sequence:\n    find the smallest value from position i onward\n    swap that value with the value at position i",
            note: "The sequence and positions are conceptual here. Later array chapters teach how Java stores indexes and performs the swap.",
          },
        ],
        rules: [
          "An algorithm should have a clear goal and ordered steps.",
          "Each step must be precise enough for another person to follow.",
          "This early bridge does not require array syntax or sorting code.",
        ],
      },
    ],
    reviewQuestions: [
      choice("mcneill-foundations-program", "Warm-up", "Separate a Program from an Algorithm", "Which description is an algorithm rather than a program?", ["A Java file containing executable instructions", "A precise language-independent procedure for ordering values", "The physical CPU running instructions", "A folder that stores application files"], "A precise language-independent procedure for ordering values", "An algorithm describes the steps without depending on Java syntax.", "Correct. An algorithm is the precise procedure that a program implements."),
      choice("mcneill-foundations-hardware", "Warm-up", "Classify Hardware and Software", "Which item is software?", ["A keyboard", "A solid-state drive", "A CPU core", "An operating system"], "An operating system", "Software consists of programs and organized data rather than physical parts.", "Correct. An operating system is software that manages hardware resources."),
      choice("mcneill-foundations-byte", "Warm-up", "Build One Byte", "How many bits make one byte?", ["2", "4", "8", "1,000"], "8", "A bit is one binary digit; bytes group a fixed number of bits.", "Correct. Eight bits form one byte."),
      choice("mcneill-foundations-capacity", "Apply", "Order Capacity Units", "Which sequence moves from the smallest listed capacity unit to the largest?", ["KB → MB → GB → TB", "TB → GB → MB → KB", "KB → GB → MB → TB", "MB → KB → TB → GB"], "KB → MB → GB → TB", "Each step in the lecture's decimal convention is approximately one thousand of the previous unit.", "Correct. Capacity scales from KB to MB to GB to TB."),
      choice("mcneill-foundations-alu", "Warm-up", "Identify the ALU's Job", "Which CPU part performs arithmetic and logical operations?", ["ALU", "Control unit", "RAM", "Persistent storage"], "ALU", "Its full name includes both kinds of operation.", "Correct. The Arithmetic and Logic Unit performs those operations."),
      choice("mcneill-foundations-control", "Apply", "Identify the Control Unit's Job", "A CPU component interprets an instruction and coordinates data movement. Which component is it?", ["ALU", "Display", "Control unit", "Storage drive"], "Control unit", "This component coordinates execution rather than doing the arithmetic itself.", "Correct. The control unit interprets instructions and coordinates CPU activity."),
      choice("mcneill-foundations-memory", "Apply", "Separate RAM from Storage", "Where should the instructions and data for a program that is running now be held?", ["Persistent storage only", "The keyboard", "The compiler", "RAM"], "RAM", "Active work and long-term files have different homes.", "Correct. RAM holds active instructions and data while persistent storage retains files beyond the run."),
      choice("mcneill-foundations-os", "Apply", "Follow an Application Request", "An application needs to display output. Which path matches the chapter's system model?", ["Application → assembler → algorithm", "Application → operating system → hardware", "RAM → source code → compiler", "Keyboard → bytecode → storage"], "Application → operating system → hardware", "Applications normally use services supplied by the operating system to reach hardware.", "Correct. The operating system coordinates the application's access to hardware."),
      choice("mcneill-foundations-language", "Apply", "Compare Language Levels", "Which language level is designed mainly for people to read and is generally more portable across systems?", ["Machine language", "Processor-specific binary", "High-level language", "Raw CPU instruction encoding"], "High-level language", "Java is the chapter's example of this more abstract level.", "Correct. High-level languages hide many processor-specific details."),
      choice("mcneill-foundations-translator", "Apply", "Match a Translator to Its Source", "Which translator converts assembly-language instructions into machine code?", ["Assembler", "Compiler", "Interpreter", "Operating system"], "Assembler", "The tool's name directly corresponds to assembly language.", "Correct. An assembler translates assembly language into machine code."),
      choice("mcneill-foundations-java-chain", "Apply", "Order Java's Execution Chain", "Which sequence correctly moves from Java source to a running program?", [".java source → JVM → Java compiler → bytecode → running program", ".java source → Java compiler → .class bytecode → JVM → running program", "bytecode → .java source → assembler → CPU → running program", "algorithm → JVM → .java source → compiler → running program"], ".java source → Java compiler → .class bytecode → JVM → running program", "Compilation creates bytecode before the JVM executes it.", "Correct. Java source is compiled to bytecode, and the JVM executes that bytecode."),
      choice("mcneill-foundations-pseudocode", "Apply", "Continue the Sorting Procedure", "For one position in the chapter's sorting pseudocode, what happens immediately after finding the smallest remaining value?", ["Convert it into Java bytecode", "Move every value into persistent storage", "Ask the operating system to choose a new algorithm", "Swap it with the value at the current position"], "Swap it with the value at the current position", "The conceptual procedure repeats a find-then-place pair of steps.", "Correct. Each pass finds the smallest remaining value and swaps it into the current position."),
      choice("mcneill-foundations-io", "Apply", "Trace Input Output and Storage", "A student types a value, sees a result on the screen, and saves the program for tomorrow. Which sequence names those three roles?", ["Output → input → ALU", "Storage → compiler → input", "RAM → assembler → output", "Input → output → storage"], "Input → output → storage", "The keyboard supplies data, the display presents data, and storage keeps files beyond the run.", "Correct. The three actions use input, output, and persistent storage in that order."),
      choice("mcneill-foundations-clock-core", "Apply", "Separate Clock Speed and Cores", "Which statement correctly distinguishes clock speed from CPU cores?", ["Clock speed stores files; a core measures bytes", "Clock speed synchronizes operations in hertz; a core can execute instructions", "Clock speed translates Java; a core is an operating system", "Clock speed is RAM; a core is persistent storage"], "Clock speed synchronizes operations in hertz; a core can execute instructions", "One describes timing pulses; the other is an instruction-executing part of the processor.", "Correct. Clock speed measures synchronization frequency, while each core can execute instructions."),
      choice("mcneill-foundations-address", "Apply", "Use a Memory Address", "What does a memory address identify?", ["A unique location used to store or retrieve a byte", "The speed of a CPU clock", "A complete high-level program", "The capacity of an entire storage drive"], "A unique location used to store or retrieve a byte", "An address lets the system reach one memory location directly.", "Correct. A memory address identifies a specific byte location, supporting random access."),
      choice("mcneill-foundations-compiler-interpreter", "Apply", "Compare Compiler and Interpreter", "Which statement matches the chapter's distinction?", ["A compiler manages hardware; an interpreter stores files", "A compiler translates assembly only; an interpreter builds CPU cores", "A compiler translates a source program as a whole before it runs; an interpreter translates and executes as it proceeds", "A compiler is RAM; an interpreter is persistent storage"], "A compiler translates a source program as a whole before it runs; an interpreter translates and executes as it proceeds", "Focus on when translation occurs relative to execution.", "Correct. Compilation prepares another form before execution, while interpretation proceeds through translation and execution together."),
      choice("mcneill-foundations-index", "Warm-up", "Read a Value by Index", "For n = [10, 2, -1, 101, 45], what value does n[2] refer to?", ["2", "-1", "101", "45"], "-1", "Indexes begin at 0, so index 2 is the third position.", "Correct. The value at index 2 is -1."),
      choice("mcneill-foundations-index-variable", "Apply", "Use a Variable as an Index", "For n = [10, 2, -1, 101, 45], if a = 1, what value does n[a] refer to?", ["10", "-1", "45", "2"], "2", "Replace a with the index value it stores, then read that position.", "Correct. a stores index 1, and n[1] is 2."),
      choice("mcneill-foundations-swap", "Apply", "Trace One Sorting Swap", "Starting with n = [10, 2, -1, 101, 45], what sequence results after swapping the values at indexes 0 and 2?", ["[-1, 2, 10, 101, 45]", "[2, 10, -1, 101, 45]", "[10, -1, 2, 101, 45]", "[-1, 10, 2, 101, 45]"], "[-1, 2, 10, 101, 45]", "Only the values at indexes 0 and 2 trade places.", "Correct. -1 moves to index 0 and 10 moves to index 2."),
    ],
  },
  {
    id: "mcneill-math-functions",
    title: "Math Functions",
    description: "Java's built-in Math tools at the point they appear in Prof. McNeill's schedule. Defining custom methods still comes later.",
    schedule: "Oct. 1 · Math Functions",
    sections: [
      {
        id: "mcneill-math-calls",
        eyebrow: "Use library tools",
        title: "Calling Math Methods",
        lead: "Java's Math class provides ready-made calculations. A call such as Math.sqrt(25) gives an argument to a library method and produces a value you can store or print.",
        concepts: [
          { label: "Math.sqrt(x)", detail: "Square root of x.", code: "double root = Math.sqrt(25);" },
          { label: "Math.pow(a, b)", detail: "a raised to power b.", code: "double area = Math.pow(side, 2);" },
          { label: "Math.abs(x)", detail: "Distance from zero; removes a negative sign.", code: "int distance = Math.abs(-7);" },
          { label: "Math.min(a, b)", detail: "The smaller of two values.", code: "int lower = Math.min(first, second);" },
          { label: "Math.max(a, b)", detail: "The larger of two values.", code: "int higher = Math.max(first, second);" },
        ],
        callout: { title: "Calling is not defining", body: "You are using methods Java already supplies. The later Methods unit teaches how to define your own methods." },
      },
      {
        id: "mcneill-rounding-constants",
        eyebrow: "Useful numeric tools",
        title: "Rounding, Constants, and Random Values",
        lead: "The Math class also supplies common constants, rounding operations, and pseudorandom decimal values.",
        concepts: [
          { label: "Math.PI", detail: "Java's decimal approximation of π.", code: "double circumference = 2 * Math.PI * radius;" },
          { label: "Math.floor(x)", detail: "Rounds downward to a decimal whole value." },
          { label: "Math.ceil(x)", detail: "Rounds upward to a decimal whole value." },
          { label: "Math.round(x)", detail: "Rounds to the nearest whole-number value." },
          { label: "Math.random()", detail: "Produces a double from 0.0 up to, but not including, 1.0." },
        ],
        examples: [{
          label: "Scale a random value",
          code: "double sample = Math.random();       // 0.0 <= sample < 1.0\nint die = (int) (sample * 6) + 1;    // 1 through 6",
          note: "Multiplication changes the range, the cast removes the decimal part, and + 1 shifts the first result from 0 to 1.",
        }],
      },
    ],
    reviewQuestions: [
      exactOutput("mcneill-math-output", "Warm-up", "Use Square Root and Absolute Value", "What is the exact output?", "System.out.println(Math.sqrt(81));\nSystem.out.println(Math.abs(-7));", "9.0\n7", "sqrt returns a decimal result; abs reports the distance from zero.", "Correct. The square root is 9.0 and the absolute value is 7."),
      writeExact("mcneill-math-power", "Apply", "Square a Stored Side", "Given double side, write one statement that stores side raised to the second power in double area.", "double side = 4.5;", "double area = Math.pow(side, 2);", "Use the ready-made Math method whose second argument is the exponent.", "Correct. Math.pow uses side as the base and 2 as the exponent."),
      choice("mcneill-math-min-max", "Warm-up", "Choose the Smaller Value", "Which expression produces the smaller of int first and int second?", ["Math.min(first, second)", "Math.max(first, second)", "Math.abs(first, second)", "Math.sqrt(first, second)"], "Math.min(first, second)", "The method name states which of the two values it returns.", "Correct. Math.min returns the smaller argument."),
      exactOutput("mcneill-math-rounding", "Apply", "Compare Rounding Tools", "What is the exact output?", "System.out.println(Math.floor(3.6));\nSystem.out.println(Math.ceil(3.6));\nSystem.out.println(Math.round(3.6));", "3.0\n4.0\n4", "floor goes down, ceil goes up, and round chooses the nearest whole-number value.", "Correct. The three methods produce 3.0, 4.0, and 4."),
      choice("mcneill-math-random", "Apply", "Track Math.random's Range", "Which value could Math.random() produce directly?", ["0.42", "-0.25", "1.0", "6.0"], "0.42", "The lower bound is included and the upper bound is excluded.", "Correct. Math.random returns a double from 0.0 up to but not including 1.0."),
      writeExact("mcneill-math-pi", "Apply", "Calculate a Circumference", "Given double radius, write one statement that stores 2 × π × radius in double circumference using Java's Math constant.", "double radius = 3.0;", "double circumference = 2 * Math.PI * radius;", "Use Math.PI between the two multiplications.", "Correct. The statement uses Java's π constant in the circumference formula."),
      choice("mcneill-math-call", "Apply", "Call Instead of Define", "What does Math.max(first, second) do in this chapter?", ["Calls a method Java already provides", "Defines a new method named max", "Creates a new CPU instruction", "Changes both arguments to the same value"], "Calls a method Java already provides", "The Math class supplies the method before your program uses it.", "Correct. This chapter calls ready-made library methods; defining custom methods comes later."),
    ],
  },
  {
    id: "mcneill-text-files",
    title: "Characters, Strings & File I/O",
    description: "The foundational character, text, formatted-output, and file tools scheduled before loops. Later chapters build full String algorithms after the required foundations exist.",
    schedule: "Oct. 6-8 · Files, Characters, and Strings",
    sections: [
      {
        id: "mcneill-characters",
        eyebrow: "One symbol at a time",
        title: "Characters and Escape Sequences",
        lead: "A char stores exactly one character in single quotes. Java also uses escape sequences for characters that are difficult to type literally.",
        concepts: [
          { label: "char", detail: "A single character value such as 'A', '7', or '?'.", code: "char grade = 'A';" },
          { label: "\\n", detail: "A newline character." },
          { label: "\\t", detail: "A tab character." },
          { label: "\\\"", detail: "A double quote inside a String." },
          { label: "\\\\", detail: "A backslash character." },
        ],
        callout: { title: "Quotes carry meaning", body: "'A' is a char. \"A\" is a String. A char holds one character; a String can hold any length of text." },
      },
      {
        id: "mcneill-string-basics",
        eyebrow: "Work with text",
        title: "Essential String Operations",
        lead: "Strings provide operations for measuring, selecting, comparing, and extracting text. These calls do not require a loop.",
        concepts: [
          { label: "length()", detail: "Number of characters in the String.", code: "int size = name.length();" },
          { label: "charAt(index)", detail: "Character at a zero-based position.", code: "char first = name.charAt(0);" },
          { label: "substring(start, end)", detail: "Text from start through end - 1.", code: "String part = name.substring(0, 3);" },
          { label: "equals(other)", detail: "Whether two Strings contain the same text.", code: "boolean same = name.equals(other);" },
          { label: "compareTo(other)", detail: "Whether text comes before, matches, or comes after other text in lexicographic order." },
        ],
        callout: { title: "Positions start at zero", body: "The first character is at index 0. The last valid index is length() - 1." },
      },
      {
        id: "mcneill-formatted-output",
        eyebrow: "Control displayed text",
        title: "Formatted Output",
        lead: "System.out.printf combines text with placeholders. Each placeholder must match the type of the corresponding value.",
        concepts: [
          { label: "%s", detail: "String or other printable text value." },
          { label: "%d", detail: "Whole-number value." },
          { label: "%f", detail: "Decimal value." },
          { label: "%.2f", detail: "Decimal displayed with exactly two digits after the decimal point." },
          { label: "%n", detail: "Portable line break." },
        ],
        examples: [{
          label: "A formatted receipt line",
          code: "String item = \"Notebook\";\ndouble price = 3.5;\nSystem.out.printf(\"%s: $%.2f%n\", item, price);",
          note: "Formatting changes how the value is displayed; it does not change the stored double.",
        }],
      },
      {
        id: "mcneill-file-input",
        eyebrow: "Read stored data",
        title: "Introductory File Input",
        lead: "A Scanner can read from a file instead of the keyboard. The setup code names the file, opens a Scanner for it, and then uses familiar Scanner methods.",
        examples: [{
          label: "Read one value from a file",
          code: "import java.io.File;\nimport java.io.FileNotFoundException;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) throws FileNotFoundException {\n        Scanner fileInput = new Scanner(new File(\"data.txt\"));\n        int value = fileInput.nextInt();\n        System.out.println(value);\n        fileInput.close();\n    }\n}",
          note: "The exception phrase is setup boilerplate at this point. The important connection is that Scanner reads typed data from a File rather than System.in.",
        }],
      },
      {
        id: "mcneill-file-output",
        eyebrow: "Save program output",
        title: "Introductory File Output",
        lead: "PrintWriter sends output to a file. Closing the writer ensures buffered output is finished and the file resource is released.",
        examples: [{
          label: "Write one line to a file",
          code: "import java.io.FileNotFoundException;\nimport java.io.PrintWriter;\n\npublic class Main {\n    public static void main(String[] args) throws FileNotFoundException {\n        PrintWriter output = new PrintWriter(\"result.txt\");\n        output.println(\"Saved result\");\n        output.close();\n    }\n}",
          note: "This is the same output idea as System.out.println, but the destination is a file.",
        }],
        rules: [
          "Use Scanner with System.in for keyboard input and Scanner with a File for file input.",
          "Use System.out for console output and PrintWriter for file output.",
          "Close file resources after the program finishes using them.",
        ],
      },
    ],
    reviewQuestions: [
      writeExact("mcneill-text-char-string", "Warm-up", "Use the Correct Quotes", "Declare char grade with A and String label with A.", undefined, "char grade = 'A';\nString label = \"A\";", "A char uses single quotes; a String uses double quotes.", "Correct. The quotation marks distinguish one character from String text."),
      exactOutput("mcneill-text-escapes", "Warm-up", "Read a Newline Escape", "What is the exact output?", "System.out.println(\"Top\\nBottom\");", "Top\nBottom", "The escape sequence inside the String moves the second word to a new line.", "Correct. \\n creates a line break between the two words."),
      choice("mcneill-text-escape-roles", "Apply", "Match Three Escape Sequences", "Which mapping is correct?", ["\\t = tab · \\\" = double quote · \\\\ = backslash", "\\t = newline · \\\" = tab · \\\\ = double quote", "\\t = backslash · \\\" = newline · \\\\ = tab", "\\t = String · \\\" = char · \\\\ = int"], "\\t = tab · \\\" = double quote · \\\\ = backslash", "Each escape represents a character that is awkward to write literally inside text.", "Correct. The escapes represent a tab, a double quote, and a backslash."),
      exactOutput("mcneill-text-methods", "Apply", "Trace String Positions", "What is the exact output?", "String word = \"Java\";\nSystem.out.println(word.length());\nSystem.out.println(word.charAt(1));\nSystem.out.println(word.substring(1, 3));", "4\na\nav", "Indexes begin at zero, and substring excludes its ending index.", "Correct. Java has length 4, index 1 is a, and positions 1 through 2 form av."),
      choice("mcneill-text-equality", "Apply", "Compare String Contents", "Which expression checks whether String first and String second contain the same text?", ["first.equals(second)", "first.length(second)", "first.charAt(second)", "first.substring(second)"], "first.equals(second)", "Use the method whose job is content equality.", "Correct. equals compares the text stored in the two Strings."),
      choice("mcneill-text-order", "Apply", "Compare Text Order", "Which String method reports whether first comes before, matches, or comes after second in lexicographic order?", ["first.compareTo(second)", "first.equals(second)", "first.charAt(second)", "first.length(second)"], "first.compareTo(second)", "This method compares ordering rather than only equality.", "Correct. compareTo reports the lexicographic relationship between two Strings."),
      writeExact("mcneill-text-printf", "Apply", "Format a Receipt Line", "Given String item and double price, write one statement that prints ITEM: $PRICE with exactly two decimal places and then ends the line.", "String item = \"Notebook\";\ndouble price = 3.5;", "System.out.printf(\"%s: $%.2f%n\", item, price);", "%s displays the text, %.2f displays two decimal places, and %n ends the line.", "Correct. Each placeholder matches its value and the price is displayed to two decimal places."),
      choice("mcneill-text-format-types", "Apply", "Match Values to Format Specifiers", "Which mapping is correct for printf?", ["%s = text · %d = whole number · %f = decimal", "%s = decimal · %d = text · %f = whole number", "%s = line break · %d = file · %f = keyboard", "%s = char only · %d = boolean · %f = String"], "%s = text · %d = whole number · %f = decimal", "Each placeholder must match the kind of value supplied after the format String.", "Correct. printf uses %s for text, %d for whole numbers, and %f for decimal values."),
      choice("mcneill-text-file-input", "Apply", "Choose a Scanner Source", "Which setup reads typed values from data.txt rather than from the keyboard?", ["Scanner fileInput = new Scanner(new File(\"data.txt\"));", "Scanner input = new Scanner(System.in);", "PrintWriter output = new PrintWriter(\"data.txt\");", "System.out.println(\"data.txt\");"], "Scanner fileInput = new Scanner(new File(\"data.txt\"));", "Scanner can read from different sources; this question asks for a File source.", "Correct. The Scanner is connected to a File instead of System.in."),
      writeExact("mcneill-text-file-output", "Apply", "Write and Close a Text File", "Inside a main method that already declares throws FileNotFoundException, create a PrintWriter for result.txt, write Saved result on one line, and close the writer.", undefined, "PrintWriter output = new PrintWriter(\"result.txt\");\noutput.println(\"Saved result\");\noutput.close();", "Create the writer, use its println method, and close the same variable.", "Correct. The program writes the line and closes the file resource."),
      choice("mcneill-text-close-resource", "Apply", "Explain Why Files Are Closed", "Why should the program close a PrintWriter after its final output?", ["To finish buffered output and release the file resource", "To convert the file into keyboard input", "To change every String into a char", "To make array indexes begin at one"], "To finish buffered output and release the file resource", "Closing completes the writer's work and releases what the program opened.", "Correct. Closing helps ensure the output is finished and the file resource is released."),
    ],
  },
];

export const cisc1115ProfessorTrack: ProfessorTrackUnit[] = [
  { id: "computer-foundations", label: "Foundations · Computers & Programs", entries: [{ kind: "added-chapter", id: "mcneill-lecture-1" }] },
  { id: "java-fundamentals", label: "Unit I · Java Fundamentals", entries: [
    { kind: "existing-chapter", id: "variables-data-types" },
    { kind: "existing-chapter", id: "operators-expressions" },
    { kind: "added-chapter", id: "number-systems" },
    { kind: "existing-chapter", id: "input-basic-programs" },
  ] },
  { id: "selections", label: "Unit II · Decision Making", entries: ["comparisons-booleans", "if-else", "decision-programs"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "math-functions", label: "Math Functions", entries: [{ kind: "added-chapter", id: "mcneill-math-functions" }] },
  { id: "text-files", label: "Characters, Strings & File I/O", entries: [{ kind: "added-chapter", id: "mcneill-text-files" }] },
  { id: "loops", label: "Unit III · Repetition", entries: ["while-loops", "for-loops", "nested-loops"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "methods", label: "Unit IV · Methods", entries: ["methods", "returns-scope"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "arrays-strings", label: "Unit V · Arrays, Lists & Strings", entries: ["arrays", "arrays-loops", "strings", "arraylists"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "algorithms", label: "Unit VI · Basic Algorithms", entries: ["searching", "sorting", "algorithmic-problem-solving"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "program-development", label: "Unit VII · Program Development", entries: ["input-output", "debugging-testing"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "computing-context", label: "Unit VIII · CS Foundations", entries: ["computers-programs-algorithms", "cs-context-applications"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "course-synthesis", label: "Final · Course Synthesis", entries: ["cumulative-challenges", "final-assessment"].map((id) => ({ kind: "existing-chapter" as const, id })) },
];

export const professorAddedChapterById = new Map(cisc1115ProfessorAddedChapters.map((chapter) => [chapter.id, chapter]));

export const professorChapterNumberById = new Map(cisc1115ProfessorTrack.flatMap((unit) => unit.entries).map((entry, index) => [entry.id, index + 1]));

export const professorMasteryDisplayById = new Map([
  ["unit-1-mastery", { unit: "Unit I · Java Fundamentals", title: "Unit I Mastery Test" }],
  ["unit-2-mastery", { unit: "Unit II · Decision Making", title: "Unit II Mastery Test" }],
  ["unit-3-mastery", { unit: "Unit III · Repetition", title: "Unit III Mastery Test" }],
  ["unit-4-mastery", { unit: "Unit IV · Methods", title: "Unit IV Mastery Test" }],
  ["unit-5-mastery", { unit: "Unit V · Arrays, Lists & Strings", title: "Arrays, Lists & Strings Mastery Test" }],
  ["unit-6-mastery", { unit: "Unit VI · Basic Algorithms", title: "Algorithms Mastery Test" }],
  ["unit-7-mastery", { unit: "Unit VII · Program Development", title: "Unit VII Mastery Test" }],
  ["unit-8-mastery", { unit: "Unit VIII · CS Foundations", title: "Unit VIII Mastery Test" }],
]);

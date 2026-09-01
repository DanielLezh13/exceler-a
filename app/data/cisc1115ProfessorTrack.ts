import type { StructuredLessonSection } from "./cisc1115Course";

export type ProfessorTrackAddedChapter = {
  id: string;
  title: string;
  description: string;
  schedule: string;
  sections: StructuredLessonSection[];
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
        examples: [{
          label: "Conceptual sorting procedure",
          language: "Pseudocode",
          code: "For each position i in the sequence:\n    find the smallest value from position i onward\n    swap that value with the value at position i",
          note: "The sequence and positions are conceptual here. Later array chapters teach how Java stores indexes and performs the swap.",
        }],
        rules: [
          "An algorithm should have a clear goal and ordered steps.",
          "Each step must be precise enough for another person to follow.",
          "This early bridge does not require array syntax or sorting code.",
        ],
      },
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
  },
];

export const cisc1115ProfessorTrack: ProfessorTrackUnit[] = [
  { id: "computer-foundations", label: "Unit I · Computer Foundations", entries: [{ kind: "added-chapter", id: "mcneill-lecture-1" }] },
  { id: "java-fundamentals", label: "Unit II · Variables, Types, Input & Output", entries: ["variables-data-types", "operators-expressions", "input-basic-programs"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "selections", label: "Unit III · Selections", entries: ["comparisons-booleans", "if-else", "decision-programs"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "math-functions", label: "Unit IV · Math Functions", entries: [{ kind: "added-chapter", id: "mcneill-math-functions" }] },
  { id: "text-files", label: "Unit V · Characters, Strings & File I/O", entries: [{ kind: "added-chapter", id: "mcneill-text-files" }] },
  { id: "loops", label: "Unit VI · Loops", entries: ["while-loops", "for-loops", "nested-loops"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "methods", label: "Unit VII · Methods", entries: ["methods", "returns-scope"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "arrays-algorithms", label: "Unit VIII · Arrays, Strings & Algorithms", entries: ["arrays", "arrays-loops", "strings", "arraylists", "searching", "sorting", "algorithmic-problem-solving"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "program-development", label: "Unit IX · Program Development", entries: ["input-output", "debugging-testing"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "computing-context", label: "Unit X · Computing Context", entries: ["computers-programs-algorithms", "cs-context-applications"].map((id) => ({ kind: "existing-chapter" as const, id })) },
  { id: "course-synthesis", label: "Final · Course Synthesis", entries: ["cumulative-challenges", "final-assessment"].map((id) => ({ kind: "existing-chapter" as const, id })) },
];

export const professorAddedChapterById = new Map(cisc1115ProfessorAddedChapters.map((chapter) => [chapter.id, chapter]));

export const professorChapterNumberById = new Map(cisc1115ProfessorTrack.flatMap((unit) => unit.entries).map((entry, index) => [entry.id, index + 1]));

export const professorMasteryDisplayById = new Map([
  ["unit-1-mastery", { unit: "Unit II · Variables, Types, Input & Output", title: "Unit II Mastery Test" }],
  ["unit-2-mastery", { unit: "Unit III · Selections", title: "Unit III Mastery Test" }],
  ["unit-3-mastery", { unit: "Unit VI · Loops", title: "Unit VI Mastery Test" }],
  ["unit-4-mastery", { unit: "Unit VII · Methods", title: "Unit VII Mastery Test" }],
  ["unit-5-mastery", { unit: "Unit VIII · Arrays, Strings & Algorithms", title: "Arrays, Lists & Strings Mastery Test" }],
  ["unit-6-mastery", { unit: "Unit VIII · Arrays, Strings & Algorithms", title: "Algorithms Mastery Test" }],
  ["unit-7-mastery", { unit: "Unit IX · Program Development", title: "Unit IX Mastery Test" }],
  ["unit-8-mastery", { unit: "Unit X · Computing Context", title: "Unit X Mastery Test" }],
]);

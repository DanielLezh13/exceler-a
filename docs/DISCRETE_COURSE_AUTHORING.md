# Discrete Structures — authored scope and verification

CISC 2210 is the next independently authored self-study course after Calculus I. It is a full lesson/practice sequence, not an official Brooklyn College offering, a particular instructor's section, or a credit award. CISC 3115 is outside this task.

## Sources and prerequisite boundary

- [Brooklyn College CISC 2210 catalog](https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=2210&div=U&dsc=CISC.): elementary sets, functions, relations, Boolean algebra, switching circuits/gating networks, algorithms and analysis, graph theory and applications, combinatorial counting, and introductory error analysis. The listed prerequisite combines introductory programming with precalculus or placement into Calculus I; completed calculus is not required.
- [Department undergraduate course resources](https://www.brooklyn.edu/cis/undergraduate-computer-science/): distinguishes topic outlines from instructor-selected texts and grading policies. The linked CISC 2210 PDF could not be retrieved during this run, so this course does not claim that its exact order or every enrichment topic is mandated by that PDF.

All explanations, examples, exercises and tests are original. Logic, proof methods, integer representations, and finite probability provide supporting foundations and counting/computing applications. They are not presented as a verbatim semester syllabus. Basic arithmetic and algebraic manipulation are assumed from the prior preparation; new discrete definitions are introduced before required use. No derivative, integral, or Calculus II technique is needed.

## Coverage map

| Unit | Chapters | Main distinctions and constructions |
| --- | --- | --- |
| I | Sets & Discrete Objects; Logic & Quantified Statements | Membership versus subsets, empty objects, operations and complements, products and power sets; inclusive/exclusive OR, implication versus converse, equivalence, argument validity, witnesses, counterexamples, quantifier order and negation. |
| II | Proof Methods & Induction; Integers, Encodings & Error | Direct/contrapositive/contradiction reasoning, algebraic proof steps, bases and induction transitions, strong-induction example, invariants versus termination; Euclid, negative remainders, congruence, fixed-width binary, absolute versus relative error. |
| III | Functions, Sequences & Recursion; Relations, Equivalence & Order | Domain/codomain/image, injections/surjections, inverse and composition, recursive updates; relation matrices, reflexive/symmetric/transitive closures, equivalence classes, partitions, partial orders, minimal versus least, cover pairs. |
| IV | Boolean Algebra & Switching Circuits; Counting & Combinatorial Arguments | Boolean equivalence and absorption, circuit expressions, NAND/NOR, half/full adders; ordered versus unordered choices, replacement/leading-zero restrictions, repetitions, binomial coefficients, stars and bars, inclusion–exclusion and pigeonhole guarantees. |
| V | Finite Probability & Expectation; Graphs & Networks | Equally likely outcomes versus categories, complements, conditional probability, independence, Bayes and expected net gain; degree/matrix construction, isolated vertices, connectivity, two-coloring, Euler versus Hamilton, planar face counts and necessary bounds. |
| VI | Trees & Graph Algorithms; Algorithm Analysis & Reliability | Tree/forest/rooted counts, BFS versus DFS, deterministic dependency order, weighted shortest paths and MST objectives; exact loop counts, tight growth versus loose bounds, sorting traces/recurrences, correctness, numerical error propagation and parity/Hamming codes. |

The course has **12 chapters, 29 lessons, 60 worked examples, 254 problems, and six unit mastery tests**. There are 176 section-practice questions, 36 chapter-review questions, and 42 assessment questions. 214 questions require at least one typed result; recognition remains for distinctions where choosing a hypothesis or detecting a false inference is useful. Every lesson has explanations, rules, at least two worked examples, a misconception, and nearby practice. Reviews and tests combine already introduced material with less guidance.

Graph questions include their complete vertex/edge lists, weights and ordering conventions. No task depends on an absent diagram. Exact traversal outputs specify tie-breaking; pair sets ignore listing order. Probabilities specify fair/uniform/independent assumptions where needed. Word problems distinguish roles from subsets, replacement, leading zeros, empty boxes and fixed-width encodings.

## Shared interface and data

- `/cisc2210` opens the real first lesson. The library places it with Computer & Information Science, alongside Java; the three MATH courses retain their own group. The existing Degree Map drawer discovers its lesson link through the course registry.
- Uses the same Section Check, connected numbered question route, score, choice cards, final-answer fields, worked steps, and pager as the other written courses. No CSS redesign or new scratch-work requirement.
- Whole-test submission creates detached question/answer/grade snapshots. Results, historical attempts and single-question retries reuse the existing workflow. Reload preserves the four additive answer kinds instead of discarding their attempts.
- Tutor context includes questions, labeled multiple-choice options, exact typed entries and feedback. Submitted review adds worked solutions; active tests withhold reference answers. Tests exercise context construction, not a separately billed live tutor request.
- Device-local records, backup format, Java progress and official degree statuses are preserved. A self-study result never changes an official requirement to complete.

## Grading contract and limits

The existing bounded number, polynomial/rational-expression and numerical-set checks are reused. Four additive formats support this subject:

- **Logic:** non-executing parser for one-letter variables, constants, NOT/AND/OR/XOR/implication/equivalence and parentheses, including common ASCII and Unicode spellings. Acceptance requires equality on every truth assignment, not matching sampled rows or canonical text. A mismatch reports an actual counterexample assignment. Limits: 600 characters, 200 tokens, bounded nesting and at most eight variables. Unsupported notation is not certified as a mathematical error.
- **Ordered-pair sets:** numerical entries, optional braces, commas/semicolons and empty-set spellings. Pair listing order and duplicate listings are irrelevant; coordinate order remains significant. Arbitrary nested/set-valued pairs are not claimed supported.
- **Sequences:** comma/semicolon-separated numerical expressions, optionally bracketed; length, order and repetitions matter. BFS/DFS matrix/sequence questions state their ordering contract.
- **Bit strings:** exact 0/1 sequence and requested width; group spaces/underscores are ignored, but leading zeros cannot be dropped when width is requested.

Proof lessons demonstrate complete arguments and ask learners to construct specific algebraic steps, conditions and counterexamples. This is **not a free-form proof verifier**; automated passing does not certify independent written-proof mastery. Circuit-expression grading verifies truth behavior, not minimum gate count. No general quantifier theorem prover, arbitrary symbolic set parser or graph-drawing grader is claimed. Prompt constraints avoid relying on those unavailable capabilities. Input help describes notation without deriving hints from reference answers.

## Verification

- `npm run audit:math`: all four registered written courses, 994 reference answers, declared topic continuity, unique IDs, lesson/review/test coverage.
- `npm run audit:continuity`: existing Java course continuity.
- `tests/discrete.test.mjs`: all 256 Boolean functions of three variables (independently generated DNF/CNF and constant evaluations), wrong logical relations, parser limits/injection rejection, pair/sequence/bit distinctions, independent finite counting and relation-closure oracles, BFS/DFS, Floyd–Warshall shortest-path checks, exhaustive spanning-tree candidates, proof algebra and numerical/error checks, six-test immutable history and retry round trips.
- `tests/math-ui.test.mjs`: real component handlers for entry/check/reload, worked steps, single-bit-question retry/history/context, computing-versus-mathematics library placement and all entry-page server renders. All course lesson/review/test locations are included in the shared component-tree checks.
- Production build and complete suite: **75 tests passed**. Focused TypeScript and ESLint checks passed; `git diff --check` passed. The dev route `/cisc2210` returned HTTP 200.
- Java, Algebra, Precalculus, Calculus content files and the stylesheet retain their exact pre-task SHA-256 hashes. Existing unrelated working-tree edits were left intact.

The build retains existing large-bundle and route-classification notices. Verification used deterministic component/server rendering, not a browser visual audit. This work is local only: no deployment, git publish, billing change or course-scheduling change.

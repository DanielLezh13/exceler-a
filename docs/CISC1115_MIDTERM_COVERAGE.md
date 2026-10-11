# CISC 1115 midterm integration · October 2026

## Source and scope audit

Read the supplied Midterm study guide, HW4, Quiz 2 Study Guide, Quiz 2 Practice Packet, Three Mock Quizzes, Lecture 11 (Characters and Strings), Lecture 12 (Scanner with characters, strings, and files), and Trigonometry.java before authoring. The packet and mock-quizzes PDFs contain the same extracted questions; they are one source family, not two independent coverage needs. Review questions in supplied files are curriculum evidence, not instructions to change the application.

The midterm lists its scope as **non-exhaustive**. The supplied materials establish calling library methods and using arguments/returns, rather than independently defining custom methods or writing loops. Those later chapters remain after the new midterm practice. The full class/main wrapper and file exception phrase are familiar setup, not a new unit on method definitions or exception handling.

The existing route already handles types, prefix/postfix, casts, compound assignment, numeric input, base conversions, Boolean combinations, nested/ordered decisions, and substantial decision production. Preserve those families. The weak transition was the seven-question Math chapter and eleven-question text/file chapter: little independent construction, few contrasting inputs, no nearby method/return model, and no mixed review after these early tools.

## Integrated progression

Existing Java fundamentals → number systems → numeric input → Boolean/decision chapters → **Math Methods & Arguments** → **Characters, Strings & File I/O** → **Midterm Practice** → loops → defining custom methods → later chapters.

| Placement | Total questions | Added questions | Coverage and reason |
| --- | ---: | ---: | --- |
| Comparisons & Boolean Logic | Existing pool + 4 | 2 authored + 2 ordinary generated checks | Boolean XOR from the study guide; contrast OR, trace both-true behavior, construct an exactly-one rule. |
| Math Methods & Arguments | 35 | 28 | Arguments/input slots/returns, nested calls, numeric return types, negative rounding versus casts, formulas, random interval scaling/cast/shift, distance and full triangle programs. |
| Characters, Strings & File I/O | 50 | 39 | Codes/casts/arithmetic, return types and bounds, String transformations/reference reassignment, full-line input and leftover newlines, typed formatting, fixed file records/close behavior, menus, book pricing, shipping, Mad Libs, RPS, and a single-hex-digit program. |
| Midterm Practice | 21 | 21 | Retrieve updates/casts/base conversions, exact class examples and structural variations, trace assignments in execution order, pricing boundaries/XOR, then build distance, file-receipt, and validated text-admission programs from behavior. |

**92 new reachable questions** in total. The new Math and text chapters distribute practice across their instructional parts, with four cumulative review questions each. The midterm chapter has three practice groups and a three-program cumulative review. This is not a large worksheet appended to the course end.

Direct source anchors retain recognizable task families; variants alter meaningful relationships: early versus late casts, original versus returned Strings, tokens versus whole lines, case-sensitive versus normalized choices, different inner branches, inclusive versus exclusive pricing windows, file transformation versus classification, and fees applied to different intermediate subtotals. Later prompts leave branch design and intermediate variables to the learner. Multiple implementations are accepted where behavior is the contract.

Deliberate non-additions: do not rebuild the already substantial operators/decision chapters, repeat both identical mock packets, teach loop-based file traversal before loops, ask learners to derive the law of cosines, or invent missing in-class demo code. The single-hex exercise is an original implementation of the lecture's named demo family using taught character codes and integer arithmetic.

## Corrected source errors

- Incrementer adds 1 to **all three** inputs: `3 10 3` produces `4`, `11`, `4`. The study guide's last `3` is a typo.
- The displayed mathematical formula has `-e` **outside** the square root; the answer key incorrectly moves it inside.
- Class reference code is compilable: corrected parentheses, the stray `|`, and `input.close():`.
- HW4's game has three computer choices, **0, 1, 2**, with 3 excluded. Avoid copying its ambiguous “0–3” phrase.
- ASCII covers 0–127; Java char stores a UTF-16 code unit. `\u0030`/48 is `'0'`, not `'a'`.

## Validation and persistence

`classroomJavaValidation.ts` parses a bounded, loop-free classroom subset. It uses virtual input/files and deterministic random fixtures; it does not execute learner Java or access host/browser files. It supports taught Math, String, Character, Scanner, File and PrintWriter operations, renamed locals, branches/nesting, grouped or equivalent expressions, wildcard imports, and irrelevant final newlines. It checks file closing when the prompt requires it.

This is a behavioral subset checker, **not a complete Java compiler**. Tests cover canonical and alternative solutions, wrong types/names/import setup, early random casts, random interval boundaries, all game pairings, incorrect range endpoints, wrong fee priority, lost multiword input, missing resource closes, wrong output files, and unsupported constructs. Binary groups are reconstructed with Java precedence because the editor parser places `%` too low. Method receivers are evaluated before arguments. File fixtures are isolated from real learner files.

`scripts/check-classroom-java.mjs` independently compiles and runs **trusted authored answers only** with a real JDK. It checks varied inputs, output files and fixed random samples; it never receives student submissions. Run with `CISC_JAVA_BIN=/path/to/jdk/bin node --experimental-strip-types scripts/check-classroom-java.mjs`.

All pre-existing chapter, section, question and mastery IDs are retained. Existing Math/text questions keep their IDs and validators and are placed near their lessons. Private/public storage keys, account synchronization, answers/hints, saved test attempts and unrelated courses are unchanged. New practice can reduce a displayed completion percentage by increasing its denominator; it does not erase old passed answers. Midterm preparation is derived from existing practice records rather than a new storage schema.

Verification: continuity audit, all question reference answers, regression suite, independent JDK checks, production build, and browser submission of a differently structured PointDistance solution with renamed variables and final `print`. The browser accepted it and updated the chapter review and midterm practice counts. Repository-wide TypeScript checking has existing PDF worker, duplicate-property, optional mastery and Cloudflare binding diagnostics; the added modules introduce none.

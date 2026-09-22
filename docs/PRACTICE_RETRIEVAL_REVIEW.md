# Course-wide writing-practice review

Date: 2026-08-30

## Decision rule

Basic material should still exercise code recall. Where writing is meaningful, place short construction tasks near the introduction, then reuse the skill in less-scaffolded fragments and existing independent builds. Preserve useful recognition, tracing, debugging, and conceptual questions; do not impose a coding-question quota or require a complete program for every small skill.

This rule is recorded in `AGENTS.md` and section 17 of `PRACTICE_AUTHORING.md`.

## Scope and evidence

Reviewed all 24 chapters against their actual `chapterPracticePlan`, including the hand-authored opening plans and fallback placement of review questions. Counting only generated section questions would incorrectly report some gaps and overlook some unreachable writing exercises.

Added 34 questions in 17 chapters. Most are guided syntax retrieval (production stage 2), six are short requirements-driven fragments (stage 3), and one is a repair (stage 1). These are not counted as new independent builds. Existing scenario-first builds, chapter reviews, final assessment questions, and all unit mastery tests remain intact.

| Chapter | Added | Decision and connection to existing practice |
| --- | ---: | --- |
| Variables & Data Types | 0 | Existing declarations, reassignment, output, inventory fragments, and tournament check-in build already connect syntax to production. Retain them. |
| Operators & Expressions | 4 | Write ticket cost, change, remainder, and a correctly grouped labeled sum. Retain the richer update/precedence traces and independent resource problems. Move the existing minutes conversion from division to modulus because it requires `%`. |
| Input & Basic Programs | 0 | Expose the already-authored weather-reading and badge-name tasks in numeric/text input checks. Retain Scanner repairs, receipt/profile/trip programs, and the independent delivery-drone build. |
| Comparisons & Booleans | 3 | Keep the six recently added comparison-writing tasks and their multiple-choice partners. Add inclusive AND boundaries, weekend OR, and reversal with NOT. Keep truth tracing and combined-condition work. |
| If / Else | 2 | Write a first single `if` before `else` is taught, then construct a three-category chain. Retain branch traces, debugging, and the complete decision build. |
| Decision Programs | 1 | Classify an invalid, small, or large parcel with decimal boundaries. Existing min/max, menu, eligibility, and complete-program tasks remain. |
| While Loops | 1 | Retrieve the complete initial loop structure in a countdown. Retain counter, accumulator, sentinel, infinite-loop, and larger-program practice. |
| For Loops | 2 | Write a complete header/body and reconstruct a shown `for` loop as `while`. Keep range, direction, accumulation, and off-by-one questions. |
| Nested Loops | 1 | Write a small rectangle with separate character output and row-ending newline. Retain iteration counting, tracing, growing patterns, and the larger loop problem. |
| Methods | 4 | Write a void definition, an ordered argument list, a parsing call, and a call based on an API entry. Retain parameter traces and decomposition builds. |
| Returns & Scope | 2 | Write a returning method and select an overload with a call. Retain scope/composition traces and the decomposed program. |
| Arrays | 2 | Produce an indexed read and an in-place element update. Retain declaration, bounds, length, and complete-array exercises. |
| Arrays & Loops | 2 | Write an ordered traversal and a running minimum. Accept indexed, enhanced-for, and while variants. Retain filling, sum/average, counting, search, and transformation builds. |
| Strings | 4 | Produce substring, last-occurrence, ordering, and case-insensitive equality calls. Retain normalization, character loops, text construction, and complete algorithms. |
| ArrayLists | 2 | Write ordered append calls and a traversal. Retain replacement, removal, and removal-during-traversal work. |
| Searching | 1 | Turn the `-1` failure convention into safe caller code. Retain search construction, first/last-match variants, and binary-search traces. |
| Sorting | 1 | Write one adjacent bubble-sort pass. Retain swap, selection-sort, trace, error, and full-sort verification questions. |
| Algorithmic Problem Solving | 0 | Existing positive-total, parallel-record, largest-even, repair, build-and-trace, and tournament-leader tasks already require production. Tracing is itself a target here. |
| Input / Output | 1 | Write file-source setup with already-taught exception/import boilerplate supplied. Retain structured input, formatting, end-of-input loops, and record processing. |
| Debugging & Testing | 1 | Turn a reported array-access error into a minimal code repair. Keep error classification, test-case design, expected/actual comparisons, and systematic repair. |
| Computers, Programs & Algorithms | 0 | Retain algorithm implementation, weather modeling, and failed-reading builds. Do not force Java transcription into hardware or translation terminology. |
| CS Context & Applications | 0 | Retain bit-count, range, policy-audit, and selection-policy production. History, disciplines, and responsibility still benefit from conceptual questions. |
| Cumulative Challenges | 0 | Already ten substantial construction tasks combining taught material; no introductory syntax drills added. |
| Final Assessment | 0 | Existing assessment is preserved, including its method and full-program writing questions. |

## Prerequisite placement

- Arithmetic questions use only already-taught declarations and arithmetic. Remainder is placed after `%`, and labeled sums after concatenation/grouping.
- AND, OR, and NOT writing follows the corresponding operators, not the earlier comparison-only section. The first `if` task contains no `else` or loops.
- A first `while`, `for`, and nested loop follows each construct's first full example. Updates were taught in Unit I.
- Method calls/definitions use their current section's signatures. Returning methods are in Returns & Scope, not the earlier void-definition exercise.
- Indexed array operations follow indexes; enhanced-for appears where that traversal is taught. String and ArrayList calls follow their method introductions.
- Search-failure handling, adjacent sorting, file setup, and exception-informed repair follow their respective lessons. File-task boilerplate is visible inside the question.

## Grading and preservation

The new retrieval validator parses Java syntax and compares supported structures with authored alternatives. It is not a Java compiler or a universal execution grader. These deliberately scoped exercises do not replace the existing behavioral graders used for independent assessments.

Tested allowances include comments, whitespace, redundant grouping, local/parameter renaming, optional braces, reversed comparisons, equivalent integer boundaries where valid, standalone expanded/compound/prefix/postfix updates, alternate traversal forms, ascending/descending classification chains, and case variants for `equalsIgnoreCase`. One-time output accepts `print` or `println`; repeated line structure remains significant. Names/types expressly required by a prompt, given-variable use, argument order, boundaries, and meaningful literal whitespace remain enforced.

Every addition has reference/alternative acceptance tests and at least one plausible wrong-answer test. This is representative equivalence coverage, not a claim that every possible valid Java implementation is recognized. If a learner supplies another prompt-valid structure, extend support with a regression test rather than tell them to imitate the reference. No unsupported source is executed.

Before/after fingerprints confirm that all 701 pre-existing chapter questions retain their wording, answers, validators, and other fields. All eight mastery tests are unchanged. Existing question placement changes are limited to the modulus prerequisite repair and exposing the two already-authored input tasks.

No stored learner records are cleared, migrated, or overwritten. Existing answers remain associated with the same IDs. New required questions can reduce a section's displayed completion percentage until the additional practice is finished; that is not loss of the previous answers or passes.

## Verification

- Production build succeeds; 35 automated tests pass, including six new course-placement and retrieval-grading tests.
- Continuity audit succeeds: 24 chapters, 735 chapter practice items, eight mastery tests with 34 existing mastery builds.
- Focused TypeScript and ESLint checks for the new modules and audit/test helpers pass.
- Existing-question and mastery-test fingerprint comparison passes; no existing question was removed or rewritten.
- Local page responds successfully. No browser interaction, new learner submission, or public deployment was performed for this change.
- The build still reports a large-chunk advisory. Full-repository lint cleanliness is not claimed; unrelated pre-existing errors are outside this curriculum change.

## Targeted follow-up: Tracing Truth

Date: 2026-09-21

The Tracing Truth section previously checked the meanings of `!`, `&&`, and `||`, but supplied too little practice actually reducing mixed boolean expressions. Seven traces now form a controlled progression: `!` with `&&`; `&&` before `||`; a near-identical parenthesized contrast; a negated false group; the preserved negated-group challenge under different values; an explicit reduction-order choice; and a final comparison/AND/OR trace.

The lesson now states the complete working order and demonstrates parentheses followed by `!`. Existing question IDs and validators remain unchanged; the effective negated-group question moved from Combining Conditions to Tracing Truth, where its reasoning belongs. No `if`, branches, loops, De Morgan's laws, short-circuit side effects, or truth-table terminology was added because those are not required for this local objective and some belong to later material. The set stops after the useful precedence and grouping contrasts rather than enumerating arbitrary truth-value permutations.

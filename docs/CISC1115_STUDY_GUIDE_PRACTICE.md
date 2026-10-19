# Dedicated Midterm Study Guide · October 19, 2026

## Audit and scope

The prior 21-question Midterm Practice chapter mixes early tools, while the 35-question Math and 50-question text/file chapters teach them in the normal route. They do not provide a single extensive, guide-ordered preparation sequence. Preserve all of them and add the requested **Midterm Study Guide at the bottom of Java**, with a shortcut in the existing preparation card.

Primary source: the supplied **Midterm study guide.pdf**, including its seven problems, front-page checklist and answer pages. Supporting sources: Lectures 8 (logical operators), 9 (conditional state/precedence/random), 10 (Math), 11 (characters/Strings), and 12 (Scanner/files). Read their extracted text and visually inspect the actual formula and Math tables; image-only tables contain methods missing from plain extraction.

The supplied guide describes its topic list as non-exhaustive. This section prepares the supplied scope; it does not promise the exam's exact questions. Required solutions use the early toolkit: types, operators, branches, library calls and fixed-count input/file operations. No loops, arrays, custom method definitions, sorting, or later String algorithms are introduced into these requirements.

## Reachable practice and progression

| Lesson group | Questions | Guide connection | Meaningful variations |
| --- | ---: | --- | --- |
| Program/types/operators/Boolean refresher | 10 | Page 1 checklist; Lectures 8–9 | Int versus decimal division, old/new update values, text joining, OR/AND grouping, outside ranges, union-and-age rules, XOR, uninitialized locals. |
| Trace changing variables | 12 | Q1, pages 2/7 | Separate ifs versus chains, inner else, post-inner updates, changed parity, exact guide final state and assignment history, three different nested paths, repair missing assignment. |
| Text menus and complete programs | 8 | Q2, pages 3/8 | Equals versus identity, unsupported choices, assign a factor on every path, original Conversion, offset/unit formula variation, normalized whole-line choices after numeric input. |
| Number systems | 16 | All five Q3 tasks | Place values and zero gaps, hex letters, original five conversions/addition, 255/256 place transition, leading zeroes, zero representation, carry propagation. |
| Pricing/ranges/priority | 9 | Q4, pages 4/9 | Included/excluded boundaries, OR range repair, nonstacking chain, original bookstore, calculated discount, dominant discount, validation, overriding exceptions. |
| Math/formulas/random | 14 | Q5, pages 4/9; Lectures 9–10 | Return types, exp/log/log10, negative rounding, rint ties, original radical, broken grouping repair, subtraction outside contrast, power/root combinations, angle units, early-cast repair, negative/general random ranges. |
| Scanner/files | 11 | Q6, pages 5/10; Lecture 12 | Source/setup, read order, corrected guide output, writer retrieval, full Incrementer, per-value transform, aggregate average, file-based decision, leftover newline, multiword record. |
| String value/type/error | 16 | All six Q7 expressions; Lecture 11 | Original expressions, return types, empty substrings, bounds/type errors, char codes versus text, discarded return, reference reassignment, substring production, normalization, safe-index logic. |
| Mixed chapter review | 10 | Retrieval across the guide | Updated-state trace, new carry and conversion, chained text, sequential versus alternative rules, novel formula, priority fragment, full shop, named file report, validated random draw. |

**106 questions, including 11 full programs.** Code production recurs beside the relevant tools; number conversions and traces use written answers, not artificial Java boilerplate. Three complete programs conclude the mixed review. Early tasks isolate one distinction or supply broken code; later tasks give inputs and required behavior while leaving intermediate values and structure to the learner. Repeated original problem families have fresh IDs for this intentionally separate exam-preparation pass, alongside structurally different variations.

Each part has a short lesson, a concrete example, and its own reachable section check. All 106 questions appear once in this chapter: 96 in the eight checks and 10 in Chapter Review. There is no newly appended 106-question undivided worksheet. Parts can be opened directly without completing unrelated later Java chapters.

## Source correction: radical extent

An enlarged rendering of **page 4** shows the radical bar extending over the `-e` term:

`a = b + sqrt((c+3)/(2+d) - e)`

The October 11 integration misread it as outside the root. Correct the earlier Math lesson, `mid-math-formula` reference/fixtures, its regression test, and the earlier audit note. The new guide explicitly contrasts inside and outside formulas so the distinction is practiced. The answer key's radical grouping is correct; its malformed parentheses, stray `|`, and `close():` are not copied. The guide's Incrementer example still has a real typo: `3 10 3` increments to `4 11 4`.

Other visual-source corrections/clarifications: Lecture 9's `(int)(Math.random()*100)` yields 0–99, not an inclusive 100. Lecture 11's encoding slide mistakes are not reintroduced. Rounding includes the image-only `rint` row (nearest even tie, double result), unlike `round(double)` (long result).

## Grading and preservation

Use the existing question renderer, answer/hint behavior, Java editor, progress records, and added-chapter mapping. New IDs start with `study-guide-`; the new chapter ID is `midterm-study-guide`. All old chapter/question/mastery identities, earlier route order, account sync and persistence keys remain intact. The corrected older formula keeps its ID; no saved record is deleted or reset.

Writing uses the bounded classroom interpreter with varied values, whole-line input, virtual files and controlled random samples. Add only the four newly evidenced Math calls (`exp`, `log`, `log10`, `rint`), an optional declared-result-type check, and numeric-only formatting equivalence that preserves exact Invalid messages. No host execution of student Java is added. Result/type questions use plain result inputs; value text remains case-sensitive while type names and optional literal quotes are normalized.

Checks include every reference, alternative nested/combined/chain structures, variable renaming and arithmetic regrouping, wrong boundary/order/format cases, all menu choices, fractional temperatures, missing closes, third-value omissions, wrong destinations, discarded line input, String types/case/bounds, random rounding bias, early casts and hardcoding. The full test suite and existing continuity audit remain gates. `scripts/check-classroom-java.mjs --study-guide` independently compiles/runs trusted answer fixtures and traces, probes returned types with actual Java declarations, and verifies the intentional compilation-error questions. It never receives student submissions.

Verified: production build, 158 regression tests, continuity audit, and 299 independent compiled Java runs for guide fixtures/traces and the corrected older formula. In the production-build browser preview, the bottom chapter/shortcut and eight parts rendered correctly; a quoted String/type answer passed in the ordinary result field; the incorrect outside-root formula failed, then a regrouped two-statement inside-root solution passed and updated section progress. The dev preview had a framework error, so browser QA used the successfully served production build. Existing repository-wide TypeScript diagnostics remain in PDF worker, optional mastery, duplicate-property, and Cloudflare binding declarations; the added modules introduce none.

## Deliberate restraint

Do not expand later Java units, regenerate strong existing questions, reproduce every repeated slide in the lecture decks, invent missing live-demo source, or require geometric derivations. The guide's seven problem families lead the section; supporting lecture details reinforce those families. Earlier Math/text lessons remain available for deeper ordinary-course practice.

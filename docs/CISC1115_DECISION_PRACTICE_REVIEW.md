# CISC 1115 practice coverage review

## Scope and prerequisite boundary

This review covers the transition from Comparisons & Boolean Logic through Decision-Making Programs, plus an inventory of the remaining introductory Java chapters. At this point, students already have variables, arithmetic, output, and typed input. Boolean comparisons and `&&`, `||`, and `!` precede the conditional operator; `if`, `else if`, and nesting are introduced in that order. Loops, methods, arrays, String methods, and later algorithms are unavailable to the new Unit II questions.

## Existing strengths

- The comparison lesson has six writing tasks with varied input values, including equality, inequality, both strict directions, inclusive boundaries, and a computed budget comparison.
- Existing Boolean practice distinguishes `&&` from `||`, repairs an impossible range, traces grouping and precedence, and constructs a combined access expression.
- Existing `if/else` practice includes first-match tracing, a nested path, a braces repair, and validated grade and ticket decisions.
- Existing decision practice already exposes a gap after a failed branch, an unreachable high threshold caused by ordering, invalid-input handling, a menu, and a three-value maximum.
- Unit II mastery asks for input, combined conditions, shipping tiers, a menu, and a complete validated grade program. Those remain useful cumulative work.

## Weak spots and changes

The previous transition had few repeated requirements-to-code problems between a one-condition range and multi-rule programs. Some late editor prompts named the intended structure, while the harder cases had little room to choose among a combined condition, `else if`, or nesting. Twelve new questions fill those gaps at the subsection where each prerequisite becomes available:

| Subsection | Added reasoning |
| --- | --- |
| Logical OR and NOT | Construct the complement of an inclusive range. |
| Combining Conditions | Group a VIP exception under a ban prohibition. |
| Conditional Operator | Choose a String from a compound range condition. |
| `if / else` | Turn two requirements into two outcomes. |
| `else if` Chains | Distinguish below, inside, and above an inclusive range. |
| Nested Conditions | First construct outer and inner `else` outcomes with actual nesting; then distinguish failed boundaries from an in-range ban and classify a validated score with a submission rule. The later structures are the learner's choice. |
| Common Logic Mistakes | Repair a branch-priority bug involving overlapping cases. |
| Validate Before Classifying | Separate impossible hours from ordinary closed hours. |
| Range-Based Categories | Resolve validation, a fragile exception, and three overlapping size tiers. |
| Combined Eligibility Program | Independently design the complete VIP, ban, and level decision. |

The new problems use varied case checks at boundaries and across status combinations. The supported checker parses a bounded subset of Java and compares each solution's output over those cases. It permits equivalent branch structures, local variables, and final `print` or `println`. It is not a full Java compiler, so forms outside that subset may need tutor review.

## Nested-section correction

The original nested writing question printed only on the success path, leaving both failure branches unexplored. The screenshot's “Stop at the First Match” question was an `else if` trace that a fallback placer had put under Nested Conditions. It now appears under `else if` Chains, while the existing nested trace moves into Nested Conditions. The nested check progresses from tracing, to the original small construction, to a new three-outcome construction that requires an outer and inner `if/else`, then to two behavior-first problems. The new score/submission problem admits either a nested branch or a clear flattened chain, so the learner can decide which structure expresses the rules best. Existing question IDs and passed records remain intact.

## Grader reliability follow-up

The validated-grade question previously required one exact spelling of the invalid-range condition, rejecting the equivalent reversed OR order. Its grader now checks multiple boundary cases and the requested single chain. The ticket, maximum, Boolean range, and grouped-access questions also check varied values instead of relying on one source-text pattern. A valid equivalent condition or reordered Boolean operands can pass when it preserves the prompt's behavior.

A course-wide probe found that 149 of 174 larger Java production questions accepted their reference answer with invalid Java appended. The shared pattern-based graders now reject malformed syntax and ignore required text found only in comments. All 174 reference answers pass the new checks, while invalid appended Java and comment-only submissions fail. A second probe reversed one comparison in 76 reference answers without changing its meaning; all 76 now pass. This probe also exposed a literal newline inside the shown Java answer for the streamed-record challenge; the shown answer now contains the proper escaped newline.

The early inventory label, video-duration, check-in-card, and String-spacing graders also now test the actual required values and output. These checks cover the audited cases; they do not make every legacy pattern grader a full Java compiler or prove every possible equivalent program is accepted. Keep adding regression cases when a learner solution exposes a new valid form.

## Course-wide inventory and additional local practice

The opening Variables & Data Types chapter has 32 practice questions, including declaration and update writing, repairs, a requirements task, and an independent build. Operators & Expressions has 44, including prefix/postfix state traces, controlled variations, calculation repairs, four Java retrieval questions, and an independent build. The remaining introductory chapters already contain substantial cumulative practice: the loop chapters cover zero iterations, endpoint mistakes, update order, sentinels, and independent construction; methods cover arguments and calls; arrays and collections cover indexing, empty and single-element cases, traversal, mutation, and search; sorting covers partial passes and edge cases. Every programming chapter has subsection-level production and an independent build, with later unit mastery tests. The foundations and computing-context chapters are more conceptual, where forcing more Java writing would be artificial.

The later-chapter scan also found subsection checks that relied mostly on recognition before their chapter's independent build. Thirteen questions now sit at those points in ten later chapters. They ask the learner to find a stalled loop, trace a dependent nested range, build a reusable method, compose return values in both directions, filter an array before averaging, construct a search flag, count adjacent String pairs, observe a removal skip, distinguish early-return comparisons, write an ArrayList String search, trace one bubble pass, and keep streamed record fields together. Each targets a rule, boundary, state change, or transfer that the local section teaches.

The inventory did not justify blanket expansion. For loops, arrays without traversal, and several other chapters already have substantial local repair, trace, writing, and cumulative work. Strong existing questions and saved IDs were preserved. Future additions should target a demonstrated misconception or missing structural variation, then use the same continuity and validator checks.

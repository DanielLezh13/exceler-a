# College Algebra and Precalculus: authored scope and checks

Added 2026-08-30. These are full independently authored self-study sequences, not condensed review sheets, official credit-bearing offerings, or a reproduction of a professor's current section.

## Sources and boundary

- [MATH 1006 catalog](https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=1006&div=U&dsc=MATH.): real numbers, sets/intervals, absolute value, exponents/radicals, expressions/polynomials/factoring, rational expressions, basic/radical/quadratic equations, coordinate plane/lines, functions/relations, linear systems, and linear/quadratic graphs.
- [MATH 1011 catalog](https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=1011&div=U&dsc=MATH..&redirect=%2Facad%2Fcourse_info.jsp): functions including composition, polynomial/rational/exponential/logarithmic/trigonometric/inverse trigonometric functions, conics, binomial theorem, and introductory limit ideas.
- [Departmental MATH 1011 syllabus](https://static.brooklyn.edu/web/aca_naturalsciences_math/Math1011_Syllabus.pdf) is dated **December 2012** internally. Used only as a topic checklist (including complex numbers, polynomial division, nonlinear systems, all six trig graphs, identities, and laws of sines/cosines), not as a current schedule or grading policy.

All explanations, examples, practice, and assessments are original. Sources identify scope; no protected textbook exercise set or answer key was copied. Existing CISC 1115 lesson/question IDs, validators, tests, and progress semantics were not reauthored.

This initial authoring task stopped after Algebra and Precalculus. MATH 1201 was subsequently added in the one-time scheduled continuation; see [Calculus I authoring and verification](CALCULUS_COURSE_AUTHORING.md). CISC 2210 was added in a separate user-requested continuation; see [Discrete Structures authoring and verification](DISCRETE_COURSE_AUTHORING.md). CISC 3115 remains for a later task, with no stub course marked available. No DegreeWorks course status or earned credit is inferred from self-study completion.

## Sequence and coverage decisions

### MATH 1006 — 12 chapters, 24 lessons, 210 questions, 6 unit tests

| Unit | Chapters | Purpose and deliberate variations |
| --- | --- | --- |
| I | Real Numbers & Arithmetic; Expressions & Exponents | Signed addition vs subtraction; negative bases vs leading negatives; fraction addition vs division; percent bases; distribution across subtraction; expression construction from fixed/per-item costs. |
| II | Linear Equations & Modeling; Sets, Inequalities & Absolute Value | Unknowns on both sides; fractions; identity vs contradiction; reverse percentages; sign reversal; open/closed boundaries; interval intersection; distance inside vs outside; empty and single-point solution sets. |
| III | Polynomial Arithmetic; Factoring | Add vs subtract polynomials; cross terms; square vs difference of squares; common factors before special patterns; grouping; trinomial sign cases; repeated factors; integer-factorization failure. |
| IV | Rational Expressions & Equations; Radicals & Rational Exponents | Cancel factors, not terms; retain original restrictions; divisor nonzero; common denominators; extraneous candidates; principal vs both roots; sign of sqrt(x²); conjugates; rates and root-based applications. |
| V | Coordinates & Lines; Functions & Their Graphs | Signed/zero/undefined slopes; intercepts; constructing equations; parallel/perpendicular lines; function vs relation; domain vs range; duplicate outputs; boundary ownership of piecewise rules; model interpretation. |
| VI | Quadratic Equations & Graphs; Systems & Cumulative Modeling | Factoring, zero-product cases, completing square, formula; two/one/no real roots; checking radicals after quadratic solving; vertex/input vs maximum/output; substitution/elimination; dependent/inconsistent systems; tickets, mixtures, rate and area models. |

Quadratic radical equations are delayed until quadratic solving has been taught. Coordinate/line/function lessons come before interpreting parabolas. Algebra works in the real number system; complex roots are explicitly deferred to Precalculus. Linear formula rearrangement is taught without premature inverse-function terminology.

### MATH 1011 — 16 chapters, 31 lessons, 260 questions, 6 unit tests

| Unit | Chapters | Purpose and deliberate variations |
| --- | --- | --- |
| I | Functions, Graphs & Transformations; Combining Functions & Inverses | Input vs output transformations; coordinate mapping; root/denominator intersections; average rate vs endpoint value; even/odd/neither; multiplication vs composition; composition order; inverse restrictions and branches. |
| II | Complex Numbers & Quadratics; Polynomial Functions; Rational Graphs & Nonlinear Systems | Signed complex arithmetic and conjugates; quadratic complex pairs; root multiplicity; rational-root candidates vs confirmed roots; division/remainders; crossing vs touching; end behavior; holes vs asymptotes; rational sign charts; nonlinear intersections and feasible points. |
| III | Exponential Functions & Models; Logarithms; Exponential & Logarithmic Equations | Constant ratio vs difference; growth/decay; rates and time units; compounding/half-life; inverse exponent meaning; log input vs output signs; domain-preserving log laws; change of base; extraneous log roots; equations quadratic in exponentials. |
| IV | Angles & the Unit Circle; Trigonometry in Triangles; Graphs of Trigonometric Functions | Degrees/radians; coterminal angles; arc length/area; exact values and quadrant signs; reciprocals/undefined values; triangle ratios; laws of sines/cosines and SSA ambiguity; amplitude/period/phase/midline; all six trig graphs. |
| V | Trigonometric Identities; Inverse Trig & Trigonometric Equations | Identity vs particular equation; valid proof moves and retained restrictions; sum/difference/double/half angles; quadrant sign choices; inverse principal values vs all solutions; doubled-angle intervals; lost zero factors and endpoint inclusion. |
| VI | Conic Sections; The Binomial Theorem; Preparing for Calculus: Limit Ideas | Distance/midpoint; geometric definitions; circle/parabola focus/directrix; ellipse/hyperbola focus relationships; shifted forms; factorial/coefficient reasoning; selected terms and signs; nearby values vs point value; one-sided agreement; removable discontinuities; difference quotients. |

The SSA problem supplies candidate angles rather than requiring inverse trig before that lesson. Conics follow right-triangle geometry and its distance formula. Introductory limits explain approach, continuity, and algebraic difference quotients, without silently requiring differentiation rules or later calculus.

## Teaching and practice design

- Lessons have prose explanation, explicit rules, at least two worked examples, a misconception contrast, and nearby practice. Sections have 4–7 questions based on their content, not alternating multiple-choice/writing quotas. Chapter reviews contain three new mixed problems; unit assessments contain six or seven new problems and are separate from chapter progress.
- Most tasks require a typed result, set, interval, coefficient, coordinate, model, or expression. Choice questions are retained where they isolate a useful distinction (function vs relation, no solution vs identity, graph classification, proof validity, undefined trig values).
- Worked examples show reasoning. Revealing a solution does not mark an item passed. Editing a previously checked answer clears its verdict; checking reevaluates the actual new answer.
- Functional SVG plots support lines, functions, quadratics, transformations, polynomial/rational behavior, exponentials/logarithms, the unit circle, trig graphs, and an ellipse. Axes use equal coordinate scale and discontinuous curves are broken, not joined across asymptotes. Other geometric tasks specify their full equations or fixed facts and require no missing diagram.
- Explicit final fields make multi-part grading transparent. A learner can see which part disagrees and retain correct parts while revising. Answer entry asks only for final results, not typed scratch work. Existing saved working remains available in a collapsed disclosure and in tutor context; no saved work is discarded.

### Shared course presentation

Math section checks and chapter reviews reuse the CS course's practice-session, score circle, connected question route, choice cards, feedback/action row, and arrow pagination styles. Next Question goes to an unfinished problem; the numbered route and bottom arrows also allow reviewing any question. The final question keeps its worked solution visible with a completion banner instead of immediately hiding it.

The learner types the final answer. Brief field-specific notation examples cover fractions, expressions, sets, intervals, roots, and radians where relevant; there is no course-wide input tutorial above every exercise. These examples depend on field kinds and taught prerequisites, never on secret reference answers. Checking a practice answer reveals its worked solution below the unchanged answer. Showing a solution alone does not earn progress; editing clears the verdict and hides the solution. Active unit tests still withhold hints, solutions, and per-question checking until submission.

## Grading limits and integrity

Contextual input help describes relevant supported notation. This is a deterministic, bounded mathematical parser, **not a computer-algebra system or automatic proof verifier**.

- Numerical expressions support arithmetic, implicit multiplication, integer/fractional powers, pi/e, sqrt, abs, trig, inverse trig, ln/log, and exp. Inputs are parsed without eval/Function or arbitrary code execution. Normal numerical equality uses a small floating-point tolerance; the compounding problem explicitly permits cent rounding.
- Polynomial and rational-function expressions in x compare by coefficient arithmetic and cross multiplication, **not agreement at a handful of sample inputs**. Variable powers are bounded; functions of x inside radicals/trig are not symbolically simplified. Unsupported notation is reported as an interpretation limit rather than proof of an incorrect mathematical idea.
- When an expression task explicitly says factor or expand, form checks supplement equivalence. Factor order, sign regrouping, repeated factors, implicit multiplication, and alternate equivalent coefficients remain acceptable. Domain/exclusion fields are separate where that knowledge is assessed.
- Finite real solution sets compare independent of order/duplicates. Interval unions merge overlapping/touching intervals correctly, preserve open/closed boundaries, and exclude infinite endpoints from closed brackets.
- Previously saved working is retained but **not graded as a proof**; new exercises ask only for final answers and show worked steps in the solution. Identity lessons teach transformations and assess selected proof steps, values, and conceptual distinctions. A future proof/graph-construction exercise engine would require a separate scoped implementation. Do not describe current progress as certification of every written step.
- Graph reading/feature construction is assessed through typed coordinates, intervals, equations, and parameters; there is no freehand graph drawing editor.

## Integration and saved data

- Courses library: Algebra first, Precalculus second, original Java course retained.
- Direct entry routes: `/math1006`, `/math1011`. Course-specific page metadata; no misleading inherited Java social-preview image.
- Math records extend the existing private/public device-local progress object under `math`, isolated by course. No account/database migration. Browser storage is explicitly the existing device-local architecture, not a claim of cloud synchronization.
- Existing progress backups now include math. Old Java-only backup imports do not erase current math progress. Storage write failures show a warning instead of silently claiming the new work was saved.
- Whole-test submission stores a detached snapshot of questions, final fields, working, solutions, verdicts, and date. History is append-only in the UI. Retries carry unchanged results forward, preserve the original attempt, and save their active subset across reload. Historical snapshots remain readable if a later author changes the current question count/order.
- The tutor receives the correct course identity, current lesson/rules/examples/available concepts, exact fields/options/selection, work, grading status, and selected attempt. Active tests withhold reference answers from the tutor context. The existing approved tutor connection is retained; no new key, live paid call, or public tutor access was introduced.

## Verification

Run `npm run audit:math`, the math test files, all existing tests, the existing Java continuity audit, and the production build. Focused TypeScript checks use `--allowImportingTsExtensions` to match the existing strip-types testing pattern. The repository-wide TypeScript check still encounters pre-existing worker/environment typing and duplicate foundational key errors; do not claim a clean global typecheck.

The tests check all 470 reference answers, blanks/malformed input and wrong choices, independently supplied correct/incorrect examples from every major domain, equivalent expressions, factoring/expansion forms, interval infinities, extraneous roots, immutable attempts, retries after reload, question-context changes, all 95 math lesson/review/test locations, and server-rendered entry routes. Component event tests use the actual JSX and handlers with deterministic hooks; they are not browser visual QA.

Publishing is separate: the existing Sites destination is public and requires explicit approval. Local verification does not mean these changes have been deployed publicly.

# Calculus I — authored scope and verification

Added in the one-time August 30, 2026 evening run. MATH 1201 is an original full self-study course, not an official credit-bearing offering, a professor's section, or a review sheet. Discrete Structures and Modern Programming Techniques are not included in this run.

## Sources and limits

- [Brooklyn College MATH 1201 catalog](https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=1201&div=U&dsc=MATH.): limits, continuity, derivatives and integrals of algebraic/exponential/logarithmic/trigonometric functions, numerical approximation, and applications.
- [Departmental MATH 1201 syllabus](https://www.brooklyn.edu/wp-content/uploads/Math1201_Syllabus.pdf): limit laws, IVT, derivative definition and rules, implicit differentiation, related rates, extrema, MVT, graph shape, optimization, antiderivatives, Riemann sums, FTC, and substitution. Used as a topic checklist, not as a current semester schedule or permission to reproduce textbook exercises.

All prose, examples, practice, reviews, and unit tests are independently authored. No protected textbook exercise set was copied. Calculus II techniques (integration by parts, partial fractions, improper integrals, sequences/series) are intentionally not required. L'Hôpital's rule and Newton's method are not required by the linked topic checklist and are not silently introduced.

## Prerequisite and coverage map

Algebra and Precalculus supply functions, domain, factoring, rational/radical expressions, exponents/logs, radians, trig identities, inverse functions, and initial limit ideas. The audit checks that each declared prerequisite was taught by those earlier courses. Calculus topics are introduced before they recur in practice or later chapters.

| Unit | Chapters | Coverage and meaningful contrasts |
| --- | --- | --- |
| I | Change & the Meaning of a Limit; Limit Laws & Continuity | Average versus instantaneous change; nearby behavior versus actual point value; one-sided agreement; factoring, conjugates and combined fractions; unbounded versus finite limits; continuity, removable pieces and IVT existence without claiming uniqueness. |
| II | Derivatives from First Principles; Differentiation Rules | Difference quotient and tangent construction; continuity versus differentiability; corners; polynomial, negative/fractional powers; product and quotient contributions; nested chain rules; second derivatives and acceleration. |
| III | Trigonometric, Exponential & Logarithmic Derivatives; Implicit Relationships & Changing Quantities | Trig angle versus outer square; exponential versus power; logarithmic differentiation; inverse slope at corresponding points; implicit product terms; rates with signs, units and geometry; differentials versus exact changes. |
| IV | Extrema & the Mean Value Theorem; Graph Shape & Optimization | Critical candidates versus actual extrema; corners/endpoints and existence hypotheses; Rolle/MVT with failed-hypothesis contrasts; derivative sign charts; concavity versus increase; inflection sign changes; objective/constraint/domain modeling and verifying the optimum. |
| V | Antiderivatives & Motion; Riemann Sums & Definite Integrals | Families and initial constants; two integrations for acceleration; displacement versus distance; left/right/midpoint/trapezoidal estimates; interval width and units; limiting sums; signed area and linearity without prematurely relying on FTC. |
| VI | The Fundamental Theorem of Calculus; Substitution & Calculus Synthesis | Accumulation derivative versus derivative of the integrand; moving upper/lower bounds; FTC endpoint evaluation; average values; net change plus initial amount; reverse chain rule; missing constant factors; changed bounds; choosing rate versus accumulation versus optimization. |

There are **12 chapters, 28 lessons, 270 problems, and six distinct unit tests**. These comprise 192 nearby practice problems, 36 mixed review problems, and 42 assessment problems. Of the 270, 237 require at least one typed result. Recognition remains where it tests a useful theorem hypothesis or misconception rather than replacing mathematical production. Section counts vary from five to eight questions according to their concepts. Each lesson has substantial explanation, rules, at least two worked examples, a misconception contrast, and practice. Chapter reviews and tests reduce guidance and combine previously taught material.

The two new plots connect a parabola to its derivative and a cubic to turning points/concavity. Graph tasks otherwise give complete formulas and request coordinates, intervals, or classifications, not a missing diagram. No freehand graph or proof-grading capability is claimed.

## Shared presentation and persistence

- Uses the existing math course component and CS-like Section Check, connected numbered route, score circle, answer cards, next-question behavior and pager. No CSS redesign.
- Learners enter final answers, not new scratch work. Checked practice reveals worked steps below the unchanged answer; active tests withhold hints/solutions and per-question checking.
- Contextual notation help explains powers, parentheses, radicals, radians and inverse trig spelling. Indefinite-integral prompts explicitly request the nonconstant part with `+C` omitted; lessons and worked solutions still teach the full family. Initial-value tasks request a unique function.
- `/math1201`, the Courses library and the existing Degree Map lesson link use the registered course. Official DegreeWorks status and earned credits are not inferred or changed.
- The existing device-local progress architecture, immutable submitted snapshots, selected questions, retry drafts and tutor context are retained. Snapshot validation now recognizes the additive `function` answer kind. Old Algebra/Precalculus/Java content and progress are not migrated or rewritten.
- Tutor context includes current prompts, labeled choices, exact answers, feedback, reviewed solutions and selected historical attempts. References remain withheld during active tests. No live tutor call or separately billed API was used for verification.

## Grading contract and limitations

Existing numerical, polynomial/rational-expression, set, interval, factoring and expansion grading remains in place. Calculus adds bounded symbolic arithmetic for expressions containing function calls. Arithmetic distributes and collects terms, normalizes function arguments, cross-multiplies rational expressions, handles `e^x`/`exp(x)`, reciprocal trig, selected double-angle/Pythagorean identities, fractional powers, and positive-constant scaling of radicals. It does **not** assume `sqrt(x²)=x` across negative inputs.

Acceptance uses these symbolic transformations, not agreement at sampled inputs. Numerical probes can only disprove equality or leave an answer unconfirmed. The implementation is **not a general CAS, domain prover, automatic derivative generator, or proof grader**. General trig/log identities, arbitrary variable-base powers and some nested functional transformations may be unsupported. For example, `exp(x)^2` versus `exp(2*x)` is currently left unconfirmed rather than accepted from samples. The learner sees that this is not a confirmed mathematical error and can rewrite using displayed notation. A test score counts only confirmed answers; unsupported responses earn no automatic credit and remain retryable with their original answers preserved.

Expression comparison follows the prompt's stated domain. Separate set/interval fields assess restrictions where requested; this checker does not certify every removable domain difference between written expressions. Parsing is non-executing and bounded by input length, polynomial term/product size, exponent and nesting limits. Identically zero denominators after supported identity reductions are rejected.

## Verification

- `npm run audit:math`: declared continuity, question identity/coverage and every reference answer across all three math courses.
- `tests/calculus.test.mjs`: full-course shape, independently supplied alternatives and mistakes, sample-fitting rejection, mathematical reference checks by independent finite differences (test oracle only), integration constants, limits/geometry/optimization/integral results, detached snapshots and one-question retries across reload with tutor context.
- `tests/math-courses.test.mjs`: all 740 current math references, wrong/blank/malformed answers, old algebra/precalculus behavior, chapter completion independent of unit test, snapshot preservation and storage integration.
- `tests/math-ui.test.mjs`: the actual shared component's navigation, typing/check/edit handlers, choice labels and keyboard behavior, worked solutions, every course location, history/retries, and server-rendered course entry pages. These are deterministic component/SSR checks, not a browser visual audit.
- Full existing test suite, Java continuity audit, production build, focused TypeScript/ESLint checks and `git diff --check`.

The build may retain its existing large-chunk and route-classification notices. A focused typecheck is not a claim that all unrelated repository-wide typing issues are fixed. The course and checks remain local; no publishing, push, billing changes or credit purchases are part of this task.

Final run results: **64/64 tests passed**, all **740 math reference answers** passed the continuity/reference audit, the Java audit passed, the production build completed, and focused TypeScript/ESLint and diff whitespace checks passed. SHA-256 comparisons confirmed that `math1006.ts`, `math1011.ts`, `cisc1115Course.ts`, and `globals.css` were unchanged from the start of this scheduled run. The one-time schedule is removed after completion; no additional courses are queued by this work.

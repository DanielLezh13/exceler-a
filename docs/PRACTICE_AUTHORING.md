# Exceler A Course Content and Practice Authoring Guide

These instructions govern curriculum, lessons, exercises, section checks, chapter reviews, unit mastery tests, and assessments in this repository. The goal is not merely to expose the learner to CISC 1115 topics. The goal is a structured path toward mastery through explanation, problem solving, controlled variation, repetition, retrieval, cumulative application, and immediate feedback.

The intended standard is closer to a carefully authored mathematics textbook and workbook than to a lightweight quiz application.

## 1. Curriculum continuity is mandatory

Navigation follows `Unit.Chapter.Section`, such as `I.3.4`.

Before adding, editing, moving, or regenerating any lesson or question, determine exactly what knowledge is available at that point. A question may rely only on:

1. Material introduced earlier in the current section.
2. Material introduced in earlier sections of the current chapter.
3. Material introduced in previous chapters.

Never require future knowledge. This includes Java syntax, operators, methods, classes, terminology, language behavior, evaluation rules, library features, programming patterns, debugging concepts, and algorithmic concepts.

Do not introduce future material incidentally merely because it is not the primary subject of the question. Hard questions must be hard because taught concepts interact—not because unexplained concepts appear.

Distinguish carefully between:

- **Untaught knowledge:** a rule, feature, term, or behavior the learner has not been given. This is not allowed.
- **A new application of taught knowledge:** a combination or context not previously demonstrated whose underlying rules are all available. This is desirable transfer.

If a worthwhile question exposes important behavior that cannot reasonably be derived from prior instruction, improve the lesson before the question. Do not automatically delete every challenging question simply because its exact form was not demonstrated.

## 2. Mastery, not exposure

Do not consider a concept sufficiently practiced merely because it appeared in a lesson, received one question, had its definition recognized, or has nominal exercise coverage.

The learner should gradually move through:

`understand slowly → apply directly → recognize variations → handle misconceptions → combine rules → retrieve without prompting → execute familiar mechanics automatically`

A cleared chapter should provide meaningful evidence of mastery at the current CISC 1115 level.

## 3. Model practice after strong mathematics workbooks

Strong mathematics exercise sets often contain superficially similar problems that systematically vary meaningful properties: signs, ordering, grouping, boundary conditions, special cases, prior rules, and interactions. This maps the problem space.

Apply the same philosophy to programming. Do not interpret variety primarily as switching among multiple choice, fill-in-the-blank, debugging, and coding. Format variety is secondary. The most valuable variation occurs inside the code, state, data, conditions, order, or interaction of rules.

## 4. Audit the concept before authoring

Before substantially changing practice, identify:

- Learning objectives and prerequisite knowledge.
- Core rules and sub-rules.
- Important distinctions and execution models.
- Likely beginner misconceptions.
- Meaningful structural variations and edge cases.
- Earlier concepts that should recur.
- Useful synthesis opportunities.
- Knowledge that is not yet available.

Use this as a coverage map. Do not merely ask an LLM to generate an arbitrary number of questions about a topic.

## 5. Systematic structural variation

For each substantial concept, consider:

- Canonical cases and simple variations.
- Ordering, value, type, and state changes.
- Similar-looking code with different behavior.
- Common syntax mistakes and misconceptions.
- Important boundaries and edge cases.
- Evaluation order and precedence.
- State mutation.
- Interaction with earlier concepts.
- Tracing, debugging, modification, and construction.
- Cumulative applications.

Deliberately sample useful dimensions. Do not randomly mutate numbers merely to manufacture more exercises. Every variation should strengthen automaticity, reveal a distinction, target a misconception, increase independence, or combine learned concepts.

## 6. Use controlled problem families

Closely related problems are desirable when each change reveals something. For prefix and postfix increment, a family might progress from standalone use, to assignment, to contribution inside an expression, to multiple mutations, and finally to interaction with evaluation order and precedence.

Early in a family, change one important thing at a time. Near-identical contrasts are especially valuable:

```java
System.out.println(2 + 3 + " points");
System.out.println("Points: " + 2 + 3);
System.out.println("Points: " + (2 + 3));
```

Once isolated distinctions are understood, combine them. Do not turn practice into intentionally unreadable Java puzzle trivia. A difficult variation should illuminate a useful consequence of taught rules.

## 7. Progression must occur inside the reasoning

Labels such as Warm-up, Apply, and Challenge do not create progression by themselves. The reasoning must become more demanding.

A substantial concept may move through:

1. Canonical use.
2. Simple application.
3. Controlled variation.
4. Contrast with a similar case.
5. Misconception or trap.
6. Interaction with earlier material.
7. Multiple-rule interaction.
8. Tracing or debugging.
9. Independent construction.
10. Cumulative synthesis.

This is not a mandatory ten-question template. Use judgment based on the concept.

## 8. Question count follows the concept

Never force every section to contain the same number of questions or optimize for the smallest possible set.

- A small concept may need roughly 3–4 questions.
- A normal concept may need roughly 6–10 questions.
- A major concept may need 10–20 or more questions, multiple problem families, or substantial cumulative practice.

Loops, conditionals, methods, arrays, algorithm tracing, and other major topics need enough practice to explore meaningful internal variation. Repetition is allowed and often desirable, but do not create filler.

## 9. Automaticity through meaningful use

Practice should make foundational mechanics increasingly cheap cognitively. Repeatedly constructing input programs should turn `Scanner input = new Scanner(System.in);` into a familiar chunk. Repeatedly traversing arrays should make a standard loop structure familiar.

Do not rely primarily on flashcard memorization. Build memory through meaningful repeated use.

## 10. Spiral earlier knowledge forward

Previously learned material must continue appearing naturally. Do not teach a concept, test it once, and make it disappear.

- Input problems can reuse variables, arithmetic, precedence, modulus, compound assignment, and concatenation.
- Conditional problems can reuse arithmetic, booleans, comparisons, and state updates.
- Loop problems can reuse conditions, comparisons, increments, input, arithmetic, and stored state.
- Array problems can reuse loops, conditions, indexes, and arithmetic.
- Algorithm problems can combine arrays, loops, conditions, methods, and tracing.

Earlier concepts should gradually become machinery used to solve later problems.

## 11. Concrete Java before abstract recall

Avoid excessive definition questions, especially immediately after displaying the definition. Terminology checks can be useful, but they should not be the primary evidence of programming understanding.

Whenever possible, associate terminology with actual Java behavior. Instead of only asking what `nextInt()` means, show a declaration, specify input, ask what happens, and then vary the type, method, or input.

When introducing abstract labels such as input, store, calculate, and output, ground them in a real program and identify the actual statements. Clarify that one statement may perform multiple conceptual jobs—for example, `int total = price * quantity;` both calculates and stores.

## 12. Teach and test the mental model

Rules with meaningful execution models must eventually be tested at that deeper level. For example, prefix/postfix practice should reveal the value contributed to an expression, the mutation of stored state, what later expressions observe, and the fact that earlier contributed values are not retroactively changed.

Author problems that distinguish a working mental model from a memorized slogan.

## 13. Deliberately combine taught rules

After individual mechanics are established, make them interact: arithmetic, precedence, integer division, modulus, assignment, compound assignment, increment, concatenation, input, comparisons, booleans, conditions, loops, methods, and arrays.

A learner can understand two rules separately and still misunderstand their interaction. Practice should expose that gap.

## 14. Difficulty must come from knowledge

Do not create difficulty with ambiguous instructions, excessive prose, irrelevant information, confusing names, unreadable formatting, or obscure trivia.

Create difficulty with relevant state, interacting rules, evaluation order, subtle structural differences, reduced scaffolding, debugging, choosing the proper construct, multi-step tracing, and independent construction.

Questions should remain clean even when the reasoning is difficult.

## 15. Target misconceptions

Identify likely beginner misconceptions and create problems that distinguish them from correct understanding. Examples include:

- Assuming postfix immediately contributes the incremented value.
- Treating prefix and postfix as always identical.
- Ignoring precedence.
- Assuming every `+` performs arithmetic.
- Confusing integer and decimal division.
- Confusing assignment and comparison.
- Treating `next()` and `nextLine()` as interchangeable.
- Forgetting the leftover newline after numeric Scanner input.
- Misunderstanding when loop conditions are checked.

Do not merely warn about every misconception in advance. Use practice to reveal whether it exists.

## 16. Choose question modes for learning value

Useful modes include exact-output prediction, variable-state tracing, execution order, compile/runtime classification, debugging, snippet comparison, missing syntax, modification, short fragments, complete programs, explanations of near-identical behavior, and cumulative challenges.

Choose the mode that best exposes understanding. Do not add formats merely for visual variety.

## 17. Recognition is not production

Recognizing or tracing correct code is weaker evidence than producing it. The course must train both directions:

- **Code → behavior:** read, trace, predict, and debug.
- **Behavior or requirements → code:** retrieve and construct an implementation.

Seeing code supplies retrieval cues. Do not treat understanding code while looking at it as equivalent to being able to produce it from an empty editor.

### Apply this throughout the course, not only at the final build

Whenever a concept can meaningfully be practiced by writing Java, include enough production to develop recall as well as recognition. Basic content is not a reason to restrict practice to clicking choices. A simple declaration, update, method call, or comparison is worth retrieving and typing when that is the skill being learned.

Judge the actual learner sequence section by section, including exercises assigned by fallback placement. Ask what the learner must produce unaided, whether they have practiced that near its introduction, and whether later exercises reuse it with less scaffolding. A writing task buried in a later chapter review does not necessarily meet the immediate need.

- For executable skills, use short requirements or concrete situations that make the learner select and write the relevant code. Move from a statement to connected statements to an independent program when the knowledge supports it.
- Use tracing and contrast when the target is execution order, state, boundaries, or a misconception. Add repair or construction when doing so exercises a distinct skill; do not simply transcribe the trace.
- Retain recognition or explanation for terminology, hardware roles, historical context, and other conceptual material where a coding task would be artificial.
- Do not add one coding question after every multiple-choice question as a course-wide formula. Do not require full program boilerplate for every small task. Quantity and placement follow the concept's demands.
- Preserve strong existing questions and saved question IDs. Prefer filling a real gap or making an existing exercise available at the right point over duplicating an already adequate family.
- Match graders to the visible contract. Test reference answers, plausible equivalent implementations, boundary mistakes, and answers that hard-code an example without solving the requirement.

Record the reasons for additions and deliberate non-additions in a coverage review. A minimum count or a label such as “Independent build” is not evidence that the resulting practice is pedagogically sufficient.

## 18. Progressive code production

Within substantial sections and chapters, writing problems should progressively remove implementation hints:

1. Complete or repair a provided line.
2. Write several lines when names and types are provided.
3. Write a fragment from behavioral requirements without naming every method or operator.
4. Write a complete small program from behavioral requirements.
5. Solve a novel problem from a blank editor, deciding the variables, types, input methods, calculations, and output structure.

Do not mechanically include all five levels in every section. Use them where appropriate, while ensuring cumulative work reaches genuine independent construction.

As mastery grows, avoid unnecessarily supplying:

- Exact variable names.
- Types that should be inferred.
- The Scanner method to call.
- The arithmetic or compound operator to use.
- The exact sequence of statements.
- The name of the previously learned concept that solves the problem.

Give enough behavioral requirements to make the task objectively gradable, but let the learner choose the implementation from taught material.

The intended production progression is:

`SEE IT → TRACE IT → MODIFY IT → COMPLETE IT → BUILD PART OF IT → BUILD FROM REQUIREMENTS → COMBINE LEARNED CONCEPTS`

### Scenario-first modeling

Once the mechanics needed for a task have been taught, a production problem should normally describe a small situation, its fixed facts or input contract, and the results the program must produce. Deciding how to represent the situation is part of the problem.

Do not turn a Java recipe into a story by renaming `x` to `playerCredits`. In later production practice, avoid prompts such as:

`Store X → multiply by Y → add Z → use remainder → print`

That sequence has already performed the decomposition for the learner. Prefer:

`A player has a fixed number of tickets, buys a stated number of one item, then spends as much of the remainder as possible on another item. Report how many of the second item can be bought and how many tickets remain.`

The learner should have to determine the useful variables, intermediate state, operations, and order. Scenarios must remain short, concrete, and unambiguous. Use fixed meaningful values when the values are part of the problem; do not ask the learner to invent arbitrary example values unless generating test data is itself the skill.

Context must change the reasoning structure, not merely decorate it. A good scenario creates a genuine modeling choice or multi-step relationship while using only taught knowledge. Difficulty still comes from the programming, not from decoding prose.

Explicit implementation directions remain appropriate when the current purpose is to practice a newly introduced syntax form, a required method signature, a particular loop family, or a specific algorithm. Reduce those directions as soon as that structure is no longer the new skill.

Do not turn all ordinary practice into blank-editor coding. Tracing, prediction, debugging, controlled variation, misconception-targeted questions, and scaffolded construction remain valuable because they isolate individual skills.

## 19. Unit mastery and programming tests

Add a meaningful Unit Mastery Test or Programming Test at the end of each major unit. It must be distinct from section checks and chapter reviews.

Its central question is: **Can the learner produce programs using this unit's knowledge when the code is no longer sitting in front of them?**

Unit mastery tests should:

- Emphasize code production.
- Begin from blank or minimally scaffolded editors when supported.
- Integrate concepts across the unit and naturally reuse earlier material.
- Use novel problems rather than copies of lessons or practice.
- Progressively reduce guidance.
- Require the learner to decide which learned tools apply.
- Remain strictly within curriculum continuity and the current CISC 1115 level.
- Avoid future syntax and obscure Java trivia.
- Include enough problems to expose weak retrieval—not one token final coding question.
- Still include selected tracing, debugging, or reasoning where they provide distinct evidence.

For Unit I, the mastery test must cumulatively exercise material actually taught in:

1. Variables & Data Types.
2. Operators & Expressions.
3. Input & Basic Programs.

A learner who passes Unit I should be able to receive a simple behavioral specification and independently construct a small Java program using the Unit I toolkit.

## 20. Do not overteach before the problem

Lessons must provide enough knowledge to solve the exercises, but should not demonstrate every exact variation. Teach the rules and mental model, then let practice explore their consequences.

A combination may be new in form if every underlying requirement is already taught. That is transfer, not a continuity violation.

## 21. Section checks, chapter reviews, and tests have different jobs

- **Section checks:** establish and vary the current concept while reusing appropriate earlier knowledge.
- **Chapter reviews:** integrate the chapter, reduce prompting, and require the learner to recognize applicable concepts.
- **Unit mastery tests:** emphasize retrieval and independent construction across the full unit.
- **Assessments:** use unseen but structurally related values, contexts, and combinations rather than copied practice answers.

## 22. Slight overtraining is desirable

Practice may extend somewhat beyond the easiest likely classroom question when that strengthens a taught concept. The goal is for normal test problems to feel comfortable after mastery work.

Productive overtraining uses slightly tricky interactions among taught rules. Unproductive overtraining creates monstrous expressions or obscure language puzzles. Build robustness, not Java trivia expertise.

## 23. Preserve local conquerability

Programming is unbounded; a chapter should not feel unbounded. At the end of a chapter, the learner should reasonably feel that the important forms and interactions at the current level have been mapped.

Do not teach every advanced consequence immediately. Master the appropriate layer, then progress. Comprehensive practice does not mean exhausting every possible permutation. Stop when additional questions provide little educational value; later chapters will spiral the skill forward.

## 24. Preserve strong existing questions

Do not regenerate everything automatically. Inspect first. Keep questions that already satisfy these principles, improve or replace weak questions, expand missing problem families, remove low-value redundancy, and preserve particularly effective reasoning problems.

Do not make ordinary practice worse while adding retrieval practice.

## 25. Prompt and validator integrity

The visible prompt is the contract. A validator must not secretly require an implementation detail that the prompt leaves open.

- Keep each question self-contained. If its wording refers to “this declaration,” “this line,” “the code shown,” an earlier example, expected output, a table, or a diagram, render that referenced material inside the question. Never make the learner search the lesson or infer what missing example the author intended.
- If a prompt specifies exact names, types, statements, or output, validate them clearly.
- If a prompt gives behavioral requirements, accept valid equivalent implementations using taught material.
- Do not reject valid Java because of harmless whitespace, formatting, or semantically equivalent structure unless exact formatting is explicitly the skill being tested.
- Treat a trailing newline after the program's final output as irrelevant unless the prompt explicitly requires it. Accept either `print` or `println` for a one-time final output, while still requiring line breaks when they separate multiple outputs, produce loop rows, or otherwise affect the visible result.
- Do not accept hard-coded output when the task requires calculation or input.
- Keep hints, shown answers, success text, and validator behavior consistent with the prompt.
- Test validators against the canonical solution, plausible equivalent solutions, common incorrect answers, spacing variations, and the exact misconception being targeted.

When a learner's correct solution is rejected, treat it as a product defect—not a learner failure.

## 26. Audit after authoring

Before considering a section complete, verify:

- **Coverage:** meaningful dimensions are represented.
- **Progression:** reasoning and independence truly increase.
- **Continuity:** every requirement is available at that point.
- **Variation:** related questions differ meaningfully.
- **Misconceptions:** important beginner errors are tested.
- **Transfer:** rules appear in unfamiliar but derivable combinations.
- **Automaticity:** foundational skills recur sufficiently.
- **Production:** the learner eventually writes or modifies code.
- **Retrieval:** cumulative work removes visual implementation cues.
- **Clarity:** difficulty comes from knowledge, not wording.
- **Validator integrity:** valid solutions pass and incorrect shortcuts fail.
- **Restraint:** the set stops before pointless permutation or trivia.

Then run the continuity audit and relevant tests.

## 27. Course-wide standard

The intended experience is:

`LESSON → BASIC PRACTICE → CONTROLLED VARIATION → MISCONCEPTION/EDGE PRACTICE → MIXED PRACTICE → INDEPENDENT APPLICATION → SPIRAL REVIEW → UNIT MASTERY`

Familiar mechanics should become automatic so active reasoning can focus on the newest layer of difficulty.

Before declaring practice complete, ask:

> If a learner completes this sequence, have they encountered enough meaningful variations, interactions, misconceptions, retrieval demands, and applications for the concept to feel mapped and masterable at the current CISC 1115 level?

If not, the practice is incomplete. If only arbitrary permutations or obscure trivia remain, stop.

## 28. Preserve product architecture and scope

These are educational-content rules, not permission for unrelated changes. During curriculum work:

- Preserve navigation and visual design.
- Preserve the lesson renderer and practice engine unless explicitly asked otherwise.
- Preserve progress semantics and existing learner data.
- Preserve unrelated chapters and user changes.
- Avoid broad refactors and unrelated redesigns.

If an ideal exercise cannot be represented by the current engine, report the limitation or make only the smallest authorized engine change needed. Do not silently redesign unrelated architecture.

## 29. Default behavior for future Codex tasks

Automatically apply this guide whenever a task asks to add, improve, move, audit, or generate curriculum, lessons, questions, section checks, chapter reviews, unit mastery tests, or assessments.

The user's explicit current request takes precedence when it conflicts with this guide. Otherwise, treat this document as Exceler A's persistent educational specification.

# CISC 1115 classroom material integration

## Sources and coverage decision

Reviewed `Quiz 1 Study Guide.pdf`, `Quiz 2 Study Guide.pdf`, `HW1.pdf`, `HW3.pdf`, and the lecture material in `/Users/daniel/Documents/School/CISC 1115/Class Materials`. The course already covered Java operators, casts, Boolean logic, and decisions; it lacked positional number conversion. Existing decision and range practice was retained. New questions use different values and settings from the class documents so the learner must transfer the rule.

| Classroom skill | Placement | Reason |
| --- | --- | --- |
| Binary and hexadecimal conversion, binary addition | New six-section Number Systems chapter after Operators & Expressions | This is a genuine missing prerequisite for Quiz 2, and its 14 questions vary positions, carries, directions, and bases. |
| Prefix/postfix, compound assignment, cast/type trace | Operators & Expressions section check | Builds on existing teaching without repeating its questions. |
| Full small program with Scanner and a decimal average | Input & Basic Programs section check | Requires a complete source file and catches integer division. |
| Boolean traces with arithmetic, equality, and negation | Comparisons & Boolean Logic section check | Tests interaction of known rules using new values. |
| Larger value, negative case, fine bands, overlapping weather-like rules | Decision-Making Programs section checks | Moves from a complete two-number program to band boundaries and a complete rule-priority program. |

The Number Systems chapter ends with a mixed conversion challenge. The existing Unit I Mastery Test questions and saved assessment IDs remain unchanged: inserting a new required question into a previously completed test would retroactively mark that test incomplete. This is a deliberate preservation choice; the new chapter is required in the merged route and keeps its own saved question IDs. Existing 24 core chapter progress is displayed separately from the four added syllabus chapters.

## Validator boundaries

Conversion answers accept case and harmless base prefixes/leading zeros while checking numeric value. The complete-program checker parses a single Java class, main method, Scanner reads, and the taught loop-free statement subset, then checks several input cases. It accepts different local names, casts, separate declarations, `print` or `println` where output is equivalent, and alternative branch structures supported by the taught subset. It rejects hard-coded sample output and wrong boundaries. This bounded checker does not claim to compile arbitrary Java or support untaught helper methods.

## Review of non-additions

The study guides also contain compiler/command-line recall and copies of worked answers. The course already teaches basic compile/run concepts; copying those prompts would add little. HW3's weather and speed scenarios were changed into an event advisor and a different fine schedule to retain the underlying decision skill without making memorized study-guide answers sufficient.

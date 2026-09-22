# CISC 3310 and CISC 3305 coverage and practice decisions

These are independent self-study tracks. The degree map continues to count Architecture / Organization as one alternative requirement. 3305's official assembly prerequisite is not marked completed or replaced by this track; a local teaching-ISA bridge makes exercises self-contained. No professor-specific ISA or exam alignment is claimed.

## Common foundation

Both tracks teach gates/Boolean construction, combinational design, clocked state, radix/width, signed arithmetic, and floating-point/error representation. Shared foundation builders reuse the same instruction and exercises with distinct course/question identities, so progress does not leak between tracks. This overlap is intentional because the courses are alternative routes, not a compulsory sequence. Advanced units have separate course-specific problems.

Practice contrasts carry with overflow, sign with zero extension, combinational with clocked updates, stored bit patterns with their interpretation, and addresses with stored values. Boolean answers are compared over all truth assignments; binary answers retain width; numerical answers accept equivalent arithmetic. Circuit production uses Boolean expressions instead of a new diagram editor.

## 3310 direction

Instruction execution, assembly data flow, branches/loops, arrays/subroutines, datapath/timing, cache/addressing, memory/I/O, and performance connect software to hardware. Assembly goes from short fragments to unseen behavioral tasks. A bounded teaching machine executes all supplied test cases and accepts alternative instruction sequences. It is explicitly not MIPS, x86, ARM, or a native assembler. Later OS/C++ tracks remain separate work.

## 3305 direction

Register transfers and bus conflicts, control sequencing, storage chips/address decoding, interrupts/DMA/arbitration, reliability, protection/context switching, shared-memory races and atomicity, and real-time constraints emphasize organization. Practice uses numeric state traces, logic construction, control decisions, and assembly where operational behavior benefits from it. Hardware terminology is tested sparingly; forcing Java into chip counts or bus timing would obscure the skill. Detailed cache-coherence protocols are not taught here.

## Assessment policy

Section exercises establish rules and contrast boundaries; chapter reviews combine them; six independent tests per track use new values and situations. Practice counts follow problem families. Build-style circuit and assembly tasks are included where executable or exhaustive checking is meaningful. Numerical hardware design tasks specify units, addressability, word widths, timing assumptions, initial cache state, and replacement policy. Passing bounded assembly test cases is evidence for those cases, not a proof for unbounded input.

## Verification

Check every authored reference through the real grading engine; independently check Boolean truth tables, bit arithmetic, cache traces, numerical models and machine execution. Test equivalent and incorrect programs, nontermination limits, save/reload/retry, course registration and routes. Preserve existing course definitions and learner records.

### Verified batch result

- CISC 3310: 12 chapters/lessons, 207 practice/review/test questions, 6 unit tests.
- CISC 3305: 12 chapters/lessons, 203 practice/review/test questions, 6 unit tests.
- Production build and all 104 automated tests pass, including seven new hardware/assembly integration tests.
- Both continuity audits and targeted changed-file ESLint pass; `git diff --check` is clean. Both local routes return HTTP 200.
- Component-level tests exercise the actual assembly textarea, checking, feedback, saved responses and code solution line breaks. No browser visual QA was requested or performed.
- Standalone TypeScript checking is not clean: the repository's existing `.ts` import configuration and unrelated CommandCenter/Cloudflare type errors remain. With `--allowImportingTsExtensions`, diagnostics are limited to those unrelated files; no new hardware-course type errors were reported.
- Local changes only. Existing unrelated edits are preserved. No commit, push, deployment, degree-completion change, or scheduled task was created. CISC 3320 and CISC 3142 are not included in this batch.

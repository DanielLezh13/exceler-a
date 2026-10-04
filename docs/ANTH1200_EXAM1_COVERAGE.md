# ANTH 1200 · Exam 1 coverage review

## Scope and source audit

The primary scope is `full_study_guide_exam1.docx` supplied for this task. Its 65 distinct prompts include the unnumbered DNA/RNA comparison, homologous chromosomes, and sister chromatids. The skipped 13 and duplicate 60 labels are source numbering; each substantive prompt is accounted for independently in `anth1200GuideCoverage` in `app/data/anth1200.ts`.

Lectures inspected: Introduction; History of Evolutionary Thought; DNA and Chromosomes; Chromosomes and Cell Division; Forces of Evolution. `05 - Mendelian Genetics and Inheritance.pptx`, found alongside the supplied files, supplies the guide's inheritance/Punnett-square topic. Duplicate copies of Introduction, History, and Cell Division contain the same extracted text and do not create additional requirements. The syllabus provides course context and the predominantly multiple-choice/fill-in-the-blank format.

The guide—not the syllabus's calendar—is the current content boundary. Exam dates can change; this addition does not infer an upcoming date. It is a study resource for the supplied Exam 1 scope.

### Included and excluded

| Guide group | Lesson placement | Meaningful variations and retrieval |
| --- | --- | --- |
| Evolutionary thought | Chapter 1: history, selection, fitness | Acquired vs inherited change; name ↔ explanation; requirements for selection; reproductive fitness vs strength; environment-dependent adaptation |
| DNA → protein | Chapter 2: structures, copying, expression | DNA/RNA sugars/bases/strand count; all nucleotide components; complementary DNA vs template-derived mRNA; replication/transcription/translation products, locations, and purposes; codons and tRNA roles |
| Cell division | Chapter 3: chromosomes, division, shuffling | Homologs vs sisters; somatic/gamete and haploid/diploid context; mitosis/meiosis counts, purpose, and similarity; first/second division distinction; segment exchange vs whole-chromosome assortment |
| Mendelian inheritance | Chapter 4: alleles, dominance, crosses | Gene vs allele; genotype vs phenotype; AA/Aa/aa; recessive expression; dominant is not common/beneficial; Aa×Aa, Aa×aa, AA×aa, AA×Aa, aa×aa; genotype vs phenotype probabilities; probabilities vs guaranteed births |
| Variation | Chapters 1, 3, and 5 | Heritable differences and fitness; reshuffling vs new alleles; crossing-over timing; variation reused in evolutionary explanations |
| Forces | Chapter 5 | Creation vs transfer vs chance vs fitness; paired scenarios with trait-dependent/independent survival; small populations; founder/bottleneck; real-world types of drift/flow examples; sequences involving several mechanisms |
| Speciation and final review | Chapter 6 and final mixed test | Allopatric vs sympatric; isolation vs completed species formation; molecular/cellular/population levels; individuals change while populations evolve |

The introduction's anthropological context explains why this biology is in Human Origins; it does not add required recall of every anthropology subfield. Other historical thinkers, dates, taxonomy, a complete codon table, every division phase, nondisjunction syndromes, polygenic/codominant/dihybrid crosses, and later primate/fossil-human material are not required practice. `Ch5.pptx` was discovered but not used to expand this exam course.

Speciation, sympatric, and allopatric are explicitly in the guide but not explained in the supplied forces slides. Only those named concepts and their necessary reproductive-isolation context are supplemented using OpenStax Biology 2e §18.2. NHGRI's glossary was consulted to check genetic-process terminology. These references are visible in the course footer.

### Source inconsistencies handled

- One RNA sequence in the DNA slides uses T; all authored RNA answers consistently use U.
- A translation summary says two codons at a time while the detailed steps correctly explain triplets of bases. Required practice tests three bases per codon, not that inconsistent shorthand.
- The cell-division slides say crossing over occurs in “phase I”; lessons give the standard specific timing, prophase I. Independent assortment is distinguished at metaphase I/distribution in meiosis I.
- The forces activity mentions five forces, while the guide and lecture list four population mechanisms. The course teaches those four and separately explains meiotic reshuffling as a source of combinations.
- Randomness is stated precisely: mutation relative to usefulness, drift as chance sampling, selection relative to inherited fitness differences. Migration is not forced into a misleading universal random/non-random binary.
- Mitosis comparisons specify the typical diploid starting cell and no new mutation; human counts are described as typical. Meiosis's standard four products are distinguished from four functional eggs.

## Practice design

Six chapters, 17 sections, 289 questions: 163 section questions, 48 chapter-review questions, and 78 test questions (12 evolutionary-thought questions, 20 genetics questions, and a 46-question cumulative Exam 1 mixed test). Questions can have multiple answer parts. Of the questions, 153 include typed factual recall, 114 include multiple-choice responses, and 23 are purely numerical probabilities/counts. One question combines typed and multiple-choice parts, so those mode counts overlap.

Each section includes original explanation, two concrete worked examples, a misconception contrast, and 8–12 questions. Both recognition and typed recall occur near introduction. Chapter reviews reduce topic cues. Later applications return to earlier fitness, inheritance, and variation. Crosses and evolutionary scenarios vary the causal structure, not just nouns. Final practice mixes all six guide groups. It is not a copy of an actual exam and does not claim a predicted grade.

The optional explanation box invites a definition, example, and comparison in the student's own words; it saves notes for contextual tutoring. These notes are not automatically graded. Editing notes alone preserves a previously passed factual answer. Automated free-form essay grading is deliberately not introduced.

## Validator and continuity verification

- Every guide coverage ID resolves to a reachable question.
- Every section is ordered after its declared prerequisites; the shared continuity audit checks the new course alongside existing courses.
- Every reference response passes; blank/unrelated responses and incorrect options fail.
- Text grading uses explicit aliases and bounded normalization, not substring/fuzzy acceptance. It accepts capitalization, whitespace, final punctuation, conventional terms, and prophase 1/I variants. Genotype case is retained where A and a differ. Fractions, decimals, and percentages use the existing numerical checker.
- Saved test snapshots retain text fields/aliases/case requirements. Tests cover full submission, reload, immutable old attempts, and a one-question retry.
- Existing course IDs and question definitions are unchanged. The new `anth1200` record uses the existing progress namespace and account-sync mechanism; no database migration, reset, or personal-data import is required.
- Tutor context supplies the actual question, selected choices/typed answers, notes, current lesson, and concepts available at that point. Hidden test reference solutions remain withheld until submission.
- Long section-check question routes retain the existing horizontal scrolling style and bring the selected bubble into view when Next/Previous changes the question.

The shared authoring guide's Java construction requirements apply to executable programming skills; artificial Java-writing questions are deliberately not added to anthropology. Here, production means retrieving a factual term and independently supplying a meaning/example in optional notes, with MC applications checking distinctions.

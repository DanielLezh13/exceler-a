import type { MathQuestion } from "../math/types.ts";

// Each row replaces one old answer field, retaining its exact answer and topic.
type ReviewPart = [prompt: string, distractors: string[]];
const parts: Record<string, ReviewPart[]> = {
  "anth-thought-review-1": [["Which thinker is associated with use/disuse and inherited acquired characteristics?", ["Darwin", "al-Jāḥiẓ"]]],
  "anth-thought-review-2": [["Which early thinker in your guide discussed environmental pressures and struggle for survival before Darwin?", ["Lamarck", "Darwin"]]],
  "anth-thought-review-3": [["Which thinker in your guide explains evolution through natural selection?", ["Lamarck", "al-Jāḥiẓ"]]],
  "anth-thought-review-5": [
    ["Which term means differences among individuals within a population?", ["evolution", "fitness", "adaptation"]],
    ["Which term means inherited change across population generations?", ["variation", "fitness", "adaptation"]],
    ["Which term means relative reproductive success?", ["variation", "evolution", "adaptation"]]
  ],
  "anth-dna-review-1": [
    ["Which sugar is found in DNA?", ["ribose", "thymine", "uracil"]],
    ["Which base does DNA use instead of RNA's U?", ["uracil", "adenine", "cytosine"]],
    ["Which sugar is found in RNA?", ["deoxyribose", "thymine", "uracil"]],
    ["Which base does RNA use instead of DNA's T?", ["thymine", "adenine", "cytosine"]]
  ],
  "anth-dna-review-2": [
    ["Which process makes a DNA copy from DNA in a human cell?", ["transcription", "translation"]],
    ["Which process makes mRNA from a DNA template in a human cell?", ["replication", "translation"]],
    ["Which process uses mRNA to build an amino-acid chain?", ["replication", "transcription"]]
  ],
  "anth-dna-review-3": [
    ["Where does replication of nuclear DNA occur in a human cell?", ["cytoplasm", "ribosome"]],
    ["Where does transcription of a nuclear gene occur in a human cell?", ["cytoplasm", "ribosome"]],
    ["Which structure carries out translation in a human cell?", ["nucleus", "gene", "tRNA"]],
    ["In which cell region does translation occur in a human cell?", ["nucleus", "outside the cell"]]
  ],
  "anth-dna-review-4": [
    ["DNA template: TGCATA. Which sequence is its complementary DNA strand, aligned in the same left-to-right order?", ["ACGUAU", "TGCATA", "ACGTTA"]],
    ["DNA template: TGCATA. Which sequence is the mRNA made from it, aligned in the same left-to-right order?", ["ACGTAT", "UGCAUA", "ACGUUA"]]
  ],
  "anth-dna-review-5": [
    ["Which term means a DNA segment with information for a functional product?", ["nucleotide", "codon", "amino acid"]],
    ["Which term means a nucleic-acid building block?", ["gene", "codon", "amino acid"]],
    ["Which term means a three-base mRNA reading unit?", ["gene", "nucleotide", "anticodon"]]
  ],
  "anth-dna-review-8": [["Which RNA delivers amino acids during translation?", ["mRNA", "DNA"]]],
  "anth-division-review-1": [
    ["What is the matching chromosome pair, with one chromosome inherited from each parent, called?", ["sister chromatids", "nucleotides", "gametes"]],
    ["What are the replicated copies of one chromosome called?", ["homologous chromosomes", "nucleotides", "gametes"]]
  ],
  "anth-division-review-2": [
    ["In the standard comparison, how many daughter cells does a diploid body cell produce through mitosis and cell splitting?", ["1", "4", "23"]],
    ["In the standard comparison, how many haploid products does meiosis produce from one diploid cell?", ["1", "2", "23"]],
    ["In the standard comparison, the daughters of diploid body-cell mitosis have which chromosome-set number?", ["haploid"]],
    ["In the standard comparison, the products of meiosis have which chromosome-set number?", ["diploid"]]
  ],
  "anth-division-review-3": [
    ["Which division supports body growth and repair?", ["meiosis", "replication", "translation"]],
    ["Which division produces haploid products for sexual reproduction?", ["mitosis", "replication", "translation"]]
  ],
  "anth-division-review-4": [
    ["Assuming no new mutation, are the standard mitotic daughters genetically identical or different?", ["different"]],
    ["In the standard comparison, are meiotic products genetically identical or different?", ["identical"]]
  ],
  "anth-division-review-5": [
    ["What process occurs when homologous nonsister chromatids exchange corresponding DNA segments?", ["independent assortment", "replication", "transcription"]],
    ["Homologous nonsister chromatids exchange corresponding DNA segments. In which specific meiotic phase does this occur?", ["metaphase I", "meiosis II", "after meiosis finishes"]]
  ],
  "anth-division-review-6": [["Which process gives gametes different mixtures of whole maternal and paternal chromosomes?", ["crossing over", "replication", "translation"]]],
  "anth-inherit-review-1": [
    ["Which term means a version of a gene?", ["genotype", "phenotype", "chromosome"]],
    ["Which term describes the allele combination at a gene?", ["allele", "phenotype", "codon"]],
    ["Which term describes an observed or measured trait?", ["allele", "genotype", "codon"]]
  ],
  "anth-inherit-review-2": [
    ["How is the genotype AA classified, without assuming anything about its fitness?", ["heterozygous"]],
    ["How is the genotype Aa classified, without assuming anything about its fitness?", ["homozygous"]],
    ["How is the genotype aa classified, without assuming anything about its fitness?", ["heterozygous"]]
  ],
  "anth-inherit-review-3": [
    ["A is completely dominant to a. Which expression term describes A?", ["recessive"]],
    ["A is completely dominant to a. Which expression term describes a?", ["dominant"]],
    ["A is completely dominant to a. Which genotype expresses the recessive phenotype? Capitalization distinguishes the alleles.", ["AA", "Aa"]]
  ],
  "anth-inherit-review-4": [["For Aa × Aa, what is the probability of aa? Choose the decimal probability.", ["0.5", "0.75", "1"]]],
  "anth-inherit-review-6": [["For Aa × aa, what fraction of offspring are expected to be heterozygous under the simple model? Choose the decimal probability.", ["0.25", "0.75", "1"]]],
  "anth-inherit-review-8": [["B is completely dominant for a stated flower color; b gives the other color. For Bb × Bb, what is the recessive phenotype probability? Choose the decimal probability.", ["0.5", "0.75", "1"]]],
  "anth-forces-review-1": [["Which force creates new alleles by changing DNA sequence?", ["gene flow", "genetic drift", "natural selection"]]],
  "anth-forces-review-2": [["Which force transfers alleles between populations when migrants reproduce?", ["mutation", "genetic drift", "natural selection"]]],
  "anth-forces-review-3": [["Which force changes allele frequencies through chance and is strongest in small populations?", ["mutation", "gene flow", "natural selection"]]],
  "anth-forces-review-4": [["Which force changes frequencies through heritable differences in reproductive success?", ["mutation", "gene flow", "genetic drift"]]],
  "anth-forces-review-5": [
    ["Relative to whether a new change is useful, is mutation random or non-random?", ["non-random"]],
    ["Is the sampling that causes genetic drift random or non-random?", ["non-random"]],
    ["Relative to inherited fitness differences, is natural selection random or non-random?", ["random"]]
  ],
  "anth-forces-review-6": [
    ["A small chance sample starts a new population with different allele ratios. Which form of drift is this?", ["bottleneck", "gene flow", "natural selection"]],
    ["An existing population is drastically reduced, leaving a chance sample of survivors. What is this event called?", ["founder effect", "gene flow", "natural selection"]]
  ],
  "anth-spec-review-1": [
    ["What is the formation of new species called?", ["mutation", "gene flow", "independent assortment"]],
    ["What is speciation following geographic separation called?", ["sympatric"]],
    ["What is speciation in the same general geographic area, without geographic separation, called?", ["allopatric"]]
  ],
  "anth-spec-review-3": [["At the genetic level, biological evolution measures changes in allele ____ across generations. Which word completes the statement?", ["dominance", "strength", "locations"]]],
  "anth-spec-review-6": [
    ["In the molecular path DNA → mRNA → protein, which process makes mRNA from the DNA template?", ["translation", "replication", "crossing over"]],
    ["In the molecular path DNA → mRNA → protein, which process uses mRNA to build the protein chain?", ["transcription", "replication", "crossing over"]],
    ["In protein synthesis, which RNA carries amino acids to the ribosome?", ["mRNA", "DNA"]]
  ]
};

export function multipleChoiceReview(questions: MathQuestion[]): MathQuestion[] {
  return questions.flatMap(question => {
    if (question.fields.length === 1 && question.fields[0].kind === "choice") return [question];
    const plan = parts[question.id];
    if (!plan || plan.length !== question.fields.length) throw new Error(`Missing Anthropology review choices: ${question.id}`);
    return question.fields.map((field, index) => {
      const id = index === 0 ? question.id : `${question.id}-part-${index + 1}`;
      const [prompt, distractors] = plan[index];
      const options = [field.answer, ...distractors];
      if (options.length < 2 || new Set(options).size !== options.length) throw new Error(`Invalid choices: ${id}`);
      const offset = [...id].reduce((total, c) => total + c.charCodeAt(0), 0) % options.length;
      return {
        ...question, id, prompt,
        fields: [{ label: "Your answer", answer: field.answer, kind: "choice" as const, caseSensitive: field.caseSensitive, options: [...options.slice(offset), ...options.slice(0, offset)] }],
        legacyReviewField: { questionId: question.id, index, field }
      };
    });
  });
}

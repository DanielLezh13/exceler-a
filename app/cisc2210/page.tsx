import AuthenticatedCommandCenter from "../AuthenticatedCommandCenter";

export const metadata = {
  title: "Discrete Structures · CISC 2210 | Exceler A",
  description: "Full Discrete Structures lessons, typed practice, and unit mastery tests.",
  openGraph: { title: "Discrete Structures · CISC 2210", description: "Logic, proofs, sets, circuits, counting, graphs, and algorithms.", images: [] },
  twitter: { title: "Discrete Structures · CISC 2210", description: "Logic, proofs, sets, circuits, counting, graphs, and algorithms.", images: [] },
};

export default function DiscreteStructuresPage() {
  return <AuthenticatedCommandCenter initialMathCourse="cisc2210" />;
}

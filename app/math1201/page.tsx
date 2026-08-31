import AuthenticatedCommandCenter from "../AuthenticatedCommandCenter";
export const metadata = { title: "Calculus I · MATH 1201 | Exceler A", description: "Full Calculus I lessons, typed practice, and unit mastery tests.", openGraph: { title: "Calculus I · MATH 1201", description: "Limits, derivatives, applications, and integration.", images: [] }, twitter: { title: "Calculus I · MATH 1201", description: "Limits, derivatives, applications, and integration.", images: [] } };
export default function CalculusPage() { return <AuthenticatedCommandCenter initialMathCourse="math1201"/>; }

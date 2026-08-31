import AuthenticatedCommandCenter from "../AuthenticatedCommandCenter";
export const metadata = { title: "College Algebra · MATH 1006 | Exceler A", description: "Full College Algebra lessons, written practice, and mastery tests.", openGraph: { title: "College Algebra · MATH 1006", description: "College Algebra lessons and written practice.", images: [] }, twitter: { title: "College Algebra · MATH 1006", description: "College Algebra lessons and written practice.", images: [] } };
export default function AlgebraPage() { return <AuthenticatedCommandCenter initialMathCourse="math1006"/>; }

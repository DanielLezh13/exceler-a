import AuthenticatedCommandCenter from "../AuthenticatedCommandCenter";
export const metadata = { title: "Precalculus · MATH 1011 | Exceler A", description: "Full Precalculus lessons, written practice, and mastery tests.", openGraph: { title: "Precalculus · MATH 1011", description: "Precalculus lessons and written practice.", images: [] }, twitter: { title: "Precalculus · MATH 1011", description: "Precalculus lessons and written practice.", images: [] } };
export default function PrecalculusPage() { return <AuthenticatedCommandCenter initialMathCourse="math1011"/>; }

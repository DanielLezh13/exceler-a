import { ArrowUpRight } from "lucide-react";
import { degreeCourses, type DegreeCourse } from "./data/curriculum";
import DegreePrerequisites from "./DegreePrerequisites";

const electivePlan = ["CISC 3410", "CISC 3440", "CISC 3171"];

export default function DegreeElectives({ records, onOpenCourse }: {
  records: Record<string, string>;
  onOpenCourse: (course: DegreeCourse) => void;
}) {
  return <div className="degree-elective-plan">
    <p className="elective-rule"><strong>3 additional classes required.</strong> You choose which ones.</p>
    <p className="elective-path-label">Your elective plan · AI, Machine Learning, and Software Engineering</p>
    <ol className="degree-elective-slots" aria-label="Three upper-level elective slots">
      {electivePlan.map((code, index) => {
        const course = degreeCourses.find(course => course.code === code)!;
        const status = records[code] ?? "unknown";
        const label = status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : status === "not_started" ? "Not started" : "Elective option";
        return <li key={code}>
          <span className="elective-slot-label">Elective {index + 1}</span>
          <div className="bubble-options"><button type="button" className={status} onClick={() => onOpenCourse(course)} aria-label={`View ${code}: ${course.title}`}>
            <b>{code}</b><small>{course.title}</small><i>{label}</i>
          </button></div>
          <p>3 credits · can count as one elective</p>
          <DegreePrerequisites course={course} records={records}/>
        </li>;
      })}
    </ol>
    <p className="elective-boundary">These fill the three CISC 3000–4899 elective slots. They do not replace Architecture, Algorithms/Theory, Statistics, Ethics, or other required courses. These are your choices—not mandatory for everyone.</p>
    <p className="elective-boundary">Checkmarks follow your saved degree statuses, including reviewed DegreeWorks imports—not lesson progress. Unconfirmed does not mean failed. Prerequisites can be completed alongside other requirements; the map is not a strict semester order.</p>
    <a className="elective-source" href="https://www.brooklyn.edu/academics/programs/computer-science-bs/" target="_blank" rel="noreferrer">Check your DegreeWorks/catalog year and prerequisites before registering.<ArrowUpRight size={12}/></a>
  </div>;
}

import { Check, Circle, Clock3 } from "lucide-react";
import { degreeAuditCourses, type DegreeCourse } from "./data/curriculum";

export default function DegreePrerequisites({ course, records }: {
  course: DegreeCourse;
  records: Record<string, string>;
}) {
  if (!course.prerequisites?.length) return null;
  return <div className="degree-prerequisites" aria-label={`${course.code} prerequisites`}>
    <h5>Prerequisites</h5>
    <ul className="prerequisite-groups">
      {course.prerequisites.map((group, index) => {
        const options = group.anyOf.map(option => typeof option === "string" ? [option] : option);
        const complete = options.some(codes => codes.every(code => records[code] === "complete"));
        const compact = options.length > 3 || (options.length > 1 && options.some(codes => codes.length > 1));
        const renderOption = (codes: string[], optionIndex: number) => <li key={codes.join("+")}>
          {optionIndex > 0 && <span className="prerequisite-or">OR</span>}
          {codes.map((code, codeIndex) => {
            const status = records[code] ?? "unknown";
            const label = status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : status === "not_started" ? "Still needed" : "Not confirmed";
            const title = degreeAuditCourses.find(item => item.code === code)?.title;
            return <div key={code}>
              {codeIndex > 0 && <span className="prerequisite-or">AND · both courses</span>}
              <div className={`prerequisite-course ${status}`}>
                <span aria-hidden="true">{status === "complete" ? <Check size={14} strokeWidth={3}/> : status === "in_progress" ? <Clock3 size={14}/> : <Circle size={14}/>}</span>
                <span><b>{code}</b>{title && <small>{title}</small>}<em>{label}</em></span>
              </div>
            </div>;
          })}
        </li>;
        return <li key={group.anyOf.join("|")} className={complete ? "prerequisite-group met" : "prerequisite-group"}>
          <p className="prerequisite-group-label">{index > 0 ? "AND · " : ""}{options.length > 1 ? "Choose one route" : "Required"}{complete ? " · course completion recorded" : ""}</p>
          <ul>
            {(compact ? options.slice(0, 1) : options).map(renderOption)}
          </ul>
          {compact && <details className="prerequisite-alternatives">
            <summary>Other accepted routes{options.slice(1).some(codes => codes.every(code => records[code] === "complete")) ? " · completion recorded" : ""}</summary>
            <ul>{options.slice(1).map((codes, optionIndex) => renderOption(codes, optionIndex + 1))}</ul>
          </details>}
          {group.alternativeNote && <p className="prerequisite-note">{group.alternativeNote}</p>}
        </li>;
      })}
    </ul>
    {course.prerequisiteNote && <details className="prerequisite-conditions"><summary>Conditions &amp; equivalencies</summary><p className="prerequisite-note">{course.prerequisiteNote}</p></details>}
  </div>;
}

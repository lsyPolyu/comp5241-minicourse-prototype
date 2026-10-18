import type { DimensionAssessment } from "@/domain/feedback";

export function DimensionFeedback({ label, dimension }: { label: string; dimension: DimensionAssessment }) {
  return <li className="feedback-dimension">
    <div className="feedback-dimension-heading"><h3>{label}</h3>
      <span className={`feedback-level feedback-level--${dimension.level.toLowerCase()}`}>
        <span aria-hidden="true">{dimension.level === "Strong" ? "✓" : dimension.level === "Partial" ? "!" : "−"} </span>{dimension.level}
      </span>
    </div>
    <p>{dimension.explanation}</p>
    {dimension.evidence.some((e) => e.quote) && <ul className="feedback-evidence" aria-label={`${label} evidence`}>
      {dimension.evidence.filter((e) => e.quote).map((e, index) => <li key={index}><q>{e.quote}</q></li>)}
    </ul>}
  </li>;
}

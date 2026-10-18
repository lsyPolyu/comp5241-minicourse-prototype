"use client";
import { useEffect, useRef } from "react";
import type { LatestSuccessfulResult } from "@/domain/learning";
import { summaryFields } from "@/domain/summary";
import { RecommendationCard } from "@/features/recommendation/RecommendationCard";
import { DimensionFeedback } from "./DimensionFeedback";

export function FeedbackPanel({ result, courseId, previous, focusOnResult = true, headingText }: {
  result: LatestSuccessfulResult;
  courseId: string;
  previous: boolean;
  focusOnResult?: boolean;
  headingText?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!previous && focusOnResult) heading.current?.focus(); }, [result.requestId, previous, focusOnResult]);
  const assessment = result.feedback;
  return <section className="feedback-panel" aria-labelledby="feedback-heading">
    <h2 id="feedback-heading" ref={heading} tabIndex={-1}>{headingText ?? (previous ? "Previous successful feedback" : "Your feedback")}</h2>
    <p>{previous ? "This feedback belongs to your previous successful submission. Your current practice is not complete yet." : "Activity complete. Your summary was submitted and valid feedback was received. These ratings guide your practice."}</p>
    <ul className="feedback-dimensions" aria-label="Nine feedback dimensions">
      <DimensionFeedback label="Questioning Process" dimension={assessment.questioning} />
      {summaryFields.map(({ id, label }) => <DimensionFeedback key={id} label={label} dimension={assessment.dimensions[id]} />)}
    </ul>
    <div className="feedback-notes">
      <section aria-labelledby="went-well"><h3 id="went-well">What you did well</h3>
        {assessment.whatWentWell.length ? <ul>{assessment.whatWentWell.map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>There is not enough evidence of a strength in this submission yet.</p>}
      </section>
      <section aria-labelledby="improve"><h3 id="improve">What to improve</h3>
        {assessment.whatToImprove.length ? <ul>{assessment.whatToImprove.map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>No substantive omissions were identified in this submission.</p>}
      </section>
    </div>
    <RecommendationCard result={result} courseId={courseId} />
    <details className="submitted-summary"><summary>View submitted summary</summary>
      <dl>{summaryFields.map(({ id, label }) => <div key={id}><dt>{label}</dt><dd>{result.summarySnapshot[id] || "Left blank"}</dd></div>)}</dl>
    </details>
  </section>;
}

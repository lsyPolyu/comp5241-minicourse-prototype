"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { LatestSuccessfulResult } from "@/domain/learning";
import { summaryFields } from "@/domain/summary";
import { courseRegistry } from "@/content/courses/registry";
import { DimensionFeedback } from "./DimensionFeedback";

export function FeedbackPanel({ result, courseId, previous }: { result: LatestSuccessfulResult; courseId: string; previous: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!previous) heading.current?.focus(); }, [result.requestId, previous]);
  const assessment = result.feedback;
  const content = courseRegistry[courseId];
  const action = result.recommendation;
  const lesson = action?.kind === "reviewLesson" ? content.lessons.find((item) => item.id === action.lessonId) : null;
  return <section className="feedback-panel" aria-labelledby="feedback-heading">
    <h2 id="feedback-heading" ref={heading} tabIndex={-1}>{previous ? "Previous successful feedback" : "Your feedback"}</h2>
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
    <section className="feedback-action" aria-labelledby="next-action"><h3 id="next-action">Recommended next action</h3>
      {action ? <>
        <p className="feedback-action-title">{action.kind === "reviewLesson" && lesson ? `Review Lesson ${lesson.order}: ${lesson.title}` : action.kind === "retryActivity" ? "Retry Activity" : "Course Complete"}</p>
        <p>{action.reason}</p>
      </> : result.completionPending && <>
        <p>{result.completionPending.explanation}</p>
        <ul>{result.completionPending.missingLessonIds.map((id) => <li key={id}>{content.lessons.find((item) => item.id === id)?.title}</li>)}</ul>
        <Link href={`/courses/${content.course.slug}`}>Continue learning</Link>
      </>}
    </section>
    <details className="submitted-summary"><summary>View submitted summary</summary>
      <dl>{summaryFields.map(({ id, label }) => <div key={id}><dt>{label}</dt><dd>{result.summarySnapshot[id] || "Left blank"}</dd></div>)}</dl>
    </details>
  </section>;
}

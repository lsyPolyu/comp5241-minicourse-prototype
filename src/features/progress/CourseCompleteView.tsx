"use client";

import { useEffect, useRef } from "react";
import type { PublishedCourse } from "@/domain/course";
import { getProgress } from "@/domain/progress";
import { summaryFields } from "@/domain/summary";
import { useLearning } from "@/state/LearningProvider";

export function CourseCompleteView({ content }: { content: PublishedCourse }) {
  const section = useRef<HTMLElement>(null);
  const { state } = useLearning();
  const learning = state.courses[content.course.id];
  const result = learning.latestSuccessfulResult;
  const complete = getProgress(content, learning).courseCompleted && result !== null;
  useEffect(() => {
    if (complete && window.location.hash === "#course-complete") section.current?.focus({ preventScroll: true });
  }, [complete]);
  if (!complete || !result) return null;

  return <section ref={section} id="course-complete" className="course-complete" aria-labelledby="course-complete-heading" tabIndex={-1}>
    <h2 id="course-complete-heading">Course Complete</h2>
    <p>You have completed all three lessons and the activity. You can continue using your feedback to guide further practice.</p>
    <h3>Your final submitted summary</h3>
    <p className="supporting-text">Your own work from the latest successful submission.</p>
    <dl className="final-summary">{summaryFields.map(({ id, label }) => <div key={id}>
      <dt>{label}</dt><dd>{result.summarySnapshot[id] || "Left blank"}</dd>
    </div>)}</dl>
  </section>;
}

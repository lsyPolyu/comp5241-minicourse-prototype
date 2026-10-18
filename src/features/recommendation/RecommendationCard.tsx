"use client";

import { useId } from "react";
import Link from "next/link";
import { courseHref, getCourseById, lessonHref } from "@/content/courses/registry";
import type { LatestSuccessfulResult } from "@/domain/learning";
import { getProgress } from "@/domain/progress";
import { useLearning } from "@/state/LearningProvider";
import { RetryActivityLink } from "./RetryActivityLink";

export function RecommendationCard({ result, courseId }: { result: LatestSuccessfulResult; courseId: string }) {
  const headingId = useId();
  const { state } = useLearning();
  const content = getCourseById(courseId);
  const learning = state.courses[courseId];
  if (!content || !learning) return null;
  const action = result.recommendation;
  const lesson = action?.kind === "reviewLesson" ? content.lessons.find(({ id }) => id === action.lessonId) : null;
  if (action?.kind === "reviewLesson" && !lesson) return null;
  if (action?.kind === "retryActivity" && !content.activities.some(({ id }) => id === action.activityId)) return null;
  if (action?.kind === "courseComplete" && !getProgress(content, learning).courseCompleted) return null;
  if (!action && !result.completionPending) return null;

  return <section className="feedback-action" aria-labelledby={headingId}>
    <h3 id={headingId}>Recommended next action</h3>
    {action ? <>
      <p className="feedback-action-title">{action.kind === "reviewLesson" && lesson
        ? `Review Lesson ${lesson.order}: ${lesson.title}` : action.kind === "retryActivity" ? "Retry Activity" : "Course Complete"}</p>
      <p>{action.reason}</p>
      <div className="recommendation-actions">
        {action.kind === "reviewLesson" && lesson && <Link className="ui-button ui-button--primary" href={lessonHref(content, lesson.id)!}>
          Review Lesson {lesson.order}
        </Link>}
        {action.kind === "retryActivity" && <RetryActivityLink courseId={courseId} activityId={action.activityId} />}
        {action.kind === "courseComplete" && <>
          <Link className="ui-button ui-button--primary" href="/progress#course-complete">View final summary</Link>
          <RetryActivityLink courseId={courseId} variant="secondary" />
        </>}
      </div>
    </> : result.completionPending && <>
      <p>{result.completionPending.explanation}</p>
      <ul>{result.completionPending.missingLessonIds.map((id) => {
        const missing = content.lessons.find((item) => item.id === id);
        return missing ? <li key={id}><Link className="text-action" href={lessonHref(content, id)!}>
          Continue to Lesson {missing.order}: {missing.title}
        </Link></li> : null;
      })}</ul>
      {!result.completionPending.missingLessonIds.length && <Link className="text-action" href={`${courseHref(content)}/activity`}>Continue activity</Link>}
    </>}
  </section>;
}

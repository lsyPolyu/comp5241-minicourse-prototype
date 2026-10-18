"use client";

import Link from "next/link";
import { lessonHref } from "@/content/courses/registry";
import type { PublishedCourse } from "@/domain/course";
import { useLearning } from "@/state/LearningProvider";
import { ModuleOutline } from "@/features/courses/ModuleOutline";
import { FeedbackPanel } from "@/features/feedback/FeedbackPanel";
import { CourseCompleteView } from "./CourseCompleteView";
import { ProgressSummary } from "./ProgressSummary";

export function ProgressView({ content }: { content: PublishedCourse }) {
  const { state } = useLearning();
  const learning = state.courses[content.course.id];
  const currentLesson = content.lessons.find(({ id }) => id === learning.currentLessonId);
  const result = learning.latestSuccessfulResult;
  const previous = learning.latestAttemptMeta !== null && learning.latestAttemptMeta.attemptId !== result?.attemptId && learning.latestAttemptMeta.phase !== "completed";
  return <>
    <h2 className="progress-course-title">{content.course.title}</h2>
    <ProgressSummary content={content} />
    {currentLesson && <p className="current-lesson">
      Last opened: Lesson {currentLesson.order} · {currentLesson.title}{" "}
      <Link className="text-action" href={lessonHref(content, currentLesson.id)!}>Return to this lesson</Link>
    </p>}
    <ModuleOutline content={content} />
    <div className="learning-section latest-feedback">
      {result ? <FeedbackPanel result={result} courseId={content.course.id} previous={previous}
        headingText="Latest successful feedback" focusOnResult={false} />
        : <section aria-labelledby="latest-feedback-heading">
          <h2 id="latest-feedback-heading">Latest feedback</h2>
          <p>No feedback yet. Interview the client and submit your own summary to receive feedback.</p>
          <Link className="text-action" href={`/courses/${content.course.slug}/activity`}>Open activity</Link>
        </section>}
    </div>
    <CourseCompleteView content={content} />
  </>;
}

"use client";

import type { PublishedCourse } from "@/domain/course";
import { getProgress } from "@/domain/progress";
import { useLearning } from "@/state/LearningProvider";
import { ContinueLearningLink } from "./ContinueLearningLink";

export function ProgressSummary({ content }: { content: PublishedCourse }) {
  const { state } = useLearning();
  const learning = state.courses[content.course.id];
  const progress = getProgress(content, learning);
  return <section className="progress-summary" aria-label={`${content.course.title} progress`}>
    <p className="progress-counts">
      <strong>{progress.completedLessons} of {progress.totalLessons} lessons completed</strong>
      <span>Activity {progress.activityCompleted ? "completed" : "incomplete"}</span>
    </p>
    <div className="completion-units" role="progressbar" aria-label="Learning completion"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}
      aria-valuetext={`${progress.completedLessons} of ${progress.totalLessons} lessons completed, activity ${progress.activityCompleted ? "completed" : "incomplete"}, ${progress.percentage}% completion`}>
      {content.lessons.map(({ id }) => <span key={id} className={learning.completedLessonIds.includes(id) ? "is-completed" : ""} />)}
      <span className={progress.activityCompleted ? "is-completed" : ""} />
    </div>
    <p className="supporting-text">{progress.percentage}% completion · {progress.completedUnits} of {progress.totalUnits} learning units</p>
    <p className="course-state">{progress.courseCompleted ? "Course Complete" : progress.completedUnits > 0 || learning.currentLessonId ? "In progress" : "Not started"}</p>
    <ContinueLearningLink content={content} />
  </section>;
}

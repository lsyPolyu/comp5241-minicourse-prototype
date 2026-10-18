"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublishedCourse } from "@/domain/course";
import { courseHref, lessonHref } from "@/content/courses/registry";
import { getContinueLearningTarget } from "@/domain/progress";
import { useLearning } from "@/state/LearningProvider";

export function ContinueLearningLink({ content }: { content: PublishedCourse }) {
  const { state } = useLearning();
  const learning = state.courses[content.course.id];
  const target = getContinueLearningTarget(content, learning);
  const href = target.kind === "lesson" ? lessonHref(content, target.lessonId)!
    : target.kind === "activity" ? `${courseHref(content)}/activity` : "/progress";
  const lesson = target.kind === "lesson" ? content.lessons.find(({ id }) => id === target.lessonId)! : null;
  const started = learning.currentLessonId !== null || learning.completedLessonIds.length > 0;
  return <div className="continue-action">
    <p className="supporting-text">
      {lesson ? `Up next: Lesson ${lesson.order} · ${lesson.title}`
        : target.kind === "activity" ? `Up next: ${content.activities[0].title}` : "All learning units completed."}
    </p>
    <Link className="ui-button ui-button--primary" href={href}>
      {target.kind === "progress" ? "View Progress" : started ? "Continue Learning" : "Start Learning"}
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  </div>;
}

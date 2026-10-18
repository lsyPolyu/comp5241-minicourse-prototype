"use client";

import Link from "next/link";
import { lessonHref } from "@/content/courses/registry";
import type { PublishedCourse } from "@/domain/course";
import { useLearning } from "@/state/LearningProvider";
import { ModuleOutline } from "@/features/courses/ModuleOutline";
import { ProgressSummary } from "./ProgressSummary";

export function ProgressView({ content }: { content: PublishedCourse }) {
  const { state } = useLearning();
  const currentLesson = content.lessons.find(({ id }) => id === state.courses[content.course.id].currentLessonId);
  return <>
    <h2 className="progress-course-title">{content.course.title}</h2>
    <ProgressSummary content={content} />
    {currentLesson && <p className="current-lesson">
      Last opened: Lesson {currentLesson.order} · {currentLesson.title}{" "}
      <Link className="text-action" href={lessonHref(content, currentLesson.id)!}>Return to this lesson</Link>
    </p>}
    <ModuleOutline content={content} />
    <section className="learning-section latest-feedback" aria-labelledby="latest-feedback-heading">
      <h2 id="latest-feedback-heading">Latest feedback</h2>
      <p>No feedback yet. Practise interviewing the client in the activity; summary submission and feedback are not available yet.</p>
    </section>
    <p className="supporting-text session-note">Progress is kept during this visit. Refreshing or reopening the site starts a new session.</p>
  </>;
}

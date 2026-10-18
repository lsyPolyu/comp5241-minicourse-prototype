"use client";

import Link from "next/link";
import { courseHref, lessonHref } from "@/content/courses/registry";
import type { PublishedCourse } from "@/domain/course";
import { useLearning } from "@/state/LearningProvider";
import { CompletionStatus } from "@/features/progress/CompletionStatus";

export function ModuleOutline({ content }: { content: PublishedCourse }) {
  const { state } = useLearning();
  const learning = state.courses[content.course.id];
  return <>
    {content.modules.map((module) => (
      <section className="learning-section" key={module.id} aria-labelledby={module.id}>
        <h2 id={module.id}>{module.title}</h2>
        <p className="supporting-text">Module progress: {module.lessonIds.filter((id) => learning.completedLessonIds.includes(id)).length} / {module.lessonIds.length} lessons · Activity {learning.earnedActivityCompletion ? "completed" : "incomplete"}</p>
        <ul className="outline-list">
          {module.lessonIds.map((id) => {
            const lesson = content.lessons.find((item) => item.id === id)!;
            return <li className="outline-row" key={id}>
              <span className="supporting-text">Lesson {lesson.order}</span>
              <Link href={lessonHref(content, id)!}>{lesson.title}</Link>
              <div className="outline-row__state">
                <CompletionStatus completed={learning.completedLessonIds.includes(id)} />
                {learning.currentLessonId === id && <span className="supporting-text">Current lesson</span>}
              </div>
            </li>;
          })}
          {module.activityIds.map((id) => (
            <li className="outline-row" key={id}>
              <span className="supporting-text">Activity</span>
              <Link href={`${courseHref(content)}/activity`}>{content.activities.find((item) => item.id === id)!.title}</Link>
              <CompletionStatus completed={learning.earnedActivityCompletion !== null} />
            </li>
          ))}
        </ul>
        <p className="supporting-text">Complete each lesson, then submit your summary and receive feedback to complete the activity.</p>
      </section>
    ))}
  </>;
}

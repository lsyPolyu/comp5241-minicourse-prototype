import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { courseHref, getCourseBySlug, getLesson } from "@/content/courses/registry";
import { LessonReader } from "@/features/lessons/LessonReader";
import { LessonNavigation } from "@/features/lessons/LessonNavigation";
import { CompleteLessonButton } from "@/features/lessons/CompleteLessonButton";

export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = await params;
  const content = getCourseBySlug(courseSlug);
  const lesson = content && getLesson(content.course.id, lessonId);
  if (!content || !lesson) notFound();
  return <>
    <Breadcrumbs items={[
      { label: "Dashboard", href: "/" },
      { label: content.course.title, href: courseHref(content) },
      { label: content.modules.find(({ id }) => id === lesson.moduleId)!.title, href: `${courseHref(content)}#${lesson.moduleId}` },
      { label: `Lesson ${lesson.order}` },
    ]} />
    <header className="learning-intro">
      <p className="supporting-text">Lesson {lesson.order} of {content.lessons.length}</p>
      <h1>{lesson.title}</h1><p>{lesson.objective}</p>
    </header>
    <div className="lesson-workspace">
      <div>
        <LessonReader lesson={lesson} />
        <div className="lesson-actions">
          <CompleteLessonButton courseId={content.course.id} lessonId={lesson.id} />
          <LessonNavigation content={content} lessonId={lesson.id} />
        </div>
      </div>
      <aside className="tutor-placeholder" aria-label="Optional lesson support">
        <details>
          <summary>Ask AI Tutor</summary>
          <p>Optional help with this lesson will be available here. The Tutor is not available yet.</p>
          <p className="supporting-text">You can read, navigate and complete lessons without Tutor help.</p>
        </details>
      </aside>
    </div>
  </>;
}

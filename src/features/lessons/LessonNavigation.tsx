import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { courseHref, lessonHref } from "@/content/courses/registry";
import type { PublishedCourse } from "@/domain/course";

export function LessonNavigation({ content, lessonId }: { content: PublishedCourse; lessonId: string }) {
  const index = content.lessons.findIndex(({ id }) => id === lessonId);
  const previous = content.lessons[index - 1];
  const next = content.lessons[index + 1];
  return (
    <nav className="lesson-navigation" aria-label="Lesson navigation">
      {previous && <Link className="text-action" href={lessonHref(content, previous.id)!}>
        <ArrowLeft size={18} aria-hidden="true" />Previous: Lesson {previous.order}
      </Link>}
      {next
        ? <Link className="text-action" href={lessonHref(content, next.id)!}>Next: Lesson {next.order}<ArrowRight size={18} aria-hidden="true" /></Link>
        : <Link className="text-action" href={`${courseHref(content)}/activity`}>Next: Activity<ArrowRight size={18} aria-hidden="true" /></Link>}
      <Link className="text-action" href={courseHref(content)}>Back to course</Link>
    </nav>
  );
}

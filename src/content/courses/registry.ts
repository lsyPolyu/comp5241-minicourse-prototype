import type { CourseCard, PublishedCourse } from "@/domain/course";
import { requirementClarification } from "./requirement-clarification/course";

export const courseRegistry: Readonly<Record<string, PublishedCourse>> = {
  [requirementClarification.course.id]: requirementClarification,
};

export const courseCards: readonly CourseCard[] = [
  { ...requirementClarification.course, availability: "available" },
  { id: "git-basics", title: "Git Basics", availability: "comingSoon" },
  { id: "ai-coding-agents", title: "Working with AI Coding Agents", availability: "comingSoon" },
  { id: "communication-skills", title: "Communication Skills", availability: "comingSoon" },
];

export function getCourseById(id: string): PublishedCourse | undefined {
  return Object.hasOwn(courseRegistry, id) ? courseRegistry[id] : undefined;
}

export function getCourseBySlug(slug: string): PublishedCourse | undefined {
  return Object.values(courseRegistry).find(({ course }) => course.slug === slug);
}

export function getLesson(courseId: string, lessonId: string) {
  return getCourseById(courseId)?.lessons.find(({ id }) => id === lessonId);
}

export function courseHref(content: PublishedCourse) {
  return `/courses/${content.course.slug}`;
}

export function lessonHref(content: PublishedCourse, lessonId: string) {
  if (!content.lessons.some(({ id }) => id === lessonId)) return undefined;
  return `${courseHref(content)}/lessons/${lessonId}`;
}

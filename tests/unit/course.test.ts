import { describe, expect, it } from "vitest";
import { courseCards, courseRegistry, getCourseById, getCourseBySlug, getLesson, lessonHref } from "@/content/courses/registry";
import { summaryFieldIds } from "@/domain/course";

describe("public course registry", () => {
  it("publishes exactly one course, one module, three lessons and one activity", () => {
    const entries = Object.values(courseRegistry);
    expect(entries).toHaveLength(1);
    const { course, modules, lessons, activities } = entries[0];
    expect(modules).toHaveLength(1);
    expect(lessons).toHaveLength(3);
    expect(activities).toHaveLength(1);
    expect(course.moduleIds).toEqual(modules.map(({ id }) => id));
    expect(modules[0].lessonIds).toEqual(lessons.map(({ id }) => id));
    expect(modules[0].activityIds).toEqual(activities.map(({ id }) => id));
    expect(activities[0].summaryFieldIds).toEqual(summaryFieldIds);
    expect(activities[0].scenarioId).toBe("club-signup-v1");
  });

  it("has unique IDs, slugs, ordered lessons and valid parent references", () => {
    const allIds: string[] = [];
    const slugs: string[] = [];
    for (const content of Object.values(courseRegistry)) {
      const { course, modules, lessons, activities } = content;
      slugs.push(course.slug);
      allIds.push(course.id, ...modules.map(({ id }) => id), ...lessons.map(({ id }) => id), ...activities.map(({ id }) => id));
      expect(lessons.map(({ order }) => order)).toEqual([1, 2, 3]);
      for (const child of [...modules, ...lessons, ...activities]) expect(child.courseId).toBe(course.id);
      for (const child of [...lessons, ...activities]) expect(course.moduleIds).toContain(child.moduleId);
      for (const lesson of lessons) expect(getLesson(course.id, lesson.id)).toBe(lesson);
      expect(getCourseBySlug(course.slug)).toBe(content);
    }
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(courseCards.map(({ id }) => id)).size).toBe(courseCards.length);
  });

  it("allows learning targets only from the published registry", () => {
    const future = courseCards.filter(({ availability }) => availability === "comingSoon");
    expect(future.length).toBeGreaterThanOrEqual(2);
    for (const card of future) {
      expect(getCourseById(card.id)).toBeUndefined();
      expect(getCourseBySlug(card.id)).toBeUndefined();
      expect(card).not.toHaveProperty("slug");
      expect(card).not.toHaveProperty("description");
    }
    expect(getCourseById("toString")).toBeUndefined();
    expect(getCourseBySlug("missing")).toBeUndefined();
    expect(getLesson("requirement-clarification", "missing")).toBeUndefined();
    expect(lessonHref(Object.values(courseRegistry)[0], "missing")).toBeUndefined();
  });
});

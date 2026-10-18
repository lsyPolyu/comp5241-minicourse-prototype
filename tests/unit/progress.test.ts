import { describe, expect, it } from "vitest";
import { requirementClarification as content } from "@/content/courses/requirement-clarification/course";
import { createCourseLearningState } from "@/domain/learning";
import { getContinueLearningTarget, getProgress } from "@/domain/progress";

describe("four equal completion units", () => {
  it.each([0, 1, 2, 3])("%i explicitly completed lessons keep the activity and course incomplete", (count) => {
    const state = { ...createCourseLearningState(), completedLessonIds: content.lessons.slice(0, count).map(({ id }) => id) };
    expect(getProgress(content, state)).toMatchObject({ completedLessons: count, percentage: count * 25, activityCompleted: false, courseCompleted: false, moduleCompleted: false });
    expect(getContinueLearningTarget(content, state)).toEqual(count < 3
      ? { kind: "lesson", lessonId: content.lessons[count].id }
      : { kind: "activity" });
  });

  it("all four units complete; duplicates and unknown lesson IDs never inflate progress", () => {
    const state = {
      ...createCourseLearningState(),
      completedLessonIds: [...content.lessons.map(({ id }) => id), "why-clarify", "unknown"],
      earnedActivityCompletion: { attemptId: "a", submissionId: "s", requestId: "r", receivedAt: "2026-10-18T04:00:00Z" },
    };
    expect(getProgress(content, state)).toMatchObject({ completedLessons: 3, percentage: 100, courseCompleted: true, moduleCompleted: true });
    expect(getContinueLearningTarget(content, state)).toEqual({ kind: "progress" });
    for (const lesson of content.lessons) {
      expect(getProgress(content, { ...state, completedLessonIds: state.completedLessonIds.filter((id) => id !== lesson.id) }).courseCompleted).toBe(false);
    }
  });

  it("continue always finds the first incomplete lesson, even after out-of-order reading", () => {
    const state = { ...createCourseLearningState(), currentLessonId: "structure-requirements", completedLessonIds: ["what-to-ask"] };
    expect(getContinueLearningTarget(content, state)).toEqual({ kind: "lesson", lessonId: "why-clarify" });
    expect(getProgress(content, state).percentage).toBe(25);
  });
});

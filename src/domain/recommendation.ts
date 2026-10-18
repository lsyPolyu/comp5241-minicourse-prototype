import { courseRegistry } from "@/content/courses/registry";
import { feedbackSchema, type ActivityAssessment } from "./feedback";
import type { PublishedCourse } from "./course";
import { summaryFields } from "./summary";

export type LearningRecommendation =
  | { kind: "reviewLesson"; lessonId: string; reason: string }
  | { kind: "retryActivity"; activityId: string; reason: string }
  | { kind: "courseComplete"; reason: string };
export interface RecommendationSelection {
  recommendation: LearningRecommendation | null;
  completionPending: { missingLessonIds: readonly string[]; explanation: string } | null;
}
export interface RecommendationCompletion { completedLessonIds: readonly string[]; activityCompleted: boolean }

export function selectRecommendation(assessment: ActivityAssessment, courseId: string, completion: RecommendationCompletion,
  registry: Readonly<Record<string, PublishedCourse>> = courseRegistry): RecommendationSelection {
  if (!Object.hasOwn(registry, courseId)) throw new Error("Recommendation requires a published course.");
  const content = registry[courseId];
  const parsed = feedbackSchema.parse(assessment);
  const dimensions = [{ id: "questioning", label: "Questioning Process", value: parsed.questioning },
    ...summaryFields.map(({ id, label }) => ({ id, label, value: parsed.dimensions[id] }))];
  // PLAN §7: goal first, questioning second, summary last; stable field order
  // breaks ties within a category. No count, score or numeric grade threshold.
  for (const [lessonId, matches] of [
    ["why-clarify", (id: string, codes: readonly string[], level: string) => codes.includes("goalMisunderstood") || (id === "userGoal" && level === "Missing")],
    ["what-to-ask", (id: string, codes: readonly string[], level: string) => codes.includes("questioningGap") || (id === "questioning" && level === "Missing")],
    ["structure-requirements", (_id: string, codes: readonly string[], level: string) => codes.includes("summaryGap") || level === "Missing"],
  ] as const) {
    const gap = dimensions.find(({ id, value }) => matches(id, value.problemCodes, value.level));
    if (!gap) continue;
    if (!content.lessons.some((lesson) => lesson.id === lessonId)) throw new Error("Recommendation target is not implemented.");
    return { recommendation: { kind: "reviewLesson", lessonId, reason: `${gap.label}: ${gap.value.level}. ${gap.value.explanation}` }, completionPending: null };
  }
  const omission = dimensions.find(({ value }) => value.level === "Partial");
  if (omission) {
    const activity = content.activities.find(({ id }) => id === "client-interview");
    if (!activity) throw new Error("Recommendation target is not implemented.");
    return { recommendation: { kind: "retryActivity", activityId: activity.id, reason: `${omission.label}: ${omission.value.explanation}` }, completionPending: null };
  }
  const missingLessonIds = content.lessons.filter(({ id }) => !completion.completedLessonIds.includes(id)).map(({ id }) => id);
  if (missingLessonIds.length || !completion.activityCompleted) return { recommendation: null,
    completionPending: { missingLessonIds, explanation: missingLessonIds.length
      ? "Your practice is strong. Complete the remaining lessons to finish the course."
      : "Your practice is strong. Submit your summary and receive valid feedback to finish the activity." } };
  return { recommendation: { kind: "courseComplete", reason: "Your questioning and summary are strong, and all lessons and the activity are complete." }, completionPending: null };
}

import { z } from "zod";
import { courseRegistry } from "@/content/courses/registry";
import { feedbackSchema, type ActivityAssessment, type DimensionAssessment } from "@/domain/feedback";
import { summaryFieldIds } from "@/domain/course";
import type { CourseLearningState, LearningState } from "@/domain/learning";
import { selectRecommendation } from "@/domain/recommendation";
import { summarySchema } from "@/domain/summary";
import type { LoadFailureReason } from "./LearningRepository";

export interface LearningSnapshot {
  schemaVersion: 1;
  contentVersion: string;
  courses: Readonly<Record<string, CourseLearningState>>;
  updatedAt: string;
}

const identifier = z.string().min(1).max(200).refine((value) => value.trim().length > 0);
const timestamp = z.string().refine((value) => Number.isFinite(Date.parse(value)));
const identity = { attemptId: identifier, submissionId: identifier, requestId: identifier, receivedAt: timestamp };
const recommendationSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("reviewLesson"), lessonId: identifier, reason: z.string().trim().min(1) }),
  z.strictObject({ kind: z.literal("retryActivity"), activityId: identifier, reason: z.string().trim().min(1) }),
  z.strictObject({ kind: z.literal("courseComplete"), reason: z.string().trim().min(1) }),
]);
const courseStateSchema = z.strictObject({
  completedLessonIds: z.array(identifier), currentLessonId: identifier.nullable(),
  earnedActivityCompletion: z.strictObject(identity).nullable(),
  latestAttemptMeta: z.strictObject({ attemptId: identifier,
    phase: z.enum(["notStarted", "openingPending", "interviewing", "summary", "feedbackPending", "completed"]),
  }).nullable(),
  latestSuccessfulResult: z.strictObject({ ...identity, scenarioVersion: z.literal("1"),
    summarySnapshot: summarySchema, feedback: feedbackSchema,
    recommendation: recommendationSchema.nullable(),
    completionPending: z.strictObject({ missingLessonIds: z.array(identifier), explanation: z.string().trim().min(1) }).nullable(),
  }).nullable(),
});
const snapshotSchema = z.strictObject({ schemaVersion: z.literal(1), contentVersion: z.string(),
  courses: z.record(z.string(), courseStateSchema), updatedAt: timestamp });
const contentVersion = courseRegistry["requirement-clarification"].course.contentVersion;

export type SnapshotValidationResult = { valid: true; snapshot: LearningSnapshot }
  | { valid: false; reason: Exclude<LoadFailureReason, "storageUnavailable"> };

function hasConsistentResult(courseId: string, state: CourseLearningState): boolean {
  const content = courseRegistry[courseId];
  const validLessons = (ids: readonly string[]) => new Set(ids).size === ids.length &&
    ids.every((id) => content.lessons.some((lesson) => lesson.id === id));
  if (!validLessons(state.completedLessonIds) ||
    (state.currentLessonId !== null && !validLessons([state.currentLessonId]))) return false;
  const result = state.latestSuccessfulResult;
  const earned = state.earnedActivityCompletion;
  const meta = state.latestAttemptMeta;
  if (!result) return earned === null && meta?.phase !== "completed";
  if (!earned || !meta || ["attemptId", "submissionId", "requestId", "receivedAt"].some((key) =>
    earned[key as keyof typeof earned] !== result[key as keyof typeof earned])) return false;
  if (meta.phase === "completed" ? meta.attemptId !== result.attemptId : meta.attemptId === result.attemptId) return false;
  if (!summaryFieldIds.every((id) => {
    const dimension = result.feedback.dimensions[id];
    return (result.summarySnapshot[id].trim().length > 0 || dimension.level === "Missing") && dimension.evidence.every((e) =>
      e.fieldId === id && (e.source === "absence" || (e.source === "summary" && result.summarySnapshot[id].includes(e.quote))));
  }) || !result.feedback.questioning.evidence.every((e) => e.source === "turn" || (e.source === "absence" && e.fieldId === null))) return false;
  const selection = selectRecommendation(result.feedback, courseId,
    { completedLessonIds: state.completedLessonIds, activityCompleted: true });
  // Compare the entire pair to the one shared selector. A different valid target
  // can still belong to an older feedback result and must not be paired with it.
  return JSON.stringify({ recommendation: result.recommendation, completionPending: result.completionPending }) === JSON.stringify(selection);
}

export function validateSnapshot(value: unknown): SnapshotValidationResult {
  if (typeof value === "object" && value !== null && "schemaVersion" in value && value.schemaVersion !== 1) {
    return { valid: false, reason: "unsupportedVersion" };
  }
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success) return { valid: false, reason: "invalidSnapshot" };
  if (parsed.data.contentVersion !== contentVersion) return { valid: false, reason: "contentMismatch" };
  const ids = Object.keys(parsed.data.courses);
  if (ids.length !== Object.keys(courseRegistry).length || ids.some((id) => !Object.hasOwn(courseRegistry, id))) {
    return { valid: false, reason: "invalidSnapshot" };
  }
  try {
    if (ids.some((id) => !hasConsistentResult(id, parsed.data.courses[id]))) return { valid: false, reason: "invalidSnapshot" };
    return { valid: true, snapshot: parsed.data };
  } catch {
    return { valid: false, reason: "invalidSnapshot" };
  }
}

export function snapshotToLearningState(snapshot: LearningSnapshot): LearningState {
  const parsed = validateSnapshot(snapshot);
  if (!parsed.valid) throw new Error("Cannot restore an invalid learning snapshot.");
  return { courses: Object.fromEntries(Object.entries(parsed.snapshot.courses).map(([id, course]) => [id, {
    ...course, latestSuccessfulResult: course.latestSuccessfulResult && {
      ...course.latestSuccessfulResult, ...selectRecommendation(course.latestSuccessfulResult.feedback, id,
        { completedLessonIds: course.completedLessonIds, activityCompleted: course.earnedActivityCompletion !== null }),
    },
  }])), activeAttempts: {} };
}

export function createSnapshot(state: LearningState, updatedAt = new Date().toISOString()): LearningSnapshot {
  const courses = Object.fromEntries(Object.entries(state.courses).map(([id, course]) => {
    const result = course.latestSuccessfulResult;
    return [id, {
      completedLessonIds: [...course.completedLessonIds], currentLessonId: course.currentLessonId,
      earnedActivityCompletion: course.earnedActivityCompletion && projectIdentity(course.earnedActivityCompletion),
      latestAttemptMeta: course.latestAttemptMeta && { attemptId: course.latestAttemptMeta.attemptId, phase: course.latestAttemptMeta.phase },
      latestSuccessfulResult: result && {
        ...projectIdentity(result), scenarioVersion: result.scenarioVersion,
        summarySnapshot: Object.fromEntries(summaryFieldIds.map((fieldId) => [fieldId, result.summarySnapshot[fieldId]])),
        feedback: projectFeedback(result.feedback),
        recommendation: result.recommendation && (result.recommendation.kind === "reviewLesson"
          ? { kind: result.recommendation.kind, lessonId: result.recommendation.lessonId, reason: result.recommendation.reason }
          : result.recommendation.kind === "retryActivity"
            ? { kind: result.recommendation.kind, activityId: result.recommendation.activityId, reason: result.recommendation.reason }
            : { kind: result.recommendation.kind, reason: result.recommendation.reason }),
        completionPending: result.completionPending && { missingLessonIds: [...result.completionPending.missingLessonIds], explanation: result.completionPending.explanation },
      },
    }];
  }));
  const parsed = validateSnapshot({ schemaVersion: 1, contentVersion, courses, updatedAt });
  if (!parsed.valid) throw new Error("Cannot save an invalid learning snapshot.");
  return parsed.snapshot;
}

function projectIdentity(value: NonNullable<CourseLearningState["earnedActivityCompletion"]>) {
  return { attemptId: value.attemptId, submissionId: value.submissionId, requestId: value.requestId, receivedAt: value.receivedAt };
}

function projectDimension(value: DimensionAssessment) {
  return { level: value.level, explanation: value.explanation, problemCodes: [...value.problemCodes],
    evidence: value.evidence.map(({ source, turnId, fieldId, quote, factId }) => ({ source, turnId, fieldId, quote, factId })) };
}

function projectFeedback(value: ActivityAssessment) {
  return { questioning: projectDimension(value.questioning),
    dimensions: Object.fromEntries(summaryFieldIds.map((id) => [id, projectDimension(value.dimensions[id])])),
    whatWentWell: [...value.whatWentWell], whatToImprove: [...value.whatToImprove] };
}

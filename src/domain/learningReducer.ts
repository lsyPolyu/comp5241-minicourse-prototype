import { summaryFieldIds, type PublishedCourse } from "./course";
import { clientSessionReducer, emptyClientSession, type ClientEvent } from "./clientSession";
import { emptySummary, summarySchema } from "./summary";
import { feedbackMatchesSubmission, feedbackSchema } from "./feedback";
import { selectRecommendation } from "./recommendation";
import {
  createCourseLearningState, type ActiveAttempt, type SummarySnapshot,
  type LatestSuccessfulResult, type LearningState, type RequestIdentity, type SubmittedSnapshot,
} from "./learning";

type Registry = Readonly<Record<string, PublishedCourse>>;
export type LearningAction =
  | { type: "LESSON_OPENED"; lessonId: string }
  | { type: "LESSON_COMPLETED"; lessonId: string }
  | { type: "RETRY_ACTIVITY"; attemptId: string }
  | { type: "CLIENT_EVENT"; attemptId: string; event: ClientEvent }
  | { type: "SUMMARY_CHANGED"; attemptId: string; summary: SummarySnapshot }
  | { type: "SUMMARY_SUBMITTED"; identity: RequestIdentity; snapshot: SubmittedSnapshot }
  | { type: "AI_FAILED"; identity: RequestIdentity; message: string }
  | { type: "RETRY_REQUEST"; identity: RequestIdentity; requestId: string }
  | { type: "FEEDBACK_SUCCEEDED"; result: LatestSuccessfulResult };
export type LearningEvent = { courseId: string } & LearningAction;

export function createLearningState(registry: Registry): LearningState {
  return {
    courses: Object.fromEntries(Object.keys(registry).map((id) => [id, createCourseLearningState()])),
    activeAttempts: {},
  };
}

function sameRequest(left: RequestIdentity | null, right: RequestIdentity) {
  return left !== null && left.attemptId === right.attemptId &&
    left.submissionId === right.submissionId && left.requestId === right.requestId;
}

function validResult(result: LatestSuccessfulResult, attempt: ActiveAttempt, content: PublishedCourse) {
  const feedback = feedbackSchema.safeParse(result.feedback);
  const recommendation = result.recommendation;
  return attempt.submittedSnapshot !== null && feedback.success &&
    feedbackMatchesSubmission(feedback.data, attempt.submittedSnapshot) &&
    result.scenarioVersion === "1" && Number.isFinite(Date.parse(result.receivedAt)) &&
    summaryFieldIds.every((id) => typeof result.summarySnapshot?.[id] === "string" && result.summarySnapshot[id] === attempt.submittedSnapshot!.summary[id]) &&
    (recommendation ? typeof recommendation.reason === "string" && recommendation.reason.trim().length > 0 && (recommendation.kind === "reviewLesson"
      ? content.lessons.some(({ id }) => id === recommendation.lessonId)
      : recommendation.kind === "retryActivity" ? content.activities.some(({ id }) => id === recommendation.activityId)
        : recommendation.kind === "courseComplete")
      : result.completionPending !== null && result.completionPending.missingLessonIds.every((id) => content.lessons.some((lesson) => lesson.id === id)));
}

export function learningReducer(state: LearningState, event: LearningEvent, registry: Registry): LearningState {
  if (!Object.hasOwn(registry, event.courseId)) return state;
  const content = registry[event.courseId];
  const course = state.courses[event.courseId];
  const attempt = state.activeAttempts[event.courseId];
  if (!course) return state;

  if (event.type === "LESSON_OPENED" || event.type === "LESSON_COMPLETED") {
    if (!content.lessons.some(({ id }) => id === event.lessonId)) return state;
    if (event.type === "LESSON_OPENED" && course.currentLessonId === event.lessonId) return state;
    if (event.type === "LESSON_COMPLETED" && course.completedLessonIds.includes(event.lessonId)) return state;
    let updated = event.type === "LESSON_OPENED"
      ? { ...course, currentLessonId: event.lessonId }
      : { ...course, completedLessonIds: [...course.completedLessonIds, event.lessonId] };
    if (event.type === "LESSON_COMPLETED" && updated.latestSuccessfulResult) {
      updated = { ...updated, latestSuccessfulResult: { ...updated.latestSuccessfulResult,
        ...selectRecommendation(updated.latestSuccessfulResult.feedback, event.courseId,
          { completedLessonIds: updated.completedLessonIds, activityCompleted: updated.earnedActivityCompletion !== null }, registry) } };
    }
    return { ...state, courses: { ...state.courses, [event.courseId]: updated } };
  }

  if (event.type === "RETRY_ACTIVITY") {
    if (!event.attemptId.trim() || course.latestAttemptMeta?.attemptId === event.attemptId) return state;
    const fresh: ActiveAttempt = {
      client: emptyClientSession,
      summaryDraft: { ...emptySummary },
      attemptId: event.attemptId, phase: "notStarted", submittedSnapshot: null, pendingRequest: null, error: null,
    };
    return {
      courses: { ...state.courses, [event.courseId]: { ...course, latestAttemptMeta: { attemptId: fresh.attemptId, phase: fresh.phase } } },
      activeAttempts: { ...state.activeAttempts, [event.courseId]: fresh },
    };
  }

  if (!attempt) return state;
  if (event.type === "SUMMARY_CHANGED") {
    if (attempt.attemptId !== event.attemptId || (attempt.pendingRequest && !attempt.error) || attempt.phase === "completed") return state;
    const parsed = summarySchema.safeParse(event.summary);
    if (!parsed.success) return state;
    return { ...state, activeAttempts: { ...state.activeAttempts, [event.courseId]: { ...attempt, summaryDraft: parsed.data } } };
  }
  if (event.type === "CLIENT_EVENT") {
    if (attempt.attemptId !== event.attemptId || attempt.phase === "completed" || attempt.phase === "feedbackPending") return state;
    const client = clientSessionReducer(attempt.client, event.event);
    if (client === attempt.client) return state;
    const phase = client.summaryOpen ? "summary" : client.pending?.request.mode === "opening" ? "openingPending" : client.messages.length ? "interviewing" : "notStarted";
    return {
      courses: { ...state.courses, [event.courseId]: { ...course, latestAttemptMeta: { attemptId: attempt.attemptId, phase } } },
      activeAttempts: { ...state.activeAttempts, [event.courseId]: { ...attempt, client, phase } },
    };
  }
  let updatedAttempt: ActiveAttempt;
  if (event.type === "SUMMARY_SUBMITTED") {
    if (attempt.attemptId !== event.identity.attemptId || (attempt.pendingRequest && !attempt.error) || attempt.client.pending || attempt.phase === "completed" ||
      !event.identity.requestId.trim() || !event.identity.submissionId.trim() ||
      event.snapshot.submissionId !== event.identity.submissionId ||
      !summaryFieldIds.every((id) => typeof event.snapshot.summary[id] === "string")) return state;
    updatedAttempt = {
      ...attempt, phase: "feedbackPending", pendingRequest: { ...event.identity }, error: null,
      submittedSnapshot: {
        submissionId: event.snapshot.submissionId, summary: { ...event.snapshot.summary },
        transcript: event.snapshot.transcript.map((turn) => ({ ...turn })),
      },
    };
  } else if (event.type === "AI_FAILED") {
    if (!sameRequest(attempt.pendingRequest, event.identity)) return state;
    updatedAttempt = { ...attempt, error: event.message };
  } else if (event.type === "RETRY_REQUEST") {
    if (!attempt.error || !sameRequest(attempt.pendingRequest, event.identity) || !event.requestId.trim() || event.requestId === event.identity.requestId) return state;
    updatedAttempt = { ...attempt, pendingRequest: { ...event.identity, requestId: event.requestId }, error: null };
  } else {
    if (attempt.error || !sameRequest(attempt.pendingRequest, event.result) || !validResult(event.result, attempt, content)) return state;
    const result = structuredClone({ ...event.result, ...selectRecommendation(event.result.feedback, event.courseId,
      { completedLessonIds: course.completedLessonIds, activityCompleted: true }, registry) });
    updatedAttempt = { ...attempt, phase: "completed", pendingRequest: null, error: null };
    return {
      courses: {
        ...state.courses,
        [event.courseId]: {
          ...course, latestSuccessfulResult: result,
          latestAttemptMeta: { attemptId: attempt.attemptId, phase: "completed" },
          earnedActivityCompletion: { attemptId: result.attemptId, submissionId: result.submissionId, requestId: result.requestId, receivedAt: result.receivedAt },
        },
      },
      activeAttempts: { ...state.activeAttempts, [event.courseId]: updatedAttempt },
    };
  }
  return {
    courses: { ...state.courses, [event.courseId]: { ...course, latestAttemptMeta: { attemptId: attempt.attemptId, phase: updatedAttempt.phase } } },
    activeAttempts: { ...state.activeAttempts, [event.courseId]: updatedAttempt },
  };
}

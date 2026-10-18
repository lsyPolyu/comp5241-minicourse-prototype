import { summaryFieldIds, type PublishedCourse } from "./course";
import {
  createCourseLearningState, type ActiveAttempt, type FeedbackDimension,
  type LatestSuccessfulResult, type LearningState, type RequestIdentity, type SubmittedSnapshot,
} from "./learning";

type Registry = Readonly<Record<string, PublishedCourse>>;
export type LearningAction =
  | { type: "LESSON_OPENED"; lessonId: string }
  | { type: "LESSON_COMPLETED"; lessonId: string }
  | { type: "RETRY_ACTIVITY"; attemptId: string }
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

function validDimension(value: FeedbackDimension | undefined) {
  return value && ["Strong", "Partial", "Missing"].includes(value.level) &&
    typeof value.explanation === "string" && value.explanation.trim().length > 0;
}

function validResult(result: LatestSuccessfulResult, attempt: ActiveAttempt, content: PublishedCourse) {
  const feedback = result.feedback;
  const recommendation = result.recommendation;
  return attempt.submittedSnapshot !== null && feedback && recommendation &&
    result.scenarioVersion.trim().length > 0 && Number.isFinite(Date.parse(result.receivedAt)) &&
    summaryFieldIds.every((id) => typeof result.summarySnapshot?.[id] === "string" && result.summarySnapshot[id] === attempt.submittedSnapshot!.summary[id]) &&
    validDimension(feedback.questioningProcess) &&
    summaryFieldIds.every((id) => validDimension(feedback.dimensions?.[id])) &&
    Array.isArray(feedback.whatYouDidWell) && Array.isArray(feedback.whatToImprove) &&
    [...feedback.whatYouDidWell, ...feedback.whatToImprove].every((text) => typeof text === "string" && text.trim().length > 0) &&
    typeof recommendation.reason === "string" && recommendation.reason.trim().length > 0 &&
    (recommendation.kind === "reviewLesson"
      ? content.lessons.some(({ id }) => id === recommendation.lessonId)
      : ["retryActivity", "courseComplete", "completionPending"].includes(recommendation.kind));
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
    const updated = event.type === "LESSON_OPENED"
      ? { ...course, currentLessonId: event.lessonId }
      : { ...course, completedLessonIds: [...course.completedLessonIds, event.lessonId] };
    return { ...state, courses: { ...state.courses, [event.courseId]: updated } };
  }

  if (event.type === "RETRY_ACTIVITY") {
    if (!event.attemptId.trim() || course.latestAttemptMeta?.attemptId === event.attemptId) return state;
    const fresh: ActiveAttempt = {
      attemptId: event.attemptId, phase: "notStarted", submittedSnapshot: null, pendingRequest: null, error: null,
    };
    return {
      courses: { ...state.courses, [event.courseId]: { ...course, latestAttemptMeta: { attemptId: fresh.attemptId, phase: fresh.phase } } },
      activeAttempts: { ...state.activeAttempts, [event.courseId]: fresh },
    };
  }

  if (!attempt) return state;
  let updatedAttempt: ActiveAttempt;
  if (event.type === "SUMMARY_SUBMITTED") {
    if (attempt.attemptId !== event.identity.attemptId || attempt.pendingRequest || attempt.phase === "completed" ||
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
    const result = structuredClone(event.result);
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

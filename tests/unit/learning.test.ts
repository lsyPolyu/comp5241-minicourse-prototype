import { describe, expect, it } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import type { FeedbackLevel, LatestSuccessfulResult, LearningState } from "@/domain/learning";
import { fixtureAssessment, fixtureSummary, fixtureTranscript } from "../fixtures/feedback";
import { createLearningState, learningReducer, type LearningAction } from "@/domain/learningReducer";
import { getProgress } from "@/domain/progress";

const courseId = "requirement-clarification";
const content = courseRegistry[courseId];
const summary = fixtureSummary;
const identity = { attemptId: "attempt-1", submissionId: "submission-1", requestId: "request-1" };
function reduce(state: LearningState, event: LearningAction) {
  return learningReducer(state, { ...event, courseId }, courseRegistry);
}
function pending() {
  let state = reduce(createLearningState(courseRegistry), { type: "RETRY_ACTIVITY", attemptId: identity.attemptId });
  state = reduce(state, { type: "SUMMARY_SUBMITTED", identity, snapshot: { submissionId: identity.submissionId, summary, transcript: fixtureTranscript } });
  return state;
}
function result(level: FeedbackLevel = "Strong"): LatestSuccessfulResult {
  return {
    ...identity, scenarioVersion: "1", summarySnapshot: { ...summary },
    feedback: fixtureAssessment(level),
    recommendation: { kind: "retryActivity", activityId: "client-interview", reason: "Practise asking more specific questions." },
    completionPending: null,
    receivedAt: "2026-10-18T04:00:00Z",
  };
}

describe("explicit lesson completion", () => {
  it("opening and switching only change currentLessonId; completion is explicit and idempotent", () => {
    let state = createLearningState(courseRegistry);
    for (const lesson of content.lessons) state = reduce(state, { type: "LESSON_OPENED", lessonId: lesson.id });
    expect(state.courses[courseId].currentLessonId).toBe("structure-requirements");
    expect(getProgress(content, state.courses[courseId]).percentage).toBe(0);
    state = reduce(state, { type: "LESSON_COMPLETED", lessonId: "what-to-ask" });
    expect(state.courses[courseId].completedLessonIds).toEqual(["what-to-ask"]);
    expect(reduce(state, { type: "LESSON_COMPLETED", lessonId: "what-to-ask" })).toBe(state);
    expect(getProgress(content, state.courses[courseId]).percentage).toBe(25);
  });
  it("rejects unknown lessons and unpublished courses", () => {
    const state = createLearningState(courseRegistry);
    expect(reduce(state, { type: "LESSON_COMPLETED", lessonId: "missing" })).toBe(state);
    for (const invalidId of ["git-basics", "toString", "missing"]) {
      expect(learningReducer(state, { type: "LESSON_OPENED", courseId: invalidId, lessonId: "why-clarify" }, courseRegistry)).toBe(state);
    }
  });
});

describe("activity completion and request identity (domain only)", () => {
  it("submission, pending and failure do not complete; retry retains the exact submitted work", () => {
    let state = pending();
    expect(getProgress(content, state.courses[courseId]).activityCompleted).toBe(false);
    const snapshot = state.activeAttempts[courseId].submittedSnapshot;
    state = reduce(state, { type: "AI_FAILED", identity, message: "Try again." });
    expect(state.courses[courseId].earnedActivityCompletion).toBeNull();
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: result() })).toBe(state);
    state = reduce(state, { type: "RETRY_REQUEST", identity, requestId: "request-2" });
    expect(state.activeAttempts[courseId].submittedSnapshot).toBe(snapshot);
    expect(state.activeAttempts[courseId].error).toBeNull();
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: result() })).toBe(state);
    state = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: { ...result(), requestId: "request-2" } });
    expect(state.courses[courseId].earnedActivityCompletion?.requestId).toBe("request-2");
  });

  it.each(["Strong", "Partial", "Missing"] as const)("%s assessment never replaces a lesson completion action", (level) => {
    let state = reduce(pending(), { type: "FEEDBACK_SUCCEEDED", result: result(level) });
    expect(getProgress(content, state.courses[courseId])).toMatchObject({ percentage: 25, activityCompleted: true, courseCompleted: false });
    for (const lesson of content.lessons) state = reduce(state, { type: "LESSON_COMPLETED", lessonId: lesson.id });
    expect(getProgress(content, state.courses[courseId])).toMatchObject({ percentage: 100, courseCompleted: true });
  });

  it("rejects stale attempt, submission and request IDs, missing dimensions and mismatched summary", () => {
    const state = pending();
    for (const field of ["attemptId", "submissionId", "requestId"] as const) {
      expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: { ...result(), [field]: "stale" } })).toBe(state);
    }
    const missing = result();
    missing.feedback = { ...missing.feedback, dimensions: {} as LatestSuccessfulResult["feedback"]["dimensions"] };
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: missing })).toBe(state);
    const mismatch = { ...result(), summarySnapshot: { ...summary, targetUser: "Changed after submission" } };
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: mismatch })).toBe(state);
    const empty = result();
    empty.feedback.questioning.explanation = " ";
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: empty })).toBe(state);
  });

  it("new practice retains earned completion and latest result; old responses cannot finish it", () => {
    const earned = reduce(pending(), { type: "FEEDBACK_SUCCEEDED", result: result("Missing") });
    let next = reduce(earned, { type: "RETRY_ACTIVITY", attemptId: "attempt-2" });
    expect(next.courses[courseId].earnedActivityCompletion).toBe(earned.courses[courseId].earnedActivityCompletion);
    expect(next.courses[courseId].latestSuccessfulResult).toBe(earned.courses[courseId].latestSuccessfulResult);
    expect(next.activeAttempts[courseId]).toMatchObject({ phase: "notStarted", submittedSnapshot: null, pendingRequest: null });
    expect(reduce(next, { type: "FEEDBACK_SUCCEEDED", result: result() })).toBe(next);
    const newIdentity = { ...identity, attemptId: "attempt-2", submissionId: "submission-2", requestId: "request-2" };
    next = reduce(next, { type: "SUMMARY_SUBMITTED", identity: newIdentity, snapshot: { submissionId: "submission-2", summary, transcript: [] } });
    next = reduce(next, { type: "AI_FAILED", identity: newIdentity, message: "Try again." });
    expect(next.courses[courseId].latestSuccessfulResult).toBe(earned.courses[courseId].latestSuccessfulResult);
    expect(next.courses[courseId].earnedActivityCompletion).toBe(earned.courses[courseId].earnedActivityCompletion);
    expect(next.activeAttempts[courseId].phase).toBe("feedbackPending");
  });

  it("rejects duplicate submissions and snapshots input to isolate later edits", () => {
    const state = pending();
    expect(reduce(state, { type: "SUMMARY_SUBMITTED", identity, snapshot: { submissionId: identity.submissionId, summary, transcript: [] } })).toBe(state);
    const feedback = result();
    const completed = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: feedback });
    const originalExplanation = feedback.feedback.questioning.explanation;
    feedback.feedback.questioning.explanation = "Changed externally";
    expect(completed.courses[courseId].latestSuccessfulResult?.feedback.questioning.explanation).toBe(originalExplanation);
    expect(reduce(completed, { type: "FEEDBACK_SUCCEEDED", result: result() })).toBe(completed);
  });
});

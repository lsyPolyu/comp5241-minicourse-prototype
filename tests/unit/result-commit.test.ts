import { expect, it } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import { createLearningState, learningReducer, type LearningAction } from "@/domain/learningReducer";
import { buildLearningResult } from "@/domain/buildLearningResult";
import type { LearningState } from "@/domain/learning";
import { getProgress } from "@/domain/progress";
import { emptyAssessment, fixtureAssessment, fixtureSummary, fixtureTranscript } from "../fixtures/feedback";
import { emptySummary } from "@/domain/summary";
const id = "requirement-clarification";
const identity = { attemptId: "a", submissionId: "s", requestId: "r" };
const reduce = (state: LearningState, action: LearningAction) => learningReducer(state, { ...action, courseId: id }, courseRegistry);
function pending(empty = false) {
  const state = reduce(createLearningState(courseRegistry), { type: "RETRY_ACTIVITY", attemptId: "a" });
  return reduce(state, { type: "SUMMARY_SUBMITTED", identity, snapshot: { submissionId: "s", summary: empty ? emptySummary : fixtureSummary, transcript: empty ? [] : fixtureTranscript } });
}
function result(state: LearningState, assessment = fixtureAssessment()) {
  return buildLearningResult({ ...identity, scenarioVersion: "1", assessment }, identity, state.activeAttempts[id].submittedSnapshot!, id, state.courses[id], "2026-10-18T12:00:00Z");
}
it("commits snapshot, assessment, recommendation and completion atomically, including the weakest feedback", () => {
  const state = pending(true); const feedback = result(state, emptyAssessment());
  const next = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: feedback });
  expect(next.activeAttempts[id]).toMatchObject({ phase: "completed", pendingRequest: null, error: null });
  expect(next.courses[id].earnedActivityCompletion).toMatchObject(identity);
  expect(next.courses[id].latestSuccessfulResult).toMatchObject({ ...identity, feedback: emptyAssessment(), summarySnapshot: emptySummary, recommendation: { kind: "reviewLesson", lessonId: "why-clarify" } });
  expect(getProgress(courseRegistry[id], next.courses[id])).toMatchObject({ activityCompleted: true, percentage: 25, courseCompleted: false });
  expect(reduce(next, { type: "FEEDBACK_SUCCEEDED", result: feedback })).toBe(next);
});
it("all Strong waits for explicit lessons; last lesson recomputes Complete without another request", () => {
  const state = pending();
  let next = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: result(state) });
  expect(next.courses[id].latestSuccessfulResult?.recommendation).toBeNull();
  expect(next.courses[id].latestSuccessfulResult?.completionPending?.missingLessonIds).toHaveLength(3);
  for (const lesson of courseRegistry[id].lessons) next = reduce(next, { type: "LESSON_COMPLETED", lessonId: lesson.id });
  expect(next.courses[id].latestSuccessfulResult?.recommendation?.kind).toBe("courseComplete");
  expect(next.courses[id].latestSuccessfulResult?.completionPending).toBeNull();
  expect(next.courses[id].latestSuccessfulResult?.submissionId).toBe("s");
});
it("recomputes against lessons completed while feedback is in flight", () => {
  let state = pending(); const response = result(state);
  for (const lesson of courseRegistry[id].lessons) state = reduce(state, { type: "LESSON_COMPLETED", lessonId: lesson.id });
  state = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: response });
  expect(state.courses[id].latestSuccessfulResult?.recommendation?.kind).toBe("courseComplete");
});
it("rejects all stale identity components and invalid evidence before any completion write", () => {
  const state = pending(); const response = result(state);
  for (const key of ["attemptId", "submissionId", "requestId"] as const) {
    expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: { ...response, [key]: "stale" } })).toBe(state);
  }
  const bad = structuredClone(response); bad.feedback.questioning.evidence[0].quote = "fabricated";
  expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: bad })).toBe(state);
  expect(reduce(state, { type: "FEEDBACK_SUCCEEDED", result: { ...response, summarySnapshot: emptySummary } })).toBe(state);
});
it("preserves old success through a new attempt's failure, and drops late responses", () => {
  const state = pending(); const old = result(state);
  const completed = reduce(state, { type: "FEEDBACK_SUCCEEDED", result: old });
  const nextIdentity = { attemptId: "a2", submissionId: "s2", requestId: "r2" };
  let next = reduce(completed, { type: "RETRY_ACTIVITY", attemptId: "a2" });
  next = reduce(next, { type: "SUMMARY_SUBMITTED", identity: nextIdentity, snapshot: { submissionId: "s2", summary: emptySummary, transcript: [] } });
  next = reduce(next, { type: "AI_FAILED", identity: nextIdentity, message: "Retry" });
  expect(next.courses[id].latestSuccessfulResult).toBe(completed.courses[id].latestSuccessfulResult);
  expect(next.courses[id].earnedActivityCompletion).toBe(completed.courses[id].earnedActivityCompletion);
  expect(next.activeAttempts[id].phase).toBe("feedbackPending");
  expect(reduce(next, { type: "FEEDBACK_SUCCEEDED", result: old })).toBe(next);
});

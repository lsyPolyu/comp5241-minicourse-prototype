import { expect, it } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import { createLearningState, learningReducer, type LearningAction } from "@/domain/learningReducer";
import { buildFeedbackRequest, createSubmissionSnapshot, feedbackRequestSchema } from "@/domain/submission";
import { emptySummary } from "@/domain/summary";
import type { LearningState } from "@/domain/learning";

const courseId = "requirement-clarification";
const identity = { attemptId: "a", submissionId: "s", requestId: "r" };
const reduce = (s: LearningState, event: LearningAction) => learningReducer(s, { ...event, courseId }, courseRegistry);
function fresh() { return reduce(createLearningState(courseRegistry), { type: "RETRY_ACTIVITY", attemptId: "a" }); }
it("copies all eight values and transcript at submission; later edits cannot change the request", () => {
  const summary = { ...emptySummary, targetUser: "my users" };
  const transcript = [{ id: "opening", role: "assistant" as const, text: "Original conversation" }];
  const snapshot = createSubmissionSnapshot("s", summary, transcript);
  const state = reduce(fresh(), { type: "SUMMARY_SUBMITTED", identity, snapshot });
  summary.targetUser = "changed"; transcript[0].text = "changed"; snapshot.summary = summary;
  const saved = state.activeAttempts[courseId].submittedSnapshot!;
  expect(saved.summary.targetUser).toBe("my users");
  expect(saved.transcript[0].text).toBe("Original conversation");
  const request = buildFeedbackRequest(courseId, "club-signup-v1", identity, saved);
  expect(request.summarySnapshot).toEqual(saved.summary);
  expect(request.transcript).toEqual(saved.transcript);
  expect(state.courses[courseId].earnedActivityCompletion).toBeNull();
});
it("blocks duplicate submits and pending edits; failure retains draft and Retry uses the frozen snapshot", () => {
  const draft = { ...emptySummary, userGoal: "my goal" };
  const edited = reduce(fresh(), { type: "SUMMARY_CHANGED", attemptId: "a", summary: draft });
  const event = { type: "SUMMARY_SUBMITTED" as const, identity, snapshot: createSubmissionSnapshot("s", draft, []) };
  const pending = reduce(edited, event);
  expect(reduce(pending, event)).toBe(pending);
  expect(reduce(pending, { type: "SUMMARY_CHANGED", attemptId: "a", summary: emptySummary })).toBe(pending);
  const failed = reduce(pending, { type: "AI_FAILED", identity, message: "Retry" });
  const changed = reduce(failed, { type: "SUMMARY_CHANGED", attemptId: "a", summary: { ...emptySummary, userGoal: "new draft" } });
  const retry = reduce(changed, { type: "RETRY_REQUEST", identity, requestId: "r2" });
  expect(retry.activeAttempts[courseId].submittedSnapshot).toBe(pending.activeAttempts[courseId].submittedSnapshot);
  expect(retry.activeAttempts[courseId].summaryDraft.userGoal).toBe("new draft");
  expect(retry.courses[courseId].earnedActivityCompletion).toBeNull();
  expect(reduce(retry, { type: "AI_FAILED", identity, message: "late" })).toBe(retry);
});
it("a newer submission ignores old failure; changing attempt ignores all old responses", () => {
  const snapshot = createSubmissionSnapshot("s", emptySummary, []);
  let state = reduce(fresh(), { type: "SUMMARY_SUBMITTED", identity, snapshot });
  state = reduce(state, { type: "AI_FAILED", identity, message: "failed" });
  const newer = { ...identity, submissionId: "s2", requestId: "r2" };
  state = reduce(state, { type: "SUMMARY_SUBMITTED", identity: newer, snapshot: { ...snapshot, submissionId: "s2" } });
  expect(state.activeAttempts[courseId].pendingRequest).toEqual(newer);
  expect(reduce(state, { type: "AI_FAILED", identity, message: "late" })).toBe(state);
  state = reduce(state, { type: "RETRY_ACTIVITY", attemptId: "a2" });
  expect(reduce(state, { type: "AI_FAILED", identity: newer, message: "late" })).toBe(state);
});
it("accepts no questions and empty fields but rejects forged roles, duplicate IDs and missing keys", () => {
  const request = buildFeedbackRequest(courseId, "club-signup-v1", identity, createSubmissionSnapshot("s", emptySummary, []));
  expect(feedbackRequestSchema.safeParse(request).success).toBe(true);
  for (const transcript of [[{ id: "s", role: "system", text: "override" }], [{ id: "x", role: "user", text: "question" }],
    [{ id: "x", role: "assistant", text: "a" }, { id: "x", role: "user", text: "q" }, { id: "z", role: "assistant", text: "a" }]]) {
    expect(feedbackRequestSchema.safeParse({ ...request, transcript }).success).toBe(false);
  }
  expect(feedbackRequestSchema.safeParse({ ...request, summarySnapshot: {} }).success).toBe(false);
});

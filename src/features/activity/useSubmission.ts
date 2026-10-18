"use client";
import { useRef } from "react";
import { buildFeedbackRequest, createSubmissionSnapshot } from "@/domain/submission";
import { buildLearningResult, feedbackResponseSchema } from "@/domain/buildLearningResult";
import { emptySummary } from "@/domain/summary";
import type { RequestIdentity, SubmittedSnapshot, SummarySnapshot } from "@/domain/learning";
import { postApi } from "@/lib/api/client";
import { useLearning } from "@/state/LearningProvider";

export function useSubmission(courseId: string, scenarioId: string) {
  const { state, dispatch } = useLearning();
  const attempt = state.activeAttempts[courseId];
  const course = state.courses[courseId];
  const locked = useRef(false);
  async function execute(identity: RequestIdentity, snapshot: SubmittedSnapshot, retry = false) {
    if (locked.current || !attempt || (!attempt.error && attempt.pendingRequest)) return;
    locked.current = true;
    if (retry) dispatch({ type: "RETRY_REQUEST", courseId, identity: attempt.pendingRequest!, requestId: identity.requestId });
    else dispatch({ type: "SUMMARY_SUBMITTED", courseId, identity, snapshot });
    try {
      const request = buildFeedbackRequest(courseId, scenarioId, identity, snapshot);
      const response = await postApi("/api/ai/feedback", request, feedbackResponseSchema);
      if (!response.ok) dispatch({ type: "AI_FAILED", courseId, identity, message: response.error.message });
      else {
        const result = buildLearningResult(response.data, identity, snapshot, courseId, course, new Date().toISOString());
        dispatch({ type: "FEEDBACK_SUCCEEDED", courseId, result });
      }
    } catch {
      dispatch({ type: "AI_FAILED", courseId, identity, message: "Unable to get feedback. Your summary and conversation are still here. Retry." });
    } finally { locked.current = false; }
  }
  function submit() {
    if (!attempt || attempt.phase === "completed" || attempt.client.pending || locked.current) return;
    const identity = { attemptId: attempt.attemptId, submissionId: crypto.randomUUID(), requestId: crypto.randomUUID() };
    const snapshot = createSubmissionSnapshot(identity.submissionId, attempt.summaryDraft,
      attempt.client.messages.map(({ id, role, content }) => ({ id, role, text: content })));
    return execute(identity, snapshot);
  }
  function retry() {
    if (!attempt?.error || !attempt.pendingRequest || !attempt.submittedSnapshot) return;
    return execute({ ...attempt.pendingRequest, requestId: crypto.randomUUID() }, attempt.submittedSnapshot, true);
  }
  function changeSummary(summary: SummarySnapshot) {
    if (attempt) dispatch({ type: "SUMMARY_CHANGED", courseId, attemptId: attempt.attemptId, summary });
  }
  return { summary: attempt?.summaryDraft ?? emptySummary, changeSummary, submit, retry,
    pending: !!attempt?.pendingRequest && !attempt.error, error: attempt?.error,
    completed: attempt?.phase === "completed", result: course.latestSuccessfulResult,
    clientPending: !!attempt?.client.pending, attemptId: attempt?.attemptId };
}

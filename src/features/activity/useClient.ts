"use client";

import { useRef } from "react";
import { clientReplySchema, clientRequestSchema, type ClientRequest } from "@/domain/client";
import { emptyClientSession, type ClientEvent, type ClientSnapshot } from "@/domain/clientSession";
import { useLearning } from "@/state/LearningProvider";
import { postApi } from "@/lib/api/client";

export function useClient(courseId: string, scenarioId: string) {
  const { state, dispatch } = useLearning();
  const attempt = state.activeAttempts[courseId];
  const session = attempt?.client ?? emptyClientSession;
  const locked = useRef(false);
  const readOnly = attempt?.phase === "completed" || attempt?.phase === "feedbackPending";
  function update(event: ClientEvent, attemptId = attempt?.attemptId) {
    if (attemptId) dispatch({ type: "CLIENT_EVENT", courseId, attemptId, event });
  }
  async function execute(snapshot: ClientSnapshot) {
    if (locked.current || session.pending || readOnly) return;
    locked.current = true;
    const attemptId = snapshot.request.attemptId;
    update({ type: "REQUEST_STARTED", snapshot }, attemptId);
    try {
      const response = await postApi("/api/ai/client", snapshot.request, clientReplySchema);
      if (response.ok) update({ type: "REQUEST_SUCCEEDED", requestId: snapshot.requestId, answer: response.data }, attemptId);
      else update({ type: "REQUEST_FAILED", requestId: snapshot.requestId, error: response.error }, attemptId);
    } catch {
      update({ type: "REQUEST_FAILED", requestId: snapshot.requestId, error: { code: "UNAVAILABLE", message: "Unable to reach Maya. Your work is still here. Retry.", retryable: true } }, attemptId);
    } finally { locked.current = false; }
  }
  function start() {
    if (session.pending || locked.current || session.messages.length) return;
    const attemptId = attempt?.attemptId ?? crypto.randomUUID();
    if (!attempt) dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId });
    const request = clientRequestSchema.parse({ mode: "opening", courseId, scenarioId, attemptId });
    return execute({ requestId: crypto.randomUUID(), request });
  }
  function send() {
    if (!attempt || !session.messages.length) return;
    const parsed = clientRequestSchema.safeParse({ mode: "turn", courseId, scenarioId, attemptId: attempt.attemptId,
      question: session.question, transcript: session.messages.map((message) => message.role === "user"
        ? { role: message.role, content: message.content } : { role: message.role, content: message.content, factIds: [...message.factIds] }),
    });
    if (parsed.success) return execute({ requestId: crypto.randomUUID(), request: parsed.data });
  }
  function retry() {
    if (session.failed) return execute({ ...session.failed, requestId: crypto.randomUUID() });
  }
  function showSummary(open: boolean) {
    if (!attempt) {
      const attemptId = crypto.randomUUID();
      dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId });
      update({ type: "SUMMARY_TOGGLED", open }, attemptId);
    } else update({ type: "SUMMARY_TOGGLED", open });
  }
  const snapshot = session.pending ?? session.failed;
  const pendingQuestion: Extract<ClientRequest, { mode: "turn" }> | null = snapshot?.request.mode === "turn" ? snapshot.request : null;
  return { session, start, send, retry, showSummary, readOnly,
    setQuestion: (question: string) => update({ type: "QUESTION_CHANGED", question }),
    messages: pendingQuestion ? [...session.messages, { id: `${snapshot!.requestId}:user`, role: "user" as const, content: pendingQuestion.question }] : session.messages,
  };
}

"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import { tutorTextSchema, tutorRequestSchema } from "@/domain/tutor";
import { createTutorSnapshot, emptyTutorSession, tutorReducer, tutorSessionKey, type TutorRequestSnapshot, type TutorSessions } from "@/domain/tutorSession";
import { postApi } from "@/lib/api/client";

interface TutorContextValue {
  sessions: TutorSessions;
  setQuestion(courseId: string, lessonId: string, question: string): void;
  send(courseId: string, lessonId: string): Promise<void>;
  retry(courseId: string, lessonId: string): Promise<void>;
}
const TutorContext = createContext<TutorContextValue | null>(null);

export function TutorProvider({ children }: { children: ReactNode }) {
  const [sessions, dispatch] = useReducer(tutorReducer, {});
  const pending = useRef(new Map<string, string>());
  const execute = useCallback(async (key: string, snapshot: TutorRequestSnapshot) => {
    if (pending.current.has(key)) return;
    pending.current.set(key, snapshot.requestId);
    dispatch({ type: "REQUEST_STARTED", key, snapshot });
    try {
      const response = await postApi("/api/ai/tutor", snapshot.request, tutorTextSchema);
      if (response.ok) dispatch({ type: "REQUEST_SUCCEEDED", key, requestId: snapshot.requestId, answer: response.data });
      else dispatch({ type: "REQUEST_FAILED", key, requestId: snapshot.requestId, error: response.error });
    } catch {
      dispatch({ type: "REQUEST_FAILED", key, requestId: snapshot.requestId, error: { code: "UNAVAILABLE", message: "Unable to reach the Tutor. Your work is still here. Retry.", retryable: true } });
    } finally {
      if (pending.current.get(key) === snapshot.requestId) pending.current.delete(key);
    }
  }, []);
  const setQuestion = useCallback((courseId: string, lessonId: string, question: string) => {
    dispatch({ type: "QUESTION_CHANGED", key: tutorSessionKey(courseId, lessonId), question });
  }, []);
  const send = useCallback(async (courseId: string, lessonId: string) => {
    const key = tutorSessionKey(courseId, lessonId);
    const snapshot = createTutorSnapshot(sessions[key] ?? emptyTutorSession, courseId, lessonId, crypto.randomUUID());
    if (!tutorRequestSchema.safeParse(snapshot.request).success) return;
    await execute(key, snapshot);
  }, [sessions, execute]);
  const retry = useCallback(async (courseId: string, lessonId: string) => {
    const key = tutorSessionKey(courseId, lessonId);
    const failed = sessions[key]?.failedRequest;
    if (failed) await execute(key, { ...failed, requestId: crypto.randomUUID() });
  }, [sessions, execute]);
  const value = useMemo(() => ({ sessions, setQuestion, send, retry }), [sessions, setQuestion, send, retry]);
  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
}

export function useTutorSession(courseId: string, lessonId: string) {
  const context = useContext(TutorContext);
  if (!context) throw new Error("Tutor components require TutorProvider.");
  return {
    session: context.sessions[tutorSessionKey(courseId, lessonId)] ?? emptyTutorSession,
    setQuestion: (question: string) => context.setQuestion(courseId, lessonId, question),
    send: () => context.send(courseId, lessonId), retry: () => context.retry(courseId, lessonId),
  };
}

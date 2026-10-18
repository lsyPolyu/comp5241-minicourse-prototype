import type { ApiError } from "@/lib/api/contracts";
import { TUTOR_HISTORY_LIMIT, type TutorAnswer, type TutorMessage, type TutorRequest } from "./tutor";

export interface TutorTurn extends TutorMessage { id: string }
export interface TutorRequestSnapshot { requestId: string; turnId: string; request: TutorRequest }
export interface TutorSession {
  messages: readonly TutorTurn[];
  currentQuestion: string;
  pendingRequest: TutorRequestSnapshot | null;
  failedRequest: TutorRequestSnapshot | null;
  error: ApiError | null;
}
export type TutorSessions = Readonly<Record<string, TutorSession>>;
export const emptyTutorSession: TutorSession = { messages: [], currentQuestion: "", pendingRequest: null, failedRequest: null, error: null };
export const tutorSessionKey = (courseId: string, lessonId: string) => `${courseId}:${lessonId}`;

export function createTutorSnapshot(session: TutorSession, courseId: string, lessonId: string, requestId: string): TutorRequestSnapshot {
  return {
    requestId, turnId: requestId,
    request: {
      courseId, lessonId, question: session.currentQuestion.trim(),
      conversation: session.messages.slice(-TUTOR_HISTORY_LIMIT).map(({ role, content }) => ({ role, content })),
    },
  };
}

export type TutorEvent = { key: string } & (
  | { type: "QUESTION_CHANGED"; question: string }
  | { type: "REQUEST_STARTED"; snapshot: TutorRequestSnapshot }
  | { type: "REQUEST_SUCCEEDED"; requestId: string; answer: TutorAnswer }
  | { type: "REQUEST_FAILED"; requestId: string; error: ApiError }
);

export function tutorReducer(state: TutorSessions, event: TutorEvent): TutorSessions {
  const session = state[event.key] ?? emptyTutorSession;
  let updated: TutorSession;
  if (event.type === "QUESTION_CHANGED") {
    updated = { ...session, currentQuestion: event.question };
  } else if (event.type === "REQUEST_STARTED") {
    if (session.pendingRequest) return state;
    updated = { ...session, pendingRequest: event.snapshot, failedRequest: null, error: null };
  } else {
    const snapshot = session.pendingRequest;
    if (!snapshot || snapshot.requestId !== event.requestId) return state;
    if (event.type === "REQUEST_FAILED") {
      updated = { ...session, pendingRequest: null, failedRequest: snapshot, error: event.error };
    } else {
      updated = {
        ...session, pendingRequest: null, failedRequest: null, error: null,
        currentQuestion: session.currentQuestion.trim() === snapshot.request.question ? "" : session.currentQuestion,
        messages: [...session.messages,
          { id: `${snapshot.turnId}:user`, role: "user", content: snapshot.request.question },
          { id: `${snapshot.turnId}:assistant`, role: "assistant", content: event.answer },
        ],
      };
    }
  }
  return { ...state, [event.key]: updated };
}

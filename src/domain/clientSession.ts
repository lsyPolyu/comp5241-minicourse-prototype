import type { ApiError } from "@/lib/api/contracts";
import type { ClientMessage, ClientReply, ClientRequest } from "./client";

export type ClientTurn = ClientMessage & { id: string };
export interface ClientSnapshot { requestId: string; request: ClientRequest }
export interface ClientSession {
  messages: readonly ClientTurn[];
  question: string;
  pending: ClientSnapshot | null;
  failed: ClientSnapshot | null;
  error: ApiError | null;
  summaryOpen: boolean;
}
export const emptyClientSession: ClientSession = { messages: [], question: "", pending: null, failed: null, error: null, summaryOpen: false };
export type ClientEvent =
  | { type: "QUESTION_CHANGED"; question: string }
  | { type: "SUMMARY_TOGGLED"; open: boolean }
  | { type: "REQUEST_STARTED"; snapshot: ClientSnapshot }
  | { type: "REQUEST_SUCCEEDED"; requestId: string; answer: ClientReply }
  | { type: "REQUEST_FAILED"; requestId: string; error: ApiError };

export function clientSessionReducer(session: ClientSession, event: ClientEvent): ClientSession {
  if (event.type === "QUESTION_CHANGED") return { ...session, question: event.question };
  if (event.type === "SUMMARY_TOGGLED") return { ...session, summaryOpen: event.open };
  if (event.type === "REQUEST_STARTED") {
    if (session.pending) return session;
    return { ...session, pending: structuredClone(event.snapshot), failed: null, error: null };
  }
  const snapshot = session.pending;
  if (!snapshot || snapshot.requestId !== event.requestId) return session;
  if (event.type === "REQUEST_FAILED") return { ...session, pending: null, failed: snapshot, error: event.error };
  const { request } = snapshot;
  const messages: ClientTurn[] = request.mode === "turn"
    ? [{ id: `${snapshot.requestId}:user`, role: "user", content: request.question }]
    : [];
  messages.push({ id: `${snapshot.requestId}:assistant`, role: "assistant", content: event.answer.reply, factIds: [...event.answer.factIds] });
  return {
    ...session, pending: null, failed: null, error: null,
    question: request.mode === "turn" && session.question.trim() === request.question ? "" : session.question,
    messages: [...session.messages, ...messages],
  };
}

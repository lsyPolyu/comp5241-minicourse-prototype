import { expect, it } from "vitest";
import { createTutorSnapshot, emptyTutorSession, tutorReducer, type TutorSession, type TutorSessions } from "@/domain/tutorSession";

const key = "course:lesson";
const error = { code: "TIMEOUT", message: "Your work is still here. Retry.", retryable: true };
const snapshot = createTutorSnapshot({ ...emptyTutorSession, currentQuestion: " question " }, "course", "lesson", "request-1");

it("retains questions and history through failure, and ignores stale responses", () => {
  let state = tutorReducer({}, { type: "QUESTION_CHANGED", key, question: "question" });
  state = tutorReducer(state, { type: "REQUEST_STARTED", key, snapshot });
  expect(tutorReducer(state, { type: "REQUEST_STARTED", key, snapshot })).toBe(state);
  expect(tutorReducer(state, { type: "REQUEST_SUCCEEDED", key, requestId: "stale", answer: "wrong" })).toBe(state);
  state = tutorReducer(state, { type: "REQUEST_FAILED", key, requestId: "request-1", error });
  expect(state[key]).toMatchObject({ currentQuestion: "question", messages: [], failedRequest: snapshot, error });
  const retry = { ...state[key].failedRequest!, requestId: "request-2" };
  state = tutorReducer(state, { type: "REQUEST_STARTED", key, snapshot: retry });
  state = tutorReducer(state, { type: "REQUEST_SUCCEEDED", key, requestId: "request-2", answer: "answer" });
  expect(state[key].messages.map(({ role, content }) => ({ role, content }))).toEqual([{ role: "user", content: "question" }, { role: "assistant", content: "answer" }]);
  expect(state[key].currentQuestion).toBe("");
  expect(state[key].failedRequest).toBeNull();
});

it("keeps a draft edited during a request, and isolates per-lesson replies", () => {
  let state: TutorSessions = tutorReducer({}, { type: "REQUEST_STARTED", key, snapshot });
  state = tutorReducer(state, { type: "QUESTION_CHANGED", key, question: "new draft" });
  state = tutorReducer(state, { type: "QUESTION_CHANGED", key: "course:other", question: "other lesson question" });
  state = tutorReducer(state, { type: "REQUEST_SUCCEEDED", key, requestId: snapshot.requestId, answer: "answer" });
  expect(state[key].currentQuestion).toBe("new draft");
  expect(state["course:other"]).toMatchObject({ currentQuestion: "other lesson question", messages: [] });
});

it("sends at most six recent complete pairs while preserving the full session in memory", () => {
  const session: TutorSession = {
    ...emptyTutorSession, currentQuestion: "follow-up",
    messages: Array.from({ length: 20 }, (_, index) => ({ id: String(index), role: index % 2 ? "assistant" : "user", content: `message ${index}` })),
  };
  const next = createTutorSnapshot(session, "course", "lesson", "request");
  expect(next.request.conversation).toHaveLength(12);
  expect(next.request.conversation[0]).toEqual({ role: "user", content: "message 8" });
  expect(next.request.conversation.at(-1)).toEqual({ role: "assistant", content: "message 19" });
  expect(session.messages).toHaveLength(20);
});

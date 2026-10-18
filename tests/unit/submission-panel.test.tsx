// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityWorkspace } from "@/features/activity/ActivityWorkspace";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
import type { FeedbackRequest } from "@/domain/submission";
import { emptyAssessment, fixtureAssessment, fixtureSummary } from "../fixtures/feedback";
import { summaryFields } from "@/domain/summary";
const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ postApi: api.post }));
const courseId = "requirement-clarification";
const failure = { ok: false, requestId: "app", error: { code: "TIMEOUT", message: "Your work is still here. Retry.", retryable: true } };
function answer(request: FeedbackRequest, assessment = emptyAssessment()) {
  return { ok: true, requestId: "app", data: { attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId, scenarioVersion: "1", assessment } };
}
function Observer() {
  const { state, dispatch } = useLearning();
  return <><output aria-label="Earned completion">{state.courses[courseId].earnedActivityCompletion ? "complete" : "incomplete"}</output>
    <button onClick={() => dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId: crypto.randomUUID() })}>Test new attempt</button></>;
}
function view(show = true) { return <LearningProvider>{show && <ActivityWorkspace courseId={courseId} scenarioId="club-signup-v1" />}<Observer /></LearningProvider>; }
function openSummary() { fireEvent.click(screen.getByRole("button", { name: "Continue to summary" })); }
function submit() { fireEvent.click(screen.getByRole("button", { name: "Submit Summary for Feedback" })); }
beforeEach(() => { api.post.mockReset(); }); afterEach(cleanup);
it("accepts blank fields, locks pending snapshot, prevents duplicates and completes only after weak valid feedback", async () => {
  let release!: (value: unknown) => void;
  api.post.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
  render(view()); openSummary(); submit();
  expect(api.post).toHaveBeenCalledOnce();
  fireEvent.submit(screen.getByRole("form", { name: "Requirement summary" }));
  expect(api.post).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Earned completion").textContent).toBe("incomplete");
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).disabled).toBe(true);
  await act(async () => release(answer(api.post.mock.calls[0][1])));
  expect(screen.getByLabelText("Earned completion").textContent).toBe("complete");
  expect(screen.getByRole("heading", { name: "Your feedback" })).toBe(document.activeElement);
  expect(screen.getByRole("list", { name: "Nine feedback dimensions" }).children).toHaveLength(9);
  expect(screen.getAllByText("Missing", { exact: false }).length).toBeGreaterThanOrEqual(9);
  expect(screen.getByRole("heading", { name: "Recommended next action" })).toBeTruthy();
});
it("failure preserves eight inputs/conversation; Retry uses the original snapshot despite draft edits", async () => {
  api.post.mockImplementation(async (path, request) => path.endsWith("client") ? { ok: true, data: { reply: "Maya's actual opening", factIds: [], disclosedFactIds: [] } }
    : api.post.mock.calls.filter(([p]) => p.endsWith("feedback")).length === 1 ? failure : answer(request));
  render(view()); fireEvent.click(screen.getByRole("button", { name: "Start interview" })); await screen.findByRole("log");
  openSummary();
  for (const field of summaryFields) fireEvent.change(screen.getByLabelText(field.label), { target: { value: `my ${field.id}` } });
  submit(); await screen.findByRole("alert");
  expect(screen.getByRole("log").textContent).toContain("Maya's actual opening");
  for (const field of summaryFields) expect((screen.getByLabelText(field.label) as HTMLTextAreaElement).value).toBe(`my ${field.id}`);
  const first = api.post.mock.calls[1][1];
  fireEvent.change(screen.getByLabelText("User Goal"), { target: { value: "new draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Retry feedback" }));
  await screen.findByRole("heading", { name: "Your feedback" });
  const retry = api.post.mock.calls[2][1];
  expect(retry).toEqual({ ...first, requestId: expect.any(String) }); expect(retry.requestId).not.toBe(first.requestId);
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).value).toBe("new draft");
  fireEvent.click(screen.getByText("View submitted summary"));
  expect(screen.getByText("my userGoal", { exact: true })).toBeTruthy();
});
it("keeps pending feedback across unmount and ignores a late response after a new attempt", async () => {
  let release!: (value: unknown) => void;
  api.post.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
  const { rerender } = render(view()); openSummary(); submit(); const first = api.post.mock.calls[0][1];
  rerender(view(false)); await act(async () => release(answer(first))); rerender(view());
  expect(screen.getByRole("heading", { name: "Your feedback" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Test new attempt" })); openSummary(); submit();
  const second = api.post.mock.calls[1][1];
  fireEvent.click(screen.getByRole("button", { name: "Test new attempt" }));
  await act(async () => release(answer(second)));
  expect(screen.queryByRole("heading", { name: "Your feedback" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Previous successful feedback" })).toBeTruthy();
});
it("keeps previous success and earned completion visible when a newer request fails", async () => {
  api.post.mockImplementation(async (_path, request) => api.post.mock.calls.length === 1 ? answer(request) : failure);
  render(view()); openSummary(); submit(); await screen.findByRole("heading", { name: "Your feedback" });
  fireEvent.click(screen.getByRole("button", { name: "Test new attempt" })); openSummary(); submit(); await screen.findByRole("alert");
  expect(screen.getByRole("heading", { name: "Previous successful feedback" })).toBeTruthy();
  expect(screen.getByLabelText("Earned completion").textContent).toBe("complete");
  expect(screen.getByLabelText("Feedback request status").textContent).toContain("Activity incomplete");
});
it("renders strong feedback with missing-lesson guidance, never an early Course Complete", async () => {
  api.post.mockImplementation(async (path, request) => {
    if (path.endsWith("client")) return { ok: true, data: { reply: "Actual client reply", factIds: [], disclosedFactIds: [] } };
    const assessment = fixtureAssessment(); const turn = request.transcript.find((entry: { role: string }) => entry.role === "user");
    assessment.questioning.evidence[0].turnId = turn.id; assessment.questioning.evidence[0].quote = turn.text;
    return answer(request, assessment);
  });
  render(view()); fireEvent.click(screen.getByRole("button", { name: "Start interview" })); await screen.findByRole("log");
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Who will use this and why?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" })); await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
  openSummary(); for (const field of summaryFields) fireEvent.change(screen.getByLabelText(field.label), { target: { value: fixtureSummary[field.id] } });
  submit(); await screen.findByRole("heading", { name: "Your feedback" });
  expect(screen.getByText("Your practice is strong. Complete the remaining lessons to finish the course.")).toBeTruthy();
  expect(screen.queryByText("Course Complete", { exact: true })).toBeNull();
});

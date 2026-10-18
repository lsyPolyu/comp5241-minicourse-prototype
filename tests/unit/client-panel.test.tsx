// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityWorkspace } from "@/features/activity/ActivityWorkspace";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ postApi: api.post }));
const courseId = "requirement-clarification";
const opening = "Our club needs a simple website so students can sign up for events more easily. Can you help us work out what it should do?";
const success = (reply = opening, factIds: string[] = []) => ({ ok: true, requestId: "r", data: { reply, factIds, disclosedFactIds: factIds } });
const failure = { ok: false, requestId: "r", error: { code: "TIMEOUT", message: "Your work is still here. Retry.", retryable: true } };
function Observer() { const { state } = useLearning(); return <output aria-label="Activity completion">{state.courses[courseId].earnedActivityCompletion ? "complete" : "incomplete"}</output>; }
function view(show = true) { return <LearningProvider>{show && <ActivityWorkspace courseId={courseId} scenarioId="club-signup-v1" />}<Observer /></LearningProvider>; }
function send(text: string) { fireEvent.change(screen.getByLabelText("Your question"), { target: { value: text } }); fireEvent.click(screen.getByRole("button", { name: "Send question" })); }
beforeEach(() => api.post.mockReset());
afterEach(cleanup);
it("does not auto-request, supports zero-question summary and grants no completion", () => {
  render(view());
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continue to summary" }));
  expect(screen.getByText(/summary form is not available yet/)).toBeTruthy();
  expect(screen.getByLabelText("Activity completion").textContent).toBe("incomplete");
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("preserves opening failure, provides explicit exact Retry and never invents a reply", async () => {
  api.post.mockResolvedValueOnce(failure).mockResolvedValueOnce(success());
  render(view());
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("log")).toBeNull();
  expect(api.post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("log");
  expect(api.post.mock.calls[1][1]).toEqual(api.post.mock.calls[0][1]);
  expect(screen.getByRole("log").textContent).toContain(opening);
});
it("prevents duplicate sends, keeps failure transcript, retries original snapshot and retains newer draft", async () => {
  let release!: (value: unknown) => void;
  api.post.mockResolvedValueOnce(success()).mockImplementationOnce(() => new Promise((resolve) => { release = resolve; })).mockResolvedValueOnce(success("The main users are students.", ["F01"]));
  render(view());
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  await screen.findByRole("textbox");
  send("Who is this for?");
  expect((screen.getByRole("button", { name: "Send question" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.submit(screen.getByRole("button", { name: "Send question" }).closest("form")!);
  expect(api.post).toHaveBeenCalledTimes(2);
  await act(async () => release(failure));
  await screen.findByRole("alert");
  expect(screen.getByRole("log").textContent).toContain(opening);
  expect(screen.getByRole("log").textContent).not.toContain("The main users");
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "A new draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.getByRole("log").textContent).toContain("The main users"));
  expect(api.post.mock.calls[2][1]).toEqual(api.post.mock.calls[1][1]);
  expect(screen.getAllByText("Who is this for?", { exact: true })).toHaveLength(1);
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("A new draft");
  expect(screen.getByLabelText("Activity completion").textContent).toBe("incomplete");
});
it("keeps pending responses and drafts across workspace unmount/remount", async () => {
  let release!: (value: unknown) => void;
  api.post.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  const { rerender } = render(view());
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  rerender(view(false));
  await act(async () => release(success()));
  rerender(view());
  expect(screen.getByRole("log").textContent).toContain(opening);
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "keep this draft" } });
  rerender(view(false)); rerender(view());
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("keep this draft");
});
it("shows internal IDs only in request state, never as learning content", async () => {
  api.post.mockResolvedValueOnce(success()).mockResolvedValueOnce(success("Visible client reply", ["F08"]));
  const { container } = render(view());
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  await screen.findByRole("textbox"); send("What are the limits?");
  await screen.findByText("Visible client reply");
  expect(container.textContent).not.toContain("F08");
});

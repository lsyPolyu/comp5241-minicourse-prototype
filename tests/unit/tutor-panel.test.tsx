// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TutorPanel } from "@/features/tutor/TutorPanel";
import { TutorProvider } from "@/state/TutorProvider";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
import { CompleteLessonButton } from "@/features/lessons/CompleteLessonButton";

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ postApi: api.post }));
beforeEach(() => { api.post.mockReset(); });
afterEach(cleanup);
const courseId = "requirement-clarification";
const success = (answer = "A constraint is a limit.") => ({ ok: true, requestId: "r", data: answer });
const failure = { ok: false, requestId: "r", error: { code: "TIMEOUT", message: "AI took too long. Your work is still here. Retry.", retryable: true } };
function LearningObserver() {
  const { state } = useLearning();
  return <output aria-label="Completed lessons">{state.courses[courseId].completedLessonIds.length}</output>;
}
function view(lessonId = "what-to-ask") {
  return <LearningProvider><TutorProvider><TutorPanel courseId={courseId} lessonId={lessonId} /><CompleteLessonButton courseId={courseId} lessonId={lessonId} /><LearningObserver /></TutorProvider></LearningProvider>;
}
function ask(question: string) {
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
}

it("keeps input during loading, prevents duplicate sends and completes no lessons", async () => {
  let resolve!: (value: unknown) => void;
  api.post.mockImplementation(() => new Promise((done) => { resolve = done; }));
  render(view());
  ask("What is a constraint?");
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("What is a constraint?");
  expect(screen.getByRole("status", { name: "Tutor request status" }).textContent).toContain("answering");
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Completed lessons").textContent).toBe("0");
  await act(async () => resolve(success()));
  expect(document.activeElement).toBe(screen.getByLabelText("Your question"));
  expect(screen.getByRole("log").textContent).toContain("A constraint is a limit.");
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("");
  expect(screen.getByLabelText("Completed lessons").textContent).toBe("0");
  fireEvent.click(screen.getByRole("button", { name: "Complete Lesson" }));
  expect(screen.getByLabelText("Completed lessons").textContent).toBe("1");
});

it("failure preserves history and question; Retry uses the original snapshot once", async () => {
  api.post.mockResolvedValueOnce(success()).mockResolvedValueOnce(failure).mockResolvedValueOnce(success("Phones can be a device constraint."));
  render(view());
  ask("What is a constraint?");
  await screen.findByText("A constraint is a limit.");
  ask("Give a simpler example.");
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("Give a simpler example.");
  expect(screen.getByRole("log").textContent).toContain("A constraint is a limit.");
  const failedInput = api.post.mock.calls[1][1];
  expect(failedInput.conversation).toEqual([{ role: "user", content: "What is a constraint?" }, { role: "assistant", content: "A constraint is a limit." }]);
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "A new draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("Phones can be a device constraint.");
  expect(api.post.mock.calls[2][1]).toBe(failedInput);
  expect(screen.getAllByText("Give a simpler example.")).toHaveLength(1);
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("A new draft");
  expect(screen.getByLabelText("Completed lessons").textContent).toBe("0");
});

it("retains per-lesson sessions through reader switches, including in-flight replies", async () => {
  let resolve!: (value: unknown) => void;
  api.post.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const { rerender } = render(view());
  ask("What is a constraint?");
  rerender(view("why-clarify"));
  expect(screen.queryByRole("log")).toBeNull();
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Lesson one draft" } });
  await act(async () => resolve(success()));
  expect(screen.queryByText("A constraint is a limit.")).toBeNull();
  rerender(view());
  expect(screen.getByText("A constraint is a limit.")).toBeTruthy();
  rerender(view("why-clarify"));
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("Lesson one draft");
});

it("renders AI output as plain text and rejects blank input without a request", async () => {
  api.post.mockResolvedValue(success('<img src=x onerror="alert(1)">'));
  const { container } = render(view());
  ask("   ");
  expect(api.post).not.toHaveBeenCalled();
  ask("Give an example.");
  await waitFor(() => expect(screen.getByRole("log").textContent).toContain("<img"));
  expect(container.querySelector("img")).toBeNull();
});

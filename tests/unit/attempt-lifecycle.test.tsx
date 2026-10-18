// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityWorkspace } from "@/features/activity/ActivityWorkspace";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
import type { ClientRequest } from "@/domain/client";
import type { LearningState } from "@/domain/learning";
import type { FeedbackRequest } from "@/domain/submission";
import { emptyAssessment } from "../fixtures/feedback";
import type { LearningRepository } from "@/persistence/LearningRepository";
import type { LearningSnapshot } from "@/persistence/snapshot";

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ postApi: api.post }));
const courseId = "requirement-clarification";
beforeEach(() => { api.post.mockReset(); });
afterEach(cleanup);
function Controls() {
  const { state, dispatch } = useLearning();
  return <><output aria-label="Learning state">{JSON.stringify(state)}</output>
    <button onClick={() => dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId: crypto.randomUUID() })}>Replace active attempt</button></>;
}
const open = () => fireEvent.click(screen.getByRole("button", { name: "Continue to summary" }));
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Submit Summary for Feedback" }));
function success(request: FeedbackRequest) {
  return { ok: true, data: { attemptId: request.attemptId, submissionId: request.submissionId,
    requestId: request.requestId, scenarioVersion: "1", assessment: emptyAssessment() } };
}
const readState = () => JSON.parse(screen.getByLabelText("Learning state").textContent!) as LearningState;
const clientSuccess = (reply: string) => ({ ok: true, data: { reply, factIds: [], disclosedFactIds: [] } });

it("a replacement attempt can submit while the old request waits; only its success replaces the saved result", async () => {
  const saves: LearningSnapshot[] = [];
  const repository: LearningRepository = { load: () => ({ status: "empty" }), save: (snapshot) => { saves.push(snapshot); return { status: "saved" }; } };
  const waiting: { request: FeedbackRequest; resolve: (value: unknown) => void }[] = [];
  api.post.mockImplementation((_path, request) => new Promise((resolve) => waiting.push({ request, resolve })));
  render(<LearningProvider repository={repository}><ActivityWorkspace courseId={courseId} scenarioId="club-signup-v1" /><Controls /></LearningProvider>);
  open(); submit();
  await act(async () => waiting[0].resolve(success(waiting[0].request)));
  const old = saves.at(-1)!.courses[courseId].latestSuccessfulResult!;
  fireEvent.click(screen.getByRole("button", { name: "Start a new practice" }));
  open();
  fireEvent.change(screen.getByLabelText("User Goal"), { target: { value: "Unfinished draft" } });
  submit();
  expect(saves.at(-1)!.courses[courseId].latestSuccessfulResult).toEqual(old);
  fireEvent.click(screen.getByRole("button", { name: "Replace active attempt" }));
  open();
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).value).toBe("");
  submit();
  expect(waiting).toHaveLength(3);
  expect(waiting[2].request.attemptId).not.toBe(waiting[1].request.attemptId);
  expect(saves.at(-1)!.courses[courseId].latestSuccessfulResult).toEqual(old);
  await act(async () => waiting[2].resolve(success(waiting[2].request)));
  const newest = saves.at(-1)!.courses[courseId];
  expect(newest.latestSuccessfulResult!.requestId).toBe(waiting[2].request.requestId);
  expect(newest.earnedActivityCompletion!.requestId).toBe(waiting[2].request.requestId);
  await act(async () => waiting[1].resolve(success(waiting[1].request)));
  expect(saves.at(-1)!.courses[courseId]).toEqual(newest);
  expect(screen.getByRole("heading", { name: "Your feedback" })).toBeTruthy();
});

it("keeps the old result through a new attempt's feedback failure and replaces it atomically when that request is retried", async () => {
  const saves: LearningSnapshot[] = [];
  const repository: LearningRepository = { load: () => ({ status: "empty" }), save: (snapshot) => { saves.push(snapshot); return { status: "saved" }; } };
  const waiting: { request: FeedbackRequest; resolve: (value: unknown) => void }[] = [];
  api.post.mockImplementation((path, request) => path.endsWith("client")
    ? Promise.resolve(clientSuccess(request.mode === "opening" ? "Current client opening." : "Current client answer."))
    : new Promise((resolve) => waiting.push({ request, resolve })));
  render(<LearningProvider repository={repository}><ActivityWorkspace courseId={courseId} scenarioId="club-signup-v1" /><Controls /></LearningProvider>);
  open(); submit();
  await act(async () => waiting[0].resolve(success(waiting[0].request)));
  const old = saves.at(-1)!.courses[courseId];

  fireEvent.click(screen.getByRole("button", { name: "Start a new practice" }));
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  await screen.findByText("Current client opening.");
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "What is the current goal?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  await screen.findByText("Current client answer.");
  open();
  fireEvent.change(screen.getByLabelText("User Goal"), { target: { value: "Current submitted goal" } });
  submit();
  const submitted = waiting[1].request;
  expect(submitted.attemptId).not.toBe(old.latestSuccessfulResult!.attemptId);
  expect(submitted.transcript.map(({ text }) => text)).toEqual(["Current client opening.", "What is the current goal?", "Current client answer."]);
  expect(saves.at(-1)!.courses[courseId]).toMatchObject({
    latestSuccessfulResult: old.latestSuccessfulResult, earnedActivityCompletion: old.earnedActivityCompletion,
    latestAttemptMeta: { attemptId: submitted.attemptId, phase: "feedbackPending" },
  });
  await act(async () => waiting[1].resolve({ ok: false, error: { code: "TIMEOUT", message: "Feedback timed out. Retry.", retryable: true } }));
  expect(screen.getByRole("heading", { name: "Previous successful feedback" })).toBeTruthy();
  expect(screen.getByRole("log").textContent).toContain("Current client answer.");
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).value).toBe("Current submitted goal");
  expect(saves.at(-1)!.courses[courseId].latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect(saves.at(-1)!.courses[courseId].earnedActivityCompletion).toEqual(old.earnedActivityCompletion);

  fireEvent.change(screen.getByLabelText("User Goal"), { target: { value: "Later unsent draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Retry feedback" }));
  const retried = waiting[2].request;
  expect(retried).toEqual({ ...submitted, requestId: expect.any(String) });
  expect(retried.requestId).not.toBe(submitted.requestId);
  expect(readState().activeAttempts[courseId].attemptId).toBe(submitted.attemptId);
  expect(saves.at(-1)!.courses[courseId].latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect(saves.at(-1)!.courses[courseId].earnedActivityCompletion).toEqual(old.earnedActivityCompletion);
  const replacement = success(retried);
  replacement.data.assessment.dimensions.userGoal.explanation = "Clarify the goal from this new submission.";
  await act(async () => waiting[2].resolve(replacement));

  const latest = saves.at(-1)!.courses[courseId];
  expect(latest.latestSuccessfulResult).toMatchObject({
    attemptId: retried.attemptId, submissionId: retried.submissionId, requestId: retried.requestId,
    summarySnapshot: retried.summarySnapshot, feedback: replacement.data.assessment,
    recommendation: { kind: "reviewLesson", lessonId: "why-clarify", reason: "User Goal: Missing. Clarify the goal from this new submission." },
  });
  expect(latest.earnedActivityCompletion).toMatchObject({ attemptId: retried.attemptId, submissionId: retried.submissionId, requestId: retried.requestId });
  expect(latest.latestAttemptMeta).toEqual({ attemptId: retried.attemptId, phase: "completed" });
  expect(readState().activeAttempts[courseId]).toMatchObject({ phase: "completed", pendingRequest: null, error: null });
  expect(latest.latestSuccessfulResult!.summarySnapshot.userGoal).toBe("Current submitted goal");
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).value).toBe("Later unsent draft");
  expect(screen.getByRole("heading", { name: "Your feedback" })).toBeTruthy();
  for (const snapshot of saves) {
    const saved = snapshot.courses[courseId];
    expect(saved.earnedActivityCompletion?.requestId).toBe(saved.latestSuccessfulResult?.requestId);
    expect(saved.earnedActivityCompletion?.submissionId).toBe(saved.latestSuccessfulResult?.submissionId);
    expect(saved.earnedActivityCompletion?.attemptId).toBe(saved.latestSuccessfulResult?.attemptId);
  }
});

it.each(["opening", "turn"] as const)("ignores a late Client %s after replacing its attempt, while the new interview stays usable", async (mode) => {
  const waiting: { request: ClientRequest; resolve: (value: unknown) => void }[] = [];
  api.post.mockImplementation((_path, request) => new Promise((resolve) => waiting.push({ request, resolve })));
  const repository: LearningRepository = { load: () => ({ status: "empty" }), save: () => ({ status: "saved" }) };
  render(<LearningProvider repository={repository}><ActivityWorkspace courseId={courseId} scenarioId="club-signup-v1" /><Controls /></LearningProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  if (mode === "turn") {
    await act(async () => waiting[0].resolve(clientSuccess("Previous opening.")));
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Previous question" } });
    fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  }
  const stale = waiting.at(-1)!;
  expect(stale.request.mode).toBe(mode);
  fireEvent.click(screen.getByRole("button", { name: "Replace active attempt" }));
  const newAttemptId = readState().activeAttempts[courseId].attemptId;
  expect(newAttemptId).not.toBe(stale.request.attemptId);
  fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
  const current = waiting.at(-1)!;
  expect(current.request.attemptId).toBe(newAttemptId);
  expect(current.request.mode).toBe("opening");
  await act(async () => current.resolve(clientSuccess("New attempt opening.")));
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "New attempt question draft" } });
  open();
  fireEvent.change(screen.getByLabelText("User Goal"), { target: { value: "New attempt summary draft" } });
  const beforeLateResponse = readState();
  await act(async () => stale.resolve(clientSuccess(`Stale ${mode} response.`)));
  expect(readState()).toEqual(beforeLateResponse);
  expect(screen.getByRole("log").textContent).toContain("New attempt opening.");
  expect(screen.queryByText(`Stale ${mode} response.`)).toBeNull();
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("New attempt question draft");
  expect((screen.getByLabelText("User Goal") as HTMLTextAreaElement).value).toBe("New attempt summary draft");
});

// @vitest-environment jsdom
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import { createLearningState } from "@/domain/learningReducer";
import { getProgress } from "@/domain/progress";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
import type { LearningRepository, LoadResult } from "@/persistence/LearningRepository";
import { createSnapshot } from "@/persistence/snapshot";

const courseId = "requirement-clarification";
afterEach(cleanup);
function Observer() {
  const { state, dispatch } = useLearning();
  return <>
    <output aria-label="State">{JSON.stringify(state)}</output>
    <output aria-label="Progress">{getProgress(courseRegistry[courseId], state.courses[courseId]).percentage}</output>
    <button onClick={() => dispatch({ type: "LESSON_COMPLETED", courseId, lessonId: "what-to-ask" })}>Complete another lesson</button>
    <button onClick={() => dispatch({ type: "LESSON_OPENED", courseId, lessonId: "structure-requirements" })}>Open another lesson</button>
    <button onClick={() => dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId: "fresh-attempt" })}>New attempt</button>
  </>;
}
function savedState() {
  const state = createLearningState(courseRegistry);
  state.courses[courseId].completedLessonIds = ["why-clarify"];
  state.courses[courseId].currentLessonId = "what-to-ask";
  return state;
}
function repository(result: LoadResult): LearningRepository {
  return { load: vi.fn(() => result), save: vi.fn(() => ({ status: "saved" as const })) };
}

it("server output is neutral and reads/writes no browser storage", () => {
  const repo = repository({ status: "empty" });
  const html = renderToString(<LearningProvider repository={repo}><Observer /></LearningProvider>);
  expect(html).toContain("Restoring progress");
  expect(html).not.toContain("Complete another lesson");
  expect(repo.load).not.toHaveBeenCalled(); expect(repo.save).not.toHaveBeenCalled();
});

it("StrictMode loads before child actions, never overwrites restored progress with defaults, then saves real changes", () => {
  const state = savedState(); const snapshot = createSnapshot(state);
  const repo = repository({ status: "loaded", state, snapshot });
  vi.mocked(repo.load).mockImplementation(() => {
    expect(repo.save).not.toHaveBeenCalled();
    return { status: "loaded", state, snapshot };
  });
  render(<StrictMode><LearningProvider repository={repo}><Observer /></LearningProvider></StrictMode>);
  expect(screen.getByLabelText("Progress").textContent).toBe("25");
  expect(screen.getByLabelText("State").textContent).toContain('"currentLessonId":"what-to-ask"');
  expect(repo.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Complete another lesson"));
  expect(screen.getByLabelText("Progress").textContent).toBe("50");
  expect(repo.save).toHaveBeenCalledOnce();
  expect(vi.mocked(repo.save).mock.calls[0][0].courses[courseId].completedLessonIds).toEqual(["why-clarify", "what-to-ask"]);
  fireEvent.click(screen.getByText("Open another lesson"));
  expect(vi.mocked(repo.save).mock.calls.at(-1)![0].courses[courseId].currentLessonId).toBe("structure-requirements");
  fireEvent.click(screen.getByText("New attempt"));
  expect(vi.mocked(repo.save).mock.calls.at(-1)![0].courses[courseId].latestAttemptMeta).toEqual({ attemptId: "fresh-attempt", phase: "notStarted" });
});

it.each(["invalidSnapshot", "unsupportedVersion", "contentMismatch", "storageUnavailable"] as const)("%s keeps original storage protected while session learning continues", (reason) => {
  const repo = repository({ status: "error", reason });
  render(<LearningProvider repository={repo}><Observer /></LearningProvider>);
  expect(screen.getByRole("status", { name: "Progress storage status" }).textContent).toContain("Progress cannot be saved in this browser");
  fireEvent.click(screen.getByText("Complete another lesson"));
  expect(screen.getByLabelText("Progress").textContent).toBe("25");
  expect(repo.save).not.toHaveBeenCalled();
});

it("quota/write failure retains current memory state and stops claiming persistence", () => {
  const repo = repository({ status: "empty" });
  vi.mocked(repo.save).mockReturnValue({ status: "error", reason: "storageUnavailable" });
  render(<LearningProvider repository={repo}><Observer /></LearningProvider>);
  fireEvent.click(screen.getByText("Complete another lesson"));
  expect(screen.getByLabelText("Progress").textContent).toBe("25");
  expect(screen.getByRole("status", { name: "Progress storage status" }).textContent).toContain("Progress cannot be saved");
  fireEvent.click(screen.getByText("Open another lesson"));
  expect(screen.getByLabelText("State").textContent).toContain("structure-requirements");
  expect(repo.save).toHaveBeenCalledOnce();
});

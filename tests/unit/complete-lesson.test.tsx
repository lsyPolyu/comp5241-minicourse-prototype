// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LearningProvider, useLearning } from "@/state/LearningProvider";
import { CompleteLessonButton } from "@/features/lessons/CompleteLessonButton";

afterEach(cleanup);
const courseId = "requirement-clarification";
function StateObserver() {
  const { state } = useLearning();
  return <output aria-label="Learning state">{JSON.stringify(state.courses[courseId])}</output>;
}
function state() { return JSON.parse(screen.getByLabelText("Learning state").textContent!); }

describe("CompleteLessonButton with the real reducer and provider", () => {
  it("opening only sets current lesson; clicking completes exactly that lesson once", () => {
    render(<LearningProvider><CompleteLessonButton courseId={courseId} lessonId="what-to-ask" /><StateObserver /></LearningProvider>);
    expect(state().currentLessonId).toBe("what-to-ask");
    expect(state().completedLessonIds).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Complete Lesson" }));
    const completed = screen.getByRole("button", { name: "Completed" }) as HTMLButtonElement;
    expect(completed.disabled).toBe(true);
    expect(screen.getByRole("status", { name: "Lesson completion" }).textContent).toBe("This lesson is completed.");
    fireEvent.click(completed);
    expect(state().completedLessonIds).toEqual(["what-to-ask"]);
    expect(state().earnedActivityCompletion).toBeNull();
  });

  it("switching readers preserves earned completion and never completes the next lesson", () => {
    const view = (lessonId: string) => <LearningProvider><CompleteLessonButton courseId={courseId} lessonId={lessonId} /><StateObserver /></LearningProvider>;
    const { rerender } = render(view("why-clarify"));
    fireEvent.click(screen.getByRole("button", { name: "Complete Lesson" }));
    rerender(view("structure-requirements"));
    expect(state().currentLessonId).toBe("structure-requirements");
    expect(state().completedLessonIds).toEqual(["why-clarify"]);
    expect((screen.getByRole("button", { name: "Complete Lesson" }) as HTMLButtonElement).disabled).toBe(false);
    rerender(view("why-clarify"));
    expect((screen.getByRole("button", { name: "Completed" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import type { LatestSuccessfulResult, LearningState } from "@/domain/learning";
import { createLearningState } from "@/domain/learningReducer";
import { RecommendationCard } from "@/features/recommendation/RecommendationCard";
import { CourseCompleteView } from "@/features/progress/CourseCompleteView";
import { ProgressView } from "@/features/progress/ProgressView";
import { fixtureAssessment, fixtureSummary } from "../fixtures/feedback";

const learning = vi.hoisted(() => ({ state: null as unknown as LearningState, dispatch: vi.fn() }));
vi.mock("@/state/LearningProvider", () => ({ useLearning: () => learning }));
vi.mock("next/link", () => ({
  default: ({ onNavigate, ...props }: ComponentProps<"a"> & { onNavigate?: () => void }) =>
    <a {...props} onClick={(event) => { event.preventDefault(); onNavigate?.(); }} />,
}));
const courseId = "requirement-clarification";
const content = courseRegistry[courseId];
const identity = { attemptId: "successful-attempt", submissionId: "submitted-summary", requestId: "feedback-request" };
function result(overrides: Partial<LatestSuccessfulResult> = {}): LatestSuccessfulResult {
  return { ...identity, scenarioVersion: "1", receivedAt: "2026-10-18T12:00:00Z", summarySnapshot: fixtureSummary,
    feedback: fixtureAssessment(), recommendation: { kind: "retryActivity", activityId: "client-interview", reason: "Clarify which needs have priority." },
    completionPending: null, ...overrides };
}
function completeCourse() {
  learning.state = { ...learning.state, courses: { ...learning.state.courses, [courseId]: {
    ...learning.state.courses[courseId], completedLessonIds: content.lessons.map(({ id }) => id),
    earnedActivityCompletion: { ...identity, receivedAt: "2026-10-18T12:00:00Z" },
  } } };
}
function setResult(latestSuccessfulResult: LatestSuccessfulResult) {
  learning.state = { ...learning.state, courses: { ...learning.state.courses, [courseId]: {
    ...learning.state.courses[courseId], latestSuccessfulResult,
  } } };
}
beforeEach(() => { learning.state = createLearningState(courseRegistry); learning.dispatch.mockReset(); });
afterEach(cleanup);

it.each(content.lessons)("links review for $id to its implemented lesson and preserves the result's exact reason", (lesson) => {
  completeCourse();
  const reason = `Evidence from your submission: review ${lesson.title}.`;
  render(<RecommendationCard courseId={courseId} result={result({ recommendation: { kind: "reviewLesson", lessonId: lesson.id, reason } })} />);
  expect(screen.getByText(reason)).toBeTruthy();
  expect(screen.getByRole("link", { name: `Review Lesson ${lesson.order}` }).getAttribute("href"))
    .toBe(`/courses/${content.course.slug}/lessons/${lesson.id}`);
  expect(screen.queryByRole("link", { name: "View final summary" })).toBeNull();
});

it("starts a fresh attempt when navigating to Retry Activity and targets the existing activity", () => {
  render(<RecommendationCard courseId={courseId} result={result()} />);
  const retry = screen.getByRole("link", { name: "Retry Activity" });
  expect(retry.getAttribute("href")).toBe(`/courses/${content.course.slug}/activity`);
  fireEvent.click(retry);
  expect(learning.dispatch).toHaveBeenCalledWith({ type: "RETRY_ACTIVITY", courseId, attemptId: expect.any(String) });
  const firstId = learning.dispatch.mock.calls[0][0].attemptId;
  fireEvent.click(retry);
  expect(learning.dispatch.mock.calls[1][0].attemptId).not.toBe(firstId);
});

it("makes each missing lesson actionable without displaying an early Complete", () => {
  render(<RecommendationCard courseId={courseId} result={result({ recommendation: null,
    completionPending: { missingLessonIds: content.lessons.map(({ id }) => id), explanation: "Complete the remaining lessons to finish the course." } })} />);
  for (const lesson of content.lessons) {
    expect(screen.getByRole("link", { name: `Continue to Lesson ${lesson.order}: ${lesson.title}` }).getAttribute("href"))
      .toBe(`/courses/${content.course.slug}/lessons/${lesson.id}`);
  }
  expect(screen.queryByText("Course Complete", { exact: true })).toBeNull();
});

it("guards the final-summary target with actual completion and offers a fresh practice after completion", () => {
  const complete = result({ recommendation: { kind: "courseComplete", reason: "Your practice is strong and all learning units are complete." } });
  const { rerender } = render(<RecommendationCard courseId={courseId} result={complete} />);
  expect(screen.queryByRole("link", { name: "View final summary" })).toBeNull();
  completeCourse(); rerender(<RecommendationCard courseId={courseId} result={complete} />);
  expect(screen.getByRole("link", { name: "View final summary" }).getAttribute("href")).toBe("/progress#course-complete");
  expect(screen.getByRole("link", { name: "Retry Activity" })).toBeTruthy();
});

it("does not construct recommendation links for Coming Soon or unknown targets", () => {
  const { rerender } = render(<RecommendationCard courseId="git-basics" result={result()} />);
  expect(screen.queryByRole("link")).toBeNull();
  rerender(<RecommendationCard courseId={courseId} result={result({ recommendation: { kind: "reviewLesson", lessonId: "future-lesson", reason: "Unknown target" } })} />);
  expect(screen.queryByRole("link")).toBeNull();
  rerender(<RecommendationCard courseId={courseId} result={result({ recommendation: { kind: "retryActivity", activityId: "future-activity", reason: "Unknown target" } })} />);
  expect(screen.queryByRole("link")).toBeNull();
});

it("only shows the final student summary after actual completion, including a weak successful result", () => {
  const successful = result({ feedback: fixtureAssessment("Missing"),
    recommendation: { kind: "reviewLesson", lessonId: "what-to-ask", reason: "You have not asked the client a question yet." } });
  setResult(successful);
  const { rerender } = render(<CourseCompleteView content={content} />);
  expect(screen.queryByRole("heading", { name: "Course Complete" })).toBeNull();
  completeCourse(); rerender(<CourseCompleteView content={content} />);
  expect(screen.getByRole("heading", { name: "Course Complete" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Your final submitted summary" })).toBeTruthy();
  expect(screen.getByText(fixtureSummary.userGoal)).toBeTruthy();
  expect(document.querySelector("#course-complete")).toBeTruthy();
  const latestStudentGoal = "My newest successful summary\nkeeps the student's own wording.";
  setResult({ ...successful, submissionId: "newest-submission", summarySnapshot: { ...fixtureSummary, userGoal: latestStudentGoal } });
  rerender(<CourseCompleteView content={content} />);
  expect(document.querySelectorAll(".final-summary dd")[1].textContent).toBe(latestStudentGoal);
  expect(screen.queryByText(fixtureSummary.userGoal)).toBeNull();
});

it("shows actionable empty feedback on Progress without outdated session or unavailable-feature claims", () => {
  render(<ProgressView content={content} />);
  expect(screen.getByText("No feedback yet. Interview the client and submit your own summary to receive feedback.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open activity" }).getAttribute("href")).toBe(`/courses/${content.course.slug}/activity`);
  expect(screen.queryByText(/new session|not available yet|kept during this visit/i)).toBeNull();
});

it("Progress displays the latest successful feedback and marks it previous during a newer unfinished practice", () => {
  completeCourse();
  setResult(result({ recommendation: { kind: "reviewLesson", lessonId: "what-to-ask", reason: "Your questions did not explore constraints." } }));
  learning.state = { ...learning.state, courses: { ...learning.state.courses, [courseId]: {
    ...learning.state.courses[courseId], latestAttemptMeta: { attemptId: "new-unfinished", phase: "feedbackPending" },
  } } };
  render(<ProgressView content={content} />);
  expect(screen.getByRole("heading", { name: "Latest successful feedback" })).toBeTruthy();
  expect(screen.getByText(/This feedback belongs to your previous successful submission/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Review Lesson 2" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Your final submitted summary" })).toBeTruthy();
  expect(screen.getByRole("list", { name: "Nine feedback dimensions" }).children).toHaveLength(9);
  expect(screen.getByRole("heading", { name: "Latest successful feedback" })).not.toBe(document.activeElement);
});

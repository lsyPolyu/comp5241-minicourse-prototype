import { expect, test } from "@playwright/test";
import { summaryFields } from "../../src/domain/summary";
import { fixtureSummary } from "../fixtures/feedback";
import { activityPath, clientAnswer, clientOpening, controlledAi, coursePath, feedbackResponse, lessonIds, savedCourse, tutorAnswer } from "../fixtures/ai";

test("new student completes the Dashboard-to-Progress learning loop with explicit lessons and valid feedback", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const ai = controlledAi(); await ai.install(page);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("link", { name: "View course", exact: true }).click();
  await expect(page).toHaveURL(coursePath);
  await expect(page.getByText("Module progress: 0 / 3 lessons · Activity incomplete", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "What is Requirement Clarification?", exact: true }).click();

  for (const [index, id] of lessonIds.entries()) {
    await expect(page).toHaveURL(`${coursePath}/lessons/${id}`);
    await expect(page.getByRole("article", { name: "Lesson content" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    await expect.poll(async () => (await savedCourse(page))?.completedLessonIds).toEqual(lessonIds.slice(0, index));
    if (index === 1) {
      await page.getByLabel("Your question", { exact: true }).fill("What is a constraint?");
      await page.getByRole("button", { name: "Send question", exact: true }).click();
      await expect(page.getByRole("log", { name: "Tutor conversation" })).toContainText(tutorAnswer);
      expect(ai.requests.tutor[0]).toMatchObject({ lessonId: id, question: "What is a constraint?", conversation: [] });
      expect((await savedCourse(page))?.completedLessonIds).toEqual([lessonIds[0]]);
    }
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
    await expect.poll(async () => (await savedCourse(page))?.completedLessonIds).toEqual(lessonIds.slice(0, index + 1));
    await page.getByRole("link", { name: index < 2 ? `Next: Lesson ${index + 2}` : "Next: Activity", exact: true }).click();
  }

  await expect(page).toHaveURL(activityPath);
  expect((await savedCourse(page))?.earnedActivityCompletion).toBeNull();
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
  await expect(page.getByText("Module progress: 3 / 3 lessons · Activity incomplete", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
  await page.getByRole("button", { name: "Start interview", exact: true }).click();
  await expect(page.getByRole("log", { name: "Client conversation" })).toContainText(clientOpening);
  await page.getByLabel("Your question", { exact: true }).fill("Who will use this and why do they need it?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("log", { name: "Client conversation" })).toContainText(clientAnswer);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  await expect(page.getByRole("form", { name: "Requirement summary" }).getByRole("textbox")).toHaveCount(8);
  for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(fixtureSummary[id]);

  let release!: () => void;
  ai.respondNext("feedback", new Promise((resolve) => { release = () => resolve({ json: feedbackResponse(ai.requests.feedback[0]) }); }));
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Getting feedback");
  await expect.poll(() => ai.requests.feedback.length).toBe(1);
  await expect.poll(async () => (await savedCourse(page))?.latestAttemptMeta?.phase).toBe("feedbackPending");
  expect((await savedCourse(page))?.earnedActivityCompletion).toBeNull();
  expect((await savedCourse(page))?.latestSuccessfulResult).toBeNull();
  release();
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeFocused();
  await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
  await expect(page.locator(".feedback-action-title")).toHaveText("Course Complete");
  const request = ai.requests.feedback[0];
  expect(request.summarySnapshot).toEqual(fixtureSummary);
  expect(request.transcript.map(({ role }) => role)).toEqual(["assistant", "user", "assistant"]);
  await expect.poll(async () => (await savedCourse(page))?.earnedActivityCompletion?.requestId).toBe(request.requestId);
  expect((await savedCourse(page))?.latestSuccessfulResult?.recommendation).toMatchObject({ kind: "courseComplete" });
  const action = page.getByRole("link", { name: "View final summary", exact: true });
  await expect(action).toHaveAttribute("href", "/progress#course-complete"); await action.click();
  await expect(page).toHaveURL("/progress#course-complete");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByText("Module progress: 3 / 3 lessons · Activity completed", { exact: true })).toBeVisible();
  for (const [index, { id }] of summaryFields.entries()) await expect(page.locator(".final-summary dd").nth(index)).toHaveText(fixtureSummary[id]);
  await page.screenshot({ path: testInfo.outputPath("student-loop-complete.png"), fullPage: true });
  expect(ai.requests.tutor).toHaveLength(1); expect(ai.requests.client).toHaveLength(2); expect(ai.requests.feedback).toHaveLength(1);
  expect(ai.unexpected).toEqual([]); expect(errors).toEqual([]);
});

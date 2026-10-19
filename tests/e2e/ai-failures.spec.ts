import { expect, test, type Page } from "@playwright/test";
import { summaryFields } from "../../src/domain/summary";
import { fixtureSummary } from "../fixtures/feedback";
import { activityPath, clientAnswer, clientOpening, controlledAi, coursePath, savedCourse, tutorAnswer } from "../fixtures/ai";

async function interview(page: Page) {
  await page.getByRole("button", { name: "Start interview", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(clientOpening);
  await page.getByLabel("Your question", { exact: true }).fill("Who will use this and why do they need it?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(clientAnswer);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(fixtureSummary[id]);
}

test("invalid Tutor output preserves the prior answer and exact question/context for Retry", async ({ page }, testInfo) => {
  const ai = controlledAi(); await ai.install(page);
  await page.goto(`${coursePath}/lessons/what-to-ask`);
  const input = page.getByLabel("Your question", { exact: true });
  await input.fill("What is a constraint?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(tutorAnswer);
  ai.respondNext("tutor", { json: { ok: true, requestId: "controlled-invalid-output", data: { invalid: "not Tutor text" } } });
  await input.fill("Give a simpler example of the same constraint.");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Ask AI Tutor" });
  await expect(panel.getByRole("alert")).toContainText("Unable to read the answer");
  await expect(input).toHaveValue("Give a simpler example of the same constraint.");
  await expect(page.getByRole("log")).toContainText(tutorAnswer);
  await expect(page.getByRole("article", { name: "Lesson content" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
  expect((await savedCourse(page))?.completedLessonIds).toEqual([]);
  expect(ai.requests.tutor).toHaveLength(2);
  const failed = ai.requests.tutor[1];
  expect(failed.conversation).toEqual([{ role: "user", content: "What is a constraint?" }, { role: "assistant", content: tutorAnswer }]);
  await page.screenshot({ path: testInfo.outputPath("tutor-invalid-output-preserved.png"), fullPage: true });
  await input.fill("Keep this unsent Tutor draft.");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  expect(ai.requests.tutor).toHaveLength(3); expect(ai.requests.tutor[2]).toEqual(failed);
  await expect(input).toHaveValue("Keep this unsent Tutor draft.");
  await expect(page.getByRole("log").getByText(failed.question, { exact: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  expect(ai.unexpected).toEqual([]);
});

test("Client provider failure preserves the conversation, eight fields and new draft during exact Retry", async ({ page }, testInfo) => {
  const ai = controlledAi(); await ai.install(page);
  await page.goto(activityPath); await interview(page);
  ai.respondNext("client", { status: 503, json: { ok: false, requestId: "controlled-provider-failure", error: {
    code: "UNAVAILABLE", message: "Unable to reach Maya. Your work is still here. Retry.", retryable: true,
  } } });
  const input = page.getByLabel("Your question", { exact: true });
  await input.fill("What should happen when an event is full?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  const panel = page.getByRole("region", { name: "Ask the client", exact: true });
  await expect(panel.getByRole("alert")).toContainText("Unable to reach Maya");
  await expect(page.getByRole("log")).toContainText(clientOpening);
  await expect(page.getByRole("log")).toContainText(clientAnswer);
  await expect(input).toHaveValue("What should happen when an event is full?");
  for (const { id, label } of summaryFields) await expect(page.getByLabel(label, { exact: true })).toHaveValue(fixtureSummary[id]);
  expect((await savedCourse(page))?.earnedActivityCompletion).toBeNull();
  expect(ai.requests.client).toHaveLength(3);
  const failed = ai.requests.client[2];
  expect(failed.mode).toBe("turn");
  if (failed.mode === "turn") expect(failed.transcript.map(({ role }) => role)).toEqual(["assistant", "user", "assistant"]);
  await page.screenshot({ path: testInfo.outputPath("client-provider-failure-preserved.png"), fullPage: true });
  await input.fill("Keep this new Client draft.");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  expect(ai.requests.client).toHaveLength(4); expect(ai.requests.client[3]).toEqual(failed);
  await expect(input).toHaveValue("Keep this new Client draft.");
  await expect(page.getByRole("log").getByText("What should happen when an event is full?", { exact: true })).toHaveCount(1);
  for (const { id, label } of summaryFields) await expect(page.getByLabel(label, { exact: true })).toHaveValue(fixtureSummary[id]);
  expect(ai.requests.feedback).toHaveLength(0); expect(ai.unexpected).toEqual([]);
});

test("Feedback timeout keeps the original submission incomplete until its Retry succeeds", async ({ page }, testInfo) => {
  const ai = controlledAi(); await ai.install(page);
  await page.goto(activityPath); await interview(page);
  ai.respondNext("feedback", { status: 504, json: { ok: false, requestId: "controlled-timeout", error: {
    code: "TIMEOUT", message: "Feedback took too long. Your work is still here. Retry.", retryable: true,
  } } });
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Activity incomplete");
  await expect(page.getByRole("log")).toContainText(clientAnswer);
  for (const { id, label } of summaryFields) await expect(page.getByLabel(label, { exact: true })).toHaveValue(fixtureSummary[id]);
  expect((await savedCourse(page))?.earnedActivityCompletion).toBeNull();
  expect((await savedCourse(page))?.latestSuccessfulResult).toBeNull();
  const failed = ai.requests.feedback[0];
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry feedback", exact: true })).toBeVisible();
  await page.getByLabel("User Goal", { exact: true }).fill("Keep this edited draft separate from the submitted snapshot.");
  await page.screenshot({ path: testInfo.outputPath("feedback-timeout-incomplete.png"), fullPage: true });
  await page.getByRole("button", { name: "Retry feedback", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
  expect(ai.requests.feedback).toHaveLength(2);
  const retried = ai.requests.feedback[1];
  expect(retried).toEqual({ ...failed, requestId: retried.requestId }); expect(retried.requestId).not.toBe(failed.requestId);
  await expect.poll(async () => (await savedCourse(page))?.earnedActivityCompletion?.requestId).toBe(retried.requestId);
  expect((await savedCourse(page))?.latestSuccessfulResult?.summarySnapshot).toEqual(fixtureSummary);
  await page.getByText("View submitted summary", { exact: true }).click();
  for (const [index, { id }] of summaryFields.entries()) await expect(page.locator(".submitted-summary dd").nth(index)).toHaveText(fixtureSummary[id]);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  expect(ai.unexpected).toEqual([]);
});

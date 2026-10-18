import { expect, test } from "@playwright/test";
import { fixtureAssessment, emptyAssessment, fixtureSummary } from "../fixtures/feedback";
import { summaryFields } from "../../src/domain/summary";
import type { FeedbackRequest } from "../../src/domain/submission";
const course = "/courses/requirement-clarification";
const activity = `${course}/activity`;
const failure = { ok: false, requestId: "controlled", error: { code: "TIMEOUT", message: "Unable to get feedback. Your work is still here. Retry.", retryable: true } };
function success(request: FeedbackRequest, assessment = emptyAssessment()) {
  return { ok: true, requestId: "controlled", data: { attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId, scenarioVersion: "1", assessment } };
}
for (const width of [1440, 1024, 768, 390]) {
  test(`summary snapshot, feedback failure/Retry and weak success at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const requests: FeedbackRequest[] = []; const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let release!: () => void; const waiting = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/ai/client", (route) => route.fulfill({ json: { ok: true, requestId: "controlled", data: { reply: "Maya wants to clarify the club website.", factIds: [], disclosedFactIds: [] } } }));
    await page.route("**/api/ai/feedback", async (route) => {
      const request = route.request().postDataJSON() as FeedbackRequest; requests.push(request);
      if (requests.length === 1) { await waiting; await route.fulfill({ status: 504, json: failure }); }
      else await route.fulfill({ json: success(request) });
    });
    await page.goto(activity); await page.getByRole("button", { name: "Start interview", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("Maya wants to clarify");
    await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
    const form = page.getByRole("form", { name: "Requirement summary" });
    await expect(form.getByRole("textbox")).toHaveCount(8);
    for (const field of summaryFields) { await expect(page.getByLabel(field.label, { exact: true })).toHaveValue(""); await expect(page.getByLabel(field.label, { exact: true })).not.toHaveAttribute("required"); }
    await page.getByLabel("User Goal", { exact: true }).fill(`My draft\n${"Long student text ".repeat(80)}`);
    const submit = page.getByRole("button", { name: "Submit Summary for Feedback", exact: true });
    await submit.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Getting feedback");
    await expect(page.getByLabel("User Goal", { exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Getting feedback…" })).toBeDisabled();
    expect(requests).toHaveLength(1); release();
    await expect(page.getByRole("region", { name: "Write your own requirement summary", exact: true }).getByRole("alert")).toContainText("Your work is still here");
    await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Activity incomplete");
    await expect(page.getByRole("log")).toContainText("Maya wants to clarify");
    await expect(page.getByLabel("User Goal", { exact: true })).toHaveValue(requests[0].summarySnapshot.userGoal);
    await page.getByLabel("User Goal", { exact: true }).fill("New draft after failure");
    await page.screenshot({ path: testInfo.outputPath(`feedback-failure-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Retry feedback", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeFocused();
    expect(requests).toHaveLength(2); expect(requests[1]).toEqual({ ...requests[0], requestId: expect.any(String) }); expect(requests[1].requestId).not.toBe(requests[0].requestId);
    await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
    await expect(page.getByRole("heading", { name: "What you did well", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What to improve", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recommended next action", exact: true })).toBeVisible();
    await expect(page.getByText("Review Lesson 1:", { exact: false })).toBeVisible();
    await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Activity complete");
    await page.getByText("View submitted summary", { exact: true }).click();
    await expect(page.locator(".submitted-summary dd").nth(1)).toHaveText(requests[0].summarySnapshot.userGoal);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`feedback-success-${width}.png`), fullPage: true });
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
    await expect(page.getByLabel("User Goal", { exact: true })).toHaveValue("New draft after failure");
    expect(errors).toEqual([]);
  });
}
test("empty summary and no interview can be submitted and completed without Client calls", async ({ page }) => {
  let clientCalls = 0;
  await page.route("**/api/ai/client", async (route) => { clientCalls++; await route.abort(); });
  await page.route("**/api/ai/feedback", (route) => route.fulfill({ json: success(route.request().postDataJSON()) }));
  await page.goto(activity); await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Activity complete");
  expect(clientCalls).toBe(0);
});
test("Strong feedback waits for lessons, then recalculates Complete without another AI request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/ai/client", (route) => route.fulfill({ json: { ok: true, requestId: "controlled", data: { reply: "Maya's client response.", factIds: [], disclosedFactIds: [] } } }));
  await page.route("**/api/ai/feedback", (route) => {
    calls++; const request = route.request().postDataJSON() as FeedbackRequest; const assessment = fixtureAssessment();
    const turn = request.transcript.find((entry) => entry.role === "user")!;
    assessment.questioning.evidence[0].turnId = turn.id; assessment.questioning.evidence[0].quote = turn.text;
    return route.fulfill({ json: success(request, assessment) });
  });
  await page.goto(activity); await page.getByRole("button", { name: "Start interview", exact: true }).click();
  await page.getByLabel("Your question", { exact: true }).fill("Who needs this and why?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("log").getByText("Maya's client response.", { exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(fixtureSummary[id]);
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByText("Your practice is strong. Complete the remaining lessons to finish the course.", { exact: true })).toBeVisible();
  await expect(page.getByText("Course Complete", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  for (const title of ["What is Requirement Clarification?", "What Should You Ask?", "From Conversation to Structured Requirements"]) {
    await page.getByRole("link", { name: title, exact: true }).click();
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
  }
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
  await expect(page.locator(".feedback-action-title")).toHaveText("Course Complete");
  expect(calls).toBe(1);
});

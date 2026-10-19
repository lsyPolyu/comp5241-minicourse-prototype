import { expect, firefox, test } from "@playwright/test";
import type { FeedbackRequest } from "../../src/domain/submission";
import { summaryFields } from "../../src/domain/summary";
import { fixtureAssessment, fixtureSummary } from "../fixtures/feedback";

test("Firefox Student core path: lessons, Tutor, Client, eight fields, feedback and Complete", async ({ baseURL }, testInfo) => {
  test.setTimeout(60_000);
  // Use Firefox explicitly even when the default local test project is Edge.
  const browser = await firefox.launch({ channel: "firefox", timeout: 15_000 });
  const page = await browser.newPage({ baseURL, viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  const purposes = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/ai/**", async (route) => {
    const purpose = new URL(route.request().url()).pathname;
    purposes.add(purpose);
    if (purpose === "/api/ai/tutor") return route.fulfill({ json: { ok: true, requestId: "firefox-tutor", data: "A goal explains the problem a user wants to solve." } });
    if (purpose === "/api/ai/client") return route.fulfill({ json: { ok: true, requestId: "firefox-client", data: {
      reply: "Controlled client reply for browser verification.", factIds: [], disclosedFactIds: [],
    } } });
    if (purpose === "/api/ai/feedback") {
      const request = route.request().postDataJSON() as FeedbackRequest;
      const assessment = fixtureAssessment("Strong", request.summarySnapshot);
      const question = request.transcript.find((turn) => turn.role === "user")!;
      assessment.questioning.evidence = [{ source: "turn", turnId: question.id, quote: question.text, fieldId: null, factId: null }];
      return route.fulfill({ json: { ok: true, requestId: "firefox-feedback", data: {
        attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId, scenarioVersion: "1", assessment,
      } } });
    }
    await route.abort("blockedbyclient");
  });
  try {
    await page.goto("/");
    await page.getByRole("link", { name: "View course", exact: true }).click();
    for (const [index, title] of ["What is Requirement Clarification?", "What Should You Ask?", "From Conversation to Structured Requirements"].entries()) {
      await page.getByRole("link", { name: title, exact: true }).click();
      if (index === 1) {
        await page.getByLabel("Your question", { exact: true }).fill("What is a goal?");
        await page.getByRole("button", { name: "Send question", exact: true }).click();
        await expect(page.getByRole("log")).toContainText("A goal explains");
      }
      await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
      await page.getByRole("link", { name: "Back to course", exact: true }).click();
    }
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
    await page.getByRole("button", { name: "Start interview", exact: true }).click();
    await expect(page.getByRole("log")).toContainText("Controlled client reply");
    await page.getByLabel("Your question", { exact: true }).fill("Who will use this and why?");
    await page.getByRole("button", { name: "Send question", exact: true }).click();
    await expect(page.getByRole("log").locator("li")).toHaveCount(3);
    await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
    await expect(page.getByRole("form", { name: "Requirement summary" }).getByRole("textbox")).toHaveCount(8);
    for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(fixtureSummary[id]);
    await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeFocused();
    await expect(page.locator(".feedback-action-title")).toHaveText("Course Complete");
    await page.screenshot({ path: testInfo.outputPath("firefox-feedback.png"), fullPage: true });
    await page.getByRole("link", { name: "View final summary", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator("#course-complete")).toBeInViewport();
    await page.reload();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator(".final-summary dd").first()).toHaveText(fixtureSummary.targetUser);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("firefox-progress-restored.png"), fullPage: true });
    expect([...purposes].sort()).toEqual(["/api/ai/client", "/api/ai/feedback", "/api/ai/tutor"]);
    expect(errors).toEqual([]);
  } finally { await browser.close(); }
});

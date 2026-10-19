import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import type { FeedbackRequest } from "../../src/domain/submission";
import type { ActivityAssessment } from "../../src/domain/feedback";
import { summaryFields } from "../../src/domain/summary";
import { fixtureAssessment } from "../fixtures/feedback";

const course = "/courses/requirement-clarification";
const activity = `${course}/activity`;
const lessonIds = ["why-clarify", "what-to-ask", "structure-requirements"];
const longText = `${"A student can ask a focused follow-up and record the answer in their own words. ".repeat(14)}\n${"LongWord".repeat(32)}`;
type ResultKind = "complete" | "review" | "retry";

function controlledAi(page: Page) {
  let tutorCalls = 0;
  let kind: ResultKind = "complete";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const install = () => page.route("**/api/ai/**", async (route) => {
    const purpose = new URL(route.request().url()).pathname;
    if (purpose === "/api/ai/tutor") {
      tutorCalls++;
      if (tutorCalls === 1) return route.fulfill({ status: 504, json: { ok: false, requestId: "responsive-failure", error: {
        code: "TIMEOUT", message: "The Tutor took too long. Your work is still here. Retry.", retryable: true,
      } } });
      return route.fulfill({ json: { ok: true, requestId: "responsive-tutor", data: longText } });
    }
    if (purpose === "/api/ai/client") return route.fulfill({ json: { ok: true, requestId: "responsive-client", data: {
      reply: `Controlled client reply. ${longText}`, factIds: [], disclosedFactIds: [],
    } } });
    if (purpose === "/api/ai/feedback") {
      const request = route.request().postDataJSON() as FeedbackRequest;
      const assessment: ActivityAssessment = fixtureAssessment("Strong", request.summarySnapshot);
      const question = request.transcript.find((turn) => turn.role === "user")!;
      assessment.questioning.evidence = [{ source: "turn", turnId: question.id, quote: question.text, fieldId: null, factId: null }];
      assessment.questioning.explanation = longText.slice(0, 1100);
      assessment.whatWentWell = [longText.slice(0, 950)];
      if (kind === "review") {
        assessment.questioning = { level: "Missing", explanation: longText.slice(0, 1100),
          evidence: [{ source: "absence", turnId: null, quote: null, fieldId: null, factId: null }], problemCodes: ["questioningGap"] };
        assessment.whatToImprove = [longText.slice(0, 950)];
      } else if (kind === "retry") {
        assessment.dimensions.outOfScope = { ...assessment.dimensions.outOfScope, level: "Partial", explanation: longText.slice(0, 1100), problemCodes: ["minorOmission"] };
        assessment.whatToImprove = [longText.slice(0, 950)];
      }
      return route.fulfill({ json: { ok: true, requestId: "responsive-feedback", data: {
        attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId, scenarioVersion: "1", assessment,
      } } });
    }
    await route.abort("blockedbyclient");
  });
  return { install, errors, setResult: (value: ResultKind) => { kind = value; } };
}

async function contained(page: Page) {
  expect(await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))).toEqual({
    width: page.viewportSize()!.width, scrollWidth: page.viewportSize()!.width,
  });
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await contained(page);
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

async function completeLessons(page: Page) {
  for (const id of lessonIds) {
    await page.goto(`${course}/lessons/${id}`);
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
  }
}

async function summarize(page: Page) {
  await page.getByRole("button", { name: "Start interview", exact: true }).click();
  const log = page.getByRole("log", { name: "Client conversation" });
  await expect(log).toContainText("Controlled client reply.");
  await page.getByLabel("Your question", { exact: true }).fill("Who will use this and why do they need it?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(log.locator("li")).toHaveCount(3);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { id, label } of summaryFields) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toHaveAttribute("aria-describedby", `summary-${id}-hint`);
    await expect(field).not.toHaveAttribute("required");
    await field.fill(`${label}: ${longText}`);
  }
}

for (const width of [1440, 1024, 768, 390]) {
  test(`all learning surfaces and long-content recommendations reflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const ai = controlledAi(page); await ai.install();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Continue your learning", exact: true })).toBeVisible();
    await capture(page, testInfo, "dashboard");
    await page.getByRole("link", { name: "View course", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Requirement Clarification", exact: true })).toBeVisible();
    await expect(page.locator(".outline-row")).toHaveCount(4);
    await capture(page, testInfo, "course");
    await page.getByRole("link", { name: "What Should You Ask?", exact: true }).click();
    const tutor = page.getByRole("complementary", { name: "Ask AI Tutor" });
    if (width < 1024) await tutor.getByText("Open Tutor", { exact: true }).click();
    await tutor.getByLabel("Your question", { exact: true }).fill("What is a constraint?");
    await tutor.getByRole("button", { name: "Send question", exact: true }).click();
    await expect(tutor.getByRole("alert")).toContainText("Your work is still here");
    await expect(tutor.getByLabel("Your question", { exact: true })).toHaveValue("What is a constraint?");
    await capture(page, testInfo, "lesson-tutor-error");
    await tutor.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(tutor.getByRole("log")).toContainText("LongWord");
    await capture(page, testInfo, "lesson-tutor-long");
    await completeLessons(page);
    await page.goto(activity);
    await summarize(page);
    await capture(page, testInfo, "activity-eight-fields-long-chat");
    const log = page.getByRole("log", { name: "Client conversation" });
    await log.focus();
    await page.keyboard.press("End");
    await expect.poll(() => log.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeFocused();
    await expect(page.locator(".feedback-action-title")).toHaveText("Course Complete");
    await page.getByText("View submitted summary", { exact: true }).click();
    await capture(page, testInfo, "feedback-complete-long-summary");
    await page.getByRole("link", { name: "View final summary", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(page.locator("#course-complete")).toBeInViewport();
    await capture(page, testInfo, "progress-course-complete");
    await page.goto(activity);
    await page.getByRole("link", { name: "Retry Activity", exact: true }).click();
    ai.setResult("review"); await summarize(page);
    await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
    await expect(page.getByRole("link", { name: "Review Lesson 2", exact: true })).toBeVisible();
    await capture(page, testInfo, "recommendation-review");
    await page.getByRole("button", { name: "Start a new practice", exact: true }).click();
    ai.setResult("retry"); await summarize(page);
    await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
    await expect(page.locator(".feedback-action-title")).toHaveText("Retry Activity");
    await capture(page, testInfo, "recommendation-retry");
    expect(ai.errors).toEqual([]);
  });
}

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 70; index++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Keyboard could not reach ${await target.getAttribute("href") ?? await target.textContent()}`);
}

async function keyboardActivate(page: Page, target: Locator) {
  await tabTo(page, target);
  await expect(target).toBeFocused();
  expect(await target.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
}

test("keyboard completes the narrow Student path, Tutor retry and all eight fields", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const ai = controlledAi(page); await ai.install();
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await keyboardActivate(page, page.getByRole("link", { name: "View course", exact: true }));
  await keyboardActivate(page, page.getByRole("link", { name: "What is Requirement Clarification?", exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Complete Lesson", exact: true }));
  await keyboardActivate(page, page.getByRole("link", { name: "Next: Lesson 2", exact: true }));
  await keyboardActivate(page, page.getByText("Open Tutor", { exact: true }));
  const input = page.getByLabel("Your question", { exact: true });
  await tabTo(page, input); await page.keyboard.insertText("What is scope?");
  await keyboardActivate(page, page.getByRole("button", { name: "Send question", exact: true }));
  await expect(page.getByRole("complementary", { name: "Ask AI Tutor" }).getByRole("alert")).toContainText("Your work is still here");
  await keyboardActivate(page, page.getByRole("button", { name: "Retry", exact: true }));
  await expect(page.getByRole("log")).toContainText("LongWord");
  await keyboardActivate(page, page.getByRole("button", { name: "Complete Lesson", exact: true }));
  await keyboardActivate(page, page.getByRole("link", { name: "Next: Lesson 3", exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Complete Lesson", exact: true }));
  await keyboardActivate(page, page.getByRole("link", { name: "Back to course", exact: true }));
  await keyboardActivate(page, page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Start interview", exact: true }));
  await expect(page.getByRole("log")).toContainText("Controlled client reply.");
  await tabTo(page, input); await page.keyboard.insertText("Who needs this and why?");
  await keyboardActivate(page, page.getByRole("button", { name: "Send question", exact: true }));
  await expect(page.getByRole("log").locator("li")).toHaveCount(3);
  await keyboardActivate(page, page.getByRole("button", { name: "Continue to summary", exact: true }));
  await expect(page.getByRole("heading", { name: "Write your own requirement summary", exact: true })).toBeFocused();
  for (const { label } of summaryFields) {
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(label, { exact: true })).toBeFocused();
    await page.keyboard.insertText(`My own ${label.toLowerCase()} evidence.`);
  }
  await keyboardActivate(page, page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }));
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeFocused();
  await keyboardActivate(page, page.getByRole("link", { name: "View final summary", exact: true }));
  await expect(page.locator("#course-complete")).toBeFocused();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await page.goto("/progress");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await keyboardActivate(page, page.getByRole("link", { name: "View final summary", exact: true }));
  await expect(page.locator("#course-complete")).toBeFocused();
  await capture(page, testInfo, "keyboard-progress-complete");
  expect(ai.errors).toEqual([]);
});

test("continuous resize across breakpoints keeps core content and actions inside the page", async ({ page }, testInfo) => {
  const ai = controlledAi(page); await ai.install();
  const widths = [...Array.from({ length: 25 }, (_, index) => 320 + index * 53), 1440, 1024, 1023, 768, 767, 390];
  async function sweep() {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await contained(page);
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    }
  }
  await page.goto("/"); await sweep();
  await page.goto(course); await sweep();
  await page.goto(`${course}/lessons/what-to-ask`); await sweep();
  await completeLessons(page);
  await page.goto(activity); await summarize(page); await sweep();
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.locator(".feedback-action-title")).toHaveText("Course Complete"); await sweep();
  await page.getByRole("link", { name: "View final summary", exact: true }).click(); await sweep();
  await capture(page, testInfo, "continuous-resize-final");
  expect(ai.errors).toEqual([]);
});

test("narrow waiting and error states keep controls reachable when usable height shrinks", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  let waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai/**", async (route) => {
    const purpose = new URL(route.request().url()).pathname;
    await waiting;
    if (purpose === "/api/ai/client") return route.fulfill({ json: { ok: true, requestId: "waiting-client", data: {
      reply: "Controlled client opening.", factIds: [], disclosedFactIds: [],
    } } });
    if (purpose === "/api/ai/tutor" || purpose === "/api/ai/feedback") return route.fulfill({ status: 504, json: {
      ok: false, requestId: "waiting-failure", error: { code: "TIMEOUT", message: "The request took too long. Your work is still here. Retry.", retryable: true },
    } });
    await route.abort("blockedbyclient");
  });
  await page.goto(`${course}/lessons/what-to-ask`);
  await page.getByText("Open Tutor", { exact: true }).click();
  await page.getByLabel("Your question", { exact: true }).fill("What is a constraint?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("status", { name: "Tutor request status" })).toContainText("The Tutor is answering");
  await expect(page.getByRole("button", { name: "Send question", exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 500 });
  await capture(page, testInfo, "tutor-waiting-reduced-height");
  release();
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await keyboardActivate(page, page.getByText("Hide Tutor", { exact: true }));
  await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();

  waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.goto(activity);
  await page.getByRole("button", { name: "Start interview", exact: true }).click();
  await expect(page.getByRole("status", { name: "Client request status" })).toContainText("Maya is getting ready");
  await expect(page.getByRole("button", { name: "Start interview", exact: true })).toBeDisabled();
  await capture(page, testInfo, "client-waiting-reduced-height");
  release();
  await expect(page.getByRole("log")).toContainText("Controlled client opening.");
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(`My preserved ${label.toLowerCase()} draft.`);
  const lastField = page.getByLabel("Out of Scope", { exact: true });
  await expect(lastField).toBeInViewport();
  waiting = new Promise<void>((resolve) => { release = resolve; });
  await keyboardActivate(page, page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }));
  await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Getting feedback");
  await expect(page.getByRole("button", { name: "Getting feedback…", exact: true })).toBeDisabled();
  await expect(lastField).toBeDisabled();
  await capture(page, testInfo, "feedback-waiting-reduced-height");
  release();
  const retry = page.getByRole("button", { name: "Retry feedback", exact: true });
  await tabTo(page, retry);
  await expect(retry).toBeFocused();
  await expect(retry).toBeInViewport();
  await expect(lastField).toHaveValue("My preserved out of scope draft.");
  await capture(page, testInfo, "feedback-error-keyboard-retry-reachable");
});

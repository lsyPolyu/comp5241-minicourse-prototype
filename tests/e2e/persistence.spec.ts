import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";
import type { ClientRequest } from "../../src/domain/client";
import type { ActivityAssessment } from "../../src/domain/feedback";
import type { CourseLearningState } from "../../src/domain/learning";
import type { FeedbackRequest } from "../../src/domain/submission";
import { summaryFields } from "../../src/domain/summary";
import { emptyAssessment, fixtureAssessment, fixtureSummary } from "../fixtures/feedback";

const courseId = "requirement-clarification";
const course = `/courses/${courseId}`;
const activity = `${course}/activity`;
const storageKey = "comp5241:learning:v1";
const lessons = ["why-clarify", "what-to-ask", "structure-requirements"];
type ResultKind = "strong" | "retry" | "lesson1" | "lesson2" | "lesson3" | "empty";

function assessmentFor(request: FeedbackRequest, kind: ResultKind): ActivityAssessment {
  if (kind === "empty") return emptyAssessment();
  const assessment = fixtureAssessment("Strong", request.summarySnapshot);
  const question = request.transcript.find((turn) => turn.role === "user");
  if (!question) throw new Error("This controlled fixture expects a student question.");
  assessment.questioning.evidence = [{ source: "turn", turnId: question.id, fieldId: null, quote: question.text, factId: null }];
  if (kind === "lesson1" || kind === "lesson3") {
    const fieldId = kind === "lesson1" ? "userGoal" : "coreRequirements";
    assessment.dimensions[fieldId] = {
      level: "Missing", explanation: `Clarify the ${fieldId} in your own summary.`,
      evidence: [{ source: "absence", fieldId, turnId: null, quote: null, factId: null }],
      problemCodes: [kind === "lesson1" ? "goalMisunderstood" : "summaryGap"],
    };
  } else if (kind === "lesson2") {
    assessment.questioning = {
      level: "Missing", explanation: "Ask about the purpose rather than assuming it.",
      evidence: [{ source: "absence", fieldId: null, turnId: null, quote: null, factId: null }],
      problemCodes: ["questioningGap"],
    };
  } else if (kind === "retry") {
    assessment.dimensions.priorities = { ...assessment.dimensions.priorities,
      level: "Partial", explanation: "Clarify the remaining priority detail.", problemCodes: ["minorOmission"] };
  }
  if (kind !== "strong") assessment.whatToImprove = ["Ask a focused follow-up and refine your summary."];
  return assessment;
}

function controlledAi(kind: ResultKind = "retry") {
  const clients: ClientRequest[] = [];
  const feedback: FeedbackRequest[] = [];
  let nextKind = kind;
  let failNext = false;
  async function handle(route: Route) {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/ai/client") {
      const request = route.request().postDataJSON() as ClientRequest;
      clients.push(request);
      await route.fulfill({ json: { ok: true, requestId: "controlled-client", data: {
        reply: request.mode === "opening" ? "Controlled Maya opening." : "Controlled answer to your question.",
        factIds: request.mode === "opening" ? [] : ["F01"],
        disclosedFactIds: request.mode === "opening" ? [] : ["F01"],
      } } });
      return;
    }
    if (pathname === "/api/ai/feedback") {
      const request = route.request().postDataJSON() as FeedbackRequest;
      feedback.push(request);
      if (failNext) {
        failNext = false;
        await route.fulfill({ status: 504, json: { ok: false, requestId: "controlled-failure", error: {
          code: "TIMEOUT", message: "Unable to get feedback. Your work is still here. Retry.", retryable: true,
        } } });
      } else await route.fulfill({ json: { ok: true, requestId: "controlled-feedback", data: {
        attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId,
        scenarioVersion: "1", assessment: assessmentFor(request, nextKind),
      } } });
      return;
    }
    // Every AI URL is intercepted; an unexpected purpose can never reach a provider.
    await route.abort("blockedbyclient");
  }
  return { clients, feedback,
    install: (target: Page | BrowserContext) => target.route("**/api/ai/**", handle),
    fail: () => { failNext = true; }, setKind: (value: ResultKind) => { nextKind = value; },
  };
}

async function savedCourse(page: Page): Promise<CourseLearningState | null> {
  return page.evaluate(({ key, id }) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).courses[id] : null;
  }, { key: storageKey, id: courseId });
}

async function startAndSummarize(page: Page, suffix = "") {
  await page.getByRole("button", { name: "Start interview", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Controlled Maya opening.");
  await page.getByLabel("Your question", { exact: true }).fill("Who will use this and why do they need it?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Controlled answer to your question.");
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(`${fixtureSummary[id]}${suffix}`);
}

async function submit(page: Page) {
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
}

async function completeLessons(page: Page) {
  for (const id of lessons) {
    await page.goto(`${course}/lessons/${id}`);
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
  }
}

for (const [index, kind] of ["lesson1", "lesson2", "lesson3"].entries()) {
  test(`review recommendation opens implemented Lesson ${index + 1} without completing it`, async ({ page }) => {
    const ai = controlledAi(kind as ResultKind);
    await ai.install(page);
    await page.goto(activity);
    await startAndSummarize(page);
    await submit(page);
    const review = page.getByRole("link", { name: `Review Lesson ${index + 1}`, exact: true });
    await expect(review).toHaveAttribute("href", `${course}/lessons/${lessons[index]}`);
    await review.click();
    await expect(page).toHaveURL(`${course}/lessons/${lessons[index]}`);
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    const saved = await savedCourse(page);
    expect(saved?.completedLessonIds).toEqual([]);
    expect(saved?.earnedActivityCompletion?.requestId).toBe(ai.feedback[0].requestId);
    expect(ai.feedback).toHaveLength(1);
    expect(await page.getByRole("link", { name: /Git Basics|Working with AI Coding Agents/ }).count()).toBe(0);
  });
}

test("partial lesson completion and current lesson restore after refresh", async ({ page }) => {
  const ai = controlledAi(); await ai.install(page);
  await page.goto(`${course}/lessons/${lessons[0]}`);
  await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
  await page.getByRole("link", { name: "Next: Lesson 2", exact: true }).click();
  await expect(page).toHaveURL(`${course}/lessons/${lessons[1]}`);
  await expect(page.getByRole("heading", { name: "What Should You Ask?", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  await expect(page.getByRole("link", { name: "Return to this lesson", exact: true })).toHaveAttribute("href", `${course}/lessons/${lessons[1]}`);
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  await expect(page.getByRole("link", { name: "Return to this lesson", exact: true })).toHaveAttribute("href", `${course}/lessons/${lessons[1]}`);
  expect((await savedCourse(page))?.completedLessonIds).toEqual([lessons[0]]);
  expect((await savedCourse(page))?.currentLessonId).toBe(lessons[1]);
  expect(ai.clients).toHaveLength(0); expect(ai.feedback).toHaveLength(0);
});

test("retry clears the new attempt, preserves old success through failure and refresh, then replaces it atomically", async ({ page }) => {
  test.setTimeout(60_000);
  const ai = controlledAi(); await ai.install(page);
  await page.goto(activity); await startAndSummarize(page, " Old result."); await submit(page);
  await expect.poll(async () => (await savedCourse(page))?.latestSuccessfulResult?.requestId).toBe(ai.feedback[0].requestId);
  const old = (await savedCourse(page))!;
  await page.getByRole("link", { name: "Retry Activity", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Previous successful feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start interview", exact: true })).toBeVisible();
  await expect.poll(async () => (await savedCourse(page))?.latestAttemptMeta?.attemptId).not.toBe(old.latestAttemptMeta!.attemptId);
  const retryAttempt = (await savedCourse(page))!.latestAttemptMeta!.attemptId;
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect((await savedCourse(page))!.earnedActivityCompletion).toEqual(old.earnedActivityCompletion);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { label } of summaryFields) await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Return to interview", exact: true }).click();
  await startAndSummarize(page, " Current draft.");
  const newOpening = ai.clients.find((request) => request.attemptId === retryAttempt && request.mode === "opening")!;
  expect(newOpening.scenarioId).toBe(ai.clients[0].scenarioId);
  expect(newOpening).not.toHaveProperty("transcript");
  const newTurn = ai.clients.find((request) => request.attemptId === retryAttempt && request.mode === "turn");
  expect(newTurn?.mode).toBe("turn");
  if (newTurn?.mode === "turn") expect(newTurn.transcript).toEqual([{ role: "assistant", content: "Controlled Maya opening.", factIds: [] }]);
  ai.fail();
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry feedback", exact: true })).toBeVisible();
  await expect(page.getByLabel("User Goal", { exact: true })).toHaveValue(`${fixtureSummary.userGoal} Current draft.`);
  await expect(page.getByRole("log")).toContainText("Controlled answer to your question.");
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect((await savedCourse(page))!.earnedActivityCompletion).toEqual(old.earnedActivityCompletion);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Previous successful feedback", exact: true })).toBeVisible();
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect((await savedCourse(page))!.latestAttemptMeta?.phase).not.toBe("completed");
  expect(ai.feedback).toHaveLength(2);
  await page.getByRole("link", { name: "Retry Activity", exact: true }).first().click();
  ai.setKind("empty");
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  for (const { label } of summaryFields) await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  await submit(page);
  const latestRequest = ai.feedback[2];
  await expect.poll(async () => (await savedCourse(page))?.latestSuccessfulResult?.requestId).toBe(latestRequest.requestId);
  const latest = (await savedCourse(page))!;
  expect(latest.latestSuccessfulResult?.attemptId).toBe(latestRequest.attemptId);
  expect(latest.latestSuccessfulResult?.summarySnapshot).toEqual(latestRequest.summarySnapshot);
  expect(latest.latestSuccessfulResult?.recommendation).toMatchObject({ kind: "reviewLesson", lessonId: "why-clarify" });
  expect(latest.earnedActivityCompletion).toMatchObject({ attemptId: latestRequest.attemptId, submissionId: latestRequest.submissionId, requestId: latestRequest.requestId });
  expect(latest.latestSuccessfulResult?.requestId).not.toBe(old.latestSuccessfulResult!.requestId);
  await page.reload();
  await expect(page.getByRole("link", { name: "Review Lesson 1", exact: true })).toBeVisible();
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(latest.latestSuccessfulResult);
});

test("Retry feedback keeps its submitted snapshot and replaces the previous result only after success", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const ai = controlledAi(); await ai.install(page);
  await page.goto(activity); await startAndSummarize(page, " Previous success."); await submit(page);
  await expect.poll(async () => (await savedCourse(page))?.latestSuccessfulResult?.requestId).toBe(ai.feedback[0].requestId);
  const old = (await savedCourse(page))!;
  await page.getByRole("link", { name: "Retry Activity", exact: true }).first().click();
  await startAndSummarize(page, " Submitted retry work.");
  ai.fail();
  await page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Previous successful feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Feedback request status" })).toHaveText("Activity incomplete. It completes after you submit your summary and receive feedback.");
  const failed = ai.feedback[1];
  expect(failed.attemptId).not.toBe(old.latestSuccessfulResult!.attemptId);
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(old.latestSuccessfulResult);
  expect((await savedCourse(page))!.earnedActivityCompletion).toEqual(old.earnedActivityCompletion);
  await page.screenshot({ path: testInfo.outputPath("previous-success-after-feedback-failure.png"), fullPage: true });

  await page.getByLabel("User Goal", { exact: true }).fill("An edited draft that was never submitted.");
  ai.setKind("lesson2");
  await page.getByRole("button", { name: "Retry feedback", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Previous successful feedback", exact: true })).toHaveCount(0);
  const retried = ai.feedback[2];
  expect(retried).toEqual({ ...failed, requestId: retried.requestId });
  expect(retried.requestId).not.toBe(failed.requestId);
  await expect.poll(async () => (await savedCourse(page))?.latestSuccessfulResult?.requestId).toBe(retried.requestId);
  const saved = (await savedCourse(page))!;
  expect(saved.latestSuccessfulResult?.attemptId).toBe(retried.attemptId);
  expect(saved.latestSuccessfulResult?.submissionId).toBe(retried.submissionId);
  expect(saved.latestSuccessfulResult?.summarySnapshot).toEqual(failed.summarySnapshot);
  expect(saved.latestSuccessfulResult?.recommendation).toMatchObject({ kind: "reviewLesson", lessonId: "what-to-ask" });
  expect(saved.earnedActivityCompletion).toMatchObject({ attemptId: retried.attemptId, submissionId: retried.submissionId, requestId: retried.requestId });
  await page.getByText("View submitted summary", { exact: true }).click();
  await expect(page.locator(".submitted-summary dd").nth(1)).toHaveText(`${fixtureSummary.userGoal} Submitted retry work.`);
  await expect(page.getByLabel("User Goal", { exact: true })).toHaveValue("An edited draft that was never submitted.");
  await expect(page.getByRole("link", { name: "Review Lesson 2", exact: true })).toBeVisible();
  expect(ai.feedback).toHaveLength(3);
  await page.screenshot({ path: testInfo.outputPath("feedback-retry-replaced-result.png"), fullPage: true });
  await page.reload();
  await expect(page.getByRole("link", { name: "Review Lesson 2", exact: true })).toBeVisible();
  expect((await savedCourse(page))!.latestSuccessfulResult).toEqual(saved.latestSuccessfulResult);
  expect(ai.feedback).toHaveLength(3);
});

test("Strong feedback waits for explicit lessons and final summary comes from the saved submission", async ({ page }) => {
  test.setTimeout(60_000);
  const ai = controlledAi("strong"); await ai.install(page);
  await page.goto(activity); await startAndSummarize(page, " Final submitted work."); await submit(page);
  await expect(page.getByText("Your practice is strong. Complete the remaining lessons to finish the course.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View final summary", exact: true })).toHaveCount(0);
  const missing = page.getByRole("link", { name: /^Continue to Lesson 1:/ });
  await expect(missing).toHaveAttribute("href", `${course}/lessons/${lessons[0]}`);
  await missing.click();
  await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
  await completeLessons(page);
  await page.goto(activity);
  await page.getByRole("link", { name: "View final summary", exact: true }).click();
  await expect(page).toHaveURL("/progress#course-complete");
  await expect(page.getByRole("heading", { name: "Your final submitted summary", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  for (const [index, field] of summaryFields.entries()) await expect(page.locator(".final-summary dd").nth(index)).toHaveText(`${fixtureSummary[field.id]} Final submitted work.`);
  expect(ai.feedback).toHaveLength(1);
});

test("weak feedback still completes the course after all lessons and leaves review usable", async ({ page }) => {
  const ai = controlledAi("empty"); await ai.install(page);
  await completeLessons(page); await page.goto(activity);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click(); await submit(page);
  await page.getByRole("link", { name: "Review Lesson 1", exact: true }).click();
  await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByRole("heading", { name: "Your final submitted summary", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByRole("link", { name: "Review Lesson 1", exact: true })).toBeVisible();
  expect(ai.clients).toHaveLength(0); expect(ai.feedback).toHaveLength(1);
});

test("closing and relaunching a real persistent browser profile restores all five learning states", async ({ playwright, browserName }, testInfo) => {
  test.setTimeout(60_000);
  const profile = testInfo.outputPath("learning-browser-profile");
  const launch = () => playwright[browserName].launchPersistentContext(profile, {
    ...testInfo.project.use.launchOptions,
    channel: testInfo.project.use.channel,
    headless: true, baseURL: testInfo.project.use.baseURL,
    viewport: { width: 1280, height: 950 }, serviceWorkers: "block",
  });
  const ai = controlledAi();
  let context = await launch();
  try {
    await ai.install(context);
    let page = await context.newPage();
    await page.goto(`${course}/lessons/${lessons[0]}`);
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("link", { name: "Next: Lesson 2", exact: true }).click();
    await page.goto(activity); await startAndSummarize(page, " Survives browser close."); await submit(page);
    await expect.poll(async () => (await savedCourse(page))?.latestSuccessfulResult?.requestId).toBe(ai.feedback[0].requestId);
    const saved = (await savedCourse(page))!;
    expect(saved.currentLessonId).toBe(lessons[1]);
    // This closes the actual browser process; no storageState export/import is used.
    await context.close();
    context = await launch();
    await ai.install(context);
    page = await context.newPage();
    await page.goto("/progress");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    await expect(page.getByRole("link", { name: "Return to this lesson", exact: true })).toHaveAttribute("href", `${course}/lessons/${lessons[1]}`);
    await expect(page.getByRole("link", { name: "Retry Activity", exact: true }).first()).toBeVisible();
    const restored = (await savedCourse(page))!;
    expect(restored.completedLessonIds).toEqual(saved.completedLessonIds);
    expect(restored.earnedActivityCompletion).toEqual(saved.earnedActivityCompletion);
    expect(restored.latestSuccessfulResult).toEqual(saved.latestSuccessfulResult);
    await page.goto(activity);
    await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
    await page.getByText("View submitted summary", { exact: true }).click();
    await expect(page.locator(".submitted-summary dd").nth(1)).toHaveText(`${fixtureSummary.userGoal} Survives browser close.`);
    expect(ai.feedback).toHaveLength(1); expect(ai.clients).toHaveLength(2);
  } finally { await context.close(); }
});

for (const [label, raw] of [
  ["malformed JSON", "{not valid JSON"],
  ["unsupported future version", JSON.stringify({ schemaVersion: 999, contentVersion: "1", courses: {}, updatedAt: "2026-10-18T00:00:00Z" })],
]) {
  test(`${label} is preserved while learning continues in memory`, async ({ page }) => {
    const ai = controlledAi(); await ai.install(page);
    await page.goto("/");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value: raw });
    await page.reload();
    await expect(page.getByRole("status", { name: "Progress storage status" })).toContainText("Saved progress could not be restored");
    await page.getByRole("link", { name: "View course", exact: true }).click();
    await page.getByRole("link", { name: "What is Requirement Clarification?", exact: true }).click();
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(raw);
    expect(ai.clients).toHaveLength(0); expect(ai.feedback).toHaveLength(0);
  });
}

for (const [operation, name] of [["getItem", "SecurityError"], ["setItem", "QuotaExceededError"]] as const) {
  test(`storage ${operation} failure keeps session learning available with an honest warning`, async ({ page }) => {
    const ai = controlledAi(); await ai.install(page);
    await page.addInitScript(({ method, errorName }) => {
      Object.defineProperty(Storage.prototype, method, {
        configurable: true, value: () => { throw new DOMException("Controlled storage failure", errorName); },
      });
    }, { method: operation, errorName: name });
    await page.goto(`${course}/lessons/${lessons[0]}`);
    await expect(page.getByRole("status", { name: "Progress storage status" })).toContainText("Progress cannot be saved in this browser");
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await expect(page.getByRole("status", { name: "Progress storage status" })).toContainText("You can keep learning during this visit");
    await page.reload();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(ai.clients).toHaveLength(0); expect(ai.feedback).toHaveLength(0);
  });
}

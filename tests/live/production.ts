import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, type BrowserContext, type Page, type Response } from "@playwright/test";
import { z } from "zod";
import { clientReplySchema, clientRequestSchema, type ClientRequest } from "../../src/domain/client";
import { feedbackResponseSchema } from "../../src/domain/buildLearningResult";
import { feedbackMatchesSubmission } from "../../src/domain/feedback";
import type { CourseLearningState } from "../../src/domain/learning";
import { selectRecommendation } from "../../src/domain/recommendation";
import { feedbackRequestSchema, type FeedbackRequest } from "../../src/domain/submission";
import { summaryFields } from "../../src/domain/summary";
import { tutorTextSchema, type TutorMessage } from "../../src/domain/tutor";
import { API_WAIT_TIMEOUT_MS } from "../../src/lib/api/client";
import { apiEnvelopeSchema } from "../../src/lib/api/contracts";
import {
  productionOptions, productionSummary, PRODUCTION_COURSE_ID, PRODUCTION_LESSONS, PRODUCTION_QUESTIONS,
  PRODUCTION_REQUEST_BUDGET, PRODUCTION_STORAGE_KEY, ProductionRequestGuard, redactReport, safeIdentifier,
  type ExpectedProductionRequest,
} from "./production-acceptance-support";

const root = fileURLToPath(new URL("../../", import.meta.url));
const coursePath = `/courses/${PRODUCTION_COURSE_ID}`;
const activityPath = `${coursePath}/activity`;

async function main() {
  // No .env files, local key, server spawn or provider imports are used.
  const options = productionOptions(process.argv.slice(2));
  const started = Date.now();
  const runId = `production-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const output = join(root, "test-results", "live", runId);
  await mkdir(join(root, "test-results", "live"), { recursive: true });
  await mkdir(output); // Unique directory only; no cleanup of any previous artifact.
  const report = {
    runId, startedAt: new Date(started).toISOString(), url: options.origin,
    mode: options.offline ? "OFFLINE_PREFLIGHT" : "USER_INVOKED_PRODUCTION", liveExecuted: false,
    providerConfiguration: { provider: "DeepSeek", model: "deepseek-flash", remoteVerification: "UNPROVEN_WITHOUT_SERVER_LOG_CORRELATION" },
    deploymentId: null as string | null,
    fixtureBoundary: "Production mode permits at most five real product requests, with no mocked AI, transcript fixture or reference-answer import. A scripted student question and intentionally incomplete eight-field summary use only the real visible Client answer. This is production smoke evidence, not a repeat of the full historic semantic suites. Offline mode executes none of this browser or AI flow.",
    requests: [] as { operation: string; appRequestId: string | null; providerRequestId: string | null; providerIdSource: string;
      httpStatus: number; durationMs: number; result: string }[],
    studentVisible: {} as Record<string, unknown>, checks: [] as string[], failures: [] as string[],
    unexpectedRequests: 0, browserErrors: 0, requestCount: 0, automaticRetries: "NONE", durationMs: 0,
    automatedChecks: "PENDING", humanSemanticReview: "PENDING", humanVisualReview: "PENDING",
    humanLearningDuration: "PENDING_USER_REAL_10_TO_15_MINUTE_TRIAL", studentComplete: "PENDING",
    sameOriginRefresh: "PENDING", sameProfileBrowserReopen: "PENDING",
  };
  let context: BrowserContext | undefined;
  let guard: ProductionRequestGuard | undefined;
  let stage = "offline-preflight";
  let feedbackRequest: FeedbackRequest | undefined;
  let openingInput: Extract<ClientRequest, { mode: "opening" }> | undefined;
  const secrets = Object.entries(process.env).filter(([name, value]) => /KEY|TOKEN|SECRET|PASSWORD/i.test(name) && value)
    .map(([, value]) => value!);
  const finish = async () => {
    report.durationMs = Date.now() - started;
    report.requestCount = guard?.count ?? 0;
    report.unexpectedRequests = guard?.blocked ?? 0;
    report.automatedChecks = report.failures.length ? "FAIL" : options.offline ? "OFFLINE_PREFLIGHT_PASS_PRODUCTION_UNTESTED" : "PASS";
    const safe = redactReport(report, secrets);
    await writeFile(join(output, "report.json"), JSON.stringify(safe, null, 2));
    await writeFile(join(output, "report.txt"), [
      `PRODUCTION ACCEPTANCE: ${safe.automatedChecks}`, `URL: ${safe.url ?? "NONE (offline)"}`,
      `LIVE_EXECUTED: ${safe.liveExecuted ? "YES" : "NO"}`, `REQUESTS: ${safe.requestCount}/${PRODUCTION_REQUEST_BUDGET}; AUTOMATIC_RETRIES: NONE`,
      `REFRESH: ${safe.sameOriginRefresh}; BROWSER_REOPEN: ${safe.sameProfileBrowserReopen}`,
      `MODEL: deepseek-flash (repository configuration; remotely unproven without correlated server logs)`,
      ...safe.requests.map((request) => `${request.operation}: ${request.result}; appRequestId=${request.appRequestId ?? "unavailable"}; providerRequestId=${request.providerRequestId ?? "unavailable in public response"}`),
      `FAILURES: ${safe.failures.join(", ") || "NONE"}`,
      "HUMAN_SEMANTIC_REVIEW: PENDING; HUMAN_VISUAL_REVIEW: PENDING; HUMAN_10_TO_15_MINUTE_TRIAL: PENDING",
      "STUDENT_COMPLETE: PENDING. Review the real visible Tutor follow-up, Client boundaries and Feedback before accepting.",
      "Correlate each appRequestId with production ai_route / ai_request logs to confirm provider IDs, DeepSeek and deepseek-flash. Deployment ID comes from the deployment record, not x-vercel-id.",
    ].join("\n") + "\n");
    console.info(`PRODUCTION_ACCEPTANCE=${safe.automatedChecks}; LIVE_EXECUTED=${safe.liveExecuted ? "YES" : "NO"}; REQUESTS=${safe.requestCount}/5; NO_AUTOMATIC_RETRY`);
    console.info(`Artifacts: test-results/live/${runId}/report.json and report.txt`);
    console.info("Human semantic / visual review and a real 10–15 minute learning trial remain pending; this command cannot approve them.");
    if (report.failures.length) process.exitCode = 1;
  };

  try {
    if (options.offline) {
      const offlineGuard = new ProductionRequestGuard("https://offline.invalid");
      const expected = { purpose: "tutor" as const, input: { courseId: PRODUCTION_COURSE_ID, lessonId: PRODUCTION_LESSONS[0],
        question: PRODUCTION_QUESTIONS.tutor, conversation: [] } };
      offlineGuard.arm(expected);
      if (!offlineGuard.claim("https://offline.invalid/api/ai/tutor", "POST", expected.input) ||
        offlineGuard.claim("https://offline.invalid/api/ai/tutor", "POST", expected.input)) throw new Error("OFFLINE_GUARD_FAILED");
      report.checks.push("Pure request guard permits once and rejects duplicate; zero network/browser/provider operations.");
      return;
    }
    const origin = options.origin!;
    guard = new ProductionRequestGuard(origin);
    const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([name, value]) =>
      typeof value === "string" && !/KEY|TOKEN|SECRET|PASSWORD/i.test(name))) as Record<string, string>;
    const launch = () => chromium.launchPersistentContext(join(output, "browser-profile"), {
      channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined),
      headless: true, viewport: { width: 1440, height: 1000 }, serviceWorkers: "block", env: browserEnv,
    });
    const installGuard = async (target: BrowserContext) => {
      target.on("page", (page) => page.on("pageerror", () => { report.browserErrors += 1; }));
      await target.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== origin) {
          guard!.claim(request.url(), request.method(), null);
          await route.abort(); return;
        }
        if (!url.pathname.startsWith("/api/")) {
          if (request.method() !== "GET" && request.method() !== "HEAD") {
            guard!.claim(request.url(), request.method(), null);
            await route.abort(); return;
          }
          await route.continue(); return;
        }
        let body: unknown;
        try { body = request.postDataJSON(); } catch { /* Guard rejects invalid JSON. */ }
        if (!guard!.claim(request.url(), request.method(), body)) { await route.abort(); return; }
        if (url.pathname === "/api/ai/feedback") feedbackRequest = feedbackRequestSchema.parse(body);
        if (url.pathname === "/api/ai/client") {
          const parsed = clientRequestSchema.parse(body);
          if (parsed.mode === "opening") openingInput = parsed;
        }
        report.liveExecuted = true;
        await route.continue();
      });
    };
    const assertClean = () => {
      if (guard!.blocked || report.browserErrors) throw new Error("UNEXPECTED_REQUEST_OR_BROWSER_ERROR");
    };
    const screenshot = async (page: Page, name: string) => {
      await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
    };
    const invoke = async <T>(page: Page, expected: ExpectedProductionRequest, schema: z.ZodType<T>, action: () => Promise<unknown>) => {
      assertClean(); guard!.arm(expected);
      const requestStarted = Date.now();
      console.info(`Running ${expected.purpose} (${guard!.count + 1}/5); stop on first failure; no automatic Retry.`);
      const operation = expected.purpose === "client-opening" ? "client" : expected.purpose;
      const responsePromise = page.waitForResponse((response: Response) => response.request().method() === "POST" &&
        new URL(response.url()).origin === origin && new URL(response.url()).pathname === `/api/ai/${operation}`,
      { timeout: API_WAIT_TIMEOUT_MS + 2_000 });
      const [response] = await Promise.all([responsePromise, action()]);
      const parsed = apiEnvelopeSchema(schema).safeParse(await response.json());
      report.requests.push({ operation: expected.purpose, appRequestId: parsed.success ? safeIdentifier(parsed.data.requestId) : null,
        providerRequestId: safeIdentifier(response.headers()["x-provider-request-id"]), providerIdSource: "public response header when available; otherwise correlate server logs",
        httpStatus: response.status(), durationMs: Date.now() - requestStarted,
        result: parsed.success ? parsed.data.ok && response.ok() ? "PASS" : parsed.data.ok ? "HTTP_ERROR" : parsed.data.error.code : "INVALID_API_RESPONSE" });
      if (!parsed.success || !parsed.data.ok || !response.ok()) throw new Error("PRODUCT_AI_REQUEST_FAILED");
      assertClean();
      return parsed.data.data;
    };
    stage = "anonymous-browser-start";
    context = await launch(); await installGuard(context);
    let page = await context.newPage();
    page.setDefaultTimeout(15_000);
    await page.goto(`${origin}${coursePath}/lessons/${PRODUCTION_LESSONS[0]}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    const tutorHistory: TutorMessage[] = [];
    for (const question of [PRODUCTION_QUESTIONS.tutor, PRODUCTION_QUESTIONS.followUp]) {
      stage = tutorHistory.length ? "real-tutor-follow-up" : "real-tutor";
      await page.getByLabel("Your question", { exact: true }).fill(question);
      const answer = await invoke(page, { purpose: "tutor", input: { courseId: PRODUCTION_COURSE_ID,
        lessonId: PRODUCTION_LESSONS[0], question, conversation: [...tutorHistory] } }, tutorTextSchema,
      () => page.getByRole("button", { name: "Send question", exact: true }).click());
      await expect(page.getByRole("log")).toContainText(answer);
      tutorHistory.push({ role: "user", content: question }, { role: "assistant", content: answer });
      await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    }
    report.studentVisible.tutor = tutorHistory;
    await screenshot(page, "tutor-follow-up");
    report.checks.push("Two real Tutor responses rendered; follow-up carried the actual first exchange; Tutor did not complete the lesson.");
    stage = "explicit-lesson-completion";
    for (const lessonId of PRODUCTION_LESSONS) {
      await page.goto(`${origin}${coursePath}/lessons/${lessonId}`);
      await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
      await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
    }
    stage = "real-client-opening";
    await page.goto(`${origin}${activityPath}`);
    const opening = await invoke(page, { purpose: "client-opening" }, clientReplySchema,
      () => page.getByRole("button", { name: "Start interview", exact: true }).click());
    if (!openingInput) throw new Error("CLIENT_OPENING_IDENTITY_UNAVAILABLE");
    if (opening.factIds.length || opening.disclosedFactIds.length) throw new Error("CLIENT_OPENING_DISCLOSED_FACTS");
    await expect(page.getByRole("log")).toContainText(opening.reply); assertClean();
    stage = "real-client-related-question";
    await page.getByLabel("Your question", { exact: true }).fill(PRODUCTION_QUESTIONS.client);
    const answer = await invoke(page, { purpose: "client", input: { ...openingInput, mode: "turn", question: PRODUCTION_QUESTIONS.client,
      transcript: [{ role: "assistant", content: opening.reply, factIds: [] }] } }, clientReplySchema,
    () => page.getByRole("button", { name: "Send question", exact: true }).click());
    if (!answer.factIds.length) throw new Error("RELATED_CLIENT_QUESTION_DISCLOSED_NOTHING");
    await expect(page.getByRole("log")).toContainText(answer.reply);
    report.studentVisible.client = { opening: opening.reply, question: PRODUCTION_QUESTIONS.client, answer: answer.reply,
      openingDisclosedFactCount: opening.factIds.length, questionDisclosedFactCount: answer.factIds.length };
    await screenshot(page, "client-interview");
    stage = "eight-field-summary-and-real-feedback";
    await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
    const summary = productionSummary(answer.reply);
    await expect(page.getByRole("form", { name: "Requirement summary" }).getByRole("textbox")).toHaveCount(8);
    for (const field of summaryFields) await page.getByLabel(field.label, { exact: true }).fill(summary[field.id]);
    const feedback = await invoke(page, { purpose: "feedback", attemptId: openingInput.attemptId, summary,
      transcript: [{ role: "assistant", text: opening.reply }, { role: "user", text: PRODUCTION_QUESTIONS.client }, { role: "assistant", text: answer.reply }] },
    feedbackResponseSchema, () => page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click());
    if (!feedbackRequest || feedback.attemptId !== feedbackRequest.attemptId || feedback.requestId !== feedbackRequest.requestId ||
      feedback.submissionId !== feedbackRequest.submissionId ||
      !feedbackMatchesSubmission(feedback.assessment, { summary, transcript: feedbackRequest.transcript })) throw new Error("FEEDBACK_SUBMISSION_IDENTITY_MISMATCH");
    await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
    report.studentVisible.summary = summary;
    const visibleDimension = (dimension: typeof feedback.assessment.questioning) => ({ level: dimension.level,
      explanation: dimension.explanation, quotes: dimension.evidence.flatMap(({ quote }) => quote ? [quote] : []) });
    report.studentVisible.feedback = { questioning: visibleDimension(feedback.assessment.questioning),
      dimensions: Object.fromEntries(Object.entries(feedback.assessment.dimensions).map(([id, value]) => [id, visibleDimension(value)])),
      whatWentWell: feedback.assessment.whatWentWell, whatToImprove: feedback.assessment.whatToImprove };
    await screenshot(page, "feedback");
    const savedCourse = async (): Promise<CourseLearningState> => page.evaluate(({ key, courseId }) => {
      const raw = localStorage.getItem(key);
      if (!raw) throw new Error("NO_SAVED_LEARNING_STATE");
      return JSON.parse(raw).courses[courseId];
    }, { key: PRODUCTION_STORAGE_KEY, courseId: PRODUCTION_COURSE_ID });
    await expect.poll(async () => (await savedCourse()).latestSuccessfulResult?.requestId).toBe(feedbackRequest.requestId);
    const saved = await savedCourse();
    expect(saved.completedLessonIds).toEqual([...PRODUCTION_LESSONS]);
    expect(saved.currentLessonId).toBe(PRODUCTION_LESSONS[2]);
    expect(saved.earnedActivityCompletion?.requestId).toBe(feedbackRequest.requestId);
    expect(saved.latestSuccessfulResult?.summarySnapshot).toEqual(summary);
    expect(saved.latestSuccessfulResult?.feedback).toEqual(feedback.assessment);
    const selection = selectRecommendation(feedback.assessment, PRODUCTION_COURSE_ID, { completedLessonIds: saved.completedLessonIds, activityCompleted: true });
    expect(saved.latestSuccessfulResult?.recommendation).toEqual(selection.recommendation);
    expect(saved.latestSuccessfulResult?.completionPending).toEqual(selection.completionPending);
    report.studentVisible.recommendation = selection;
    const checkRestoredUi = async () => {
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      await expect(page.getByRole("link", { name: "Return to this lesson", exact: true })).toHaveAttribute("href", `${coursePath}/lessons/${PRODUCTION_LESSONS[2]}`);
      await expect(page.getByRole("heading", { name: "Latest successful feedback", exact: true })).toBeVisible();
      await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
      await expect(page.getByRole("heading", { name: "Recommended next action", exact: true })).toBeVisible();
      if (selection.recommendation?.kind === "reviewLesson") {
        await expect(page.locator(".feedback-action")).toContainText(selection.recommendation.reason);
        await expect(page.locator(".feedback-action").getByRole("link").first()).toHaveAttribute("href", `${coursePath}/lessons/${selection.recommendation.lessonId}`);
      } else if (selection.recommendation) await expect(page.locator(".feedback-action")).toContainText(selection.recommendation.reason);
      expect(await savedCourse()).toEqual(saved);
      await page.getByText("View submitted summary", { exact: true }).click();
      for (const [index, field] of summaryFields.entries()) await expect(page.locator(".submitted-summary dd").nth(index)).toHaveText(summary[field.id]);
      assertClean();
    };
    stage = "production-progress-and-refresh";
    await page.goto(`${origin}/progress`); await checkRestoredUi();
    await screenshot(page, "progress-before-refresh");
    await page.reload(); await checkRestoredUi(); report.sameOriginRefresh = "PASS";
    await screenshot(page, "progress-after-refresh");
    stage = "real-browser-process-close-and-same-profile-reopen";
    await context.close(); context = undefined;
    context = await launch(); await installGuard(context);
    page = await context.newPage(); page.setDefaultTimeout(15_000);
    await page.goto(`${origin}/progress`); await checkRestoredUi();
    report.sameProfileBrowserReopen = "PASS";
    await screenshot(page, "progress-after-browser-reopen");
    if (guard.count !== PRODUCTION_REQUEST_BUDGET) throw new Error("REQUEST_BUDGET_MISMATCH");
    report.checks.push("All three explicit lesson completions plus valid real Feedback give Progress 100%.",
      "Saved completion, current lesson, submitted summary, feedback and recommendation match before refresh, after refresh and after actual browser process close/relaunch with the same profile and HTTPS origin.",
      "No storageState export/import, localStorage seeding, mock AI, direct provider API, automatic retry or additional request during restoration.");
  } catch {
    report.failures.push(`FAILED_STAGE:${stage}`);
  } finally {
    await context?.close().catch(() => {});
    await finish();
  }
}

void main().catch(() => {
  // Never print a raw exception: browser/provider diagnostics may contain input.
  console.info("PRODUCTION_ACCEPTANCE=FAIL; invalid arguments or artifact environment; no automatic retry. Use --url https://YOUR-PRODUCTION-HOST or --offline.");
  process.exitCode = 1;
});

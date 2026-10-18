import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, type Browser } from "@playwright/test";
import { courseRegistry } from "../../src/content/courses/registry";
import { createCourseLearningState } from "../../src/domain/learning";
import { feedbackResponseSchema, buildLearningResult } from "../../src/domain/buildLearningResult";
import { feedbackRequestSchema, type FeedbackRequest } from "../../src/domain/submission";
import { summaryFields } from "../../src/domain/summary";
import { apiEnvelopeSchema } from "../../src/lib/api/contracts";
import { API_WAIT_TIMEOUT_MS } from "../../src/lib/api/client";
import { controlledClientReply, feedbackInterview, feedbackOpening, feedbackSemanticCases, FEEDBACK_REQUEST_BUDGET } from "./cases/feedback";
import { checkFeedbackCase, feedbackAcceptanceSummary, matchesFeedbackRequest, readFeedbackTelemetry, redactFeedbackReport } from "./feedback-acceptance-support";

const root = fileURLToPath(new URL("../../", import.meta.url));
const courseId = "requirement-clarification";
const coursePath = `/courses/${courseId}`;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const address = listener.address(); await new Promise<void>((resolve) => listener.close(() => resolve()));
  if (!address || typeof address === "string") throw new Error("No local port");
  return address.port;
}
interface Evidence {
  id: string; requestId: string | null; durationMs: number; input: FeedbackRequest | null; feedback: unknown;
  nextAction: unknown; telemetry: ReturnType<typeof readFeedbackTelemetry>; failures: string[]; humanReview: string;
}
async function main() {
  const started = Date.now();
  const dir = join(root, "test-results/live", `feedback-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  const report = { provider: "DeepSeek", model: "deepseek-flash", clientTranscriptSource: "CONTROLLED FIXTURES; no live Client/Tutor requests",
    automaticRetries: "NONE", requestBudget: FEEDBACK_REQUEST_BUDGET, requestCount: 0, durationMs: 0, cases: [] as Evidence[], failures: [] as string[],
    summary: feedbackAcceptanceSummary(0, 0, FEEDBACK_REQUEST_BUDGET, []) };
  const secrets = Object.entries(process.env).filter(([name, value]) => /API_KEY|TOKEN|SECRET|PASSWORD/i.test(name) && value).map(([, value]) => value!);
  async function finish() {
    report.durationMs = Date.now() - started;
    report.summary = feedbackAcceptanceSummary(report.cases.length, report.requestCount, FEEDBACK_REQUEST_BUDGET, [...report.failures, ...report.cases.flatMap((c) => c.failures)]);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "feedback-acceptance.json"), redactFeedbackReport(JSON.stringify(report, null, 2), secrets));
    const readable = ["T028 FEEDBACK LIVE SEMANTIC ACCEPTANCE", "Only Feedback is LIVE. Interview inputs use clearly identified controlled fixtures.",
      `Requests: ${report.requestCount}/${FEEDBACK_REQUEST_BUDGET}; automatic retries NONE`,
      ...report.cases.flatMap((c) => [`\n${c.id}`, `Submitted input: ${JSON.stringify(c.input)}`, `Actual feedback: ${JSON.stringify(c.feedback)}`,
        `Next action: ${JSON.stringify(c.nextAction)}`, `Request ID: ${c.requestId}; duration: ${c.durationMs}ms`, `Safe telemetry: ${JSON.stringify(c.telemetry)}`,
        `Failures: ${c.failures.join(", ") || "NONE"}`, `[ ] Human semantic review: ${c.humanReview}`,
        "[ ] Verify each quote/absence, nine ratings, specific strengths/improvements and separation of questioning from summary. No private rubric dump or replacement answer."]),
      `\nRun failures: ${report.failures.join(", ") || "NONE"}`, ...Object.entries(report.summary).map(([key, value]) => `${key} = ${value}`),
      "Candidate PASS alone does not complete T028. Human must review all actual feedback and the browser evidence.",
    ].join("\n");
    await writeFile(join(dir, "feedback-acceptance.txt"), redactFeedbackReport(readable, secrets));
    console.info(redactFeedbackReport(readable, secrets)); console.info(`Artifacts: ${dir}`);
    if (report.summary.AUTOMATED_CHECKS !== "PASS") process.exitCode ||= 1;
  }
  if (!process.env.DEEPSEEK_API_KEY?.trim() || !existsSync(join(root, ".next/BUILD_ID"))) {
    report.failures.push(!process.env.DEEPSEEK_API_KEY?.trim() ? "NOT_CONFIGURED; zero requests" : "PRODUCTION_BUILD_REQUIRED; zero requests");
    process.exitCode = 2; await finish(); return;
  }
  const origin = `http://127.0.0.1:${await freePort()}`;
  const server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", new URL(origin).port],
    { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let output = ""; let startupFailed = false;
  server.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  server.stderr?.on("data", () => {}); server.on("error", () => { startupFailed = true; });
  let browser: Browser | undefined; let stage = "server"; let blocked = 0;
  try {
    const deadline = Date.now() + 15000;
    while (!output.includes("Ready in")) {
      if (startupFailed || server.exitCode !== null || Date.now() > deadline) throw new Error("Server unavailable");
      await pause(100);
    }
    stage = "browser";
    const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([name, value]) => typeof value === "string" && !/API_KEY|TOKEN|SECRET|PASSWORD/i.test(name))) as Record<string, string>;
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), env: browserEnv, args: ["--disable-gpu"] });
    for (const testCase of feedbackSemanticCases) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      let clientIndex = 0; let forwarded = false; let ready = false; let submitted: FeedbackRequest | null = null;
      const transcript = testCase.interview ? [{ role: "assistant", text: feedbackOpening }, ...feedbackInterview.flatMap((turn, index) => [
        { role: "user", text: turn.question }, { role: "assistant", text: controlledClientReply(index + 1).reply },
      ])] : [];
      await context.route("**/*", async (route) => {
        const request = route.request(); const url = new URL(request.url());
        if (url.origin !== origin) { await route.abort(); return; }
        if (!url.pathname.startsWith("/api/ai/")) { await route.continue(); return; }
        if (url.pathname === "/api/ai/client" && testCase.interview && !ready && clientIndex <= feedbackInterview.length) {
          const input = request.postDataJSON();
          if ((clientIndex === 0 && input.mode === "opening") || (clientIndex > 0 && input.mode === "turn" && input.question === feedbackInterview[clientIndex - 1].question)) {
            await route.fulfill({ json: { ok: true, requestId: "controlled-client-fixture", data: controlledClientReply(clientIndex++) } }); return;
          }
        }
        let raw: unknown; try { raw = request.postDataJSON(); } catch { raw = null; }
        if (url.pathname !== "/api/ai/feedback" || request.method() !== "POST" || !ready || forwarded ||
          report.requestCount >= FEEDBACK_REQUEST_BUDGET || !matchesFeedbackRequest(raw, testCase, transcript)) {
          blocked++; await route.abort(); return;
        }
        submitted = feedbackRequestSchema.parse(raw); forwarded = true; report.requestCount++; await route.continue();
      });
      const page = await context.newPage();
      await page.goto(`${origin}${coursePath}/activity`);
      // Use client navigation so explicit completion stays in the root provider.
      if (testCase.completeLessons) {
        await page.getByRole("link", { name: "Back to course", exact: true }).click();
        for (const lesson of courseRegistry[courseId].lessons) {
          await page.getByRole("link", { name: lesson.title, exact: true }).click();
          await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
          await page.getByRole("link", { name: "Back to course", exact: true }).click();
        }
        await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
      }
      if (testCase.interview) {
        await page.getByRole("button", { name: "Start interview", exact: true }).click();
        await expect(page.getByRole("log")).toContainText(feedbackOpening);
        for (const [index, turn] of feedbackInterview.entries()) {
          await page.getByLabel("Your question", { exact: true }).fill(turn.question);
          await page.getByRole("button", { name: "Send question", exact: true }).click();
          await expect(page.getByRole("log")).toContainText(controlledClientReply(index + 1).reply);
        }
      }
      await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
      for (const { id, label } of summaryFields) await page.getByLabel(label, { exact: true }).fill(testCase.summary[id]);
      ready = true; const offset = output.length; const caseStarted = Date.now(); stage = `feedback:${testCase.id}`;
      console.info(`Running ${testCase.id} (${report.requestCount + 1}/${FEEDBACK_REQUEST_BUDGET}); no automatic Retry.`);
      const evidence: Evidence = { id: testCase.id, requestId: null, durationMs: 0, input: null, feedback: null, nextAction: null, telemetry: readFeedbackTelemetry(""), failures: [], humanReview: testCase.review };
      try {
        const [response] = await Promise.all([
          page.waitForResponse((r) => new URL(r.url()).pathname === "/api/ai/feedback", { timeout: API_WAIT_TIMEOUT_MS + 2000 }),
          page.getByRole("button", { name: "Submit Summary for Feedback", exact: true }).click(),
        ]);
        evidence.durationMs = Date.now() - caseStarted; await pause(150);
        evidence.telemetry = readFeedbackTelemetry(output.slice(offset)); evidence.input = submitted;
        const parsed = apiEnvelopeSchema(feedbackResponseSchema).safeParse(await response.json());
        if (!parsed.success) evidence.failures.push("INVALID_API_ENVELOPE");
        else if (!parsed.data.ok) { evidence.requestId = parsed.data.requestId; evidence.failures.push(`APPLICATION_ERROR:${parsed.data.error.code}`); }
        else if (!response.ok() || !submitted) evidence.failures.push("HTTP_OR_REQUEST_FAILURE");
        else {
          evidence.requestId = parsed.data.requestId;
          const course = { ...createCourseLearningState(), completedLessonIds: testCase.completeLessons ? courseRegistry[courseId].lessons.map((l) => l.id) : [] };
          const request: FeedbackRequest = submitted;
          const result = buildLearningResult(parsed.data.data, request, { submissionId: request.submissionId, summary: request.summarySnapshot, transcript: request.transcript }, courseId, course, new Date().toISOString());
          evidence.feedback = result.feedback; evidence.nextAction = { recommendation: result.recommendation, completionPending: result.completionPending };
          evidence.failures.push(...checkFeedbackCase(testCase, result.feedback, result, request));
          if (secrets.some((secret) => JSON.stringify(result.feedback).includes(secret))) evidence.failures.push("SECRET_OUTPUT_REDACTED");
          await expect(page.getByRole("heading", { name: "Your feedback", exact: true })).toBeVisible();
          await expect(page.getByRole("list", { name: "Nine feedback dimensions" }).locator(":scope > li")).toHaveCount(9);
          await expect(page.getByRole("status", { name: "Feedback request status" })).toContainText("Activity complete");
          const action = result.recommendation;
          const lesson = action?.kind === "reviewLesson" ? courseRegistry[courseId].lessons.find((item) => item.id === action.lessonId) : null;
          await expect(page.locator(".feedback-action-title")).toHaveText(lesson ? `Review Lesson ${lesson.order}: ${lesson.title}` : action?.kind === "retryActivity" ? "Retry Activity" : "Course Complete");
          await page.getByText("View submitted summary", { exact: true }).click();
          for (const [index, field] of summaryFields.entries()) await expect(page.locator(".submitted-summary dd").nth(index)).toHaveText(request.summarySnapshot[field.id] || "Left blank");
          await mkdir(dir, { recursive: true }); await page.screenshot({ path: join(dir, `${testCase.id}.png`), fullPage: true });
          await page.getByRole("link", { name: "Back to course", exact: true }).click();
          await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", testCase.completeLessons ? "100" : "25");
        }
        if (!forwarded || blocked) evidence.failures.push("REQUEST_GUARD_FAILED");
      } catch { evidence.failures.push(`FAILED_STAGE:${stage}`); evidence.durationMs ||= Date.now() - caseStarted; evidence.telemetry = readFeedbackTelemetry(output.slice(offset)); }
      report.cases.push(evidence); await context.close();
      if (evidence.failures.length) break;
    }
  } catch { report.failures.push(`EXECUTION_ENVIRONMENT:${stage}`); }
  finally { if (blocked) report.failures.push(`BLOCKED_UNEXPECTED_REQUESTS:${blocked}`); await browser?.close().catch(() => {}); server.kill(); await finish(); }
}
void main().catch(() => { console.info("T028 LIVE ACCEPTANCE: execution failed; no automatic Retry. HUMAN_REVIEW_REQUIRED=YES; T028=PENDING"); process.exitCode = 1; });

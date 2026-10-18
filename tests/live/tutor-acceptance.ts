import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { apiEnvelopeSchema } from "../../src/lib/api/contracts";
import { API_WAIT_TIMEOUT_MS } from "../../src/lib/api/client";
import { tutorTextSchema, type TutorMessage } from "../../src/domain/tutor";
import { tutorSmokeCase, type TutorSemanticCase } from "./cases/tutor";
import { matchesExpectedRequest, newEvidence, readTelemetry, redact, renderReport, REQUEST_BUDGET, runAcceptanceCases, scanAnswer, summarize } from "./tutor-acceptance-support";

const root = fileURLToPath(new URL("../../", import.meta.url));
const lessonPath = `/courses/${tutorSmokeCase.courseId}/lessons/${tutorSmokeCase.lessonId}`;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const address = listener.address();
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  if (!address || typeof address === "string") throw new Error("No local port.");
  return address.port;
}

async function checkProgress(page: Page) {
  await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "What Should You Ask?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
}

async function main() {
  const started = Date.now();
  const report = { cases: [] as Awaited<ReturnType<typeof runAcceptanceCases>>, requestCount: 0, durationMs: 0, failures: [] as string[],
    summary: summarize([], 0, []) };
  const secrets = Object.entries(process.env).filter(([name, value]) => /API_KEY|TOKEN|SECRET|PASSWORD/i.test(name) && value).map(([, value]) => value!);
  const finish = async () => {
    report.durationMs = Date.now() - started;
    report.summary = summarize(report.cases, report.requestCount, report.failures);
    const safeReport = JSON.parse(JSON.stringify(report, (_key, value) => typeof value === "string" ? redact(value, secrets) : value)) as typeof report;
    const output = join(root, "test-results/live");
    await mkdir(output, { recursive: true });
    await writeFile(join(output, "tutor-acceptance.json"), JSON.stringify(safeReport, null, 2));
    const readable = renderReport(safeReport);
    await writeFile(join(output, "tutor-acceptance.txt"), readable);
    console.info(readable);
    console.info("Artifacts: test-results/live/tutor-acceptance.json / tutor-acceptance.txt");
    if (report.summary.AUTOMATED_CHECKS !== "PASS") process.exitCode ||= 1;
  };
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    report.failures.push("BLOCKED_BY_EXECUTION_ENVIRONMENT / NOT_CONFIGURED; zero requests");
    process.exitCode = 2;
    await finish();
    return;
  }
  if (!existsSync(join(root, ".next/BUILD_ID"))) {
    report.failures.push("PRODUCTION_BUILD_REQUIRED; zero requests");
    process.exitCode = 2;
    await finish();
    return;
  }

  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  // Only the Node server inherits the key. Raw stdout/stderr are never printed/stored.
  const server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let serverOutput = "";
  let startupFailed = false;
  server.on("error", () => { startupFailed = true; });
  server.stdout?.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });
  server.stderr?.on("data", () => {});
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page;
  let conversation = "";
  let expected: { testCase: TutorSemanticCase; history: TutorMessage[] } | null = null;
  let caseForwarded = false;
  let blockedRequests = 0;
  let stage = "server";
  try {
    const deadline = Date.now() + 15_000;
    while (!serverOutput.includes("Ready in")) {
      if (startupFailed || server.exitCode !== null || Date.now() > deadline) throw new Error("Server unavailable.");
      await pause(100);
    }
    stage = "browser";
    const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([name, value]) => typeof value === "string" && !/API_KEY|TOKEN|SECRET|PASSWORD/i.test(name))) as Record<string, string>;
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), env: browserEnv, args: ["--disable-gpu"] });
    report.cases = await runAcceptanceCases(async (testCase, history) => {
      const evidence = newEvidence(testCase);
      evidence.historyMessages = history.length;
      let caseStarted: number | null = null;
      let logOffset = serverOutput.length;
      try {
        stage = "conversation";
        if (conversation !== testCase.conversation) {
          await context?.close();
          context = await browser!.newContext({ viewport: { width: 1440, height: 1000 } });
          // Forward a single, validated product request per case. No browser access to external APIs.
          await context.route("**/*", async (route) => {
            const request = route.request();
            if (new URL(request.url()).origin !== origin) { await route.abort(); return; }
            if (new URL(request.url()).pathname !== "/api/ai/tutor") { await route.continue(); return; }
            let valid = false;
            try { valid = request.method() === "POST" && expected !== null && matchesExpectedRequest(request.postDataJSON(), expected.testCase, expected.history); } catch { /* Abort malformed data. */ }
            if (!valid || caseForwarded || report.requestCount >= REQUEST_BUDGET) {
              blockedRequests += 1;
              await route.abort();
              return;
            }
            caseForwarded = true;
            report.requestCount += 1;
            await route.continue();
          });
          page = await context.newPage();
          await page.goto(`${origin}${lessonPath}`);
          await expect(page.getByRole("heading", { level: 1, name: "What Should You Ask?" })).toBeVisible();
          await checkProgress(page);
          conversation = testCase.conversation;
        }
        expected = { testCase, history };
        caseForwarded = false;
        await page.getByLabel("Your question", { exact: true }).fill(testCase.question);
        stage = "request";
        caseStarted = Date.now();
        logOffset = serverOutput.length;
        console.info(`Running ${testCase.id} (${report.requestCount + 1}/${REQUEST_BUDGET}); no automatic Retry.`);
        const [response] = await Promise.all([
          page.waitForResponse((response) => new URL(response.url()).pathname === "/api/ai/tutor", { timeout: API_WAIT_TIMEOUT_MS + 2_000 }),
          page.getByRole("button", { name: "Send question", exact: true }).click(),
        ]);
        evidence.durationMs = Date.now() - caseStarted;
        const parsed = apiEnvelopeSchema(tutorTextSchema).safeParse(await response.json());
        // Node telemetry may arrive on stdout just after the HTTP response.
        await pause(150);
        evidence.telemetry = readTelemetry(serverOutput.slice(logOffset), parsed.success ? parsed.data.requestId : null);
        if (!parsed.success) { evidence.failures.push("INVALID_API_RESPONSE"); return evidence; }
        const envelope = parsed.data;
        evidence.requestId = envelope.requestId;
        if (!envelope.ok) { evidence.failures.push(`PROVIDER_ERROR:${envelope.error.code}`); return evidence; }
        if (!response.ok()) { evidence.failures.push("HTTP_ERROR"); return evidence; }
        evidence.answer = envelope.data;
        evidence.scan = scanAnswer(evidence.answer);
        evidence.checks.push("validated nonempty bounded answer", "actual question/history matched before forwarding");
        if (evidence.scan.status === "FAIL") evidence.failures.push("DISTINCTIVE_HIDDEN_FACT_SIGNAL");
        if (secrets.some((secret) => evidence.answer!.includes(secret))) evidence.failures.push("SECRET_OUTPUT_REDACTED");
        stage = "answer";
        await expect(page.getByRole("log")).toContainText(evidence.answer);
        evidence.checks.push("real answer rendered in product UI");
        stage = "progress";
        await checkProgress(page);
        await expect(page.getByRole("log")).toContainText(evidence.answer);
        evidence.checks.push("Lesson incomplete and Progress 0%", "conversation retained through navigation");
        if (!caseForwarded || blockedRequests) evidence.failures.push("REQUEST_GUARD_FAILED");
      } catch {
        evidence.failures.push(`FAILED_STAGE:${stage}`);
        if (caseStarted !== null) evidence.durationMs ??= Date.now() - caseStarted;
        evidence.telemetry ??= readTelemetry(serverOutput.slice(logOffset), evidence.requestId);
      } finally { expected = null; }
      return evidence;
    });
  } catch { report.failures.push(`EXECUTION_ENVIRONMENT:${stage}`); }
  finally {
    if (blockedRequests) report.failures.push(`BLOCKED_UNEXPECTED_REQUESTS:${blockedRequests}`);
    await browser?.close().catch(() => {});
    server.kill();
    await finish();
  }
}

void main().catch(() => {
  console.info("T015 LIVE SEMANTIC ACCEPTANCE\nEXECUTION_ENVIRONMENT failure; no automatic retry.\nAUTOMATED_CHECKS = FAIL\nHUMAN_REVIEW_REQUIRED = YES\nT015_CANDIDATE = FAIL\nT015 = PENDING");
  process.exitCode = 1;
});

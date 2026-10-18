import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium, expect, type Browser } from "@playwright/test";
import { tutorSmokeCase } from "./cases/tutor";
import { tutorTextSchema } from "../../src/domain/tutor";
import { API_WAIT_TIMEOUT_MS } from "../../src/lib/api/client";

const root = fileURLToPath(new URL("../../", import.meta.url));
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const address = listener.address();
  if (!address || typeof address === "string") throw new Error("No local port.");
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  return address.port;
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    console.info(JSON.stringify({ status: "BLOCKED_BY_EXECUTION_ENVIRONMENT", code: "NOT_CONFIGURED", requestCount: 0, testLesson: "N/A", testQuestion: "N/A", durationMs: "N/A", usage: "N/A" }));
    process.exitCode = 2;
    return;
  }
  if (!existsSync(join(root, ".next/BUILD_ID"))) {
    console.info(JSON.stringify({ status: "NOT RUN", code: "PRODUCTION_BUILD_REQUIRED", requestCount: 0 }));
    process.exitCode = 2;
    return;
  }
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let serverOutput = "";
  let startupFailed = false;
  server.on("error", () => { startupFailed = true; });
  server.stdout?.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });
  server.stderr?.on("data", () => {});
  let browser: Browser | undefined;
  let stage = "server";
  let requestCount = 0;
  const report: Record<string, unknown> = { status: "FAIL", provider: "DeepSeek", model: "deepseek-flash", testLesson: tutorSmokeCase.lessonId, testQuestion: tutorSmokeCase.question, requestCount: 0, semanticReview: "PENDING_MANUAL_REVIEW", fullT015Coverage: "PENDING" };
  try {
    const readyDeadline = Date.now() + 15_000;
    while (!serverOutput.includes("Ready in")) {
      if (startupFailed || server.exitCode !== null || Date.now() > readyDeadline) throw new Error("Local server unavailable.");
      await pause(100);
    }
    stage = "browser";
    const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([name, value]) => typeof value === "string" && !/API_KEY|TOKEN|SECRET|PASSWORD/i.test(name))) as Record<string, string>;
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), env: browserEnv, args: ["--disable-gpu"] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route("**/api/ai/tutor", async (route) => {
      requestCount += 1;
      if (requestCount > 1) await route.abort();
      else await route.continue();
    });
    await page.goto(`${origin}/courses/${tutorSmokeCase.courseId}/lessons/${tutorSmokeCase.lessonId}`);
    await expect(page.getByRole("heading", { level: 1, name: "What Should You Ask?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    await page.getByLabel("Your question", { exact: true }).fill(tutorSmokeCase.question);
    stage = "request";
    const started = Date.now();
    const pendingResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/ai/tutor", { timeout: API_WAIT_TIMEOUT_MS + 2_000 });
    await page.getByRole("button", { name: "Send question", exact: true }).click();
    const response = await pendingResponse;
    report.durationMs = Date.now() - started;
    const envelope = await response.json();
    report.requestId = typeof envelope.requestId === "string" ? envelope.requestId : null;
    if (!response.ok() || envelope.ok !== true) {
      report.errorCode = typeof envelope.error?.code === "string" && /^[A-Z_]{1,40}$/.test(envelope.error.code) ? envelope.error.code : "UNAVAILABLE";
      throw new Error("Tutor request failed.");
    }
    stage = "answer";
    expect(tutorTextSchema.safeParse(envelope.data).success).toBe(true);
    await expect(page.getByRole("log")).toContainText(envelope.data);
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    let answer = envelope.data as string;
    for (const secret of [process.env.DEEPSEEK_API_KEY, process.env.STITCH_API_KEY].filter((value): value is string => Boolean(value))) answer = answer.replaceAll(secret, "[redacted]");
    report.answer = answer;
    stage = "progress";
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(requestCount).toBe(1);
    report.status = "PASS";
    report.lessonCompletionUnchanged = true;
  } catch {
    report.failedStage = stage;
    process.exitCode = 1;
  } finally {
    await browser?.close().catch(() => {});
    server.kill();
    report.requestCount = requestCount;
    const usage = serverOutput.match(/inputTokens:\s*(\d+),\s*outputTokens:\s*(\d+),\s*totalTokens:\s*(\d+)/);
    report.usage = usage ? { inputTokens: Number(usage[1]), outputTokens: Number(usage[2]), totalTokens: Number(usage[3]) } : null;
    report.providerRequestId = serverOutput.match(/providerRequestId:\s*'([^']+)'/)?.[1] ?? null;
    const output = join(root, "test-results/live");
    await mkdir(output, { recursive: true });
    await writeFile(join(output, "tutor-smoke.json"), JSON.stringify(report, null, 2));
    const { answer: _answer, ...metadata } = report;
    void _answer;
    console.info(JSON.stringify({ ...metadata, artifact: "test-results/live/tutor-smoke.json" }));
  }
}
void main().catch(() => { console.info(JSON.stringify({ status: "FAIL", code: "EXECUTION_ENVIRONMENT", requestCount: null })); process.exitCode = 1; });

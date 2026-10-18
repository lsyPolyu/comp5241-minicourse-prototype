import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, type Browser, type BrowserContext } from "@playwright/test";
import { clientReplySchema, type ClientMessage, type ClientRequest } from "../../src/domain/client";
import { apiEnvelopeSchema } from "../../src/lib/api/contracts";
import { API_WAIT_TIMEOUT_MS } from "../../src/lib/api/client";
import { clientSemanticCases, CLIENT_REQUEST_BUDGET, type ClientSemanticCase } from "./cases/client";
import { checkClientCase, clientAcceptanceSummary, locateClientFailure, matchesClientRequest, readClientSelection, readClientTelemetry, redactClientReport } from "./client-acceptance-support";

const root = fileURLToPath(new URL("../../", import.meta.url));
const activity = "/courses/requirement-clarification/activity";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const address = listener.address();
  await new Promise<void>((resolve) => listener.close(() => resolve()));
  if (!address || typeof address === "string") throw new Error("No local port");
  return address.port;
}
interface Evidence {
  id: string; conversation: string; question: string | null; answer: unknown;
  requestId: string | null; durationMs: number; historyMessages: number;
  modelSelection: ReturnType<typeof readClientSelection>; telemetry: ReturnType<typeof readClientTelemetry>;
  failures: string[]; humanReview: string;
}
async function main() {
  const started = Date.now();
  const report = { provider: "DeepSeek", model: "deepseek-flash", automaticRetries: "NONE", requestBudget: CLIENT_REQUEST_BUDGET, requestCount: 0, durationMs: 0,
    cases: [] as Evidence[], failures: [] as string[], summary: clientAcceptanceSummary(0, 0, CLIENT_REQUEST_BUDGET, []) };
  const secrets = Object.entries(process.env).filter(([name, value]) => /API_KEY|TOKEN|SECRET|PASSWORD/i.test(name) && value).map(([, value]) => value!);
  async function finish() {
    report.durationMs = Date.now() - started;
    report.summary = clientAcceptanceSummary(report.cases.length, report.requestCount, CLIENT_REQUEST_BUDGET, [...report.failures, ...report.cases.flatMap((c) => c.failures)]);
    // Unique run folder preserves all earlier evidence, including failed runs.
    const dir = join(root, "test-results/live", `client-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    await mkdir(dir, { recursive: true });
    const safe = redactClientReport(JSON.stringify(report, null, 2), secrets);
    await writeFile(join(dir, "client-acceptance.json"), safe);
    const readable = ["T021 CLIENT LIVE SEMANTIC ACCEPTANCE", "DeepSeek / deepseek-flash; no automatic Retry.",
      ...report.cases.flatMap((c) => [`\n${c.id} / ${c.conversation}`, `Question: ${c.question ?? "OPENING"}`, `Actual reply/IDs: ${JSON.stringify(c.answer)}`, `Model selection: ${JSON.stringify(c.modelSelection)}`, `Request ID: ${c.requestId}; duration: ${c.durationMs}ms; history: ${c.historyMessages}`, `Safe telemetry: ${JSON.stringify(c.telemetry)}`, `Failures: ${c.failures.join(", ") || "NONE"}`, `[ ] Human semantic review: ${c.humanReview}`, "[ ] No unrelated facts, role changes, invented requirements or contradictions."]),
      `\nRequests: ${report.requestCount}/${CLIENT_REQUEST_BUDGET}`, `Run failures: ${report.failures.join(", ") || "NONE"}`, ...Object.entries(report.summary).map(([k, v]) => `${k} = ${v}`),
      "Human must review ALL actual model choices and replies. Candidate PASS does not complete T021.",
    ].join("\n");
    await writeFile(join(dir, "client-acceptance.txt"), redactClientReport(readable, secrets));
    console.info(redactClientReport(readable, secrets));
    console.info(`Artifacts: ${dir}`);
    if (report.summary.AUTOMATED_CHECKS !== "PASS") process.exitCode ||= 1;
  }
  if (!process.env.DEEPSEEK_API_KEY?.trim() || !existsSync(join(root, ".next/BUILD_ID"))) {
    report.failures.push(!process.env.DEEPSEEK_API_KEY?.trim() ? "NOT_CONFIGURED; zero requests" : "PRODUCTION_BUILD_REQUIRED; zero requests");
    process.exitCode = 2; await finish(); return;
  }
  const origin = `http://127.0.0.1:${await freePort()}`;
  const server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", new URL(origin).port], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let output = "";
  let startupFailed = false;
  server.on("error", () => { startupFailed = true; });
  server.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
  server.stderr?.on("data", () => {});
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let blocked = 0;
  let expected: ClientSemanticCase | null = null;
  let forwarded = false;
  let transcript: ClientMessage[] = [];
  let attemptId: string | null = null;
  let stage = "server";
  try {
    const deadline = Date.now() + 15000;
    while (!output.includes("Ready in")) {
      if (startupFailed || server.exitCode !== null || Date.now() > deadline) throw new Error("Server unavailable");
      await pause(100);
    }
    stage = "browser";
    const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([name, value]) => typeof value === "string" && !/API_KEY|TOKEN|SECRET|PASSWORD/i.test(name))) as Record<string, string>;
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), env: browserEnv, args: ["--disable-gpu"] });
    let conversation = "";
    for (const testCase of clientSemanticCases) {
      if (conversation !== testCase.conversation) {
        await context?.close();
        context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        transcript = []; attemptId = null; conversation = testCase.conversation;
        await context.route("**/*", async (route) => {
          const request = route.request(); const url = new URL(request.url());
          if (url.origin !== origin) { await route.abort(); return; }
          if (!url.pathname.startsWith("/api/ai/")) { await route.continue(); return; }
          let body: ClientRequest | null = null;
          try { body = request.postDataJSON() as ClientRequest; } catch { /* Guard below aborts invalid input. */ }
          if (url.pathname !== "/api/ai/client" || request.method() !== "POST" || !expected || forwarded || report.requestCount >= CLIENT_REQUEST_BUDGET || !matchesClientRequest(body, expected, transcript, attemptId)) {
            blocked++; await route.abort(); return;
          }
          attemptId ??= body!.attemptId;
          forwarded = true; report.requestCount++; await route.continue();
        });
      }
      const page = context!.pages()[0] ?? await context!.newPage();
      if (testCase.question === null) await page.goto(`${origin}${activity}`);
      expected = testCase; forwarded = false;
      const offset = output.length; const caseStarted = Date.now();
      stage = `request:${testCase.id}`;
      console.info(`Running ${testCase.id} (${report.requestCount + 1}/${CLIENT_REQUEST_BUDGET}); no automatic Retry.`);
      const evidence: Evidence = { id: testCase.id, conversation, question: testCase.question, answer: null, requestId: null, durationMs: 0, historyMessages: transcript.length, modelSelection: null, telemetry: readClientTelemetry(""), failures: [], humanReview: testCase.review };
      try {
        if (testCase.question !== null) await page.getByLabel("Your question", { exact: true }).fill(testCase.question);
        const [response] = await Promise.all([
          page.waitForResponse((r) => new URL(r.url()).pathname === "/api/ai/client", { timeout: API_WAIT_TIMEOUT_MS + 2000 }),
          page.getByRole("button", { name: testCase.question === null ? "Start interview" : "Send question", exact: true }).click(),
        ]);
        evidence.durationMs = Date.now() - caseStarted;
        await pause(150);
        evidence.telemetry = readClientTelemetry(output.slice(offset));
        evidence.modelSelection = readClientSelection(output.slice(offset));
        const parsed = apiEnvelopeSchema(clientReplySchema).safeParse(await response.json());
        if (!parsed.success) evidence.failures.push("INVALID_API_ENVELOPE");
        else {
          evidence.requestId = parsed.data.requestId;
          if (!parsed.data.ok) evidence.failures.push(`APPLICATION_ERROR:${parsed.data.error.code}; FAILURE_STAGE:${locateClientFailure(evidence.telemetry)}`);
          else if (!response.ok()) evidence.failures.push("HTTP_FAILURE");
          else {
            const answer = parsed.data.data;
            evidence.answer = answer;
            evidence.failures.push(...checkClientCase(testCase, answer, transcript, evidence.modelSelection));
            if (secrets.some((secret) => answer.reply.includes(secret))) evidence.failures.push("SECRET_OUTPUT_REDACTED");
            await expect(page.getByRole("log", { name: "Client conversation" })).toContainText(answer.reply);
            if (testCase.question !== null) transcript.push({ role: "user", content: testCase.question });
            transcript.push({ role: "assistant", content: answer.reply, factIds: answer.factIds });
            stage = `navigation:${testCase.id}`;
            await page.getByRole("link", { name: "Back to course", exact: true }).click();
            await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
            await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
            await expect(page.getByRole("log")).toContainText(answer.reply);
          }
        }
        if (!forwarded || blocked) evidence.failures.push("REQUEST_GUARD_FAILED");
      } catch { evidence.failures.push(`FAILED_STAGE:${stage}`); evidence.durationMs ||= Date.now() - caseStarted; evidence.telemetry = readClientTelemetry(output.slice(offset)); }
      report.cases.push(evidence); expected = null;
      if (evidence.failures.length) break; // Fail fast: no follow-up paid requests.
    }
  } catch { report.failures.push(`EXECUTION_ENVIRONMENT:${stage}`); }
  finally {
    if (blocked) report.failures.push(`BLOCKED_UNEXPECTED_REQUESTS:${blocked}`);
    await browser?.close().catch(() => {});
    server.kill();
    await finish();
  }
}
void main().catch(() => { console.info("T021 LIVE ACCEPTANCE: execution failed; no automatic Retry. HUMAN_REVIEW_REQUIRED=YES; T021=PENDING"); process.exitCode = 1; });

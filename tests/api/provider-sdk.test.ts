import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubEnv("DEEPSEEK_API_KEY", "offline-test-key");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function probe() {
  const { requestStructuredResponse } = await import("../../src/server/ai/provider");
  return requestStructuredResponse({
    operation: "capability", instructions: 'Return only this json: {"ok":true,"message":"capability-ok"}.',
    input: "Check capability.", schema: z.object({ ok: z.literal(true), message: z.literal("capability-ok") }),
    schemaName: "capability_check",
  });
}

test("real SDK serializes a DeepSeek JSON request and decodes its response offline", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({
    id: "response_offline", status: "completed", model: "deepseek-flash",
    output: [{ type: "message", status: "completed", role: "assistant",
      content: [{ type: "output_text", text: '{"ok":true,"message":"capability-ok"}', annotations: [] }],
    }],
    usage: { input_tokens: 12, output_tokens: 6, total_tokens: 18 },
  }), { headers: { "content-type": "application/json", "x-request-id": "req_sdk_offline" } }));

  expect(await probe()).toMatchObject({
    data: { ok: true, message: "capability-ok" }, model: "deepseek-flash", requestId: "req_sdk_offline",
    usage: { inputTokens: 12, outputTokens: 6, totalTokens: 18 },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.deepseek.com/responses");
  expect(new Headers(options?.headers).get("authorization")).toBe("Bearer offline-test-key");
  expect(new Headers(options?.headers).get("x-stainless-timeout")).toBe("60");
  expect(options).toHaveProperty("dispatcher");
  expect(JSON.parse(options?.body as string)).toMatchObject({
    model: "deepseek-flash", text: { format: { type: "json_object" } },
    reasoning: { effort: "none" }, max_output_tokens: 128, stream: false,
  });
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("offline-test-key");
});

test("real SDK waits past 10s and 30s, aborts capability at 60s, and never retries", async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  let settled = false;
  const result = probe().catch((error: unknown) => error).finally(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(30_001);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(30_000);
  expect(await result).toMatchObject({ code: "TIMEOUT", diagnostic: "TIMEOUT" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(settled).toBe(true);
});

test("real SDK balance errors retain only safe diagnostics and do not retry", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({
    error: { message: "private payload offline-test-key", type: "insufficient_balance" },
  }), { status: 402, headers: { "content-type": "application/json", "x-request-id": "req_balance" } }));
  const error = await probe().catch((caught: unknown) => caught);
  expect(error).toMatchObject({
    code: "NOT_CONFIGURED", diagnostic: "INSUFFICIENT_BALANCE", requestId: "req_balance",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveProperty("cause");
  expect(JSON.stringify({ error, logs: vi.mocked(console.info).mock.calls })).not.toMatch(/private|offline-test-key/);
});

test.each(["success", "timeout"])("Tutor real SDK transport stays pending past 10/30/45s, then %s within the 60s budget", async (outcome) => {
  vi.useFakeTimers();
  const { askTutor } = await import("../../src/server/ai/tutor");
  fetchMock.mockImplementation((_url, options) => new Promise((resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    if (outcome === "success") setTimeout(() => resolve(new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "A small related example." }] }] }), { headers: { "content-type": "application/json" } })), 55_000);
  }));
  let settled = false;
  const result = askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question: "Give an example of that.", conversation: [{ role: "user", content: "What is a constraint?" }, { role: "assistant", content: "A constraint is a limit." }] })
    .catch((error: unknown) => error).finally(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(10_001);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(settled).toBe(false);
  const options = fetchMock.mock.calls[0][1];
  expect(new Headers(options?.headers).get("x-stainless-timeout")).toBe("60");
  expect(options).toHaveProperty("dispatcher", expect.anything());
  expect(options?.signal?.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(35_000);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(outcome === "success" ? 10_000 : 15_000);
  if (outcome === "success") expect(await result).toMatchObject({ data: "A small related example." });
  else expect(await result).toMatchObject({ code: "TIMEOUT", diagnostic: "TIMEOUT" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("real SDK maps the native Undici connect-timeout cause to safe TIMEOUT with no retry", async () => {
  const { askTutor } = await import("../../src/server/ai/tutor");
  const cause = Object.assign(new Error("private connect details"), { name: "ConnectTimeoutError", code: "UND_ERR_CONNECT_TIMEOUT" });
  fetchMock.mockRejectedValue(new TypeError("fetch failed", { cause }));
  await expect(askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question: "What is a constraint?", conversation: [] }))
    .rejects.toMatchObject({ code: "TIMEOUT", diagnostic: "TIMEOUT" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/private|offline-test-key|UND_ERR_CONNECT_TIMEOUT/);
});

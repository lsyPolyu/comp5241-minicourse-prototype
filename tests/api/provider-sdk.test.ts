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

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { APIConnectionTimeoutError, APIError } from "openai";

const sdk = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("openai", async (original) => ({ ...await original<typeof import("openai")>(), default: class { responses = { create: sdk.create }; } }));
import { POST } from "@/app/api/ai/tutor/route";
import { MAX_API_BODY_BYTES } from "@/server/http/readJson";

const input = { courseId: "requirement-clarification", lessonId: "what-to-ask", question: "What is a constraint?", conversation: [] };
const makeRequest = (body: unknown = input) => new Request("http://localhost/api/ai/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
function providerResponse(text = "A constraint is a limit.") {
  return { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] };
}
beforeEach(() => {
  sdk.create.mockReset();
  vi.stubEnv("DEEPSEEK_API_KEY", "offline-test-key");
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it("runs the route, trusted service and shared transport, returning only the public DTO", async () => {
  sdk.create.mockResolvedValue(providerResponse());
  const response = await POST(makeRequest());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ ok: true, requestId: expect.any(String), data: "A constraint is a limit." });
  expect(sdk.create).toHaveBeenCalledTimes(1);
});

it.each([{}, null, { ...input, question: " " }, { ...input, lessonId: "missing" }, { ...input, courseId: "git-basics" }, { ...input, lessonContext: "forged" }])("returns safe invalid-input envelopes %# without transport access", async (body) => {
  const response = await POST(makeRequest(body));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT", retryable: false } });
  expect(sdk.create).not.toHaveBeenCalled();
});

it.each([
  [new APIConnectionTimeoutError({ message: "private upstream stack" }), "TIMEOUT", 504],
  [new APIError(503, { message: "private upstream stack" }, undefined, new Headers()), "UNAVAILABLE", 503],
  [new APIError(401, { message: "private upstream stack" }, undefined, new Headers()), "NOT_CONFIGURED", 503],
  [new APIError(402, { message: "private upstream stack" }, undefined, new Headers()), "NOT_CONFIGURED", 503],
  [new APIError(429, { message: "private upstream stack" }, undefined, new Headers()), "RATE_LIMITED", 429],
])("normalizes provider failure %# without raw errors or retries", async (error, code, status) => {
  sdk.create.mockRejectedValue(error);
  const response = await POST(makeRequest());
  expect(response.status).toBe(status);
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, error: { code, retryable: true, message: expect.stringContaining("Your work is still here") } });
  expect(JSON.stringify(body)).not.toMatch(/private|offline-test-key|diagnostic|stack|api\.deepseek|node_modules/);
  expect(sdk.create).toHaveBeenCalledTimes(1);
});

it.each(["", " \n\t", "x".repeat(4001)])("rejects unusable output %#", async (text) => {
  sdk.create.mockResolvedValue(providerResponse(text));
  const response = await POST(makeRequest());
  expect(response.status).toBe(502);
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, error: { code: "INVALID_AI_RESPONSE", retryable: true } });
  expect(JSON.stringify(body)).not.toMatch(/diagnostic|schemaIssues|responseStatus|textLength|stack|offline-test-key/);
});

it("maps refusal and missing credentials safely", async () => {
  sdk.create.mockResolvedValue({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "private refusal" }] }] });
  expect((await POST(makeRequest())).status).toBe(422);
  sdk.create.mockReset();
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  const response = await POST(makeRequest());
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "NOT_CONFIGURED" } });
  expect(sdk.create).not.toHaveBeenCalled();
});

it("rejects malformed JSON, wrong content type and oversized actual bodies", async () => {
  for (const request of [
    new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }),
    new Request("http://localhost", { method: "POST", body: JSON.stringify(input) }),
    new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, question: "x".repeat(MAX_API_BODY_BYTES) }) }),
  ]) {
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  }
  expect(sdk.create).not.toHaveBeenCalled();
});

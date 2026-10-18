import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { APIConnectionError, APIConnectionTimeoutError, APIError } from "openai";
import { z } from "zod";
import { AIProviderError, normalizeAIError } from "../../src/server/ai/errors";

const sdk = vi.hoisted(() => {
  const create = vi.fn();
  const destroy = vi.fn(async () => {});
  return {
    create, constructor: vi.fn(function () { return { responses: { create } }; }),
    destroy, agent: vi.fn(function () { return { destroy }; }),
  };
});
vi.mock("server-only", () => ({}));
vi.mock("undici", () => ({ Agent: sdk.agent }));
vi.mock("openai", async (original) => ({
  ...await original<typeof import("openai")>(), default: sdk.constructor,
}));

beforeEach(() => {
  vi.resetModules();
  sdk.create.mockReset();
  vi.stubEnv("DEEPSEEK_API_KEY", "offline-test-key");
  vi.stubEnv("DEEPSEEK_MODEL", "");
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function validResponse() {
  return {
    status: "completed", _request_id: "req_offline",
    output: [{ type: "message", content: [{ type: "output_text", text: '{"answer":"A clear answer."}' }] }],
    usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
  };
}

async function sendRequest() {
  const { requestStructuredResponse } = await import("../../src/server/ai/provider");
  return requestStructuredResponse({
    operation: "tutor", instructions: "private instructions", input: "private student text",
    schema: z.object({ answer: z.string().min(1) }), schemaName: "test_answer",
  });
}

test("uses one structured request and returns only validated data and metadata", async () => {
  sdk.create.mockResolvedValue(validResponse());
  expect(await sendRequest()).toMatchObject({
    data: { answer: "A clear answer." }, model: "deepseek-flash",
    requestId: "req_offline", usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  });
  expect(sdk.create).toHaveBeenCalledTimes(1);
  expect(sdk.create).toHaveBeenCalledWith(expect.objectContaining({
    model: "deepseek-flash", stream: false, reasoning: { effort: "none" }, max_output_tokens: 900,
    instructions: expect.stringMatching(/json[\s\S]*test_answer[\s\S]*properties/),
    input: "private student text",
    text: { format: { type: "json_object" } },
  }), undefined);
  expect(sdk.create.mock.calls[0][0]).not.toHaveProperty("store");
  expect(sdk.agent).not.toHaveBeenCalled();
  expect(sdk.constructor).toHaveBeenCalledWith(expect.objectContaining({
    apiKey: "offline-test-key", maxRetries: 0, timeout: 30_000,
    logLevel: "off", baseURL: "https://api.deepseek.com",
  }));
  const logs = JSON.stringify(vi.mocked(console.info).mock.calls);
  expect(logs).toContain("req_offline");
  expect(logs).toContain("totalTokens");
  for (const privateText of ["offline-test-key", "private instructions", "private student text", "A clear answer."]) {
    expect(logs).not.toContain(privateText);
  }
});

test("limits the 60s connection and request timeout override to capability and closes its dispatcher", async () => {
  const { requestStructuredResponse } = await import("../../src/server/ai/provider");
  sdk.create.mockResolvedValue(validResponse());
  await requestStructuredResponse({
    operation: "capability", instructions: "Return a json answer.", input: "Check capability.",
    schema: z.object({ answer: z.string() }), schemaName: "capability_check",
  });
  expect(sdk.agent).toHaveBeenCalledExactlyOnceWith({ connectTimeout: 60_000 });
  expect(sdk.create.mock.calls[0][1]).toMatchObject({
    timeout: 60_000, fetchOptions: { dispatcher: sdk.agent.mock.results[0].value },
  });
  expect(sdk.create.mock.calls[0][0]).toMatchObject({ reasoning: { effort: "none" }, max_output_tokens: 128 });
  expect(sdk.destroy).toHaveBeenCalledTimes(1);
  await sendRequest();
  expect(sdk.create.mock.calls[1][1]).toBeUndefined();
  expect(sdk.agent).toHaveBeenCalledTimes(1);
});

test("initializes lazily and reuses the server client", async () => {
  await import("../../src/server/ai/provider");
  expect(sdk.constructor).not.toHaveBeenCalled();
  sdk.create.mockResolvedValue(validResponse());
  await sendRequest();
  await sendRequest();
  expect(sdk.constructor).toHaveBeenCalledTimes(1);
  expect(sdk.create).toHaveBeenCalledTimes(2);
});

test.each([
  [{ ...validResponse(), output: [{ type: "message", content: [{ type: "refusal", refusal: "private refusal" }] }] }, "REFUSED"],
  [{ ...validResponse(), status: "incomplete" }, "INVALID_AI_RESPONSE"],
  [{ ...validResponse(), status: "failed" }, "INVALID_AI_RESPONSE"],
  [{ ...validResponse(), output: null }, "INVALID_AI_RESPONSE"],
  [{ ...validResponse(), output: [] }, "INVALID_AI_RESPONSE"],
  [{ ...validResponse(), output: [{ type: "message", content: null }] }, "INVALID_AI_RESPONSE"],
])("rejects unusable provider output %# without a success fallback", async (response, code) => {
  sdk.create.mockResolvedValue(response);
  await expect(sendRequest()).rejects.toMatchObject({ code, retryable: true });
  expect(sdk.create).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/private|offline-test-key/);
});

test.each([
  [new APIConnectionTimeoutError({ message: "private payload" }), "TIMEOUT"],
  [new APIError(429, { message: "private payload" }, undefined, new Headers({ "x-request-id": "req_failure" })), "RATE_LIMITED"],
  [new APIConnectionError({ message: "private payload" }), "UNAVAILABLE"],
  [new APIError(403, { message: "private payload" }, undefined, new Headers()), "NOT_CONFIGURED"],
  [new SyntaxError("private payload"), "INVALID_AI_RESPONSE"],
  [new z.ZodError([]), "INVALID_AI_RESPONSE"],
])("sanitizes failed SDK calls %# and does not retry", async (failure, code) => {
  sdk.create.mockRejectedValue(failure);
  const error = await sendRequest().catch((caught: unknown) => caught);
  expect(error).toMatchObject({ name: "AIProviderError", code, retryable: true });
  expect(error).not.toHaveProperty("cause");
  expect(sdk.create).toHaveBeenCalledTimes(1);
  expect(JSON.stringify({ error, logs: vi.mocked(console.info).mock.calls })).not.toMatch(/private|offline-test-key/);
});

test.each([
  ["", ""],
  ["   ", ""],
  ["offline-test-key", "unapproved-model"],
])("blocks missing credentials or a different model before a provider request %#", async (key, model) => {
  vi.stubEnv("DEEPSEEK_API_KEY", key);
  vi.stubEnv("DEEPSEEK_MODEL", model);
  await expect(sendRequest()).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
  expect(sdk.constructor).not.toHaveBeenCalled();
  expect(sdk.create).not.toHaveBeenCalled();
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("unapproved-model");
});

test.each([
  ["", "JSON_OUTPUT_FAILURE"],
  ["   ", "JSON_OUTPUT_FAILURE"],
  ['{"answer":', "INVALID_JSON"],
  ['```json\n{"answer":"private payload"}\n```', "INVALID_JSON"],
  ['{"answer":""}', "SCHEMA_VALIDATION_FAILURE"],
  ['{"wrong":"private payload"}', "SCHEMA_VALIDATION_FAILURE"],
  ['{"answer":42}', "SCHEMA_VALIDATION_FAILURE"],
  ["null", "SCHEMA_VALIDATION_FAILURE"],
])("rejects invalid JSON or schema mismatch %# without logging output", async (text, diagnostic) => {
  sdk.create.mockResolvedValue({ ...validResponse(),
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  });
  await expect(sendRequest()).rejects.toMatchObject({
    code: "INVALID_AI_RESPONSE", diagnostic, requestId: "req_offline",
  });
  expect(sdk.create).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/private|offline-test-key/);
});

describe("AI error boundary", () => {
  test.each([
    [new APIConnectionTimeoutError({ message: "private payload" }), "TIMEOUT", "TIMEOUT"],
    [new APIConnectionError({ message: "private payload" }), "UNAVAILABLE", "NETWORK"],
    [new APIError(400, { message: "private payload" }, undefined, new Headers()), "INVALID_INPUT", "INVALID_REQUEST"],
    [new APIError(401, { message: "private payload" }, undefined, new Headers()), "NOT_CONFIGURED", "AUTHENTICATION"],
    [new APIError(402, { message: "private payload" }, undefined, new Headers()), "NOT_CONFIGURED", "INSUFFICIENT_BALANCE"],
    [new APIError(403, { message: "private payload" }, undefined, new Headers()), "NOT_CONFIGURED", "MODEL_ACCESS"],
    [new APIError(404, { message: "private payload" }, undefined, new Headers()), "NOT_CONFIGURED", "MODEL_NOT_FOUND"],
    [new APIError(422, { message: "private payload" }, undefined, new Headers()), "INVALID_INPUT", "INVALID_REQUEST"],
    [new APIError(429, { message: "private payload" }, undefined, new Headers()), "RATE_LIMITED", "RATE_LIMIT"],
    [new APIError(500, { message: "private payload" }, undefined, new Headers()), "UNAVAILABLE", "PROVIDER_ERROR"],
    [new APIError(503, { message: "private payload" }, undefined, new Headers()), "UNAVAILABLE", "PROVIDER_ERROR"],
    [new SyntaxError("private payload"), "INVALID_AI_RESPONSE", "INVALID_JSON"],
    [new z.ZodError([]), "INVALID_AI_RESPONSE", "SCHEMA_VALIDATION_FAILURE"],
    [new Error("private payload"), "UNAVAILABLE", "PROVIDER_ERROR"],
  ])("sanitizes provider failure %#", (failure, code, diagnostic) => {
    const error = normalizeAIError(failure);
    expect(error).toBeInstanceOf(AIProviderError);
    expect(error.code).toBe(code);
    expect(error.diagnostic).toBe(diagnostic);
    expect(error.message).toContain("Your work is still here");
    expect(error.message).not.toContain("private payload");
    expect(error.cause).toBeUndefined();
  });
});

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { postApi, API_WAIT_TIMEOUT_MS } from "@/lib/api/client";
import { tutorTextSchema } from "@/domain/tutor";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.useRealTimers());
const send = () => postApi("/api/ai/tutor", { question: "question" }, tutorTextSchema);

it("uses same-origin POST and validates the success envelope", async () => {
  const envelope = { ok: true, requestId: "req_test", data: "A short explanation." };
  fetchMock.mockResolvedValue(Response.json(envelope));
  expect(await send()).toEqual(envelope);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/ai/tutor", expect.objectContaining({ method: "POST", credentials: "same-origin", body: '{"question":"question"}' }));
});
it("preserves a valid safe failure envelope", async () => {
  const envelope = { ok: false, requestId: "req_error", error: { code: "TIMEOUT", message: "Your work is still here. Retry.", retryable: true } };
  fetchMock.mockResolvedValue(Response.json(envelope, { status: 504 }));
  expect(await send()).toEqual(envelope);
});
it.each([new Response("private proxy stack", { status: 502 }), Response.json({ ok: true, requestId: "r", data: { answer: "legacy wrapper" } }), Response.json({ ok: true, requestId: "r", data: " \n " }), Response.json({ ok: true, requestId: "r", data: "answer" }, { status: 500 })])("never displays malformed/proxy responses %#", async (response) => {
  fetchMock.mockResolvedValue(response);
  const result = await send();
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toMatch(/private proxy stack/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("allows the full 60s provider budget, then times out at 65s without an automatic retry", async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))));
  let settled = false;
  const response = send().finally(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(60_001);
  expect(settled).toBe(false);
  expect(API_WAIT_TIMEOUT_MS).toBe(65_000);
  await vi.advanceTimersByTimeAsync(4_999);
  expect(await response).toMatchObject({ ok: false, error: { code: "TIMEOUT", retryable: true } });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

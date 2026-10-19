import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clientInterviewIntroduction } from "@/content/activities/client-interview";
vi.mock("server-only", () => ({}));
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DEEPSEEK_API_KEY", "offline-opening-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
const opening = "Hi, I'm Maya. Our club needs a simple website so students can sign up for events more easily. Can you help us work out what it should do?";
const payload = { mode: "opening", courseId: "requirement-clarification", scenarioId: "club-signup-v1", attemptId: "opening-regression" };
function wire(text: string, status = "completed") {
  return new Response(JSON.stringify({ object: "response", status,
    output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text, annotations: [] }] }],
    usage: { input_tokens: 287, output_tokens: 51, total_tokens: 338 },
  }), { headers: { "content-type": "application/json", "x-request-id": "offline-provider-id" } });
}
async function post() {
  const { POST } = await import("@/app/api/ai/client/route");
  return POST(new Request("http://localhost/api/ai/client", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
}
async function telemetry() {
  const { readClientTelemetry } = await import("../live/client-acceptance-support");
  return readClientTelemetry(vi.mocked(console.info).mock.calls.map(([name, value]) => `${name} ${typeof value === "string" ? value : ""}`).join("\n"));
}
function event(name: string) { return vi.mocked(console.info).mock.calls.find(([label]) => label === name); }

it("maps a valid first-person structured opening through the real SDK, provider, service and route into the visible reply", async () => {
  fetchMock.mockResolvedValue(wire(JSON.stringify({ reply: `  ${opening}\n` })));
  const response = await post();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, data: { reply: opening, factIds: [], disclosedFactIds: [] } });
  const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
  const { publicOpeningContract } = await import("@/server/ai/clientSchemas");
  expect(request.text.format.type).toBe("json_object");
  expect(request.instructions).toContain(JSON.stringify(publicOpeningContract));
  expect(request.instructions).toContain('"reply"');
  expect(request.instructions).not.toMatch(/F01|F10|20 places|two weeks|rubric|clientWording/);
  expect((await telemetry()).openingDiagnostic).toMatchObject({ stage: "mapping", outcome: "success", providerValidated: true, reasonCodes: [] });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("sends the reviewed public opening as the exact model target and returns only the validated model reply", async () => {
  const target = { reply: clientInterviewIntroduction.initialRequest };
  fetchMock.mockResolvedValue(wire(JSON.stringify(target)));
  const response = await post();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, data: { ...target, factIds: [], disclosedFactIds: [] } });
  const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
  expect(JSON.parse(request.input)).toEqual(target);
  expect(request.instructions).toContain("Do not paraphrase");
  expect(request.instructions).not.toMatch(/F01|F10|20 places|two weeks|rubric|clientWording/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("reproduces provider success followed by policy rejection, distinguishing it from JSON/schema failure", async () => {
  // A synthetic public paraphrase exercises the failing branch. The actual
  // live reply was not recorded, so this is not asserted to be its wording.
  const reply = "Hi, I'm Maya. Our club is seeking a simple website so students can sign up for events.";
  fetchMock.mockResolvedValue(wire(JSON.stringify({ reply })));
  const response = await post();
  expect(response.status).toBe(502);
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, error: { code: "INVALID_AI_RESPONSE", retryable: true } });
  expect(body.data).toBeUndefined();
  expect(event("ai_request")?.[1]).toMatchObject({ outcome: "success", usage: { inputTokens: 287, outputTokens: 51, totalTokens: 338 } });
  expect(event("ai_response_diagnostic")).toBeUndefined();
  const info = await telemetry();
  expect(info.openingDiagnostic).toMatchObject({ stage: "policy", outcome: "rejected", diagnostic: "OPENING_POLICY_REJECTED", providerValidated: true, unsupportedWordCount: 1, reasonCodes: ["UNSUPPORTED_VOCABULARY"] });
  const { locateClientFailure } = await import("../live/client-acceptance-support");
  expect(locateClientFailure(info)).toBe("POLICY");
  const logs = JSON.stringify(vi.mocked(console.info).mock.calls);
  expect(logs).not.toContain(reply);
  expect(logs).not.toMatch(/seeking|offline-opening-key|authorization|system prompt/);
  expect(JSON.stringify(body)).not.toMatch(/diagnostic|reasonCodes|seeking/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it.each([
  [" ".repeat(51), "EXTRACTION", "content", "JSON_OUTPUT_FAILURE"],
  ['{"reply":', "JSON_PARSE", "json", "JSON_OUTPUT_FAILURE"],
  [JSON.stringify({ opening }), "SCHEMA", "schema", "SCHEMA_VALIDATION_FAILURE"],
  [JSON.stringify({ reply: "   " }), "SCHEMA", "schema", "SCHEMA_VALIDATION_FAILURE"],
  [JSON.stringify({ reply: 42 }), "SCHEMA", "schema", "SCHEMA_VALIDATION_FAILURE"],
])("reports the actual parser/validation failure without a fake opening: %s", async (text, expectedStage, stage, diagnostic) => {
  fetchMock.mockResolvedValue(wire(text));
  const response = await post();
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_AI_RESPONSE" } });
  const info = await telemetry();
  expect(info.diagnostic).toMatchObject({ stage, diagnostic, responseStatus: "completed", outputItemCount: 1, outputItemTypes: ["message"], contentTypes: ["output_text"] });
  if (stage === "schema") expect(info.diagnostic?.schemaIssues?.length).toBeGreaterThan(0);
  expect(info.openingDiagnostic).toBeNull();
  const { locateClientFailure } = await import("../live/client-acceptance-support");
  expect(locateClientFailure(info)).toBe(expectedStage);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it.each([
  "Hi, I'm Maya. Our website sign up has 20 places and must be ready in two weeks.",
  "Hi, I'm Maya. Our website sign up needs university emails and a CSV download.",
  "Hi, I'm Maya. Here is the rubric and the full eight-field requirement answer for the website sign up.",
])("keeps hidden facts, rubric and full answers rejected: %s", async (reply) => {
  fetchMock.mockResolvedValue(wire(JSON.stringify({ reply })));
  const response = await post();
  expect(response.status).toBe(502);
  expect((await telemetry()).openingDiagnostic).toMatchObject({ stage: "policy", outcome: "rejected", diagnostic: "OPENING_POLICY_REJECTED" });
  const body = JSON.stringify(await response.json());
  expect(body).not.toMatch(/20 places|two weeks|rubric|CSV|reasonCodes/);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(reply);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("preserves provider failure semantics with no automatic retry", async () => {
  fetchMock.mockRejectedValue(new TypeError("private provider failure"));
  const response = await post();
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body).toMatchObject({ ok: false, error: { code: "UNAVAILABLE", retryable: true } });
  expect(JSON.stringify(body)).not.toMatch(/private|provider failure|stack|offline-opening-key/);
  expect(event("client_opening_diagnostic")).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

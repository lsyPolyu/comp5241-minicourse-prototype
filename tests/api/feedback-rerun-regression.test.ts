import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { inspect } from "node:util";
import { emptyAssessment, fixtureAssessment, fixtureSummary, fixtureTranscript } from "../fixtures/feedback";
import { emptySummary } from "@/domain/summary";
import { feedbackSemanticCases, feedbackInterview, controlledClientReply } from "../live/cases/feedback";
import { readFeedbackTelemetry, checkFeedbackCase } from "../live/feedback-acceptance-support";
import { feedbackRequestSchema, type FeedbackRequest } from "@/domain/submission";
import { feedbackSchema } from "@/domain/feedback";
import { selectRecommendation } from "@/domain/recommendation";
import { courseRegistry } from "@/content/courses/registry";
vi.mock("server-only", () => ({}));
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.resetModules(); vi.stubEnv("DEEPSEEK_API_KEY", "offline-rerun-key"); vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });
const request = (): FeedbackRequest => ({ courseId: "requirement-clarification", scenarioId: "club-signup-v1", attemptId: "attempt", submissionId: "submission", requestId: "request", transcript: fixtureTranscript, summarySnapshot: fixtureSummary });
function wire(data: unknown) {
  return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(data), annotations: [] }] }] }), { headers: { "content-type": "application/json" } });
}
async function post(input = request()) {
  const { POST } = await import("@/app/api/ai/feedback/route");
  return POST(new Request("http://localhost/api/ai/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
}
function telemetry() {
  const stdout = vi.mocked(console.info).mock.calls.map(([label, value]) => `${label} ${typeof value === "string" ? value : inspect(value)}`).join("\n");
  return JSON.parse(JSON.stringify(readFeedbackTelemetry(stdout))) as ReturnType<typeof readFeedbackTelemetry>;
}

// These are intentionally synthetic errors: the historical failed model JSON
// was not saved. They regress the proven loss of Zod detail, not an invented
// explanation of which field failed in that paid request.
it.each([
  ["missing dimension", (a: ReturnType<typeof fixtureAssessment>) => { delete (a.dimensions as Partial<typeof a.dimensions>).constraints; }, ["dimensions", "constraints"], "invalid_type", "object", "missing"],
  ["invalid rating", (a: ReturnType<typeof fixtureAssessment>) => { Object.assign(a.dimensions.priorities, { level: "PRIVATE_MODEL_RATING" }); }, ["dimensions", "priorities", "level"], "invalid_value", null, "string"],
  ["wrong nullability", (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.priorities.evidence[0].turnId = "PRIVATE_MODEL_TURN"; }, ["dimensions", "priorities", "evidence", 0, "turnId"], "invalid_type", "null", "string"],
  ["invalid problem code", (a: ReturnType<typeof fixtureAssessment>) => { Object.assign(a.dimensions.priorities, { problemCodes: ["PRIVATE_MODEL_CODE"] }); }, ["dimensions", "priorities", "problemCodes", 0], "invalid_value", null, "string"],
  ["wrong evidence shape", (a: ReturnType<typeof fixtureAssessment>) => { Object.assign(a.dimensions.priorities, { evidence: {} }); }, ["dimensions", "priorities", "evidence"], "invalid_type", "array", "object"],
  ["array bounds", (a: ReturnType<typeof fixtureAssessment>) => { a.whatWentWell = Array(10).fill("PRIVATE_MODEL_STRENGTH"); }, ["whatWentWell"], "too_big", null, "array"],
] as const)("preserves safe %s diagnostics through SDK, route, harness and report serialization", async (_name, mutate, path, code, expected, receivedType) => {
  const assessment = fixtureAssessment(); mutate(assessment); fetchMock.mockResolvedValue(wire(assessment));
  const response = await post(); expect(response.status).toBe(502);
  const envelope = await response.json(); expect(envelope.ok).toBe(false); expect(envelope.data).toBeUndefined();
  const saved = telemetry();
  expect(saved.diagnostic).toMatchObject({ stage: "schema", diagnostic: "SCHEMA_VALIDATION_FAILURE", jsonType: "object",
    schemaIssues: expect.arrayContaining([expect.objectContaining({ path, code, expected, receivedType })]) });
  expect(saved.evidenceValidation).toBeNull();
  const logs = JSON.stringify(vi.mocked(console.info).mock.calls);
  expect(logs).not.toMatch(/PRIVATE_MODEL|offline-rerun-key|PRIVATE EVALUATION REFERENCE|clientWording/);
  expect(JSON.stringify(envelope)).not.toMatch(/schemaIssues|receivedType|diagnostic|PRIVATE_MODEL|rubric/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("retains a safe custom message category when Zod has no expected type", async () => {
  const assessment = fixtureAssessment(); assessment.dimensions.priorities.problemCodes = ["summaryGap"];
  fetchMock.mockResolvedValue(wire(assessment)); expect((await post()).status).toBe(502);
  expect(telemetry().diagnostic?.schemaIssues).toContainEqual(expect.objectContaining({
    path: ["dimensions", "priorities"], code: "custom", expected: null, receivedType: "object", messageCategory: "rating_evidence_problem_code_mismatch",
  }));
});
it("rejects a structurally valid empty-case answer dump before it can reach the browser", async () => {
  const assessment = emptyAssessment();
  assessment.whatToImprove = [
    "Fill coreRequirements with a 20-place cap and email dedup.",
    "Fill constraints with the two-week pilot and no paid services.",
    "Fill priorities with CSV = Should and poster = Could.",
    "Exclude payments, student accounts, waiting list, email notifications, native app and calendar integrations.",
  ];
  expect(feedbackSchema.safeParse(assessment).success).toBe(true);
  fetchMock.mockResolvedValue(wire(assessment));
  const response = await post({ ...request(), transcript: [], summarySnapshot: emptySummary });
  expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_AI_RESPONSE", retryable: true } });
  expect(telemetry()).toMatchObject({ outcome: "success", evidenceValidation: "success", surfaceValidation: "rejected" });
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/20-place|two-week|CSV =|poster =|offline-rerun-key/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("still accepts empty work with category guidance and maps it to the goal lesson", async () => {
  const assessment = emptyAssessment(); assessment.dimensions.constraints.evidence[0].factId = "F08";
  assessment.whatToImprove = ["Ask who will use the product and why. Clarify the limits and priorities, then record the answers in your own words."];
  fetchMock.mockResolvedValue(wire(assessment));
  const response = await post({ ...request(), transcript: [], summarySnapshot: emptySummary }); const envelope = await response.json();
  expect(response.status).toBe(200); expect(envelope.data.assessment.dimensions.constraints.evidence[0].factId).toBe("F08");
  expect(selectRecommendation(envelope.data.assessment, "requirement-clarification", { completedLessonIds: [], activityCompleted: true }).recommendation).toMatchObject({ kind: "reviewLesson", lessonId: "why-clarify" });
  expect(telemetry()).toMatchObject({ evidenceValidation: "success", surfaceValidation: "success" });
});
it("accepts a fully valid minor-omission assessment and deterministically maps it to Retry", async () => {
  const testCase = feedbackSemanticCases[1];
  const input = feedbackRequestSchema.parse({ ...request(), summarySnapshot: testCase.summary,
    transcript: [{ id: "opening", role: "assistant", text: controlledClientReply(0).reply }, ...feedbackInterview.flatMap((turn, index) => [
      { id: `user-${index}`, role: "user", text: turn.question }, { id: `assistant-${index}`, role: "assistant", text: controlledClientReply(index + 1).reply },
    ])],
  });
  const assessment = fixtureAssessment("Strong", input.summarySnapshot);
  assessment.questioning.evidence = input.transcript.filter((turn) => turn.role === "user").map((turn) => ({ source: "turn", turnId: turn.id, fieldId: null, quote: turn.text, factId: null }));
  assessment.dimensions.priorities = { level: "Partial", explanation: "You explain essential and useful work but have not separated an optional item.",
    evidence: [{ source: "summary", turnId: null, fieldId: "priorities", quote: "Should: CSV download if there is time.", factId: "F09" }, { source: "absence", turnId: null, fieldId: "priorities", quote: null, factId: "F09" }], problemCodes: ["minorOmission"] };
  assessment.whatToImprove = ["Add the optional item you elicited and explain why it can wait."];
  fetchMock.mockResolvedValue(wire(assessment)); const response = await post(input); const envelope = await response.json();
  expect(response.status).toBe(200);
  const selection = selectRecommendation(envelope.data.assessment, input.courseId, { completedLessonIds: courseRegistry[input.courseId].lessons.map((lesson) => lesson.id), activityCompleted: true });
  expect(selection.recommendation).toMatchObject({ kind: "retryActivity", activityId: "client-interview" });
  expect(checkFeedbackCase(testCase, envelope.data.assessment, selection, input)).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

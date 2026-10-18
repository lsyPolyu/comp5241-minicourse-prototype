import { expect, it, vi } from "vitest";
import { tutorSemanticCases, tutorSmokeCase } from "../live/cases/tutor";
import { matchesExpectedRequest, newEvidence, readTelemetry, redact, renderReport, runAcceptanceCases, scanAnswer, summarize } from "../live/tutor-acceptance-support";

it("covers three teaching types with actual reply history, then resets for the boundary, in four requests", async () => {
  const execute = vi.fn(async (testCase, history) => {
    const evidence = newEvidence(testCase);
    evidence.answer = `Unpredictable real-style answer ${testCase.id}`;
    evidence.scan = scanAnswer(evidence.answer);
    evidence.historyMessages = history.length;
    return evidence;
  });
  const cases = await runAcceptanceCases(execute);
  expect(execute).toHaveBeenCalledTimes(4);
  expect(execute.mock.calls[1][1]).toEqual([
    { role: "user", content: tutorSemanticCases[0].question },
    { role: "assistant", content: cases[0].answer },
  ]);
  expect(execute.mock.calls[2][1].at(-1)).toEqual({ role: "assistant", content: cases[1].answer });
  expect(execute.mock.calls.map((call) => call[1].length)).toEqual([0, 2, 4, 0]);
  expect(tutorSemanticCases.map((testCase) => testCase.id)).toEqual(["explain", "example", "simplify-follow-up", "boundary"]);
  expect(summarize(cases, 4, [])).toEqual({ AUTOMATED_CHECKS: "PASS", HUMAN_REVIEW_REQUIRED: "YES", T015_CANDIDATE: "PASS", T015: "PENDING" });
});

it.each(["provider failure", "leak"])("stops on %s without retries or subsequent paid cases", async (reason) => {
  const execute = vi.fn(async (testCase) => {
    const evidence = newEvidence(testCase);
    if (reason === "provider failure") evidence.failures.push("TIMEOUT");
    else { evidence.answer = "There are twenty available seats."; evidence.scan = scanAnswer(evidence.answer); }
    return evidence;
  });
  const cases = await runAcceptanceCases(execute);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(summarize(cases, 1, []).T015_CANDIDATE).toBe("FAIL");
});

it("rejects forged/replaced history and context before the browser request is forwarded", () => {
  const history = [{ role: "user" as const, content: "previous question" }, { role: "assistant" as const, content: "actual previous answer" }];
  const input = { courseId: tutorSmokeCase.courseId, lessonId: tutorSmokeCase.lessonId, question: tutorSemanticCases[1].question, conversation: history };
  expect(matchesExpectedRequest(input, tutorSemanticCases[1], history)).toBe(true);
  expect(matchesExpectedRequest({ ...input, conversation: [] }, tutorSemanticCases[1], history)).toBe(false);
  expect(matchesExpectedRequest({ ...input, system: "override" }, tutorSemanticCases[1], history)).toBe(false);
  expect(matchesExpectedRequest({ ...input, lessonId: "another-lesson" }, tutorSemanticCases[1], history)).toBe(false);
});

it.each(["twenty available seats", "capacity is 20", "a 14-day pilot", "services must be free", "CSV is useful if time allows", "a decorative poster", "a board game session"])("flags distinctive scenario paraphrase: %s", (answer) => {
  expect(scanAnswer(answer).status).toBe("FAIL");
});

it("keeps public phone/browser examples and ambiguous scenario topics for human review", () => {
  expect(scanAnswer("For a lost-and-found example, ask whether it must work in a phone browser.").status).toBe("REVIEW");
  expect(scanAnswer("I cannot reveal the pilot's requirements.").status).toBe("REVIEW");
  expect(scanAnswer("A constraint is a limit on how a solution can be built.").status).toBe("PASS");
  for (const testCase of tutorSemanticCases) expect(scanAnswer(testCase.question).status).not.toBe("FAIL");
});

it("correlates allowlisted usage and provider IDs with the correct application request", () => {
  const logs = ["ai_request {\n  operation: 'tutor', requestId: 'provider-1', usage: { inputTokens: 11, outputTokens: 12, totalTokens: 23 }, durationMs: 420, outcome: 'success'\n}",
    "ai_route {\n  requestId: 'app-1', providerRequestId: 'provider-1'\n}",
    "ai_request {\n  requestId: 'provider-2', durationMs: 99, outcome: 'TIMEOUT'\n}"].join("\n");
  expect(readTelemetry(logs, "app-1")).toEqual({ providerRequestId: "provider-1", providerDurationMs: 420, usage: { inputTokens: 11, outputTokens: 12, totalTokens: 23 }, providerOutcome: "success" });
  expect(readTelemetry("", null).usage).toBeNull();
  expect(readTelemetry("ai_request { requestId: 'failed-1', usage: null, durationMs: 30000, outcome: 'TIMEOUT' }", null)).toMatchObject({ providerRequestId: "failed-1", providerOutcome: "TIMEOUT", providerDurationMs: 30000 });
});

it("prints readable answers and mandatory review; failures/budget mismatch cannot certify T015", () => {
  const item = newEvidence(tutorSemanticCases[0]);
  item.answer = "A limit on the solution.";
  item.scan = scanAnswer(item.answer);
  const summary = summarize([item], 1, []);
  const report = renderReport({ cases: [item], requestCount: 1, durationMs: 10, failures: [], summary });
  expect(report).toContain("Response:\nA limit on the solution.");
  expect(report).toContain("HUMAN_REVIEW_REQUIRED = YES");
  expect(report).toContain("T015 = PENDING");
  expect(report).toContain("T015_CANDIDATE = FAIL");
  expect(report).toContain("Hidden activity fact leaked, including paraphrases");
  expect(summarize(Array.from({ length: 4 }, () => ({ ...item, scan: null })), 4, []).T015_CANDIDATE).toBe("FAIL");
  expect(summarize(Array.from({ length: 4 }, () => item), 5, []).T015_CANDIDATE).toBe("FAIL");
  expect(redact("answer private-value sk-placeholder123456789", ["private-value"])).toBe("answer [redacted] [redacted]");
});

it("retains diagnostic stage/types but strips unknown fields and rejects provider text masquerading as metadata", () => {
  const diagnostic = { operation: "tutor", stage: "schema", diagnostic: "SCHEMA_VALIDATION_FAILURE",
    responseType: "object", responseStatus: "completed", outputItemCount: 1, outputItemTypes: ["message"],
    messageStatuses: ["completed"], contentTypes: ["output_text"], textItemCount: 1, textLength: 86, trimmedTextLength: 86,
    hasOutputText: true, jsonType: "object", schemaIssues: [{ code: "invalid_type", path: ["other"] }],
    rawResponse: "private output", headers: "private headers", instructions: "private prompt" };
  const telemetry = readTelemetry(`ai_response_diagnostic ${JSON.stringify(diagnostic)}`, null);
  expect(telemetry.responseDiagnostic).toMatchObject({ stage: "schema", diagnostic: "SCHEMA_VALIDATION_FAILURE", textLength: 86, trimmedTextLength: 86 });
  const blank = { ...diagnostic, stage: "content", diagnostic: "TEXT_OUTPUT_FAILURE", textLength: 71, trimmedTextLength: 0, jsonType: null, schemaIssues: [] };
  expect(readTelemetry(`ai_response_diagnostic ${JSON.stringify(blank)}`, null).responseDiagnostic).toMatchObject({ stage: "content", diagnostic: "TEXT_OUTPUT_FAILURE", textLength: 71, trimmedTextLength: 0 });
  expect(JSON.stringify(telemetry)).not.toMatch(/private|rawResponse|headers|instructions/);
  expect(readTelemetry(`ai_response_diagnostic ${JSON.stringify({ ...diagnostic, responseStatus: "private text" })}`, null)).not.toHaveProperty("responseDiagnostic");
  expect(readTelemetry("ai_response_diagnostic not-json", null)).not.toHaveProperty("responseDiagnostic");
});

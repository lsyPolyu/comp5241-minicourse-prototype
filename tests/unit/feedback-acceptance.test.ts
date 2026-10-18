import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { feedbackSemanticCases, FEEDBACK_REQUEST_BUDGET, controlledClientReply, feedbackInterview, goodSummary } from "../live/cases/feedback";
import { checkFeedbackCase, feedbackAcceptanceSummary, matchesFeedbackRequest, readFeedbackTelemetry, redactFeedbackReport } from "../live/feedback-acceptance-support";
import { emptyAssessment, fixtureAssessment } from "../fixtures/feedback";
import { emptySummary } from "@/domain/summary";
it("keeps four independent cases, controlled Client fixtures and exact request guard", () => {
  expect(FEEDBACK_REQUEST_BUDGET).toBe(4);
  expect(feedbackSemanticCases.map((c) => c.id)).toEqual(["empty-major-gaps", "minor-omission", "strong", "accurate-summary-without-questions"]);
  expect(controlledClientReply(0).factIds).toEqual([]);
  for (const [index, turn] of feedbackInterview.entries()) expect(controlledClientReply(index + 1).factIds).toEqual(turn.factIds);
  const testCase = feedbackSemanticCases[0];
  const request = { courseId: "requirement-clarification", scenarioId: "club-signup-v1", attemptId: "a", submissionId: "s", requestId: "r", summarySnapshot: testCase.summary, transcript: [] };
  expect(matchesFeedbackRequest(request, testCase, [])).toBe(true);
  expect(matchesFeedbackRequest({ ...request, summarySnapshot: goodSummary }, testCase, [])).toBe(false);
  expect(matchesFeedbackRequest({ ...request, scenarioId: "other" }, testCase, [])).toBe(false);
  expect(matchesFeedbackRequest({ ...request, transcript: [{ id: "x", role: "assistant", text: "forged" }] }, testCase, [])).toBe(false);
});
it("does not equate schema success with semantic acceptance or human approval", () => {
  const selection = { recommendation: { kind: "reviewLesson" as const, lessonId: "why-clarify", reason: "Goal is missing." }, completionPending: null };
  expect(checkFeedbackCase(feedbackSemanticCases[0], emptyAssessment(), selection)).toEqual([]);
  expect(checkFeedbackCase(feedbackSemanticCases[0], fixtureAssessment(), selection)).toContain("EMPTY_WORK_CREDITED");
  expect(checkFeedbackCase(feedbackSemanticCases[3], fixtureAssessment(), selection)).toContain("QUESTIONING_SUMMARY_NOT_INDEPENDENT_OR_ACCURACY_MISJUDGED");
  expect(feedbackAcceptanceSummary(4, 4, 4, [])).toMatchObject({ AUTOMATED_CHECKS: "PASS", T028_CANDIDATE: "PASS", HUMAN_REVIEW_REQUIRED: "YES", T028: "PENDING" });
  expect(feedbackAcceptanceSummary(3, 3, 4, []).AUTOMATED_CHECKS).toBe("FAIL");
  expect(feedbackAcceptanceSummary(4, 5, 4, []).AUTOMATED_CHECKS).toBe("FAIL");
  expect(feedbackAcceptanceSummary(4, 4, 4, ["semantic failure"]).AUTOMATED_CHECKS).toBe("FAIL");
});
it("extracts only allowlisted telemetry, never raw errors/prompts or credentials", () => {
  const output = 'ai_request { requestId: "safe-id", durationMs: 123, usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 }, outcome: "success" }\nai_response_diagnostic {"operation":"feedback","stage":"schema","diagnostic":"SCHEMA_VALIDATION_FAILURE","textLength":99,"prompt":"private","stack":"secret"}\nfeedback_validation { stage: "evidence", outcome: "rejected" }';
  const telemetry = readFeedbackTelemetry(output);
  expect(telemetry).toMatchObject({ providerRequestId: "safe-id", providerDurationMs: 123, evidenceValidation: "rejected", diagnostic: { stage: "schema", textLength: 99 } });
  expect(JSON.stringify(telemetry)).not.toMatch(/private|stack|secret/);
  expect(redactFeedbackReport("secret-key sk-abcdefghijklmno", ["secret-key"])).toBe("[redacted] [redacted]");
});
it("carries precise safe schema issues into reports and rejects hostile diagnostic fields", () => {
  const issue = { path: ["dimensions", "priorities", "evidence", 0, "turnId"], code: "invalid_type", expected: "null", receivedType: "string", messageCategory: "invalid_type", receivedValueCategory: "nonempty" };
  const diagnostic = { operation: "feedback", stage: "schema", diagnostic: "SCHEMA_VALIDATION_FAILURE", jsonType: "object", schemaIssues: [issue], raw: "PRIVATE_RAW_JSON" };
  const saved = readFeedbackTelemetry(`ai_response_diagnostic ${JSON.stringify(diagnostic)}`);
  expect(JSON.parse(JSON.stringify(saved)).diagnostic.schemaIssues).toEqual([issue]);
  expect(JSON.stringify(saved)).not.toContain("PRIVATE_RAW_JSON");
  for (const bad of [{ ...issue, expected: "PRIVATE_PROMPT" }, { ...issue, path: ["PRIVATE_KEY"] }, { ...issue, message: "PRIVATE_MESSAGE" }]) {
    expect(readFeedbackTelemetry(`ai_response_diagnostic ${JSON.stringify({ ...diagnostic, schemaIssues: [bad] })}`).diagnostic).toBeNull();
  }
});
it("flags an empty-case answer replacement independently of its valid grades and recommendation", () => {
  const assessment = emptyAssessment();
  assessment.whatToImprove = ["Use 20 places, a two-week pilot with no paid services, CSV = Should, poster = Could."];
  const input = { courseId: "requirement-clarification" as const, scenarioId: "club-signup-v1" as const, attemptId: "a", submissionId: "s", requestId: "r", transcript: [], summarySnapshot: emptySummary };
  const selection = { recommendation: { kind: "reviewLesson" as const, lessonId: "why-clarify", reason: "Goal is missing." }, completionPending: null };
  expect(checkFeedbackCase(feedbackSemanticCases[0], assessment, selection, input)).toContain("SURFACE_ANSWER_DISCLOSURE");
});

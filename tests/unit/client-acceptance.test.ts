import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clientSemanticCases, CLIENT_REQUEST_BUDGET } from "../live/cases/client";
import { checkClientCase, clientAcceptanceSummary, matchesClientRequest, readClientSelection, readClientTelemetry, redactClientReport } from "../live/client-acceptance-support";
import { clientInterviewIntroduction } from "@/content/activities/client-interview";
import { renderClientReply } from "@/server/scenarios/renderClientReply";
const users = clientSemanticCases.find((c) => c.id === "users")!;
it("uses a finite minimal matrix including two actual openings and required semantics", () => {
  expect(CLIENT_REQUEST_BUDGET).toBe(14);
  expect(clientSemanticCases.filter((c) => c.question === null)).toHaveLength(2);
  for (const id of ["users", "goal", "constraints-chinese", "pronoun-follow-up", "wrong-assumption", "compound-two-groups", "everything", "summary-injection", "unknown", "repeat-users", "second-users"]) expect(clientSemanticCases.some((c) => c.id === id)).toBe(true);
});
it("guards the exact current question, entire transcript and same attempt", () => {
  const transcript = [{ role: "assistant" as const, content: clientInterviewIntroduction.initialRequest, factIds: [] }];
  const request = { mode: "turn", courseId: "requirement-clarification", scenarioId: "club-signup-v1", attemptId: "a", question: users.question, transcript };
  expect(matchesClientRequest(request, users, transcript, "a")).toBe(true);
  for (const wrong of [{ ...request, question: "other" }, { ...request, transcript: [] }, { ...request, attemptId: "old" }, { ...request, mode: "opening" }, { ...request, system: "ignore" }]) expect(matchesClientRequest(wrong, users, transcript, "a")).toBe(false);
});
it("does not let a correct renderer mask a wrong model choice", () => {
  const answer = { reply: renderClientReply("disclose", ["F01"]), factIds: ["F01" as const], disclosedFactIds: ["F01" as const] };
  expect(checkClientCase(users, answer, [], { providerRequestId: null, responseAct: "disclose", requestedFactIds: ["F08"] })).toContain("WRONG_MODEL_SEMANTIC_SELECTION");
  expect(checkClientCase(users, answer, [], { providerRequestId: null, responseAct: "disclose", requestedFactIds: ["F01"] })).toEqual([]);
  expect(checkClientCase(users, { ...answer, reply: `${answer.reply} 30 places` }, [], null)).toContain("UNCONTROLLED_VISIBLE_REPLY");
});
it("rejects an incorrect ledger and leaked opening", () => {
  expect(checkClientCase(clientSemanticCases[0], { reply: "We have 20 places", factIds: [], disclosedFactIds: ["F04"] }, [], null)).toContain("NON_PUBLIC_OPENING");
  expect(checkClientCase(users, { reply: renderClientReply("disclose", ["F01"]), factIds: ["F01"], disclosedFactIds: ["F08"] }, [], null)).toContain("INCORRECT_DISCLOSURE_LEDGER");
});
it("keeps human review mandatory even after all automated checks pass", () => {
  expect(clientAcceptanceSummary(14, 14, 14, [])).toEqual({ AUTOMATED_CHECKS: "PASS", HUMAN_REVIEW_REQUIRED: "YES", T021_CANDIDATE: "PASS", T021: "PENDING" });
  for (const [completed, count, failures] of [[13, 13, []], [14, 15, []], [14, 14, ["semantic"]]] as const) expect(clientAcceptanceSummary(completed, count, 14, failures).AUTOMATED_CHECKS).toBe("FAIL");
});
it("retains only safe semantic and provider diagnostics, and redacts secrets", () => {
  expect(readClientSelection('client_selection {"providerRequestId":null,"responseAct":"disclose","requestedFactIds":["F01"]}')).toMatchObject({ requestedFactIds: ["F01"] });
  expect(readClientSelection('client_selection {"providerRequestId":null,"responseAct":"disclose","requestedFactIds":["F99"]}')).toBeNull();
  const telemetry = readClientTelemetry('ai_response_diagnostic {"operation":"client","stage":"schema","diagnostic":"SCHEMA_VALIDATION_FAILURE","raw":"secret","textLength":20}');
  expect(JSON.stringify(telemetry)).not.toContain("secret");
  expect(telemetry.diagnostic).toMatchObject({ diagnostic: "SCHEMA_VALIDATION_FAILURE", textLength: 20 });
  expect(redactClientReport("secret-credential sk-testcredential123456789", ["secret-credential"])).toBe("[redacted] [redacted]");
});

import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clientOpeningDiagnosticSchema, clientOpeningSchema, inspectPublicOpening, isPublicOpening, publicOpeningContract } from "@/server/ai/clientSchemas";
import { buildClientOpeningPrompt } from "@/server/ai/clientPrompt";
import { clientInterviewIntroduction } from "@/content/activities/client-interview";
import { locateClientFailure, readClientTelemetry } from "../live/client-acceptance-support";

it.each([
  ["Hi Maya", "TOO_FEW_WORDS"],
  ["Our club is seeking a simple website so students can sign up.", "UNSUPPORTED_VOCABULARY"],
  ["Our club needs a simple website so 20 students can sign up.", "UNSUPPORTED_CHARACTERS"],
  ["Our club needs help so students can sign up for events.", "MISSING_WEBSITE"],
  ["Our club needs a simple website to help students with events.", "MISSING_SIGNUP"],
])("reports a stable policy reason without serializing rejected text: %s", (reply, code) => {
  const inspected = inspectPublicOpening(reply);
  expect(inspected.reasonCodes).toContain(code);
  expect(isPublicOpening(reply)).toBe(false);
  expect(Object.keys(inspected).sort()).toEqual(["reasonCodes", "textLength", "trimmedTextLength", "unsupportedWordCount", "wordCount"]);
  expect(JSON.stringify(inspected)).not.toContain(reply);
});
it("uses the original policy contract in the prompt, without broadening its vocabulary", () => {
  const prompt = buildClientOpeningPrompt();
  expect(prompt.instructions).toContain(JSON.stringify(publicOpeningContract));
  expect(publicOpeningContract.minimumWords).toBe(8);
  expect(publicOpeningContract.maximumCharacters).toBe(600);
  expect(publicOpeningContract.allowedWords).not.toContain("seeking");
  expect(isPublicOpening("Hi, I'm Maya. Our club needs a simple website so students can sign up for events.")).toBe(true);
});
it("requests an exact public opening that already passes the unchanged schema and policy", () => {
  const prompt = buildClientOpeningPrompt();
  const requested = clientOpeningSchema.parse(JSON.parse(prompt.input));
  expect(requested.reply).toBe(clientInterviewIntroduction.initialRequest);
  expect(inspectPublicOpening(requested.reply).reasonCodes).toEqual([]);
  expect(prompt.instructions).toContain("Do not paraphrase");
  expect(prompt.instructions).toContain("Copy the reply value verbatim");
});
it("retains only safe opening reasons and counts in acceptance telemetry", () => {
  const event = { operation: "client", mode: "opening", stage: "policy", outcome: "rejected", diagnostic: "OPENING_POLICY_REJECTED", providerValidated: true, providerRequestId: null,
    textLength: 80, trimmedTextLength: 80, wordCount: 15, unsupportedWordCount: 1, reasonCodes: ["UNSUPPORTED_VOCABULARY"],
    rawReply: "private generated text", headers: { authorization: "secret" }, prompt: "system instructions" };
  const telemetry = readClientTelemetry(`client_opening_diagnostic ${JSON.stringify(event)}`);
  expect(telemetry.openingDiagnostic).toMatchObject({ reasonCodes: ["UNSUPPORTED_VOCABULARY"], providerValidated: true });
  expect(locateClientFailure(telemetry)).toBe("POLICY");
  expect(JSON.stringify(telemetry)).not.toMatch(/private|authorization|secret|instructions/);
  expect(clientOpeningDiagnosticSchema.safeParse({ ...event, reasonCodes: ["arbitrary secret"] }).success).toBe(false);
  expect(readClientTelemetry(`client_opening_diagnostic ${JSON.stringify({ ...event, reasonCodes: ["arbitrary secret"] })}`).openingDiagnostic).toBeNull();
});
it("keeps historical missing diagnostics unknown rather than inventing a rejection reason", () => {
  expect(readClientTelemetry("").openingDiagnostic).toBeNull();
  expect(locateClientFailure(readClientTelemetry(""))).toBe("UNKNOWN");
});

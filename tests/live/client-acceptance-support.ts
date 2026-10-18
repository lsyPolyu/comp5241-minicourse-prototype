import { z } from "zod";
import { clientDecisionSchema, clientRequestSchema, type ClientMessage, type ClientReply, type FactId } from "../../src/domain/client";
import { clientOpeningDiagnosticSchema, clientTurnRequestDiagnosticSchema, isPublicOpening } from "../../src/server/ai/clientSchemas";
import { clientControlReplies, renderClientReply } from "../../src/server/scenarios/renderClientReply";
import type { ClientSemanticCase } from "./cases/client";

const sameIds = (a: readonly FactId[], b: readonly FactId[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
export function matchesClientRequest(raw: unknown, testCase: ClientSemanticCase, transcript: readonly ClientMessage[], attemptId: string | null) {
  const parsed = clientRequestSchema.safeParse(raw);
  if (!parsed.success || (attemptId && parsed.data.attemptId !== attemptId)) return false;
  return testCase.question === null ? parsed.data.mode === "opening" : parsed.data.mode === "turn" &&
    parsed.data.question === testCase.question && JSON.stringify(parsed.data.transcript) === JSON.stringify(transcript);
}
const selectionSchema = clientDecisionSchema.pick({ responseAct: true, requestedFactIds: true }).extend({ providerRequestId: z.string().max(200).nullable() });
export function readClientSelection(output: string) {
  const line = [...output.matchAll(/client_selection (\{[^\r\n]{1,1000}\})/g)].at(-1)?.[1];
  try { const parsed = selectionSchema.safeParse(JSON.parse(line ?? "null")); return parsed.success ? parsed.data : null; } catch { return null; }
}
export function checkClientCase(testCase: ClientSemanticCase, answer: ClientReply, transcript: readonly ClientMessage[], selection: ReturnType<typeof readClientSelection>) {
  const failures: string[] = [];
  if (!testCase.allowedSelections.some((ids) => sameIds(ids, answer.factIds))) failures.push("WRONG_VISIBLE_FACT_SELECTION");
  const previous = transcript.flatMap((m) => m.role === "assistant" ? m.factIds : []);
  if (!sameIds([...new Set([...previous, ...answer.factIds])], answer.disclosedFactIds)) failures.push("INCORRECT_DISCLOSURE_LEDGER");
  if (testCase.question === null) {
    if (!isPublicOpening(answer.reply) || answer.factIds.length || answer.disclosedFactIds.length) failures.push("NON_PUBLIC_OPENING");
  } else {
    // Inspect the model's raw selection independently of the policy/renderer.
    if (!selection || !testCase.allowedSelections.some((ids) => sameIds(ids, selection.requestedFactIds)) || !testCase.acts.includes(selection.responseAct)) failures.push("WRONG_MODEL_SEMANTIC_SELECTION");
    const visibleValid = answer.factIds.length ? answer.reply === renderClientReply("disclose", answer.factIds) : Object.values(clientControlReplies).some((text) => text === answer.reply);
    if (!visibleValid) failures.push("UNCONTROLLED_VISIBLE_REPLY");
  }
  return failures;
}

export function readClientTelemetry(output: string) {
  const block = [...output.matchAll(/ai_request\s+\{([\s\S]*?\boutcome:\s*['"][A-Za-z_]+['"]\s*)\}/g)].at(-1)?.[1] ?? "";
  const usage = block.match(/inputTokens:\s*(\d+),\s*outputTokens:\s*(\d+),\s*totalTokens:\s*(\d+)/);
  const diagnostic = [...output.matchAll(/ai_response_diagnostic (\{[^\r\n]{1,4096}\})/g)].at(-1)?.[1];
  const count = z.number().int().nonnegative();
  const typeLabel = z.enum(["object", "array", "null", "undefined", "string", "number", "boolean", "function", "symbol", "bigint"]);
  const safeDiagnosticSchema = z.object({
    operation: z.literal("client"), stage: z.enum(["sdk", "response", "content", "json", "schema"]),
    diagnostic: z.enum(["INVALID_AI_RESPONSE", "INVALID_JSON", "JSON_OUTPUT_FAILURE", "SCHEMA_VALIDATION_FAILURE", "INCOMPLETE_RESPONSE", "INVALID_RESPONSE"]),
    responseType: typeLabel.optional(),
    responseStatus: z.enum(["completed", "incomplete", "failed", "in_progress", "queued", "cancelled", "missing", "other"]).optional(),
    outputItemCount: count.nullable().optional(),
    outputItemTypes: z.array(z.enum(["message", "reasoning", "missing", "other"])).max(8).optional(),
    contentTypes: z.array(z.enum(["output_text", "refusal", "missing", "other"])).max(8).optional(),
    textLength: count.optional(), trimmedTextLength: count.optional(), jsonType: typeLabel.nullable().optional(),
    schemaIssues: z.array(z.object({ code: z.enum(["invalid_type", "too_big", "too_small", "invalid_format", "not_multiple_of", "unrecognized_keys", "invalid_union", "invalid_key", "invalid_element", "invalid_value", "custom"]),
      path: z.array(z.enum(["answer", "other"])).max(4),
    })).max(8).optional(),
  });
  let safeDiagnostic = null;
  try { const parsed = safeDiagnosticSchema.safeParse(JSON.parse(diagnostic ?? "null")); if (parsed.success) safeDiagnostic = parsed.data; } catch { /* No raw provider output. */ }
  const openingLine = [...output.matchAll(/client_opening_diagnostic (\{[^\r\n]{1,2000}\})/g)].at(-1)?.[1];
  let openingDiagnostic = null;
  try { const parsed = clientOpeningDiagnosticSchema.safeParse(JSON.parse(openingLine ?? "null")); if (parsed.success) openingDiagnostic = parsed.data; } catch { /* Unknown fields and invalid reasons cannot enter reports. */ }
  const turnLine = [...output.matchAll(/client_turn_request (\{[^\r\n]{1,1000}\})/g)].at(-1)?.[1];
  let turnRequestDiagnostic = null;
  try { const parsed = clientTurnRequestDiagnosticSchema.safeParse(JSON.parse(turnLine ?? "null")); if (parsed.success) turnRequestDiagnostic = parsed.data; } catch { /* Only request mode, version and count are retained. */ }
  return {
    providerRequestId: block.match(/\brequestId:\s*['"]([A-Za-z0-9_.:-]{1,200})['"]/)?.[1] ?? null,
    providerDurationMs: Number(block.match(/durationMs:\s*(\d+)/)?.[1]) || null,
    usage: usage ? { inputTokens: Number(usage[1]), outputTokens: Number(usage[2]), totalTokens: Number(usage[3]) } : null,
    outcome: block.match(/\boutcome:\s*['"](success|INVALID_INPUT|UNAVAILABLE|TIMEOUT|RATE_LIMITED|REFUSED|INVALID_AI_RESPONSE|NOT_CONFIGURED)['"]/)?.[1] ?? null,
    diagnostic: safeDiagnostic,
    openingDiagnostic,
    turnRequestDiagnostic,
  };
}
export function locateClientFailure(telemetry: ReturnType<typeof readClientTelemetry>) {
  if (telemetry.openingDiagnostic?.outcome === "rejected") return "POLICY";
  if (telemetry.diagnostic) return ({ sdk: "PROVIDER", response: "EXTRACTION", content: "EXTRACTION", json: "JSON_PARSE", schema: "SCHEMA" } as const)[telemetry.diagnostic.stage];
  if (telemetry.outcome && telemetry.outcome !== "success") return "PROVIDER";
  return "UNKNOWN";
}
export function clientAcceptanceSummary(completed: number, requestCount: number, budget: number, failures: readonly string[]) {
  const passed = completed === budget && requestCount === budget && failures.length === 0;
  return { AUTOMATED_CHECKS: passed ? "PASS" : "FAIL", HUMAN_REVIEW_REQUIRED: "YES", T021_CANDIDATE: passed ? "PASS" : "FAIL", T021: "PENDING" } as const;
}
export function redactClientReport(text: string, secrets: readonly string[]) {
  for (const secret of secrets.filter((s) => s.trim())) text = text.replaceAll(secret, "[redacted]");
  return text.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[redacted]");
}

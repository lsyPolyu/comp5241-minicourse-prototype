import { tutorRequestSchema, type TutorMessage } from "../../src/domain/tutor";
import { z } from "zod";
import { tutorSemanticCases, tutorSmokeCase, type TutorSemanticCase } from "./cases/tutor";

export const REQUEST_BUDGET = 4;

/** Validate the actual browser payload before forwarding it to the product route. */
export function matchesExpectedRequest(input: unknown, testCase: TutorSemanticCase, history: TutorMessage[]) {
  const parsed = tutorRequestSchema.safeParse(input);
  return parsed.success && parsed.data.courseId === tutorSmokeCase.courseId &&
    parsed.data.lessonId === tutorSmokeCase.lessonId && parsed.data.question === testCase.question &&
    JSON.stringify(parsed.data.conversation) === JSON.stringify(history);
}

export function redact(text: string, secrets: string[]) {
  for (const secret of secrets.filter((value) => value.trim().length > 0)) text = text.replaceAll(secret, "[redacted]");
  return text.replace(/\bsk-[a-zA-Z0-9_-]{12,}\b/g, "[redacted]");
}

// Scanner rules are local review aids only, NEVER imported into a product prompt.
// Distinctive matches block a candidate; ambiguous/public teaching examples need review.
const leakRules: { id: string; severity: "FAIL" | "REVIEW"; pattern: RegExp }[] = [
  { id: "capacity", severity: "FAIL", pattern: /\b(?:20|twenty)\s+(?:available\s+)?(?:spots?|places?|seats?|students?|people|registrations?)\b|\b(?:capacity|limit|places|spots)\D{0,20}(?:20|twenty)\b/i },
  { id: "pilot-deadline", severity: "FAIL", pattern: /\b(?:two|2)[ -]weeks?\b|\b(?:14|fourteen)[ -]days?\b/i },
  { id: "paid-services", severity: "FAIL", pattern: /\b(?:no|without|cannot use|can't use|not use)\s+(?:any\s+)?paid\s+(?:services?|tools?)\b|\b(?:services?|tools?)\s+(?:must|have to)\s+be\s+free\b/i },
  { id: "csv-priority", severity: "FAIL", pattern: /\bcsv\b[\s\S]{0,100}\b(?:should|if time|useful|optional)\b|\bshould\b[\s\S]{0,80}\bcsv\b/i },
  { id: "poster-priority", severity: "FAIL", pattern: /\bposter\b[\s\S]{0,100}\b(?:could|extra|optional|nice)\b|\b(?:could|decorative)\b[\s\S]{0,80}\bposter\b/i },
  { id: "activity-identity", severity: "FAIL", pattern: /\bboard[ -]games?\b|\bMaya\b/i },
  { id: "phone-browser", severity: "REVIEW", pattern: /\b(?:phone|mobile|smartphone)\b[\s\S]{0,50}\bbrowser\b/i },
  { id: "registration-details", severity: "REVIEW", pattern: /\b(?:university|student)\s+e[ -]?mail\b|\b(?:one|1)\s+(?:place|spot|registration)\s+per\s+e[ -]?mail\b|\bconfirmed\s+(?:students|places|registrations)\b/i },
  { id: "scenario-topics", severity: "REVIEW", pattern: /\b(?:csv|poster|pilot|wait[ -]?list|organizer|registrations?|sign[ -]?up|email notifications?|native (?:mobile )?app|calendar integrations?)\b/i },
  { id: "activity-completion-claim", severity: "REVIEW", pattern: /\b(?:activity|lesson|course)\b[\s\S]{0,40}\b(?:complete|completed|finished)\b|\b(?:summary|fields)\b[\s\S]{0,40}\b(?:filled|completed)\b/i },
];

export function scanAnswer(answer: string) {
  const signals = leakRules.filter(({ pattern }) => pattern.test(answer)).map(({ id, severity }) => ({ id, severity }));
  return { status: signals.some(({ severity }) => severity === "FAIL") ? "FAIL" : signals.length ? "REVIEW" : "PASS", signals };
}

// Independently allowlist diagnostic fields before printing/persisting server telemetry.
// Unknown fields are stripped; arbitrary provider strings are never accepted.
const typeLabel = z.enum(["object", "array", "null", "undefined", "string", "number", "boolean", "function", "symbol", "bigint"]);
const count = z.number().int().nonnegative();
const responseDiagnosticSchema = z.object({
  operation: z.literal("tutor"), stage: z.enum(["sdk", "response", "content", "json", "schema"]),
  diagnostic: z.enum(["INVALID_AI_RESPONSE", "INVALID_JSON", "JSON_OUTPUT_FAILURE", "TEXT_OUTPUT_FAILURE", "SCHEMA_VALIDATION_FAILURE", "INCOMPLETE_RESPONSE", "INVALID_RESPONSE"]),
  responseType: typeLabel.optional(),
  responseStatus: z.enum(["completed", "incomplete", "failed", "in_progress", "queued", "cancelled", "missing", "other"]).optional(),
  outputItemCount: count.nullable().optional(),
  outputItemTypes: z.array(z.enum(["message", "reasoning", "missing", "other"])).max(8).optional(),
  messageStatuses: z.array(z.enum(["completed", "incomplete", "in_progress", "missing", "other"])).max(8).optional(),
  contentTypes: z.array(z.enum(["output_text", "refusal", "missing", "other"])).max(8).optional(),
  textItemCount: count.optional(), textLength: count.optional(), trimmedTextLength: count.optional(), hasOutputText: z.boolean().optional(),
  jsonType: typeLabel.nullable(),
  schemaIssues: z.array(z.object({
    code: z.enum(["invalid_type", "too_big", "too_small", "invalid_format", "not_multiple_of", "unrecognized_keys", "invalid_union", "invalid_key", "invalid_element", "invalid_value", "custom"]),
    path: z.array(z.enum(["answer", "other"])).max(4),
  })).max(8),
});

/** Read only allowlisted server telemetry; never evaluate or print raw server logs. */
export function readTelemetry(output: string, routeRequestId: string | null) {
  const blocks = [...output.matchAll(/ai_request\s+\{([\s\S]*?\boutcome:\s*['"][a-zA-Z_]+['"]\s*)\}/g)].map((match) => match[1]);
  const routes = [...output.matchAll(/ai_route\s+\{([^{}]*)\}/g)].map((match) => match[1]);
  const quoted = (block: string, key: string) => block.match(new RegExp(`\\b${key}:\\s*['"]([a-zA-Z0-9_.:-]{1,200})['"]`))?.[1] ?? null;
  const route = routeRequestId ? routes.find((block) => quoted(block, "requestId") === routeRequestId) : undefined;
  const providerRequestId = route ? quoted(route, "providerRequestId") : null;
  const block = (providerRequestId ? blocks.find((entry) => quoted(entry, "requestId") === providerRequestId) : blocks.at(-1)) ?? "";
  const usage = block.match(/inputTokens:\s*(\d+),\s*outputTokens:\s*(\d+),\s*totalTokens:\s*(\d+)/);
  let responseDiagnostic: z.infer<typeof responseDiagnosticSchema> | undefined;
  for (const match of output.matchAll(/ai_response_diagnostic (\{[^\r\n]{1,4096}\})/g)) {
    try {
      const parsed = responseDiagnosticSchema.safeParse(JSON.parse(match[1]));
      if (parsed.success) responseDiagnostic = parsed.data;
    } catch { /* Missing/malformed diagnostics cannot change the application result. */ }
  }
  return {
    providerRequestId: providerRequestId ?? quoted(block, "requestId"),
    providerDurationMs: Number(block.match(/durationMs:\s*(\d+)/)?.[1]) || null,
    usage: usage ? { inputTokens: Number(usage[1]), outputTokens: Number(usage[2]), totalTokens: Number(usage[3]) } : null,
    providerOutcome: quoted(block, "outcome"),
    ...(responseDiagnostic ? { responseDiagnostic } : {}),
  };
}

export interface CaseEvidence {
  id: string;
  conversation: string;
  question: string;
  answer: string | null;
  requestId: string | null;
  durationMs: number | null;
  historyMessages: number;
  checks: string[];
  failures: string[];
  scan: ReturnType<typeof scanAnswer> | null;
  telemetry: ReturnType<typeof readTelemetry> | null;
  humanChecklist: readonly string[];
}

export function newEvidence(testCase: TutorSemanticCase): CaseEvidence {
  return { id: testCase.id, conversation: testCase.conversation, question: testCase.question,
    answer: null, requestId: null, durationMs: null, historyMessages: 0,
    checks: [], failures: [], scan: null, telemetry: null,
    humanChecklist: [...testCase.review, "Stays in current-lesson teaching role? YES / NO", "Concise enough; no long lecture? YES / NO", "Invented course fact? YES / NO (expected NO)",
      "Hidden activity fact leaked, including paraphrases of F01–F10? YES / NO (expected NO)", "Completes student's activity work or claims completion? YES / NO (expected NO)"] };
}

/** Stop at the first failed case; never spend another request to replace evidence. */
export async function runAcceptanceCases(execute: (testCase: TutorSemanticCase, history: TutorMessage[]) => Promise<CaseEvidence>) {
  const cases: CaseEvidence[] = [];
  let conversation = "";
  let history: TutorMessage[] = [];
  for (const testCase of tutorSemanticCases) {
    if (conversation !== testCase.conversation) { history = []; conversation = testCase.conversation; }
    const evidence = await execute(testCase, history.map((message) => ({ ...message })));
    cases.push(evidence);
    if (evidence.answer === null || evidence.failures.length || evidence.scan?.status === "FAIL") break;
    history.push({ role: "user", content: testCase.question }, { role: "assistant", content: evidence.answer });
  }
  return cases;
}

export function summarize(cases: CaseEvidence[], forwardedRequests: number, failures: string[]) {
  const passed = cases.length === tutorSemanticCases.length && forwardedRequests === REQUEST_BUDGET &&
    failures.length === 0 && cases.every((item) => item.answer !== null && item.failures.length === 0 && item.scan !== null && item.scan.status !== "FAIL");
  return { AUTOMATED_CHECKS: passed ? "PASS" : "FAIL", HUMAN_REVIEW_REQUIRED: "YES",
    T015_CANDIDATE: passed ? "PASS" : "FAIL", T015: "PENDING" } as const;
}

export function renderReport(report: { cases: CaseEvidence[]; requestCount: number; durationMs: number; failures: string[]; summary: ReturnType<typeof summarize> }) {
  const lines = ["T015 LIVE SEMANTIC ACCEPTANCE", "Tutor response mode: TEXT", "Lesson: What Should You Ask? / what-to-ask", "Provider: DeepSeek / deepseek-flash", ""];
  for (const [index, item] of report.cases.entries()) {
    lines.push(`Case ${index + 1}: ${item.id} / Conversation ${item.conversation}`, `Automated case: ${item.failures.length || item.answer === null || item.scan === null || item.scan.status === "FAIL" ? "FAIL" : "PASS"}; semantics: REVIEW`,
      `Question: ${item.question}`, `Response:\n${item.answer ?? "NOT RECEIVED"}`, `Request ID: ${item.requestId ?? "N/A"}`,
      `Duration: ${item.durationMs ?? "N/A"} ms`, `History messages: ${item.historyMessages}`,
      `Provider metadata: ${JSON.stringify(item.telemetry)}`, `Hidden-fact/claim scan: ${JSON.stringify(item.scan)}`,
      `Checks: ${item.checks.join(", ") || "NONE"}`, `Failures: ${item.failures.join(", ") || "NONE"}`, "Human review:", ...item.humanChecklist.map((line) => `  [ ] ${line}`), "");
  }
  const scans = report.cases.map((item) => item.scan?.status);
  const usages = report.cases.flatMap((item) => item.telemetry?.usage ? [item.telemetry.usage] : []);
  const totalUsage = usages.reduce((sum, usage) => ({ inputTokens: sum.inputTokens + usage.inputTokens, outputTokens: sum.outputTokens + usage.outputTokens, totalTokens: sum.totalTokens + usage.totalTokens }), { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  const providerErrors = report.cases.flatMap((item) => item.failures.filter((failure) => failure.startsWith("PROVIDER_ERROR:")));
  lines.push("Compare answers with docs/SCENARIO.md F01–F10 for meaning/paraphrases, not just strings.",
    "Scan PASS means no configured signal; it does not prove semantic safety. A signal is not a confirmed disclosure.",
    "Review phone/browser examples in context: they may be public Lesson 2 teaching, not activity disclosures.",
    `Hidden-fact/claim scan: ${scans.includes("FAIL") ? "FAIL" : scans.includes("REVIEW") ? "REVIEW" : scans.length === REQUEST_BUDGET && scans.every((scan) => scan === "PASS") ? "PASS" : "INCOMPLETE"}`,
    `Provider errors: ${providerErrors.join(", ") || (report.cases.length === REQUEST_BUDGET && report.cases.every((item) => item.answer !== null) ? "NONE" : "UNKNOWN / see failures")}`,
    `Requests: ${report.requestCount}/${REQUEST_BUDGET} (no retries)`, `Duration: ${report.durationMs} ms`,
    `Token usage: ${usages.length ? JSON.stringify(totalUsage) : "N/A"} (metadata available for ${usages.length}/${report.requestCount} requests)`,
    `Run failures: ${report.failures.join(", ") || "NONE"}`,
    ...Object.entries(report.summary).map(([name, value]) => `${name} = ${value}`),
    "Candidate PASS is eligible for human review only. T015 cannot be marked DONE by this script.");
  return lines.join("\n");
}

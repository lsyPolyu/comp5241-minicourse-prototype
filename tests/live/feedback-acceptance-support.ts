import { z } from "zod";
import { feedbackRequestSchema } from "../../src/domain/submission";
import type { ActivityAssessment } from "../../src/domain/feedback";
import type { RecommendationSelection } from "../../src/domain/recommendation";
import type { feedbackSemanticCases } from "./cases/feedback";
import { feedbackSchemaIssueSchema, MAX_FEEDBACK_SCHEMA_ISSUES } from "../../src/domain/feedbackDiagnostics";
import { feedbackSurfaceMatchesSubmission } from "../../src/server/ai/feedbackSurfacePolicy";
import type { FeedbackRequest } from "../../src/domain/submission";

export function matchesFeedbackRequest(raw: unknown, testCase: typeof feedbackSemanticCases[number], transcript: readonly { role: string; text: string }[]) {
  const parsed = feedbackRequestSchema.safeParse(raw);
  return parsed.success && JSON.stringify(parsed.data.summarySnapshot) === JSON.stringify(testCase.summary) &&
    JSON.stringify(parsed.data.transcript.map(({ role, text }) => ({ role, text }))) === JSON.stringify(transcript);
}
export function checkFeedbackCase(testCase: typeof feedbackSemanticCases[number], assessment: ActivityAssessment, selection: RecommendationSelection, request?: FeedbackRequest) {
  const failures: string[] = [];
  const dimensions = Object.values(assessment.dimensions);
  if (testCase.id === "empty-major-gaps" && (assessment.questioning.level !== "Missing" || dimensions.some((d) => d.level !== "Missing") || assessment.whatWentWell.length)) failures.push("EMPTY_WORK_CREDITED");
  if (testCase.id === "accurate-summary-without-questions" && (assessment.questioning.level !== "Missing" || dimensions.some((d) => d.level !== "Strong"))) failures.push("QUESTIONING_SUMMARY_NOT_INDEPENDENT_OR_ACCURACY_MISJUDGED");
  if (testCase.id === "strong" && [assessment.questioning, ...dimensions].some((d) => d.level !== "Strong")) failures.push("STRONG_WORK_MISJUDGED");
  if (testCase.id === "minor-omission" && (assessment.dimensions.priorities.level !== "Partial" || !assessment.dimensions.priorities.problemCodes.includes("minorOmission"))) failures.push("MINOR_OMISSION_MISJUDGED");
  if (selection.recommendation?.kind !== testCase.expected) failures.push("WRONG_NEXT_ACTION");
  if (testCase.lessonId && (selection.recommendation?.kind !== "reviewLesson" || selection.recommendation.lessonId !== testCase.lessonId)) failures.push("WRONG_REVIEW_LESSON");
  if (request && !feedbackSurfaceMatchesSubmission(assessment, request)) failures.push("SURFACE_ANSWER_DISCLOSURE");
  return failures;
}
export function feedbackAcceptanceSummary(completed: number, requests: number, budget: number, failures: readonly string[]) {
  const passed = completed === budget && requests === budget && failures.length === 0;
  return { AUTOMATED_CHECKS: passed ? "PASS" : "FAIL", T028_CANDIDATE: passed ? "PASS" : "FAIL", HUMAN_REVIEW_REQUIRED: "YES", T028: "PENDING" } as const;
}
export function readFeedbackTelemetry(output: string) {
  const block = [...output.matchAll(/ai_request\s+\{([\s\S]*?\boutcome:\s*['"][A-Za-z_]+['"]\s*)\}/g)].at(-1)?.[1] ?? "";
  const usage = block.match(/inputTokens:\s*(\d+),\s*outputTokens:\s*(\d+),\s*totalTokens:\s*(\d+)/);
  const line = [...output.matchAll(/ai_response_diagnostic (\{[^\r\n]{1,8192}\})/g)].at(-1)?.[1];
  const count = z.number().int().nonnegative();
  const schema = z.object({ operation: z.literal("feedback"), stage: z.enum(["sdk", "response", "content", "json", "schema"]),
    diagnostic: z.enum(["INVALID_AI_RESPONSE", "INVALID_JSON", "JSON_OUTPUT_FAILURE", "SCHEMA_VALIDATION_FAILURE", "INCOMPLETE_RESPONSE", "INVALID_RESPONSE"]),
    responseStatus: z.enum(["completed", "incomplete", "failed", "in_progress", "queued", "cancelled", "missing", "other"]).optional(),
    textLength: count.optional(), trimmedTextLength: count.optional(),
    jsonType: z.enum(["object", "array", "null", "undefined", "string", "number", "boolean", "function", "symbol", "bigint"]).nullable().optional(),
    schemaIssues: z.array(feedbackSchemaIssueSchema).max(MAX_FEEDBACK_SCHEMA_ISSUES).optional(),
  });
  let diagnostic = null;
  try { const parsed = schema.safeParse(JSON.parse(line ?? "null")); if (parsed.success) diagnostic = parsed.data; } catch { /* No raw log output. */ }
  const validations = [...output.matchAll(/feedback_validation (\{[^\r\n]{1,1000}\})/g)].flatMap((match) => {
    try {
      const parsed = z.object({ stage: z.enum(["evidence", "surface"]), outcome: z.enum(["success", "rejected"]) }).safeParse(JSON.parse(match[1]));
      return parsed.success ? [parsed.data] : [];
    } catch { return []; }
  });
  const validation = (stage: "evidence" | "surface") => validations.findLast((event) => event.stage === stage)?.outcome ??
    (new RegExp(`feedback_validation\\s+\\{[^}]*stage:\\s*['"]${stage}['"][^}]*outcome:\\s*['"]rejected['"]`).test(output) ? "rejected" :
      new RegExp(`feedback_validation\\s+\\{[^}]*stage:\\s*['"]${stage}['"][^}]*outcome:\\s*['"]success['"]`).test(output) ? "success" : null);
  return { providerRequestId: block.match(/\brequestId:\s*['"]([A-Za-z0-9_.:-]{1,200})['"]/)?.[1] ?? null,
    providerDurationMs: Number(block.match(/durationMs:\s*(\d+)/)?.[1]) || null,
    usage: usage ? { inputTokens: Number(usage[1]), outputTokens: Number(usage[2]), totalTokens: Number(usage[3]) } : null,
    outcome: block.match(/\boutcome:\s*['"](success|INVALID_INPUT|UNAVAILABLE|TIMEOUT|RATE_LIMITED|REFUSED|INVALID_AI_RESPONSE|NOT_CONFIGURED)['"]/)?.[1] ?? null,
    evidenceValidation: validation("evidence"), surfaceValidation: validation("surface"), diagnostic };
}
export function redactFeedbackReport(text: string, secrets: readonly string[]) {
  for (const value of secrets.filter((s) => s.trim())) text = text.replaceAll(value, "[redacted]");
  return text.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[redacted]");
}

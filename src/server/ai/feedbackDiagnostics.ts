import "server-only";
import type { z } from "zod";
import {
  feedbackDiagnosticCodeSchema, feedbackDiagnosticExpectedSchema, feedbackDiagnosticPathKeySchema,
  MAX_FEEDBACK_SCHEMA_ISSUES, type SafeFeedbackSchemaIssue,
} from "@/domain/feedbackDiagnostics";

const customCategories = new Map<string, SafeFeedbackSchemaIssue["messageCategory"]>([
  ["Rating, evidence and problem codes must agree.", "rating_evidence_problem_code_mismatch"],
  ["Gaps need actionable improvement guidance.", "missing_improvement_guidance"],
  ["Identified strengths need supported feedback.", "missing_strength_guidance"],
  ["Problem code does not describe this dimension.", "dimension_problem_code_mismatch"],
]);

function receivedAtPath(input: unknown, path: readonly PropertyKey[]): { type: SafeFeedbackSchemaIssue["receivedType"]; value?: unknown } {
  let value = input;
  for (const key of path) {
    if (value === null || typeof value !== "object") return { type: "unknown" };
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) return { type: "missing" };
    if (!("value" in descriptor)) return { type: "unknown" };
    value = descriptor.value;
  }
  return { type: value === null ? "null" : Array.isArray(value) ? "array" : typeof value, value };
}

/** Only finite labels and public property names leave this server-side boundary. */
export function summarizeFeedbackSchemaIssues(error: z.ZodError, input: unknown): SafeFeedbackSchemaIssue[] {
  const result: SafeFeedbackSchemaIssue[] = [];
  function append(issues: readonly z.core.$ZodIssue[], prefix: readonly PropertyKey[] = [], depth = 0) {
    for (const issue of issues) {
      if (result.length >= MAX_FEEDBACK_SCHEMA_ISSUES) return;
      const path = [...prefix, ...issue.path];
      if (issue.code === "invalid_union" && issue.errors.length && depth < 8) {
        for (const branch of issue.errors) append(branch, path, depth + 1);
        continue;
      }
      const code = feedbackDiagnosticCodeSchema.safeParse(issue.code);
      const expected = feedbackDiagnosticExpectedSchema.safeParse("expected" in issue ? issue.expected : null);
      const received = receivedAtPath(input, path);
      result.push({
        path: path.slice(0, 10).map((key) => {
          if (typeof key === "number" && Number.isInteger(key) && key >= 0 && key <= 9999) return key;
          const allowed = feedbackDiagnosticPathKeySchema.safeParse(key);
          return allowed.success ? allowed.data : "other";
        }),
        code: code.success ? code.data : "unknown",
        expected: expected.success ? expected.data : null,
        receivedType: received.type,
        messageCategory: issue.code === "custom" ? customCategories.get(issue.message) ?? "custom" : code.success ? code.data : "unknown",
        receivedValueCategory: received.type === "missing" ? "missing" : received.type === "null" ? "null"
          : issue.code === "invalid_value" ? "outside_allowed_values"
            : typeof received.value === "string" || Array.isArray(received.value) ? received.value.length ? "nonempty" : "empty" : "not_applicable",
      });
    }
  }
  append(error.issues);
  return result;
}

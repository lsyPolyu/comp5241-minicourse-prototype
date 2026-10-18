import { z } from "zod";
import { summaryFieldIds } from "./course";

export const MAX_FEEDBACK_SCHEMA_ISSUES = 8;
export const feedbackDiagnosticPathKeySchema = z.enum([
  "questioning", "dimensions", ...summaryFieldIds, "level", "explanation", "evidence",
  "source", "turnId", "fieldId", "quote", "factId", "problemCodes", "whatWentWell", "whatToImprove", "answer", "other",
]);
export const feedbackDiagnosticCodeSchema = z.enum([
  "invalid_type", "too_big", "too_small", "invalid_format", "not_multiple_of", "unrecognized_keys",
  "invalid_union", "invalid_key", "invalid_element", "invalid_value", "custom", "unknown",
]);
export const feedbackDiagnosticExpectedSchema = z.enum([
  "string", "number", "int", "boolean", "bigint", "symbol", "undefined", "null", "never", "void", "date",
  "array", "object", "tuple", "record", "map", "set", "file", "nonoptional", "nan", "function",
]);
export const feedbackSchemaIssueSchema = z.strictObject({
  path: z.array(z.union([feedbackDiagnosticPathKeySchema, z.number().int().min(0).max(9999)])).max(10),
  code: feedbackDiagnosticCodeSchema,
  expected: feedbackDiagnosticExpectedSchema.nullable(),
  receivedType: z.enum(["missing", "undefined", "null", "string", "number", "boolean", "bigint", "symbol", "function", "array", "object", "unknown"]),
  messageCategory: z.enum([
    ...feedbackDiagnosticCodeSchema.options, "rating_evidence_problem_code_mismatch", "missing_improvement_guidance",
    "missing_strength_guidance", "dimension_problem_code_mismatch",
  ]),
  receivedValueCategory: z.enum(["outside_allowed_values", "missing", "null", "empty", "nonempty", "not_applicable"]),
});
export type SafeFeedbackSchemaIssue = z.infer<typeof feedbackSchemaIssueSchema>;

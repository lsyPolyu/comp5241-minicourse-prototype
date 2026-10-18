import { z } from "zod";
import { factIdSchema } from "./client";
import { summaryFieldIds } from "./course";
import type { SubmittedSnapshot } from "./learning";

export const feedbackLevelSchema = z.enum(["Strong", "Partial", "Missing"]);
export const problemCodeSchema = z.enum(["goalMisunderstood", "questioningGap", "summaryGap", "minorOmission"]);
const evidenceSchema = z.discriminatedUnion("source", [
  z.strictObject({ source: z.literal("turn"), turnId: z.string().min(1).max(200), fieldId: z.null(), quote: z.string().min(1).max(2000).refine((text) => text.trim().length > 0), factId: factIdSchema.nullable() }),
  z.strictObject({ source: z.literal("summary"), turnId: z.null(), fieldId: z.enum(summaryFieldIds), quote: z.string().min(1).refine((text) => text.trim().length > 0), factId: factIdSchema.nullable() }),
  z.strictObject({ source: z.literal("absence"), turnId: z.null(), fieldId: z.enum(summaryFieldIds).nullable(), quote: z.null(), factId: factIdSchema.nullable() }),
]);
export const dimensionAssessmentSchema = z.strictObject({
  level: feedbackLevelSchema, explanation: z.string().trim().min(1).max(1200),
  evidence: z.array(evidenceSchema).min(1).max(8), problemCodes: z.array(problemCodeSchema).max(4),
}).superRefine((value, ctx) => {
  const codes = value.problemCodes;
  if (new Set(codes).size !== codes.length ||
    (value.level === "Strong" && (codes.length > 0 || value.evidence.some((e) => e.source === "absence"))) ||
    (value.level !== "Strong" && codes.length === 0) ||
    (value.level === "Missing" && codes.every((code) => code === "minorOmission"))) {
    ctx.addIssue({ code: "custom", message: "Rating, evidence and problem codes must agree." });
  }
});
export const feedbackSchema = z.strictObject({
  questioning: dimensionAssessmentSchema,
  dimensions: z.strictObject({
    targetUser: dimensionAssessmentSchema, userGoal: dimensionAssessmentSchema,
    coreRequirements: dimensionAssessmentSchema, constraints: dimensionAssessmentSchema,
    priorities: dimensionAssessmentSchema, userFlow: dimensionAssessmentSchema,
    acceptanceCriteria: dimensionAssessmentSchema, outOfScope: dimensionAssessmentSchema,
  }),
  whatWentWell: z.array(z.string().trim().min(1).max(1000)).max(9),
  whatToImprove: z.array(z.string().trim().min(1).max(1000)).max(9),
}).superRefine(({ questioning, dimensions, whatWentWell, whatToImprove }, ctx) => {
  const values = [questioning, ...Object.values(dimensions)];
  if (values.some((value) => value.level !== "Strong") && whatToImprove.length === 0) {
    ctx.addIssue({ code: "custom", path: ["whatToImprove"], message: "Gaps need actionable improvement guidance." });
  }
  if (values.some((value) => value.level === "Strong") && whatWentWell.length === 0) {
    ctx.addIssue({ code: "custom", path: ["whatWentWell"], message: "Identified strengths need supported feedback." });
  }
  for (const [id, dimension] of [["questioning", questioning], ...Object.entries(dimensions)] as const) {
    const allowed = id === "questioning" ? ["questioningGap", "minorOmission"]
      : id === "userGoal" ? ["goalMisunderstood", "summaryGap", "minorOmission"] : ["summaryGap", "minorOmission"];
    if (dimension.problemCodes.some((code) => !allowed.includes(code))) {
      ctx.addIssue({ code: "custom", path: [id], message: "Problem code does not describe this dimension." });
    }
  }
});
export type ActivityAssessment = z.infer<typeof feedbackSchema>;
export type DimensionAssessment = z.infer<typeof dimensionAssessmentSchema>;
export type FeedbackLevel = z.infer<typeof feedbackLevelSchema>;

// Input references are checked again before committing a browser result. Rubric
// relevance stays server-only; exact substring checks do not prove AI semantics.
export function feedbackMatchesSubmission(assessment: ActivityAssessment, snapshot: Pick<SubmittedSnapshot, "summary" | "transcript">): boolean {
  const entries = [["questioning", assessment.questioning], ...Object.entries(assessment.dimensions)] as const;
  return entries.every(([id, dimension]) => {
    const questioning = id === "questioning";
    const hasInput = questioning ? snapshot.transcript.some((turn) => turn.role === "user")
      : snapshot.summary[id as keyof typeof snapshot.summary].trim().length > 0;
    if (!hasInput && dimension.level !== "Missing") return false;
    return dimension.evidence.every((evidence) => {
      if (evidence.source === "absence") return evidence.fieldId === (questioning ? null : id);
      if (questioning) return evidence.source === "turn" && snapshot.transcript.some((turn) =>
        turn.id === evidence.turnId && turn.role === "user" && turn.text.includes(evidence.quote));
      return evidence.source === "summary" && evidence.fieldId === id && snapshot.summary[evidence.fieldId].includes(evidence.quote);
    });
  });
}

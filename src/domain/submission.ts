import { z } from "zod";
import { summarySchema } from "./summary";
import type { RequestIdentity, SubmittedSnapshot, SummarySnapshot } from "./learning";

export const submissionTurnSchema = z.strictObject({
  id: z.string().min(1).max(200), role: z.enum(["user", "assistant"]), text: z.string().min(1).max(2000),
});
export const feedbackRequestSchema = z.strictObject({
  courseId: z.literal("requirement-clarification"), scenarioId: z.literal("club-signup-v1"),
  attemptId: z.string().min(1).max(128), submissionId: z.string().min(1).max(128),
  requestId: z.string().min(1).max(128),
  transcript: z.array(submissionTurnSchema), summarySnapshot: summarySchema,
}).superRefine(({ transcript }, ctx) => {
  if (new Set(transcript.map((turn) => turn.id)).size !== transcript.length ||
    (transcript.length > 0 && transcript.length % 2 !== 1) ||
    transcript.some((turn, index) => turn.role !== (index % 2 === 0 ? "assistant" : "user"))) {
    ctx.addIssue({ code: "custom", path: ["transcript"], message: "Expected unique turns, an opening and completed interview pairs." });
  }
});
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

export function createSubmissionSnapshot(submissionId: string, summary: SummarySnapshot, transcript: SubmittedSnapshot["transcript"]): SubmittedSnapshot {
  return { submissionId, summary: summarySchema.parse(summary), transcript: transcript.map((turn) => ({ ...turn })) };
}
export function buildFeedbackRequest(courseId: string, scenarioId: string, identity: RequestIdentity, snapshot: SubmittedSnapshot): FeedbackRequest {
  if (identity.submissionId !== snapshot.submissionId) throw new Error("Submission identity mismatch.");
  return feedbackRequestSchema.parse({ courseId, scenarioId, ...identity, transcript: snapshot.transcript, summarySnapshot: snapshot.summary });
}

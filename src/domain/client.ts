import { z } from "zod";

export const CLIENT_QUESTION_LIMIT = 1200;
export const factIds = ["F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10"] as const;
export const factIdSchema = z.enum(factIds);
export type FactId = z.infer<typeof factIdSchema>;
const uniqueFacts = z.array(factIdSchema).max(10).refine((ids) => new Set(ids).size === ids.length);
export const clientMessageSchema = z.discriminatedUnion("role", [
  z.strictObject({ role: z.literal("user"), content: z.string().trim().min(1).max(CLIENT_QUESTION_LIMIT) }),
  z.strictObject({ role: z.literal("assistant"), content: z.string().trim().min(1).max(2000), factIds: uniqueFacts.max(2) }),
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;
const identity = {
  courseId: z.literal("requirement-clarification"), scenarioId: z.literal("club-signup-v1"),
  attemptId: z.string().trim().min(1).max(128),
};
export const clientRequestSchema = z.discriminatedUnion("mode", [
  z.strictObject({ ...identity, mode: z.literal("opening") }),
  z.strictObject({ ...identity, mode: z.literal("turn"), question: z.string().trim().min(1).max(CLIENT_QUESTION_LIMIT),
    transcript: z.array(clientMessageSchema).min(1),
  }).superRefine(({ transcript }, ctx) => {
    if (transcript.length % 2 !== 1 || transcript.some((m, i) => m.role !== (i % 2 === 0 ? "assistant" : "user"))) {
      ctx.addIssue({ code: "custom", path: ["transcript"], message: "Expected an opening and completed interview pairs." });
    }
  }),
]);
export type ClientRequest = z.infer<typeof clientRequestSchema>;
export type ClientTurnRequest = Extract<ClientRequest, { mode: "turn" }>;
export const clientReplySchema = z.strictObject({
  reply: z.string().trim().min(1).max(2000), factIds: uniqueFacts.max(2), disclosedFactIds: uniqueFacts,
});
export type ClientReply = z.infer<typeof clientReplySchema>;
export const clientDecisionSchema = z.strictObject({
  responseAct: z.enum(["disclose", "repeat", "clarify", "unknown", "redirect"]),
  requestedFactIds: uniqueFacts.max(2),
  questionEvidence: z.array(z.strictObject({ factId: factIdSchema, quote: z.string().trim().min(1).max(CLIENT_QUESTION_LIMIT) })).max(2),
});
export type ClientDecision = z.infer<typeof clientDecisionSchema>;

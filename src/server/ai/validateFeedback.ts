import "server-only";
import { feedbackMatchesSubmission, feedbackSchema, type ActivityAssessment } from "@/domain/feedback";
import type { FeedbackRequest } from "@/domain/submission";
import { clubSignupScenario } from "@/server/scenarios/club-signup";
import { AIProviderError } from "./errors";
import { feedbackSurfaceMatchesSubmission } from "./feedbackSurfacePolicy";

export function validateFeedback(input: unknown, request: FeedbackRequest): ActivityAssessment {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success || !feedbackMatchesSubmission(parsed.data, { summary: request.summarySnapshot, transcript: request.transcript })) {
    throw new AIProviderError("INVALID_AI_RESPONSE");
  }
  for (const [id, dimension] of [["questioning", parsed.data.questioning], ...Object.entries(parsed.data.dimensions)] as const) {
    const rubric = clubSignupScenario.rubric[id as keyof typeof clubSignupScenario.rubric];
    if (dimension.evidence.some((e) => e.factId !== null && !(rubric.factIds as readonly string[]).includes(e.factId))) {
      throw new AIProviderError("INVALID_AI_RESPONSE");
    }
  }
  if (!feedbackSurfaceMatchesSubmission(parsed.data, request)) {
    throw new AIProviderError("INVALID_AI_RESPONSE", "FEEDBACK_SURFACE_REJECTED");
  }
  return parsed.data;
}

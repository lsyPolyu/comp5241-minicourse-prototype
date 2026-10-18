import "server-only";
import { feedbackSchema } from "@/domain/feedback";
import { feedbackRequestSchema } from "@/domain/submission";
import { clubSignupScenario } from "@/server/scenarios/club-signup";
import { AIProviderError } from "./errors";
import { buildFeedbackPrompt } from "./feedbackPrompt";
import { requestStructuredResponse } from "./provider";
import { validateFeedback } from "./validateFeedback";

export async function assessSubmission(input: unknown) {
  const parsed = feedbackRequestSchema.safeParse(input);
  if (!parsed.success) throw new AIProviderError("INVALID_INPUT");
  const request = parsed.data;
  const result = await requestStructuredResponse({ operation: "feedback", ...buildFeedbackPrompt(request), schema: feedbackSchema, schemaName: "feedback_assessment" });
  try {
    const assessment = validateFeedback(result.data, request);
    console.info("feedback_validation", JSON.stringify({ stage: "evidence", outcome: "success", providerRequestId: result.requestId }));
    console.info("feedback_validation", JSON.stringify({ stage: "surface", outcome: "success", providerRequestId: result.requestId }));
    return { ...result, data: { attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId,
      scenarioVersion: String(clubSignupScenario.version), assessment } };
  } catch (error) {
    const surfaceRejected = error instanceof AIProviderError && error.diagnostic === "FEEDBACK_SURFACE_REJECTED";
    if (surfaceRejected) console.info("feedback_validation", JSON.stringify({ stage: "evidence", outcome: "success", providerRequestId: result.requestId }));
    console.info("feedback_validation", JSON.stringify({ stage: surfaceRejected ? "surface" : "evidence", outcome: "rejected", providerRequestId: result.requestId }));
    throw new AIProviderError("INVALID_AI_RESPONSE", surfaceRejected ? "FEEDBACK_SURFACE_REJECTED" : "SCHEMA_VALIDATION_FAILURE", result.requestId);
  }
}

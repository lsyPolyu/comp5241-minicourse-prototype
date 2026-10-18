import "server-only";
import { TUTOR_ANSWER_LIMIT, tutorRequestSchema } from "@/domain/tutor";
import { AIProviderError } from "./errors";
import { requestTextResponse } from "./provider";
import { buildTutorPrompt } from "./tutorPrompt";

export async function askTutor(input: unknown) {
  const parsed = tutorRequestSchema.safeParse(input);
  if (!parsed.success) throw new AIProviderError("INVALID_INPUT");
  const prompt = buildTutorPrompt(parsed.data);
  return requestTextResponse({
    operation: "tutor", ...prompt,
    maxLength: TUTOR_ANSWER_LIMIT,
  });
}

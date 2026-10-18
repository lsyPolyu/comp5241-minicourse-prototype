import "server-only";
import { z } from "zod";
import { clientInterviewIntroduction } from "@/content/activities/client-interview";

const minimumOpeningWords = 8;
const maximumOpeningLength = 600;
export const clientOpeningSchema = z.strictObject({ reply: z.string().trim().min(1).max(maximumOpeningLength) });
// Closed public vocabulary prevents a generated opening from smuggling new
// facts. An unsupported paraphrase is a visible failure, never a fallback.
const publicWords = new Set((`${clientInterviewIntroduction.initialRequest} Maya university board-game club organizer
  hi hello i'm i am my name is a an the we our us you your it its this that for to of and or in on at with as
  would like want looking need help work out figure make build create plan simple small website site students
  student can could please easier easy easily sign up signup signing events event board game boardgame games
  club university organize organising organizing thanks thank let's together about what should do how so more
  be get started start tell me hoping working re d s ups there`.toLowerCase().match(/[a-z]+/g) ?? []));

// The prompt and policy share the same existing contract. No additional words
// are accepted merely to make a failed model response pass.
export const publicOpeningContract = {
  minimumWords: minimumOpeningWords,
  maximumCharacters: maximumOpeningLength,
  allowedWords: [...publicWords].sort(),
  allowedPunctuation: ". , ! ? ; : ' ’ “ ” \" ( ) — – -",
  websiteWords: ["website", "site"],
  signupWords: ["sign", "signup", "signing"],
} as const;
export const openingPolicyReasonSchema = z.enum([
  "TOO_FEW_WORDS", "UNSUPPORTED_VOCABULARY", "UNSUPPORTED_CHARACTERS", "MISSING_WEBSITE", "MISSING_SIGNUP",
]);
export const clientOpeningDiagnosticSchema = z.object({
  operation: z.literal("client"), mode: z.literal("opening"),
  stage: z.enum(["policy", "mapping"]), outcome: z.enum(["rejected", "success"]),
  diagnostic: z.literal("OPENING_POLICY_REJECTED").nullable(),
  providerValidated: z.literal(true), providerRequestId: z.string().max(200).nullable(),
  textLength: z.number().int().nonnegative(), trimmedTextLength: z.number().int().nonnegative(),
  wordCount: z.number().int().nonnegative(), unsupportedWordCount: z.number().int().nonnegative(),
  reasonCodes: z.array(openingPolicyReasonSchema).max(5),
});
export const clientTurnPromptContractVersion = "turn-context-v2";
export const clientTurnRequestDiagnosticSchema = z.object({
  operation: z.literal("client"), mode: z.literal("turn"),
  historyMessageCount: z.number().int().nonnegative(),
  promptContractVersion: z.literal(clientTurnPromptContractVersion),
  structuredOutputMode: z.literal("json_object"),
});

export function inspectPublicOpening(reply: string) {
  const words = reply.toLowerCase().match(/[a-z]+/g) ?? [];
  const unsupportedWordCount = words.filter((word) => !publicWords.has(word)).length;
  const reasonCodes: z.infer<typeof openingPolicyReasonSchema>[] = [];
  if (words.length < minimumOpeningWords) reasonCodes.push("TOO_FEW_WORDS");
  if (unsupportedWordCount) reasonCodes.push("UNSUPPORTED_VOCABULARY");
  if (/[^a-zA-Z\s.,!?;:'’“”"()—–-]/.test(reply)) reasonCodes.push("UNSUPPORTED_CHARACTERS");
  if (!/\b(website|site)\b/i.test(reply)) reasonCodes.push("MISSING_WEBSITE");
  if (!/\b(sign|signup|signing)\b/i.test(reply)) reasonCodes.push("MISSING_SIGNUP");
  return { textLength: reply.length, trimmedTextLength: reply.trim().length,
    wordCount: words.length, unsupportedWordCount, reasonCodes };
}

export function isPublicOpening(reply: string) {
  return inspectPublicOpening(reply).reasonCodes.length === 0;
}

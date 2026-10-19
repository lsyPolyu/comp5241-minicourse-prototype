import { randomUUID } from "node:crypto";
import type { ApiEnvelope } from "@/lib/api/contracts";
import type { TutorAnswer } from "@/domain/tutor";
import { normalizeAIError, type AIErrorCode } from "@/server/ai/errors";
import { askTutor } from "@/server/ai/tutor";
import { readJson } from "@/server/http/readJson";

export const runtime = "nodejs";
export const maxDuration = 75;
const statusCodes: Record<AIErrorCode, number> = {
  INVALID_INPUT: 400, UNAVAILABLE: 503, TIMEOUT: 504, RATE_LIMITED: 429,
  REFUSED: 422, INVALID_AI_RESPONSE: 502, NOT_CONFIGURED: 503,
};

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const result = await askTutor(await readJson(request));
    console.info("ai_route", { operation: "tutor", requestId, providerRequestId: result.requestId });
    const body: ApiEnvelope<TutorAnswer> = { ok: true, requestId, data: result.data };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = normalizeAIError(error);
    const body: ApiEnvelope<TutorAnswer> = {
      ok: false, requestId, error: { code: safe.code, message: safe.message, retryable: safe.retryable },
    };
    return Response.json(body, { status: statusCodes[safe.code], headers: { "Cache-Control": "no-store" } });
  }
}

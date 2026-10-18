import { randomUUID } from "node:crypto";
import { normalizeAIError, type AIErrorCode } from "@/server/ai/errors";
import { assessSubmission } from "@/server/ai/feedback";
import { readJson } from "@/server/http/readJson";

export const runtime = "nodejs";
const statusCodes: Record<AIErrorCode, number> = {
  INVALID_INPUT: 400, UNAVAILABLE: 503, TIMEOUT: 504, RATE_LIMITED: 429,
  REFUSED: 422, INVALID_AI_RESPONSE: 502, NOT_CONFIGURED: 503,
};
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const result = await assessSubmission(await readJson(request));
    console.info("ai_route", { operation: "feedback", requestId, providerRequestId: result.requestId });
    return Response.json({ ok: true, requestId, data: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = normalizeAIError(error);
    return Response.json({ ok: false, requestId, error: { code: safe.code, message: safe.message, retryable: safe.retryable } },
      { status: statusCodes[safe.code], headers: { "Cache-Control": "no-store" } });
  }
}

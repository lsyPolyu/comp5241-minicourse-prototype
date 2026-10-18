import { z } from "zod";
import { apiEnvelopeSchema, type ApiEnvelope } from "./contracts";

// Leave time for the server's 60s request budget and safe error envelope.
export const API_WAIT_TIMEOUT_MS = 65_000;

export async function postApi<T>(path: string, input: unknown, dataSchema: z.ZodType<T>): Promise<ApiEnvelope<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_WAIT_TIMEOUT_MS);
  try {
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Expected a same-origin path.");
    const response = await fetch(path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input), signal: controller.signal, credentials: "same-origin", cache: "no-store",
    });
    const parsed = apiEnvelopeSchema(dataSchema).safeParse(await response.json());
    if (!parsed.success || (parsed.data.ok && !response.ok)) {
      return { ok: false, requestId: "local", error: { code: "INVALID_AI_RESPONSE", message: "Unable to read the answer. Your question and conversation are still here. Retry.", retryable: true } };
    }
    return parsed.data;
  } catch {
    return {
      ok: false, requestId: "local",
      error: controller.signal.aborted
        ? { code: "TIMEOUT", message: "The answer took too long. Your question and conversation are still here. Retry.", retryable: true }
        : { code: "UNAVAILABLE", message: "Unable to reach the Tutor. Your question and conversation are still here. Retry.", retryable: true },
    };
  } finally { clearTimeout(timeout); }
}

import { z } from "zod";
import { AI_BASE_URL, AI_CAPABILITY_TIMEOUT_MS, AI_MODEL, AI_PROVIDER, requestStructuredResponse } from "../../src/server/ai/provider";
import { normalizeAIError } from "../../src/server/ai/errors";

// Only this explicit CLI may make a paid capability request. Ordinary tests exclude it.
const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
const context = {
  operation: "capability", provider: AI_PROVIDER, baseURL: AI_BASE_URL, model: AI_MODEL,
  timeoutMs: AI_CAPABILITY_TIMEOUT_MS, thinking: "disabled",
};

if (!keyConfigured) {
  console.info(JSON.stringify({
    ...context, status: "blocked", code: "NOT_CONFIGURED", secret: "missing",
  }));
  process.exitCode = 1;
} else {
  const started = Date.now();
  try {
    const result = await requestStructuredResponse({
      operation: "capability",
      instructions: 'Return only this json: {"ok":true,"message":"capability-ok"}.',
      input: "Check capability.",
      schema: z.object({ ok: z.literal(true), message: z.literal("capability-ok") }),
      schemaName: "capability_check",
    });
    console.info(JSON.stringify({
      ...context, status: "passed", secret: "configured",
      authentication: "PASS", modelAccess: "PASS",
      normalResponse: "PASS", jsonOutput: "PASS", jsonParse: "PASS", zodValidation: "PASS",
      durationMs: Date.now() - started,
      requestId: result.requestId, usage: result.usage,
    }));
  } catch (error) {
    const safeError = normalizeAIError(error);
    console.info(JSON.stringify({
      ...context, status: "failed", secret: "configured",
      code: safeError.code, diagnostic: safeError.diagnostic,
      requestId: safeError.requestId, durationMs: Date.now() - started,
    }));
    process.exitCode = 1;
  }
}

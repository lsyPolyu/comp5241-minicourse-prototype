import "server-only";
import OpenAI, { APIError } from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import { Agent } from "undici";
import { z } from "zod";
import { AIProviderError, normalizeAIError, type AIErrorCode } from "./errors";

export const AI_PROVIDER = "DeepSeek";
export const AI_BASE_URL = "https://api.deepseek.com";
export const AI_MODEL = "deepseek-flash";
export const AI_CAPABILITY_TIMEOUT_MS = 60_000;
const outputLimits = { tutor: 900, client: 600, feedback: 4500, capability: 128 } as const;
type AIOperation = keyof typeof outputLimits;
type Usage = { inputTokens: number; outputTokens: number; totalTokens: number };

export interface AIResult<T> {
  data: T;
  model: typeof AI_MODEL;
  requestId: string | null;
  usage: Usage | null;
}

let client: OpenAI | undefined;

function getClient(): OpenAI {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim();
  if (!key || (model && model !== AI_MODEL)) throw new AIProviderError("NOT_CONFIGURED");
  client ??= new OpenAI({
    apiKey: key,
    baseURL: AI_BASE_URL,
    maxRetries: 0,
    timeout: 30_000,
    // Disable SDK payload logging even if OPENAI_LOG is set externally.
    logLevel: "off",
  });
  return client;
}

/** One provider request per call. Purpose services own context and semantic checks. */
export async function requestStructuredResponse<Schema extends z.ZodType>(request: {
  operation: AIOperation;
  instructions: string;
  input: string | ResponseInput;
  schema: Schema;
  schemaName: string;
}): Promise<AIResult<z.infer<Schema>>> {
  const started = Date.now();
  let requestId: string | null = null;
  let usage: Usage | null = null;
  let outcome: "success" | AIErrorCode = "UNAVAILABLE";
  let capabilityDispatcher: Agent | undefined;
  try {
    const api = getClient();
    if (request.operation === "capability") {
      // Native fetch otherwise has a separate 10s connection timeout.
      capabilityDispatcher = new Agent({ connectTimeout: AI_CAPABILITY_TIMEOUT_MS });
    }
    const response = await api.responses.create({
      model: AI_MODEL,
      instructions: `${request.instructions}\nReturn only a json object for ${request.schemaName}. ` +
        `Match this JSON format: ${JSON.stringify(z.toJSONSchema(request.schema))}`,
      input: request.input,
      stream: false,
      reasoning: { effort: "none" },
      max_output_tokens: outputLimits[request.operation],
      text: { format: { type: "json_object" } },
    }, capabilityDispatcher ? {
      timeout: AI_CAPABILITY_TIMEOUT_MS,
      fetchOptions: { dispatcher: capabilityDispatcher },
    } : undefined);
    requestId = response?._request_id ?? null;
    usage = response?.usage ? {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.total_tokens,
    } : null;
    if (!response || response.status !== "completed" || !Array.isArray(response.output)) {
      throw new AIProviderError("INVALID_AI_RESPONSE",
        response?.status === "incomplete" ? "INCOMPLETE_RESPONSE" : "INVALID_RESPONSE");
    }
    const chunks: string[] = [];
    for (const item of response.output) {
      if (item?.type !== "message") continue;
      if (!Array.isArray(item.content) || (item.status && item.status !== "completed")) {
        throw new AIProviderError("INVALID_AI_RESPONSE", "INVALID_RESPONSE");
      }
      for (const content of item.content) {
        if (content?.type === "refusal") throw new AIProviderError("REFUSED");
        if (content?.type !== "output_text" || typeof content.text !== "string") {
          throw new AIProviderError("INVALID_AI_RESPONSE", "INVALID_RESPONSE");
        }
        chunks.push(content.text);
      }
    }
    const text = chunks.join("");
    if (!text.trim()) throw new AIProviderError("INVALID_AI_RESPONSE", "JSON_OUTPUT_FAILURE");
    // JSON Output guarantees syntax only; the application validates its own schema.
    const json: unknown = JSON.parse(text);
    const parsed = request.schema.safeParse(json);
    if (!parsed.success) throw new AIProviderError("INVALID_AI_RESPONSE", "SCHEMA_VALIDATION_FAILURE");
    outcome = "success";
    return { data: parsed.data, model: AI_MODEL, requestId, usage };
  } catch (error) {
    if (error instanceof APIError) requestId = error.requestID ?? null;
    const safeError = normalizeAIError(error);
    outcome = safeError.code;
    throw new AIProviderError(safeError.code, safeError.diagnostic, requestId ?? safeError.requestId);
  } finally {
    console.info("ai_request", {
      operation: request.operation, provider: AI_PROVIDER, model: AI_MODEL, requestId, usage,
      durationMs: Date.now() - started, outcome,
    });
    await capabilityDispatcher?.destroy();
  }
}

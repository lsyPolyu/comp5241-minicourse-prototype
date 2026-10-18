import "server-only";
import OpenAI, { APIError } from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import { Agent } from "undici";
import { z } from "zod";
import { AIProviderError, normalizeAIError, type AIDiagnosticCode, type AIErrorCode } from "./errors";

export const AI_PROVIDER = "DeepSeek";
export const AI_BASE_URL = "https://api.deepseek.com";
export const AI_MODEL = "deepseek-flash";
export const AI_REQUEST_TIMEOUT_MS = 60_000;
export const AI_CONNECTION_TIMEOUT_MS = 60_000;
// Retain the existing capability CLI's name for the shared request budget.
export const AI_CAPABILITY_TIMEOUT_MS = AI_REQUEST_TIMEOUT_MS;
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
    timeout: AI_REQUEST_TIMEOUT_MS,
    // Disable SDK payload logging even if OPENAI_LOG is set externally.
    logLevel: "off",
  });
  return client;
}

// Counts/types only: no model text, arbitrary property names, prompts or headers.
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function valueType(value: unknown) {
  return value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
}
function safeLabel(value: unknown, allowed: readonly string[]) {
  return value === undefined ? "missing" : typeof value === "string" && allowed.includes(value) ? value : "other";
}
function describeResponse(value: unknown) {
  const response = record(value);
  const items = Array.isArray(response.output) ? response.output.map(record) : [];
  const messages = items.filter((item) => item.type === "message");
  const contents = messages.flatMap((item) => Array.isArray(item.content) ? item.content.map(record) : []);
  const texts = contents.filter((item) => item.type === "output_text" && typeof item.text === "string");
  return {
    responseType: valueType(value),
    responseStatus: safeLabel(response.status, ["completed", "incomplete", "failed", "in_progress", "queued", "cancelled"]),
    outputItemCount: Array.isArray(response.output) ? response.output.length : null,
    outputItemTypes: items.slice(0, 8).map((item) => safeLabel(item.type, ["message", "reasoning"])),
    messageStatuses: messages.slice(0, 8).map((item) => safeLabel(item.status, ["completed", "incomplete", "in_progress"])),
    contentTypes: contents.slice(0, 8).map((item) => safeLabel(item.type, ["output_text", "refusal"])),
    textItemCount: texts.length,
    textLength: texts.reduce((length, item) => length + (item.text as string).length, 0),
    trimmedTextLength: texts.map((item) => item.text as string).join("").trim().length,
    hasOutputText: typeof response.output_text === "string",
  };
}

interface BaseRequest {
  instructions: string;
  input: string | ResponseInput;
}
type TextRequest = BaseRequest & { operation: "tutor"; maxLength: number };
type StructuredRequest<Schema extends z.ZodType> = BaseRequest & {
  operation: Exclude<AIOperation, "tutor">;
  schema: Schema;
  schemaName: string;
};

export function requestTextResponse(request: TextRequest): Promise<AIResult<string>> {
  return requestResponse({ ...request, mode: "text" });
}
export function requestStructuredResponse<Schema extends z.ZodType>(request: StructuredRequest<Schema>): Promise<AIResult<z.infer<Schema>>> {
  return requestResponse({ ...request, mode: "structured" });
}

/** Both modes share exactly one SDK call, extraction, error boundary and telemetry. */
async function requestResponse(request: TextRequest & { mode: "text" }): Promise<AIResult<string>>;
async function requestResponse<Schema extends z.ZodType>(request: StructuredRequest<Schema> & { mode: "structured" }): Promise<AIResult<z.infer<Schema>>>;
async function requestResponse(request: (TextRequest & { mode: "text" }) | (StructuredRequest<z.ZodType> & { mode: "structured" })): Promise<AIResult<unknown>> {
  const started = Date.now();
  let requestId: string | null = null;
  let usage: Usage | null = null;
  let outcome: "success" | AIErrorCode = "UNAVAILABLE";
  let diagnostic: AIDiagnosticCode | null = null;
  let stage: "sdk" | "response" | "content" | "json" | "schema" = "sdk";
  let shape: ReturnType<typeof describeResponse> | null = null;
  let jsonType: string | null = null;
  let schemaIssues: { code: string; path: string[] }[] = [];
  let requestDispatcher: Agent | undefined;
  try {
    const api = getClient();
    // Apply the P01-verified transport to every operation. SDK request timeout
    // alone does not override native fetch's separate default connect timeout.
    requestDispatcher = new Agent({ connectTimeout: AI_CONNECTION_TIMEOUT_MS });
    const response = await api.responses.create({
      model: AI_MODEL,
      instructions: request.mode === "text" ? request.instructions :
        `${request.instructions}\nReturn only a json object for ${request.schemaName}. ` +
        `Match this JSON format: ${JSON.stringify(z.toJSONSchema(request.schema))}`,
      input: request.input,
      stream: false,
      reasoning: { effort: "none" },
      max_output_tokens: outputLimits[request.operation],
      text: { format: { type: request.mode === "text" ? "text" : "json_object" } },
    }, {
      timeout: AI_REQUEST_TIMEOUT_MS,
      fetchOptions: { dispatcher: requestDispatcher },
    }).catch((error: unknown) => {
      // The SDK derives output_text before returning. Broken response arrays can
      // throw TypeError there; fetch failures are already APIConnectionError.
      if (request.mode === "text" && error instanceof TypeError) {
        throw new AIProviderError("INVALID_AI_RESPONSE", "INVALID_RESPONSE");
      }
      throw error;
    });
    stage = "response";
    shape = describeResponse(response);
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
    stage = "content";
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
    if (!text.trim()) throw new AIProviderError("INVALID_AI_RESPONSE", request.mode === "text" ? "TEXT_OUTPUT_FAILURE" : "JSON_OUTPUT_FAILURE");
    if (request.mode === "text") {
      const answer = text.trim();
      if (answer.length > request.maxLength) throw new AIProviderError("INVALID_AI_RESPONSE", "TEXT_OUTPUT_FAILURE");
      outcome = "success";
      return { data: answer, model: AI_MODEL, requestId, usage };
    }
    // JSON Output guarantees syntax only; the application validates its own schema.
    stage = "json";
    let json: unknown;
    try { json = JSON.parse(text); }
    catch { throw new AIProviderError("INVALID_AI_RESPONSE", "JSON_OUTPUT_FAILURE"); }
    jsonType = valueType(json);
    stage = "schema";
    const parsed = request.schema.safeParse(json);
    if (!parsed.success) {
      schemaIssues = parsed.error.issues.slice(0, 8).map((issue) => ({ code: issue.code,
        path: issue.path.slice(0, 4).map((key) => key === "answer" ? key : "other"),
      }));
      throw new AIProviderError("INVALID_AI_RESPONSE", "SCHEMA_VALIDATION_FAILURE");
    }
    outcome = "success";
    return { data: parsed.data, model: AI_MODEL, requestId, usage };
  } catch (error) {
    if (error instanceof APIError) requestId = error.requestID ?? null;
    const safeError = normalizeAIError(error);
    outcome = safeError.code;
    diagnostic = safeError.diagnostic;
    throw new AIProviderError(safeError.code, safeError.diagnostic, requestId ?? safeError.requestId);
  } finally {
    if (outcome === "INVALID_AI_RESPONSE") {
      console.info("ai_response_diagnostic", JSON.stringify({ operation: request.operation, stage, diagnostic,
        ...shape, jsonType, schemaIssues }));
    }
    console.info("ai_request", {
      operation: request.operation, provider: AI_PROVIDER, model: AI_MODEL, requestId, usage,
      durationMs: Date.now() - started, outcome,
    });
    await requestDispatcher?.destroy();
  }
}

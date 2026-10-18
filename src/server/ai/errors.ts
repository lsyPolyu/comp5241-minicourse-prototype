import "server-only";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from "openai";
import { ZodError } from "zod";

const messages = {
  INVALID_INPUT: "This request could not be sent. Your work is still here.",
  UNAVAILABLE: "AI is temporarily unavailable. Your work is still here. Retry.",
  TIMEOUT: "AI took too long to respond. Your work is still here. Retry.",
  RATE_LIMITED: "AI is busy right now. Your work is still here. Retry shortly.",
  REFUSED: "AI could not answer this request. Your work is still here. Retry.",
  INVALID_AI_RESPONSE: "AI did not return a usable answer. Your work is still here. Retry.",
  NOT_CONFIGURED: "AI is not available yet. Your work is still here. Retry later.",
} as const;

export type AIErrorCode = keyof typeof messages;
export type AIDiagnosticCode = AIErrorCode | "AUTHENTICATION" | "MODEL_ACCESS" |
  "MODEL_NOT_FOUND" | "INSUFFICIENT_BALANCE" | "RATE_LIMIT" | "NETWORK" |
  "INVALID_REQUEST" | "INVALID_JSON" | "SCHEMA_VALIDATION_FAILURE" |
  "JSON_OUTPUT_FAILURE" | "TEXT_OUTPUT_FAILURE" | "INCOMPLETE_RESPONSE" | "INVALID_RESPONSE" | "PROVIDER_ERROR" | "OPENING_POLICY_REJECTED" | "FEEDBACK_SURFACE_REJECTED";

/** Contains only safe, public error details; never retains the provider cause. */
export class AIProviderError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;

  constructor(
    code: AIErrorCode,
    readonly diagnostic: AIDiagnosticCode = code,
    readonly requestId: string | null = null,
  ) {
    super(messages[code]);
    this.name = "AIProviderError";
    this.code = code;
    this.retryable = code !== "INVALID_INPUT";
  }
}

export function normalizeAIError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error;
  if (error instanceof APIConnectionTimeoutError) return new AIProviderError("TIMEOUT");
  if (error instanceof APIConnectionError) return new AIProviderError("UNAVAILABLE", "NETWORK");
  if (error instanceof APIError) {
    const requestId = error.requestID ?? null;
    switch (error.status) {
      case 400:
      case 422: return new AIProviderError("INVALID_INPUT", "INVALID_REQUEST", requestId);
      case 401: return new AIProviderError("NOT_CONFIGURED", "AUTHENTICATION", requestId);
      case 402: return new AIProviderError("NOT_CONFIGURED", "INSUFFICIENT_BALANCE", requestId);
      case 403: return new AIProviderError("NOT_CONFIGURED", "MODEL_ACCESS", requestId);
      case 404: return new AIProviderError("NOT_CONFIGURED", "MODEL_NOT_FOUND", requestId);
      case 429: return new AIProviderError("RATE_LIMITED", "RATE_LIMIT", requestId);
      default: return new AIProviderError("UNAVAILABLE", "PROVIDER_ERROR", requestId);
    }
  }
  if (error instanceof ZodError) return new AIProviderError("INVALID_AI_RESPONSE", "SCHEMA_VALIDATION_FAILURE");
  if (error instanceof SyntaxError) return new AIProviderError("INVALID_AI_RESPONSE", "INVALID_JSON");
  return new AIProviderError("UNAVAILABLE", "PROVIDER_ERROR");
}

import { z } from "zod";

export const apiErrorSchema = z.strictObject({
  code: z.string().regex(/^[A-Z_]{1,40}$/),
  message: z.string().min(1).max(240),
  retryable: z.boolean(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiEnvelope<T> =
  | { ok: true; requestId: string; data: T }
  | { ok: false; requestId: string; error: ApiError };

export function apiEnvelopeSchema<T>(data: z.ZodType<T>): z.ZodType<ApiEnvelope<T>> {
  return z.discriminatedUnion("ok", [
    z.strictObject({ ok: z.literal(true), requestId: z.string().min(1).max(128), data }),
    z.strictObject({ ok: z.literal(false), requestId: z.string().min(1).max(128), error: apiErrorSchema }),
  ]) as z.ZodType<ApiEnvelope<T>>;
}

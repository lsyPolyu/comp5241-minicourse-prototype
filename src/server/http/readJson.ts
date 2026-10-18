import "server-only";
import { AIProviderError } from "@/server/ai/errors";

export const MAX_API_BODY_BYTES = 256 * 1024;

export async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !request.body ||
    Number(request.headers.get("content-length")) > MAX_API_BODY_BYTES) throw new AIProviderError("INVALID_INPUT");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_API_BODY_BYTES) {
        await reader.cancel();
        throw new AIProviderError("INVALID_INPUT");
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch { throw new AIProviderError("INVALID_INPUT"); }
  finally { reader.releaseLock(); }
}

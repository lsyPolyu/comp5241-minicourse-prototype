import "server-only";
import { clientDecisionSchema, clientRequestSchema, type ClientReply, type ClientTurnRequest, type FactId } from "@/domain/client";
import { applyDisclosurePolicy } from "@/server/scenarios/disclosure";
import { clientControlReplies, renderClientReply } from "@/server/scenarios/renderClientReply";
import { AIProviderError } from "./errors";
import { requestStructuredResponse } from "./provider";
import { buildClientOpeningPrompt, buildClientTurnPrompt } from "./clientPrompt";
import { clientOpeningSchema, clientTurnPromptContractVersion, inspectPublicOpening, isPublicOpening } from "./clientSchemas";

export function validateClientTranscript(request: ClientTurnRequest): FactId[] {
  const disclosed = new Set<FactId>();
  for (const [index, message] of request.transcript.entries()) {
    if (message.role === "user") continue;
    const valid = index === 0
      ? message.factIds.length === 0 && isPublicOpening(message.content)
      : message.factIds.length > 0
        ? message.content === renderClientReply("disclose", message.factIds)
        : Object.values(clientControlReplies).some((reply) => reply === message.content);
    if (!valid) throw new AIProviderError("INVALID_INPUT");
    message.factIds.forEach((id) => disclosed.add(id));
  }
  return [...disclosed];
}

export async function askClient(input: unknown) {
  const parsed = clientRequestSchema.safeParse(input);
  if (!parsed.success) throw new AIProviderError("INVALID_INPUT");
  const request = parsed.data;
  if (request.mode === "opening") {
    const result = await requestStructuredResponse({ operation: "client", ...buildClientOpeningPrompt(), schema: clientOpeningSchema, schemaName: "client_opening" });
    const inspection = inspectPublicOpening(result.data.reply);
    const rejected = inspection.reasonCodes.length > 0;
    // Only codes/counts: never emit the rejected text, its words or the prompt.
    console.info("client_opening_diagnostic", JSON.stringify({ operation: "client", mode: "opening",
      stage: rejected ? "policy" : "mapping", outcome: rejected ? "rejected" : "success",
      diagnostic: rejected ? "OPENING_POLICY_REJECTED" : null,
      providerValidated: true, providerRequestId: result.requestId, ...inspection }));
    if (rejected) throw new AIProviderError("INVALID_AI_RESPONSE", "OPENING_POLICY_REJECTED", result.requestId);
    const data: ClientReply = { reply: result.data.reply, factIds: [], disclosedFactIds: [] };
    return { ...result, data };
  }
  const disclosed = validateClientTranscript(request);
  console.info("client_turn_request", JSON.stringify({ operation: "client", mode: "turn",
    historyMessageCount: request.transcript.length, promptContractVersion: clientTurnPromptContractVersion,
    structuredOutputMode: "json_object" }));
  const result = await requestStructuredResponse({ operation: "client", ...buildClientTurnPrompt(request), schema: clientDecisionSchema, schemaName: "client_decision" });
  // Safe semantic diagnostics for explicit acceptance; no question, quote or fact text.
  console.info("client_selection", JSON.stringify({ providerRequestId: result.requestId,
    responseAct: result.data.responseAct, requestedFactIds: result.data.requestedFactIds }));
  const decision = applyDisclosurePolicy(request, result.data, disclosed);
  const data: ClientReply = {
    reply: renderClientReply(decision.responseAct, decision.requestedFactIds),
    factIds: decision.requestedFactIds,
    disclosedFactIds: [...new Set([...disclosed, ...decision.requestedFactIds])],
  };
  return { ...result, data };
}

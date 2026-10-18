import "server-only";
import { clientDecisionSchema, type ClientDecision, type ClientTurnRequest, type FactId } from "@/domain/client";
import { AIProviderError } from "@/server/ai/errors";

// A backstop for explicit topics, not an intent classifier: the model still
// interprets paraphrases and references. Novel wording is reviewed in live QA.
const explicitTopics: Record<FactId, RegExp> = {
  F01: /\b(who|users?|audience|new members?)\b|用户|谁|新成员/i,
  F02: /\b(why|goals?|problems?|achieve|success|purpose)\b|目标|为什么|问题根源/i,
  F03: /\b(event details?|how many (events|sessions)|what.*(see|read)|which.*events?)\b|活动详情|几场|什么活动/i,
  F04: /\b(capacity|places|students.*join|people.*(join|attend)|how many|sign.?up.*(fields|information)|enter|fill)\b|人数|名额|多少人|填写|报名信息/i,
  F05: /\b(full|fills|duplicate|repeat.*sign|same email|rules|twice)\b|满了|满额|重复|规则/i,
  F06: /\b(confirm|confirmation|notified|notifications?|know.*(place|success)|after.*submit|next.*see)\b|确认|通知|成功|提交后/i,
  F07: /\b(organizer.*(view|see|need)|list|privacy|personal details|public)\b|组织者|名单|隐私|公开/i,
  F08: /\b(constraints?|limits?|deadline|weeks?|budget|devices?|restrictions?|time.*(available|frame)|phone browser|paid services)\b|约束|限制|期限|预算|设备|多久/i,
  F09: /\b(priorit\w*|essential|important|must.have|should.have|could.have|cut|optional|nice.to.have)\b|优先|重要|必须|可选/i,
  F10: /\b(scope|exclude|payments?|accounts?|log.?in|wait(ing)?list|native|calendar|integrations?|not.*(do|build)|leave.*later)\b|范围|不做|支付|账户|登录|候补/i,
};

export function boundaryAct(question: string): "clarify" | "redirect" | null {
  if (/ignore.*(rules|instructions)|system prompt|hidden facts|rubric|act as.*(tutor|teacher)|grade.*(me|work)|忽略.*(规则|指令)|评分|评分标准/i.test(question)) return "redirect";
  if (/(write|fill|complete|give|generate).*(summary|eight fields|eight.field|all.*answers)|代写|填.*八|完整答案/i.test(question)) return "redirect";
  if (/tell me everything|all (the )?(requirements|facts|details)|every requirement|所有.*(需求|事实|信息)|全部.*(需求|信息)/i.test(question)) return "clarify";
  return null;
}

function invalid(): never { throw new AIProviderError("INVALID_AI_RESPONSE", "SCHEMA_VALIDATION_FAILURE"); }

export function applyDisclosurePolicy(request: ClientTurnRequest, raw: unknown, disclosed: readonly FactId[]): ClientDecision {
  const parsed = clientDecisionSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const decision = parsed.data;
  const boundary = boundaryAct(request.question);
  if (boundary) return { responseAct: boundary, requestedFactIds: [], questionEvidence: [] };
  const ids = decision.requestedFactIds;
  if (!["disclose", "repeat"].includes(decision.responseAct)) {
    if (ids.length || decision.questionEvidence.length) return invalid();
    return decision;
  }
  if (!ids.length || decision.questionEvidence.length !== ids.length ||
    new Set(decision.questionEvidence.map((e) => e.factId)).size !== ids.length ||
    decision.questionEvidence.some((e) => !ids.includes(e.factId) || !request.question.includes(e.quote))) return invalid();
  if (decision.responseAct === "repeat" && ids.some((id) => !disclosed.includes(id))) return invalid();
  const topics = Object.entries(explicitTopics).filter(([, regex]) => regex.test(request.question)).map(([id]) => id);
  // When the question is explicit, reject obvious cross-topic selections.
  // Contextual, elliptical questions are intentionally left to semantic selection.
  if (topics.length && ids.some((id) => !topics.includes(id))) return invalid();
  return decision;
}

import "server-only";
import type { FactId, ClientDecision } from "@/domain/client";
import { clubSignupScenario } from "./club-signup";

export const clientControlReplies = {
  clarify: "Could you ask me about one specific part of the club's website?",
  unknown: "I haven't decided on that for this pilot. Could we focus on what we need for students to sign up?",
  redirect: "I'm Maya, the club organizer. I can answer questions about what we need, but you'll need to write your own summary. What would you like to clarify?",
} as const;

export function renderClientReply(act: ClientDecision["responseAct"], ids: readonly FactId[]) {
  if (act === "disclose" || act === "repeat") return ids.map((id) => clubSignupScenario.facts[id].clientWording).join("\n\n");
  return clientControlReplies[act];
}

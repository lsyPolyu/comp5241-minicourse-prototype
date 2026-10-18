import type { ActivityAssessment, DimensionAssessment, FeedbackLevel } from "../../src/domain/feedback";
import { summaryFieldIds } from "../../src/domain/course";
import type { SummarySnapshot } from "../../src/domain/learning";
import { emptySummary } from "../../src/domain/summary";

export const fixtureSummary = Object.fromEntries(summaryFieldIds.map((id) => [id, `Student evidence for ${id}.`])) as SummarySnapshot;
export const fixtureTranscript = [
  { id: "open", role: "assistant" as const, text: "Our club needs a simple website so students can sign up for events more easily." },
  { id: "question", role: "user" as const, text: "Who will use this and why do they need it?" },
  { id: "answer", role: "assistant" as const, text: "Students need a reliable sign-up list." },
];
export function fixtureAssessment(level: FeedbackLevel = "Strong", summary: SummarySnapshot = fixtureSummary): ActivityAssessment {
  const dimension = (id: typeof summaryFieldIds[number]): DimensionAssessment => ({
    level, explanation: `Your ${id} ${level === "Strong" ? "explains the relevant requirements" : "needs more clarification"}.`,
    evidence: level === "Missing" ? [{ source: "absence", fieldId: id, turnId: null, quote: null, factId: null }]
      : [{ source: "summary", fieldId: id, turnId: null, quote: summary[id], factId: null }],
    problemCodes: level === "Strong" ? [] : level === "Partial" ? ["minorOmission"] : ["summaryGap"],
  });
  return {
    questioning: { level, explanation: "Your questions explore the users and their purpose.",
      evidence: level === "Missing" ? [{ source: "absence", turnId: null, fieldId: null, quote: null, factId: null }]
        : [{ source: "turn", turnId: "question", fieldId: null, quote: fixtureTranscript[1].text, factId: null }],
      problemCodes: level === "Strong" ? [] : level === "Partial" ? ["minorOmission"] : ["questioningGap"],
    },
    dimensions: Object.fromEntries(summaryFieldIds.map((id) => [id, dimension(id)])) as ActivityAssessment["dimensions"],
    whatWentWell: level === "Missing" ? [] : ["Your user question asks who the software is for."],
    whatToImprove: level === "Strong" ? [] : ["Clarify the missing details and record them in your summary."],
  };
}
export const emptyAssessment = () => fixtureAssessment("Missing", emptySummary);

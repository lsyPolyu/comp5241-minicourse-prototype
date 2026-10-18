import "server-only";
import type { ActivityAssessment } from "@/domain/feedback";
import type { FeedbackRequest } from "@/domain/submission";

// A backstop for combined answer dumps, not a semantic grader. Each signature
// describes a concrete frozen answer relationship, never an isolated banned
// word. Prompt instructions and live human review still cover novel paraphrases.
const answerFacets = [
  {
    answer: /\b(?:20|twenty)\s*[- ]?(?:places?|spots?|seats?|registrations?|students?)\b|\b(?:capacity|cap|limit)\s*(?:of|is|to|=|:)?\s*(?:20|twenty)\b/i,
    attempted: /\b(?:capacity|cap|limits?|places?|spots?|seats?|maximum)\b|名额|人数|上限/i,
  },
  {
    answer: /\b(?:two|2)[- ]weeks?\b/i,
    attempted: /\b(?:deadline|weeks?|days?|delivery|launch|timeline)\b|期限|两周|时间限制/i,
  },
  {
    answer: /\b(?:no|without|cannot use|can['’]t use)\s+(?:any\s+)?paid services\b/i,
    attempted: /\b(?:paid|free|budget|cost|integrations?)\b|付费|预算|集成/i,
  },
  {
    answer: /\bcsv\b[^.!?;\n]{0,80}\b(?:should|useful if time|if time (?:allows|permits))\b|\bshould\b[^.!?;\n]{0,80}\bcsv\b/i,
    attempted: /\b(?:csv|download|export)\b|下载|导出/i,
  },
  {
    answer: /\bposter\b[^.!?;\n]{0,80}\b(?:could|nice (?:extra|to have))\b|\b(?:could|nice (?:extra|to have))\b[^.!?;\n]{0,80}\bposter\b/i,
    attempted: /\bposter\b|海报/i,
  },
];

const scopeItems = [
  /\bpayments?\b/i, /\b(?:student )?accounts?\b|\blog[ -]?in\b/i,
  /\bwait(?:ing)?[ -]?list\b/i, /\bemail notifications?\b/i,
  /\bnative (?:mobile )?app\b/i, /\bmultiple[ -]events?\b/i,
  /\bcalendar(?:[ /-](?:external|other))? (?:integrations?|sync)\b/i,
];

export function feedbackSurfaceMatchesSubmission(assessment: ActivityAssessment, request: FeedbackRequest): boolean {
  // evidence and factIds remain private evaluation references and are deliberately
  // excluded. Spreading an answer across explanations must not bypass this check.
  const surface = [assessment.questioning.explanation,
    ...Object.values(assessment.dimensions).map((dimension) => dimension.explanation),
    ...assessment.whatWentWell, ...assessment.whatToImprove].join("\n");
  // Actual attempted topics may receive concrete corrections, including numbers
  // the student got wrong. Client replies are learned context, never evidence of
  // the student's questioning; the independent evidence validator enforces that.
  const submitted = [...request.transcript.map((turn) => turn.text), ...Object.values(request.summarySnapshot)].join("\n");
  const unseenAnswers = answerFacets.filter((facet) => facet.answer.test(surface) && !facet.attempted.test(submitted));
  if (unseenAnswers.length >= 3) return false;
  // An unelicited near-complete exclusion list is itself a replacement field.
  const newScopeItems = scopeItems.filter((item) => item.test(surface) && !item.test(submitted));
  return newScopeItems.length < 5;
}

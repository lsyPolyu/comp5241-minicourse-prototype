import type { SummarySnapshot } from "../../../src/domain/learning";
import { emptySummary } from "../../../src/domain/summary";
import type { FactId } from "../../../src/domain/client";
import { clientInterviewIntroduction } from "../../../src/content/activities/client-interview";
import { renderClientReply } from "../../../src/server/scenarios/renderClientReply";

// Controlled interview fixtures, NOT fresh live Client evidence. Only Feedback
// requests are forwarded to DeepSeek by this acceptance command.
export const feedbackInterview = [
  { question: "Who will use it, including new members, and what problem should it solve?", factIds: ["F01", "F02"] },
  { question: "What event information is needed, and what does a student enter to sign up?", factIds: ["F03", "F04"] },
  { question: "What happens with duplicate emails or a full session, and how does the student see the result?", factIds: ["F05", "F06"] },
  { question: "What does the organizer need to see, what must stay private, and what are the delivery constraints?", factIds: ["F07", "F08"] },
  { question: "Which items are Must, Should or Could and why? What is out of scope for the pilot?", factIds: ["F09", "F10"] },
] satisfies { question: string; factIds: FactId[] }[];
export const goodSummary: SummarySnapshot = {
  targetUser: "University students, including newcomers, mostly on phones; Maya needs to see the confirmed registrations.",
  userGoal: "Replace easily missed private messages with one reliable list and a clear answer about whether each student has a place.",
  coreRequirements: "Show one board-game session's title, date, time and room. Take name and university email. Limit it to 20 places and one place per email; duplicates must not use another place. Show confirmed or full immediately on screen. Maya sees confirmed names, emails and count; students cannot see other students' personal details.",
  constraints: "Pilot in two weeks. It must work in a phone browser, without paid services or extra integrations.",
  priorities: "Must: event details, sign-up rules, clear confirmation and organizer list, because reliable places and records solve the core problem. Should: CSV download for the organizer if time permits. Could: a decorative event poster, which does not help registration reliability.",
  userFlow: "Student opens session details, reads time and room, enters name and university email, submits. Check duplicate email and capacity, then show confirmed or full. Maya checks the confirmed list and count.",
  acceptanceCriteria: "With 19 confirmed places, a valid new email gets the 20th place and confirmed appears. At 20, another registration shows full and adds no record. Repeating an email adds no extra place. A valid signup appears in Maya's list, while students cannot see others' names/emails. Details and signup work in a phone browser and the result appears immediately on screen.",
  outOfScope: "No payments, student accounts, waiting list, email notifications, native mobile app, multiple-event platform or calendar/external integrations in this pilot.",
};
export const feedbackSemanticCases = [
  { id: "empty-major-gaps", interview: false, summary: emptySummary, completeLessons: false, expected: "reviewLesson", lessonId: "why-clarify",
    review: "All nine Missing; no fabricated strengths or questions; specific guidance without replacing the answer. Valid feedback still completes the Activity." },
  { id: "minor-omission", interview: true, summary: { ...goodSummary, priorities: "Must: event details, sign-up rules, confirmation and organizer list, because reliable records and clear places solve the problem. Should: CSV download if there is time." }, completeLessons: true, expected: "retryActivity", lessonId: null,
    review: "Core understanding retained; omitted decorative Could is a minor omission, not a major gap. Actual transcript questioning and summary are judged separately." },
  { id: "strong", interview: true, summary: goodSummary, completeLessons: true, expected: "courseComplete", lessonId: null,
    review: "Nine Strong based on the actual broad questions and accurate summary, no demand for verbatim reference or every SC-AC ID. All explicit completions permit Course Complete." },
  { id: "accurate-summary-without-questions", interview: false, summary: goodSummary, completeLessons: false, expected: "reviewLesson", lessonId: "what-to-ask",
    review: "Questioning Missing despite accurate summary; summary dimensions may be Strong. No invented interview credit; recommend Lesson 2." },
] as const;
export const FEEDBACK_REQUEST_BUDGET = feedbackSemanticCases.length;
export const feedbackOpening = clientInterviewIntroduction.initialRequest;
export function controlledClientReply(index: number) {
  return index === 0 ? { reply: feedbackOpening, factIds: [], disclosedFactIds: [] }
    : { reply: renderClientReply("disclose", feedbackInterview[index - 1].factIds), factIds: feedbackInterview[index - 1].factIds,
      disclosedFactIds: feedbackInterview.slice(0, index).flatMap((turn) => turn.factIds) };
}

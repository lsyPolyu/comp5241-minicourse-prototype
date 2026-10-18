import { summaryFieldIds, type Activity } from "@/domain/course";

// Opening prompt material, not a generated Client reply or a success fallback.
export const clientInterviewIntroduction = {
  scenarioId: "club-signup-v1",
  version: 1,
  client: { name: "Maya", role: "university board-game club organizer" },
  initialRequest: "Our club needs a simple website so students can sign up for events more easily. Can you help us work out what it should do?",
} as const;

export const clientInterview = {
  id: "client-interview",
  courseId: "requirement-clarification",
  moduleId: "clarification-basics",
  title: "AI Client Requirement Clarification",
  kind: "clientRoleplay",
  scenarioId: clientInterviewIntroduction.scenarioId,
  summaryFieldIds,
} as const satisfies Activity;

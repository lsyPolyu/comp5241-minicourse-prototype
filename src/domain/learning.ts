import type { summaryFieldIds } from "./course";
import type { ClientSession } from "./clientSession";
import type { RecommendationSelection } from "./recommendation";
export type { ActivityAssessment, FeedbackLevel } from "./feedback";
import type { ActivityAssessment } from "./feedback";

export type SummaryFieldId = (typeof summaryFieldIds)[number];
export type SummarySnapshot = Readonly<Record<SummaryFieldId, string>>;
export interface RequestIdentity {
  attemptId: string;
  submissionId: string;
  requestId: string;
}

export interface LatestSuccessfulResult extends RequestIdentity, RecommendationSelection {
  scenarioVersion: string;
  summarySnapshot: SummarySnapshot;
  feedback: ActivityAssessment;
  receivedAt: string;
}

export type AttemptPhase = "notStarted" | "openingPending" | "interviewing" | "summary" | "feedbackPending" | "completed";

export interface CourseLearningState {
  completedLessonIds: readonly string[];
  currentLessonId: string | null;
  earnedActivityCompletion: (RequestIdentity & { receivedAt: string }) | null;
  latestAttemptMeta: { attemptId: string; phase: AttemptPhase } | null;
  latestSuccessfulResult: LatestSuccessfulResult | null;
}

export interface SubmittedSnapshot {
  submissionId: string;
  summary: SummarySnapshot;
  transcript: readonly { id: string; role: "user" | "assistant"; text: string }[];
}

export interface ActiveAttempt {
  client: ClientSession;
  summaryDraft: SummarySnapshot;
  attemptId: string;
  phase: AttemptPhase;
  submittedSnapshot: SubmittedSnapshot | null;
  pendingRequest: RequestIdentity | null;
  error: string | null;
}

export interface LearningState {
  courses: Readonly<Record<string, CourseLearningState>>;
  activeAttempts: Readonly<Record<string, ActiveAttempt>>;
}

export function createCourseLearningState(): CourseLearningState {
  return {
    completedLessonIds: [], currentLessonId: null, earnedActivityCompletion: null,
    latestAttemptMeta: null, latestSuccessfulResult: null,
  };
}

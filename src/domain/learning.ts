import type { summaryFieldIds } from "./course";

export type SummaryFieldId = (typeof summaryFieldIds)[number];
export type SummarySnapshot = Readonly<Record<SummaryFieldId, string>>;
export type FeedbackLevel = "Strong" | "Partial" | "Missing";
export interface FeedbackDimension { level: FeedbackLevel; explanation: string }

// Internal domain input after feedback validation, never a raw provider response.
export interface ActivityAssessment {
  questioningProcess: FeedbackDimension;
  dimensions: Readonly<Record<SummaryFieldId, FeedbackDimension>>;
  whatYouDidWell: readonly string[];
  whatToImprove: readonly string[];
}

export type LearningRecommendation =
  | { kind: "reviewLesson"; lessonId: string; reason: string }
  | { kind: "retryActivity" | "courseComplete" | "completionPending"; reason: string };

export interface RequestIdentity {
  attemptId: string;
  submissionId: string;
  requestId: string;
}

export interface LatestSuccessfulResult extends RequestIdentity {
  scenarioVersion: string;
  summarySnapshot: SummarySnapshot;
  feedback: ActivityAssessment;
  recommendation: LearningRecommendation;
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
  transcript: readonly { role: "user" | "assistant"; text: string }[];
}

export interface ActiveAttempt {
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

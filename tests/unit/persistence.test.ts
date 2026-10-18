import { expect, it, vi } from "vitest";
import { courseRegistry } from "@/content/courses/registry";
import { createLearningState, learningReducer, type LearningAction } from "@/domain/learningReducer";
import { buildLearningResult } from "@/domain/buildLearningResult";
import type { CourseLearningState, LearningState } from "@/domain/learning";
import type { FeedbackLevel } from "@/domain/feedback";
import { getProgress } from "@/domain/progress";
import { createSnapshot, snapshotToLearningState, validateSnapshot } from "@/persistence/snapshot";
import { createLocalStorageLearningRepository, LEARNING_STORAGE_KEY } from "@/persistence/localStorageRepository";
import { fixtureAssessment, fixtureSummary, fixtureTranscript } from "../fixtures/feedback";

const courseId = "requirement-clarification";
const identity = { attemptId: "attempt-one", submissionId: "submission-one", requestId: "request-one" };
const reduce = (state: LearningState, action: LearningAction) => learningReducer(state, { ...action, courseId }, courseRegistry);
function successfulState(level: FeedbackLevel = "Strong") {
  let state = createLearningState(courseRegistry);
  for (const lesson of courseRegistry[courseId].lessons) state = reduce(state, { type: "LESSON_COMPLETED", lessonId: lesson.id });
  state = reduce(state, { type: "LESSON_OPENED", lessonId: "what-to-ask" });
  state = reduce(state, { type: "RETRY_ACTIVITY", attemptId: identity.attemptId });
  const snapshot = { submissionId: identity.submissionId, summary: fixtureSummary, transcript: fixtureTranscript };
  state = reduce(state, { type: "SUMMARY_SUBMITTED", identity, snapshot });
  const result = buildLearningResult({ ...identity, scenarioVersion: "1", assessment: fixtureAssessment(level) },
    identity, snapshot, courseId, state.courses[courseId], "2026-10-18T12:00:00Z");
  return reduce(state, { type: "FEEDBACK_SUCCEEDED", result });
}

function memoryStorage(initial: string | null = null) {
  let raw = initial;
  return { getItem: vi.fn((key: string) => { expect(key).toBe(LEARNING_STORAGE_KEY); return raw; }),
    setItem: vi.fn((key: string, value: string) => { expect(key).toBe(LEARNING_STORAGE_KEY); raw = value; }),
    read: () => raw };
}

it("creates a versioned snapshot without active session data", () => {
  const state = createLearningState(courseRegistry);
  Object.assign(state, { apiKey: "KEY_DO_NOT_SAVE", transcript: "TRANSCRIPT_DO_NOT_SAVE" });
  Object.assign(state.courses["requirement-clarification"], { percentage: 100, hiddenScenario: "SCENARIO_DO_NOT_SAVE", summaryDraft: "DRAFT_DO_NOT_SAVE" });
  const snapshot = createSnapshot(state, "2026-10-18T12:00:00Z");
  expect(snapshot).toMatchObject({ schemaVersion: 1, contentVersion: "1", updatedAt: "2026-10-18T12:00:00Z" });
  expect(Object.keys(snapshot).sort()).toEqual(["contentVersion", "courses", "schemaVersion", "updatedAt"]);
  expect(JSON.stringify(snapshot)).not.toMatch(/DO_NOT_SAVE|percentage|activeAttempts/);
});

it("saves the complete snapshot in one write and restores it", () => {
  const storage = memoryStorage();
  const repository = createLocalStorageLearningRepository(storage);
  expect(repository.load()).toEqual({ status: "empty" });
  const snapshot = createSnapshot(createLearningState(courseRegistry));
  expect(repository.save(snapshot)).toEqual({ status: "saved" });
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  expect(repository.load()).toEqual({ status: "loaded", snapshot, state: snapshotToLearningState(snapshot) });
});

it("keeps corrupt or future raw data intact and blocks replacement", () => {
  for (const raw of ["{bad", JSON.stringify({ schemaVersion: 99 })]) {
    const storage = memoryStorage(raw);
    const repository = createLocalStorageLearningRepository(storage);
    expect(repository.load().status).toBe("error");
    expect(repository.save(createSnapshot(createLearningState(courseRegistry)))).toEqual({ status: "error", reason: "writeProtected" });
    expect(storage.read()).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  }
});

it("rejects unsupported versions, unknown IDs and false completion claims", () => {
  const snapshot = createSnapshot(createLearningState(courseRegistry));
  expect(validateSnapshot({ ...snapshot, schemaVersion: 2 })).toEqual({ valid: false, reason: "unsupportedVersion" });
  expect(validateSnapshot({ ...snapshot, contentVersion: "future" })).toEqual({ valid: false, reason: "contentMismatch" });
  const state = snapshot.courses["requirement-clarification"];
  for (const courses of [
    { "git-basics": state },
    { "requirement-clarification": { ...state, completedLessonIds: ["unknown"] } },
    { "requirement-clarification": { ...state, currentLessonId: "unknown" } },
    { "requirement-clarification": { ...state, latestAttemptMeta: { attemptId: "a", phase: "completed" } } },
  ]) expect(validateSnapshot({ ...snapshot, courses })).toEqual({ valid: false, reason: "invalidSnapshot" });
  expect(snapshotToLearningState(snapshot).activeAttempts).toEqual({});
});

it("restores all five states from one successful result and recalculates progress", () => {
  for (const level of ["Strong", "Partial", "Missing"] as const) {
    const original = successfulState(level);
    const storage = memoryStorage();
    const repository = createLocalStorageLearningRepository(storage);
    expect(repository.save(createSnapshot(original))).toEqual({ status: "saved" });
    const loaded = repository.load();
    expect(loaded.status).toBe("loaded");
    if (loaded.status !== "loaded") throw new Error("Expected a restored state");
    expect(loaded.state.courses).toEqual(original.courses);
    expect(loaded.state.activeAttempts).toEqual({});
    const course = loaded.state.courses[courseId];
    expect(course.currentLessonId).toBe("what-to-ask");
    expect(course.earnedActivityCompletion).toEqual({ ...identity, receivedAt: "2026-10-18T12:00:00Z" });
    expect(course.latestSuccessfulResult?.feedback).toEqual(fixtureAssessment(level));
    expect(course.latestSuccessfulResult?.summarySnapshot).toEqual(fixtureSummary);
    expect(course.latestSuccessfulResult?.recommendation?.kind).toBe(level === "Strong" ? "courseComplete" : level === "Partial" ? "retryActivity" : "reviewLesson");
    expect(getProgress(courseRegistry[courseId], course)).toMatchObject({ courseCompleted: true, moduleCompleted: true, percentage: 100 });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.read()).not.toContain("percentage");
  }
});

it("retains old success plus unfinished metadata without restoring transcript, drafts or pending requests", () => {
  let state = reduce(successfulState(), { type: "RETRY_ACTIVITY", attemptId: "attempt-two" });
  state = reduce(state, { type: "SUMMARY_CHANGED", attemptId: "attempt-two", summary: { ...fixtureSummary, targetUser: "UNFINISHED_DRAFT" } });
  state = reduce(state, { type: "SUMMARY_SUBMITTED", identity: { attemptId: "attempt-two", submissionId: "submission-two", requestId: "request-two" },
    snapshot: { submissionId: "submission-two", summary: state.activeAttempts[courseId].summaryDraft,
      transcript: [{ id: "unsaved-turn", role: "user", text: "UNFINISHED_TRANSCRIPT" }] } });
  const snapshot = createSnapshot(state);
  const restored = snapshotToLearningState(snapshot);
  expect(restored.courses).toEqual(state.courses);
  expect(restored.courses[courseId].latestAttemptMeta).toEqual({ attemptId: "attempt-two", phase: "feedbackPending" });
  expect(restored.courses[courseId].latestSuccessfulResult?.attemptId).toBe(identity.attemptId);
  expect(restored.activeAttempts).toEqual({});
  expect(JSON.stringify(snapshot)).not.toMatch(/UNFINISHED|pendingRequest|summaryDraft|submittedSnapshot|activeAttempts/);
});

it("rejects logically inconsistent result bundles and keeps their original raw value", () => {
  const mutations: ((course: CourseLearningState) => void)[] = [
    (course) => { course.earnedActivityCompletion = null; },
    (course) => { course.latestSuccessfulResult = null; },
    (course) => { course.latestAttemptMeta = null; },
    (course) => { course.earnedActivityCompletion!.requestId = "unrelated"; },
    (course) => { course.latestAttemptMeta!.attemptId = "unrelated"; },
    (course) => { course.latestAttemptMeta!.phase = "feedbackPending"; },
    (course) => { course.latestSuccessfulResult!.receivedAt = "not a date"; },
    (course) => { course.completedLessonIds = ["why-clarify", "why-clarify"]; },
    (course) => { course.latestSuccessfulResult!.recommendation = { kind: "reviewLesson", lessonId: "git-basics", reason: "Invalid target" }; },
    (course) => { course.latestSuccessfulResult!.recommendation = { kind: "reviewLesson", lessonId: "why-clarify", reason: "An older recommendation" }; },
    (course) => { course.latestSuccessfulResult!.recommendation = null; },
    (course) => { Reflect.deleteProperty(course.latestSuccessfulResult!.feedback.dimensions, "targetUser"); },
    (course) => { course.latestSuccessfulResult!.summarySnapshot = { ...fixtureSummary, targetUser: "Different submitted summary" }; },
    (course) => { Reflect.set(course.latestSuccessfulResult!, "scenarioVersion", "future"); },
  ];
  for (const mutate of mutations) {
    const snapshot = createSnapshot(successfulState());
    mutate(snapshot.courses[courseId]);
    const raw = JSON.stringify(snapshot);
    const storage = memoryStorage(raw);
    const repository = createLocalStorageLearningRepository(storage);
    expect(repository.load()).toEqual({ status: "error", reason: "invalidSnapshot" });
    expect(repository.save(createSnapshot(createLearningState(courseRegistry)))).toEqual({ status: "error", reason: "writeProtected" });
    expect(storage.read()).toBe(raw);
  }
});

it("reports read denial or quota failures explicitly while keeping existing storage", () => {
  const original = JSON.stringify(createSnapshot(successfulState()));
  for (const name of ["SecurityError", "QuotaExceededError"]) {
    const storage = memoryStorage(original);
    const repository = createLocalStorageLearningRepository({ getItem: storage.getItem,
      setItem: () => { throw new DOMException("Storage is unavailable", name); } });
    expect(repository.load().status).toBe("loaded");
    expect(repository.save(createSnapshot(createLearningState(courseRegistry)))).toEqual({ status: "error", reason: "storageUnavailable" });
    expect(storage.read()).toBe(original);
  }
  const storage = memoryStorage(original);
  const repository = createLocalStorageLearningRepository({
    getItem: () => { throw new DOMException("Storage is disabled", "SecurityError"); }, setItem: storage.setItem,
  });
  expect(repository.load()).toEqual({ status: "error", reason: "storageUnavailable" });
  expect(repository.save(createSnapshot(createLearningState(courseRegistry)))).toEqual({ status: "error", reason: "writeProtected" });
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(storage.read()).toBe(original);
});

it("defers access to the browser storage getter and handles a getter denial", () => {
  const getter = vi.fn(() => { throw new DOMException("Storage blocked", "SecurityError"); });
  const browserWindow = Object.defineProperty({}, "localStorage", { get: getter });
  vi.stubGlobal("window", browserWindow);
  try {
    const repository = createLocalStorageLearningRepository();
    expect(getter).not.toHaveBeenCalled();
    expect(repository.load()).toEqual({ status: "error", reason: "storageUnavailable" });
  } finally {
    vi.unstubAllGlobals();
  }
});

it("rejects wrong content, unknown IDs and non-allowlisted schema without replacing raw storage", () => {
  const snapshot = createSnapshot(successfulState());
  const course = snapshot.courses[courseId];
  for (const value of [
    { ...snapshot, contentVersion: "0" },
    { ...snapshot, courses: {} },
    { ...snapshot, courses: { ...snapshot.courses, "git-basics": course } },
    { ...snapshot, courses: { [courseId]: { ...course, currentLessonId: "unknown" } } },
    { ...snapshot, courses: { [courseId]: { ...course, completedLessonIds: ["unknown"] } } },
    { ...snapshot, percentage: 100 },
    { ...snapshot, courses: { [courseId]: { ...course, transcript: [] } } },
  ]) {
    const raw = JSON.stringify(value);
    const storage = memoryStorage(raw);
    const repository = createLocalStorageLearningRepository(storage);
    expect(repository.load().status).toBe("error");
    expect(repository.save(snapshot)).toEqual({ status: "error", reason: "writeProtected" });
    expect(storage.read()).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  }
});

it("projects nested successful-result fields through an explicit allowlist", () => {
  const state = successfulState();
  const result = state.courses[courseId].latestSuccessfulResult!;
  const privateFields = { DEEPSEEK_API_KEY: "PRIVATE_KEY_CANARY", scenarioRegistry: "PRIVATE_REGISTRY_CANARY",
    rubric: "PRIVATE_RUBRIC_CANARY", answerKey: "PRIVATE_F01_F10_CANARY", systemPrompt: "PRIVATE_PROMPT_CANARY",
    providerRawResponse: "PRIVATE_RESPONSE_CANARY" };
  for (const object of [result, result.summarySnapshot, result.feedback, result.feedback.questioning,
    result.feedback.questioning.evidence[0], result.recommendation!, state.courses[courseId].earnedActivityCompletion!,
    state.courses[courseId].latestAttemptMeta!]) Object.assign(object, { secret: "DO_NOT_SAVE", hiddenScenario: "DO_NOT_SAVE", ...privateFields });
  const snapshot = createSnapshot(state);
  expect(JSON.stringify(snapshot)).not.toMatch(/DO_NOT_SAVE|secret|hiddenScenario/);
  for (const [key, canary] of Object.entries(privateFields)) {
    expect(JSON.stringify(snapshot)).not.toContain(key);
    expect(JSON.stringify(snapshot)).not.toContain(canary);
  }
  expect(snapshotToLearningState(snapshot).courses[courseId].latestSuccessfulResult?.summarySnapshot).toEqual(fixtureSummary);
});

it("refuses an invalid bundle on save without touching the last successful snapshot", () => {
  const storage = memoryStorage();
  const repository = createLocalStorageLearningRepository(storage);
  const snapshot = createSnapshot(successfulState());
  expect(repository.save(snapshot)).toEqual({ status: "saved" });
  const original = storage.read();
  snapshot.courses[courseId].latestSuccessfulResult = null;
  expect(repository.save(snapshot)).toEqual({ status: "error", reason: "invalidSnapshot" });
  expect(storage.read()).toBe(original);
  expect(storage.setItem).toHaveBeenCalledTimes(1);
});

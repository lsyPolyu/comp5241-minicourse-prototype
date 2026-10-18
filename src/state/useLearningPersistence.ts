"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { courseRegistry } from "@/content/courses/registry";
import type { LearningState } from "@/domain/learning";
import { createLearningState, learningReducer, type LearningEvent } from "@/domain/learningReducer";
import type { LearningRepository } from "@/persistence/LearningRepository";
import { createLocalStorageLearningRepository } from "@/persistence/localStorageRepository";
import { createSnapshot } from "@/persistence/snapshot";

export type RestoreState = "restoring" | "ready" | "memory";
interface Session {
  state: LearningState;
  restore: RestoreState;
  restoreFailed: boolean;
}
type Event = { type: "RESTORED"; state: LearningState; failed: boolean }
  | { type: "SAVE_FAILED" }
  | { type: "LEARNING_EVENT"; event: LearningEvent };

function reduce(session: Session, event: Event): Session {
  if (event.type === "RESTORED") return { state: event.state, restore: event.failed ? "memory" : "ready", restoreFailed: event.failed };
  if (event.type === "SAVE_FAILED") return { ...session, restore: "memory" };
  if (session.restore === "restoring") return session;
  const state = learningReducer(session.state, event.event, courseRegistry);
  return state === session.state ? session : { ...session, state };
}

export function useLearningPersistence(repository?: LearningRepository) {
  const [repo] = useState(() => repository ?? createLocalStorageLearningRepository());
  const [session, send] = useReducer(reduce, undefined, (): Session => ({
    state: createLearningState(courseRegistry), restore: "restoring", restoreFailed: false,
  }));
  const lastSaved = useRef<LearningState["courses"] | null>(null);

  useEffect(() => {
    const loaded = repo.load();
    const state = loaded.status === "loaded" ? loaded.state : createLearningState(courseRegistry);
    lastSaved.current = state.courses;
    send({ type: "RESTORED", state, failed: loaded.status === "error" });
  }, [repo]);

  useEffect(() => {
    if (session.restore !== "ready" || session.state.courses === lastSaved.current) return;
    try {
      const saved = repo.save(createSnapshot(session.state));
      if (saved.status === "saved") lastSaved.current = session.state.courses;
      else send({ type: "SAVE_FAILED" });
    } catch {
      send({ type: "SAVE_FAILED" });
    }
  }, [repo, session.state.courses, session.state, session.restore]);

  const dispatch = useCallback((event: LearningEvent) => send({ type: "LEARNING_EVENT", event }), []);
  return { ...session, dispatch };
}

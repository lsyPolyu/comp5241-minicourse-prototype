"use client";

import { createContext, useContext, useMemo, type Dispatch, type ReactNode } from "react";
import type { LearningState } from "@/domain/learning";
import type { LearningEvent } from "@/domain/learningReducer";
import type { LearningRepository } from "@/persistence/LearningRepository";
import { RestoreStatus } from "@/features/progress/RestoreStatus";
import { useLearningPersistence } from "./useLearningPersistence";

const LearningContext = createContext<{ state: LearningState; dispatch: Dispatch<LearningEvent> } | null>(null);
export function LearningProvider({ children, repository }: { children: ReactNode; repository?: LearningRepository }) {
  const { state, dispatch, restore, restoreFailed } = useLearningPersistence(repository);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <LearningContext.Provider value={value}>
    <RestoreStatus status={restore} restoreFailed={restoreFailed} />
    {restore !== "restoring" && children}
  </LearningContext.Provider>;
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) throw new Error("Learning components require LearningProvider.");
  return context;
}

"use client";

import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { courseRegistry } from "@/content/courses/registry";
import type { LearningState } from "@/domain/learning";
import { createLearningState, learningReducer, type LearningEvent } from "@/domain/learningReducer";

const LearningContext = createContext<{ state: LearningState; dispatch: Dispatch<LearningEvent> } | null>(null);
const reducer = (state: LearningState, event: LearningEvent) => learningReducer(state, event, courseRegistry);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, courseRegistry, createLearningState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) throw new Error("Learning components require LearningProvider.");
  return context;
}

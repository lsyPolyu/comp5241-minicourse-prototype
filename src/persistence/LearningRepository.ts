import type { LearningState } from "@/domain/learning";
import type { LearningSnapshot } from "./snapshot";

export type LoadFailureReason = "invalidSnapshot" | "unsupportedVersion" | "contentMismatch" | "storageUnavailable";
export type LoadResult =
  | { status: "loaded"; snapshot: LearningSnapshot; state: LearningState }
  | { status: "empty" }
  | { status: "error"; reason: LoadFailureReason };
export type SaveResult =
  | { status: "saved" }
  | { status: "error"; reason: "invalidSnapshot" | "storageUnavailable" | "writeProtected" };

export interface LearningRepository {
  load(): LoadResult;
  save(snapshot: LearningSnapshot): SaveResult;
}

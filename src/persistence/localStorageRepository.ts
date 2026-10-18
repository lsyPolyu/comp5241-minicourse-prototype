import type { LearningRepository, LoadResult, SaveResult } from "./LearningRepository";
import { snapshotToLearningState, validateSnapshot, type LearningSnapshot } from "./snapshot";

export const LEARNING_STORAGE_KEY = "comp5241:learning:v1";
export interface LearningStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalStorageLearningRepository implements LearningRepository {
  private writeProtected = false;

  constructor(private readonly storage?: LearningStorage) {}

  private getStorage(): LearningStorage {
    // Resolve lazily: constructing the repository during SSR never reads a
    // browser API, including browsers whose storage getter itself throws.
    return this.storage ?? window.localStorage;
  }

  load(): LoadResult {
    let raw: string | null;
    try {
      raw = this.getStorage().getItem(LEARNING_STORAGE_KEY);
    } catch {
      this.writeProtected = true;
      return { status: "error", reason: "storageUnavailable" };
    }
    if (raw === null) return { status: "empty" };
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      this.writeProtected = true;
      return { status: "error", reason: "invalidSnapshot" };
    }
    const parsed = validateSnapshot(value);
    if (!parsed.valid) {
      this.writeProtected = true;
      return { status: "error", reason: parsed.reason };
    }
    return { status: "loaded", snapshot: parsed.snapshot, state: snapshotToLearningState(parsed.snapshot) };
  }

  save(snapshot: LearningSnapshot): SaveResult {
    if (this.writeProtected) return { status: "error", reason: "writeProtected" };
    const parsed = validateSnapshot(snapshot);
    if (!parsed.valid) return { status: "error", reason: "invalidSnapshot" };
    try {
      this.getStorage().setItem(LEARNING_STORAGE_KEY, JSON.stringify(parsed.snapshot));
      return { status: "saved" };
    } catch {
      return { status: "error", reason: "storageUnavailable" };
    }
  }
}

export function createLocalStorageLearningRepository(storage?: LearningStorage): LearningRepository {
  return new LocalStorageLearningRepository(storage);
}

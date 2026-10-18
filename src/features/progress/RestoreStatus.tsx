import type { RestoreState } from "@/state/useLearningPersistence";

export function RestoreStatus({ status, restoreFailed }: { status: RestoreState; restoreFailed: boolean }) {
  if (status === "restoring") return <main className="page-shell" id="main-content" aria-busy="true">
    <p role="status">Restoring progress…</p>
  </main>;
  if (status === "ready") return null;
  return <div className="page-shell restore-notice" role="status" aria-label="Progress storage status">
    {restoreFailed && <p>Saved progress could not be restored. Your existing browser data has been kept.</p>}
    <p>Progress cannot be saved in this browser. You can keep learning during this visit.</p>
  </div>;
}

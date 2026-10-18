"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ClientPanel } from "./ClientPanel";
import { useClient } from "./useClient";
import { useSubmission } from "./useSubmission";
import { SummaryForm } from "./SummaryForm";
import { StatusPanel } from "@/components/ui/StatusPanel";
import { FeedbackPanel } from "@/features/feedback/FeedbackPanel";
import { useAttempt } from "./useAttempt";

export function ActivityWorkspace({ courseId, scenarioId }: { courseId: string; scenarioId: string }) {
  const { attempt } = useAttempt(courseId);
  return <AttemptWorkspace key={attempt?.attemptId ?? "restored"} courseId={courseId} scenarioId={scenarioId} />;
}

function AttemptWorkspace({ courseId, scenarioId }: { courseId: string; scenarioId: string }) {
  const { restored, metadata, startNew } = useAttempt(courseId);
  const client = useClient(courseId, scenarioId);
  const submission = useSubmission(courseId, scenarioId);
  const heading = useRef<HTMLHeadingElement>(null);
  if (restored) return <>
    <section className="attempt-notice" aria-label="Restored activity">
      <p>{metadata?.phase === "completed" ? "Your latest successful activity has been restored." : "Your previous practice was not finished. Its conversation and draft were not saved. Start a new practice when you are ready."}</p>
      {submission.result && <p>Your latest successful summary, feedback and recommendation are kept below.</p>}
      <Button variant="secondary" onClick={startNew}>Start a new practice</Button>
    </section>
    {submission.result && <FeedbackPanel result={submission.result} courseId={courseId} previous={metadata?.phase !== "completed"} />}
  </>;
  return <>
    {submission.result && submission.result.attemptId !== submission.attemptId && <p className="attempt-notice" role="status">New practice in progress. Your previous successful result and earned completion are kept. This practice completes only after new valid feedback.</p>}
    <ol className="activity-stages" aria-label="Activity stages">
      <li aria-current={!client.session.summaryOpen ? "step" : undefined}>Client Interview</li>
      <li aria-current={client.session.summaryOpen && !submission.completed && !submission.pending ? "step" : undefined}>Structured Summary</li>
      <li aria-current={submission.pending ? "step" : undefined}>AI Feedback</li><li aria-current={submission.completed ? "step" : undefined}>Recommendation</li>
    </ol>
    <div className="activity-workspace">
      <ClientPanel client={client} />
      <section className="summary-next" aria-labelledby="summary-heading">
        <h2 id="summary-heading" ref={heading} tabIndex={-1}>Write your own requirement summary</h2>
        <p>Use what you learn from Maya to organize the requirements in your own words. You can move on whenever you are ready.</p>
        {client.session.summaryOpen ? <>
          <SummaryForm value={submission.summary} onChange={submission.changeSummary} onSubmit={() => void submission.submit()}
            disabled={submission.pending || submission.completed || submission.clientPending} pending={submission.pending} />
          {!submission.pending && !submission.completed && !submission.error && <Button variant="secondary" onClick={() => client.showSummary(false)}>Return to interview</Button>}
        </> : <Button onClick={() => { client.showSummary(true); heading.current?.focus(); }}>Continue to summary</Button>}
        <p role="status" aria-label="Feedback request status" className="supporting-text">{submission.pending ? "Getting feedback. Your submitted summary and conversation are kept here." : submission.completed ? "Activity complete. Feedback received." : "Activity incomplete. It completes after you submit your summary and receive feedback."}</p>
        {submission.error && <StatusPanel tone="error" title="Unable to get feedback" role="alert">
          <p>{submission.error}</p><p>Your eight fields and client conversation are kept here. Retry uses the original submitted summary. You can also edit your draft and submit it again.</p>
          <Button variant="secondary" onClick={() => void submission.retry()}>Retry feedback</Button>
        </StatusPanel>}
      </section>
    </div>
    {submission.completed && <Button variant="secondary" onClick={startNew}>Start a new practice</Button>}
    {submission.result && <FeedbackPanel result={submission.result} courseId={courseId} previous={submission.result.attemptId !== submission.attemptId} />}
  </>;
}

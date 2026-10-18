"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ClientPanel } from "./ClientPanel";
import { useClient } from "./useClient";

export function ActivityWorkspace({ courseId, scenarioId }: { courseId: string; scenarioId: string }) {
  const client = useClient(courseId, scenarioId);
  const heading = useRef<HTMLHeadingElement>(null);
  return <>
    <ol className="activity-stages" aria-label="Activity stages">
      <li aria-current={!client.session.summaryOpen ? "step" : undefined}>Client Interview</li>
      <li aria-current={client.session.summaryOpen ? "step" : undefined}>Structured Summary</li>
      <li>AI Feedback</li><li>Recommendation</li>
    </ol>
    <div className="activity-workspace">
      <ClientPanel client={client} />
      <section className="summary-next" aria-labelledby="summary-heading">
        <h2 id="summary-heading" ref={heading} tabIndex={-1}>Write your own requirement summary</h2>
        <p>Use what you learn from Maya to organize the requirements in your own words. You can move on whenever you are ready.</p>
        {client.session.summaryOpen ? <>
          <p role="status">The summary form is not available yet. Your interview is kept here so you can return to it.</p>
          <Button variant="secondary" onClick={() => client.showSummary(false)}>Return to interview</Button>
        </> : <Button onClick={() => { client.showSummary(true); heading.current?.focus(); }}>Continue to summary</Button>}
        <p className="supporting-text">Activity incomplete. It completes after you submit your summary and receive feedback.</p>
      </section>
    </div>
  </>;
}

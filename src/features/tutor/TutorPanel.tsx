"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { StatusPanel } from "@/components/ui/StatusPanel";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { useTutor } from "./useTutor";

const mediaQuery = "(min-width: 1024px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(mediaQuery);
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}
const getWideSnapshot = () => window.matchMedia?.(mediaQuery).matches ?? true;
const getServerSnapshot = () => false;

export function TutorPanel({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const tutor = useTutor(courseId, lessonId);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const wide = useSyncExternalStore(subscribe, getWideSnapshot, getServerSnapshot);
  const headingId = `tutor-${lessonId}-heading`;
  return <aside className="tutor-panel" aria-labelledby={headingId}>
    <h2 id={headingId}>Ask AI Tutor</h2>
    <p className="supporting-text">Optional help with this lesson.</p>
    <details open={wide || expanded} onToggle={(event) => { if (!wide) setExpanded(event.currentTarget.open); }}>
      <summary className="tutor-toggle">{expanded ? "Hide Tutor" : "Open Tutor"}</summary>
      <div className="tutor-content">
        {tutor.messages.length === 0
          ? <p className="tutor-guidance">Need a simpler explanation or an example? Ask about anything in this lesson.</p>
          : <MessageList messages={tutor.messages} />}
        <Composer id={`tutor-${lessonId}-question`} inputRef={questionInput} question={tutor.session.currentQuestion} pending={tutor.pending}
          onChange={tutor.setQuestion} onSubmit={() => { void tutor.send(); }} />
        <div role="status" aria-label="Tutor request status" className="supporting-text tutor-status">
          {tutor.pending ? "The Tutor is answering. Your question is still here." : ""}
        </div>
        {tutor.session.error && <StatusPanel tone="error" title="Unable to get an answer" role="alert">
          <p>{tutor.session.error.message}</p>
          {tutor.session.error.retryable
            ? <><p className="tutor-retry-note">Retry sends the same question and conversation. Any new draft stays here.</p>
              <Button variant="secondary" onClick={() => { void tutor.retry(); questionInput.current?.focus(); }}>Retry</Button></>
            : <p>Edit your question and send it again.</p>}
        </StatusPanel>}
      </div>
    </details>
  </aside>;
}

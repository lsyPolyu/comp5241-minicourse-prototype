"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { StatusPanel } from "@/components/ui/StatusPanel";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import type { useClient } from "./useClient";

export function ClientPanel({ client }: { client: ReturnType<typeof useClient> }) {
  const input = useRef<HTMLTextAreaElement>(null);
  const { session } = client;
  return <section className="client-panel" aria-labelledby="client-heading">
    <h2 id="client-heading">Ask the client</h2>
    <p className="supporting-text">Maya · University board-game club organizer</p>
    {session.messages.length > 0 && <MessageList messages={client.messages} assistantName="Maya" label="Client conversation" />}
    {session.messages.length === 0 && !session.error && <>
      <p>Meet Maya and help her clarify what the club website should do.</p>
      <Button variant="secondary" disabled={session.pending !== null} onClick={() => void client.start()}>Start interview</Button>
    </>}
    {session.messages.length > 0 && <Composer id="client-question" inputRef={input} question={session.question} pending={session.pending !== null}
      description="Ask Maya in English or Chinese. Follow up on anything unclear."
      placeholder="What would you like to clarify?" onChange={client.setQuestion} onSubmit={() => void client.send()} />}
    <p role="status" aria-label="Client request status" className="supporting-text client-status">{session.pending ? session.pending.request.mode === "opening" ? "Maya is getting ready. Your work is still here." : "Maya is answering. Your question is still here." : ""}</p>
    {session.error && <StatusPanel tone="error" title={session.messages.length ? "Unable to get Maya's answer" : "Unable to start the interview"} role="alert">
      <p>{session.error.message}</p>
      {session.error.retryable ? <><p>Retry sends the same request and conversation. Any new draft stays here.</p>
        <Button variant="secondary" disabled={session.pending !== null} onClick={() => { void client.retry(); input.current?.focus(); }}>Retry</Button></> : <p>Edit your question and send it again.</p>}
    </StatusPanel>}
  </section>;
}

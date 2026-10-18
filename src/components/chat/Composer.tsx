import type { RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { TUTOR_QUESTION_LIMIT } from "@/domain/tutor";

export function Composer({ id, question, pending, inputRef, onChange, onSubmit, description = "Ask about this lesson in English or Chinese.", placeholder = "Ask for an explanation or a simple example" }: {
  id: string; question: string; pending: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange(question: string): void; onSubmit(): void;
  description?: string; placeholder?: string;
}) {
  return <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); onSubmit(); inputRef.current?.focus(); }}>
    <Field as="textarea" id={id} ref={inputRef} label="Your question"
      description={description}
      placeholder={placeholder}
      value={question} onChange={(event) => onChange(event.target.value)} rows={4} maxLength={TUTOR_QUESTION_LIMIT} />
    <Button type="submit" variant="secondary" disabled={pending || !question.trim()}>Send question</Button>
  </form>;
}

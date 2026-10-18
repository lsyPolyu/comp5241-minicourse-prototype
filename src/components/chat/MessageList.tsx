import type { TutorTurn } from "@/domain/tutorSession";

export function MessageList({ messages }: { messages: readonly TutorTurn[] }) {
  return <div className="chat-message-log" role="log" aria-label="Tutor conversation" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
    <ol className="chat-message-list">
      {messages.map((message) => <li key={message.id}>
        <p className="chat-speaker">{message.role === "user" ? "You" : "Tutor"}</p>
        <p className="chat-message-text">{message.content}</p>
      </li>)}
    </ol>
  </div>;
}

export function MessageList({ messages, assistantName = "Tutor", label = "Tutor conversation" }: {
  messages: readonly { id: string; role: "user" | "assistant"; content: string }[];
  assistantName?: string; label?: string;
}) {
  return <div className="chat-message-log" role="log" aria-label={label} aria-live="polite" aria-relevant="additions text" tabIndex={0}>
    <ol className="chat-message-list">
      {messages.map((message) => <li key={message.id}>
        <p className="chat-speaker">{message.role === "user" ? "You" : assistantName}</p>
        <p className="chat-message-text">{message.content}</p>
      </li>)}
    </ol>
  </div>;
}

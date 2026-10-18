import { CheckCircle2, Circle } from "lucide-react";

export function CompletionStatus({ completed }: { completed: boolean }) {
  const Icon = completed ? CheckCircle2 : Circle;
  return <span className={`completion-status ${completed ? "completion-status--completed" : ""}`}>
    <Icon size={18} aria-hidden="true" />{completed ? "Completed" : "Incomplete"}
  </span>;
}

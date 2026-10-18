import type { ComponentPropsWithRef } from "react";
import { CircleAlert, Info } from "lucide-react";

export type StatusPanelProps = ComponentPropsWithRef<"div"> & {
  title: string;
  tone?: "neutral" | "error";
};

export function StatusPanel({ title, tone = "neutral", children, className = "", ...props }: StatusPanelProps) {
  const Icon = tone === "error" ? CircleAlert : Info;

  return (
    <div className={`ui-status ui-status--${tone} ${className}`} {...props}>
      <Icon size={20} aria-hidden="true" />
      <div>
        <p className="ui-status__title">{title}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}

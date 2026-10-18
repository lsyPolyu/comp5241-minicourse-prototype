import type { ComponentPropsWithRef } from "react";

export function Card({ className = "", ...props }: ComponentPropsWithRef<"div">) {
  return <div className={`ui-card ${className}`} {...props} />;
}

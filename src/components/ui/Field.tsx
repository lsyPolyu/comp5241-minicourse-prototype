import type { ComponentPropsWithRef } from "react";
import { CircleAlert } from "lucide-react";

type FieldLabels = {
  id: string;
  label: string;
  description?: string;
  error?: string;
};

export type FieldProps = FieldLabels & (
  | ({ as?: "input" } & ComponentPropsWithRef<"input">)
  | ({ as: "textarea" } & ComponentPropsWithRef<"textarea">)
);

export function Field({ id, label, description, error, as = "input", className = "", ...props }: FieldProps) {
  const describedBy = [props["aria-describedby"], description && `${id}-description`, error && `${id}-error`]
    .filter(Boolean).join(" ") || undefined;
  const shared = {
    id,
    className: `ui-field__control ${className}`,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : props["aria-invalid"],
  };

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      {description && <p className="ui-field__description" id={`${id}-description`}>{description}</p>}
      {as === "textarea"
        ? <textarea {...props as ComponentPropsWithRef<"textarea">} {...shared} />
        : <input {...props as ComponentPropsWithRef<"input">} {...shared} />}
      {error && (
        <p className="ui-field__error" id={`${id}-error`}>
          <CircleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

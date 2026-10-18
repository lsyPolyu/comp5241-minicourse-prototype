import type { SummaryFieldId } from "@/domain/learning";

export function SummaryField({ id, label, hint, value, disabled, onChange }: {
  id: SummaryFieldId; label: string; hint: string; value: string;
  disabled: boolean; onChange: (value: string) => void;
}) {
  return <div className="summary-field">
    <label htmlFor={`summary-${id}`}>{label}</label>
    <p id={`summary-${id}-hint`} className="supporting-text">{hint}</p>
    <textarea id={`summary-${id}`} name={id} rows={3} value={value}
      aria-describedby={`summary-${id}-hint`} disabled={disabled}
      onChange={(event) => onChange(event.target.value)} />
  </div>;
}

"use client";
import { Button } from "@/components/ui/Button";
import { summaryFields, type StructuredSummary } from "@/domain/summary";
import { SummaryField } from "./SummaryField";

export function SummaryForm({ value, onChange, onSubmit, disabled = false, pending = false }: {
  value: Readonly<StructuredSummary>; onChange: (value: StructuredSummary) => void;
  onSubmit: () => void; disabled?: boolean; pending?: boolean;
}) {
  return <form className="summary-form" aria-label="Requirement summary" onSubmit={(event) => { event.preventDefault(); if (!disabled) onSubmit(); }}>
    <p className="supporting-text">Write in your own words. Refer to your client conversation as you go. You may leave fields blank and get feedback on what is missing.</p>
    {summaryFields.map((field) => <SummaryField key={field.id} {...field} value={value[field.id]} disabled={disabled}
      onChange={(text) => onChange({ ...value, [field.id]: text })} />)}
    <Button type="submit" disabled={disabled}>{pending ? "Getting feedback…" : "Submit Summary for Feedback"}</Button>
  </form>;
}

// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SummaryForm } from "@/features/activity/SummaryForm";
import { emptySummary, summaryFields, summarySchema } from "@/domain/summary";
import { summaryFieldIds } from "@/domain/course";
afterEach(cleanup);

describe("student summary", () => {
  it("requires exactly eight keys, accepts blank and Chinese text without a word gate", () => {
    expect(Object.keys(summarySchema.parse(emptySummary))).toEqual([...summaryFieldIds]);
    expect(summarySchema.parse({ ...emptySummary, userGoal: "解决实际问题" }).userGoal).toBe("解决实际问题");
    const missing: Record<string, string> = { ...emptySummary };
    delete missing.targetUser;
    expect(summarySchema.safeParse(missing).success).toBe(false);
    expect(summarySchema.safeParse({ ...emptySummary, notes: "extra" }).success).toBe(false);
  });
  it("lets students type all eight fields and submit their exact work", () => {
    const submitted = vi.fn();
    function Form() {
      const [value, setValue] = useState({ ...emptySummary });
      return <SummaryForm value={value} onChange={setValue} onSubmit={() => submitted(value)} />;
    }
    render(<Form />);
    for (const field of summaryFields) {
      const input = screen.getByLabelText(field.label) as HTMLTextAreaElement;
      expect(input.required).toBe(false);
      expect(input.value).toBe("");
      fireEvent.change(input, { target: { value: `My ${field.id}\n${"x".repeat(1000)}` } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Submit Summary for Feedback" }));
    expect(submitted).toHaveBeenCalledWith(Object.fromEntries(summaryFieldIds.map((id) => [id, `My ${id}\n${"x".repeat(1000)}`])));
  });
  it("submits all empty fields and freezes editing while pending", () => {
    const submit = vi.fn();
    const { rerender } = render(<SummaryForm value={emptySummary} onChange={vi.fn()} onSubmit={submit} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit Summary for Feedback" }));
    expect(submit).toHaveBeenCalledOnce();
    rerender(<SummaryForm value={emptySummary} onChange={vi.fn()} onSubmit={submit} disabled pending />);
    expect((screen.getByRole("button", { name: "Getting feedback…" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByRole("textbox")).toHaveLength(8);
    screen.getAllByRole("textbox").forEach((input) => expect((input as HTMLTextAreaElement).disabled).toBe(true));
  });
});

"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { StatusPanel } from "@/components/ui/StatusPanel";

export default function Home() {
  const writingField = useRef<HTMLTextAreaElement>(null);
  const [hasExampleError, setHasExampleError] = useState(true);

  return (
    <div className="preview-shell">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <div className="preview-intro">
        <p className="preview-caption">Development preview</p>
        <h1>Mini-course</h1>
        <p>P01 · Foundation and static shell.</p>
        <p className="preview-description">A preview of the reading, writing, and navigation foundations for this learning workspace.</p>
      </div>

      <div className="preview-grid">
        <section aria-labelledby="controls-heading">
          <h2 id="controls-heading">Try the controls</h2>
          <p className="preview-section-description">Focus a field, type a note, or reset the examples.</p>
          <Card>
            <form
              className="preview-form"
              onSubmit={(event) => event.preventDefault()}
              onReset={() => setHasExampleError(true)}
            >
              <Field
                as="textarea"
                id="preview-writing"
                ref={writingField}
                label="Writing field"
                description="A short note for trying the field. Nothing is submitted or saved."
                placeholder="Type a short note here…"
                rows={4}
              />
              <Field
                id="preview-error"
                label="Error state example"
                description="Type anything to clear this example error."
                error={hasExampleError ? "Example error: this field is empty." : undefined}
                onChange={(event) => setHasExampleError(event.target.value.trim().length === 0)}
                placeholder="Try entering a sentence"
              />
              <Field
                id="preview-disabled"
                label="Disabled field example"
                defaultValue="This example is unavailable"
                disabled
              />
              <div className="preview-actions">
                <Button onClick={() => writingField.current?.focus()}>
                  Focus writing field <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <Button type="reset" variant="secondary">Reset examples</Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="preview-notes" aria-labelledby="notes-heading">
          <h2 id="notes-heading">Clear at every step</h2>
          <p className="preview-section-description">Readable text and controls that tell you what is happening.</p>
          <StatusPanel title="Interface preview only">
            <p>These examples are for checking the interface. They do not show learning progress or AI results.</p>
          </StatusPanel>
          <ul className="preview-checks">
            <li><strong>Visible labels</strong><span>Each writing field keeps its label and guidance nearby.</span></li>
            <li><strong>Keyboard focus</strong><span>Use Tab to move between links, buttons, and fields.</span></li>
            <li><strong>Readable states</strong><span>Errors include a message and symbol. Disabled controls stay clear.</span></li>
          </ul>
          <Button variant="secondary" disabled>Disabled button example</Button>
        </section>
      </div>
    </div>
  );
}

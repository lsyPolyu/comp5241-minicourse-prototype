import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatusPanel } from "@/components/ui/StatusPanel";

export const metadata: Metadata = { title: "Progress | Mini-course" };

export default function ProgressPage() {
  return (
    <div className="shell-message">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Progress" }]} />
      <p className="preview-caption">Development preview</p>
      <h1>Progress</h1>
      <p>A place to return to your learning.</p>
      <StatusPanel title="Static page preview">
        <p>This preview establishes the Progress destination. Learning records will appear here when the course is connected.</p>
      </StatusPanel>
      <p className="shell-return"><Link href="/">Return to Dashboard</Link></p>
    </div>
  );
}

import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatusPanel } from "@/components/ui/StatusPanel";

export default function Loading() {
  return (
    <div className="shell-message">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Loading" }]} />
      <h1>Getting your workspace ready</h1>
      <StatusPanel title="Loading page" role="status">
        <p>You can wait here or return to the dashboard.</p>
      </StatusPanel>
      <p className="shell-return"><Link href="/">Return to Dashboard</Link></p>
    </div>
  );
}

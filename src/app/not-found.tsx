import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Page not found | Mini-course" };

export default function NotFound() {
  return (
    <div className="shell-message">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Page not found" }]} />
      <p className="preview-caption">Page not found</p>
      <h1>We couldn’t find that page</h1>
      <p>Check the address, or return to the dashboard to find your way.</p>
      <Link className="ui-button ui-button--primary" href="/">
        <ArrowLeft size={18} aria-hidden="true" /> Return to Dashboard
      </Link>
    </div>
  );
}

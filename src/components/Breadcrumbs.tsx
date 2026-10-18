import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Breadcrumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Breadcrumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map(({ label, href }, index) => (
          <li key={`${label}-${index}`}>
            {index > 0 && <ChevronRight size={16} aria-hidden="true" />}
            {href && index < items.length - 1
              ? <Link href={href}>{label}</Link>
              : <span aria-current={index === items.length - 1 ? "page" : undefined}>{label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

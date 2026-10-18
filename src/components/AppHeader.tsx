"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

const destinations = [
  { href: "/", label: "Dashboard" },
  { href: "/progress", label: "Progress" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="Mini-course, COMP5241 dashboard">
          <BookOpen size={24} aria-hidden="true" />
          <span className="site-brand__name">Mini-course</span>
          <span className="site-brand__course">COMP5241</span>
        </Link>
        <nav aria-label="Main navigation">
          <ul className="site-nav">
            {destinations.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} aria-current={pathname === href ? "page" : undefined}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

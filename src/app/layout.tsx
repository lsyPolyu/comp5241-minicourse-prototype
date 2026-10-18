import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

// Original OFL-1.1 licenses accompany these unmodified Fontsource 5.3.0 files.
const outfit = localFont({
  src: "./fonts/outfit-latin-wght-normal.woff2",
  weight: "500 600",
  display: "swap",
  variable: "--font-outfit",
});

const geist = localFont({
  src: "./fonts/geist-latin-wght-normal.woff2",
  weight: "400 600",
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Mini-course | COMP5241",
  description: "A short, focused learning workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${geist.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <AppHeader />
        <main className="page-shell" id="main-content" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}

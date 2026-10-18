import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { courseRegistry } from "@/content/courses/registry";
import { ProgressView } from "@/features/progress/ProgressView";

export const metadata: Metadata = { title: "Progress | Mini-course" };

export default function ProgressPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Progress" }]} />
      <header className="learning-intro"><h1>Progress</h1><p>See what you have completed and choose your next step.</p></header>
      {Object.values(courseRegistry).map((content) => <ProgressView key={content.course.id} content={content} />)}
    </>
  );
}

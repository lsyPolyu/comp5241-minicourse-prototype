import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCourseBySlug } from "@/content/courses/registry";
import { ModuleOutline } from "@/features/courses/ModuleOutline";
import { ProgressSummary } from "@/features/progress/ProgressSummary";

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const content = getCourseBySlug(courseSlug);
  if (!content) notFound();
  return <>
    <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: content.course.title }]} />
    <header className="learning-intro">
      <p className="supporting-text">3 short lessons · 1 interactive AI Client activity</p>
      <h1>{content.course.title}</h1>
      <p>{content.course.description}</p>
      <p className="supporting-text">{content.course.estimatedExperience}</p>
    </header>
    <div className="course-progress"><ProgressSummary content={content} /></div>
    <ModuleOutline content={content} />
  </>;
}

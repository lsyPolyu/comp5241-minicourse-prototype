import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ActivityWorkspace } from "@/features/activity/ActivityWorkspace";
import { courseHref, getCourseBySlug } from "@/content/courses/registry";

export default async function ActivityPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const content = getCourseBySlug(courseSlug);
  if (!content) notFound();
  return <>
    <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: content.course.title, href: courseHref(content) }, { label: "Activity" }]} />
    <header className="learning-intro">
      <p className="supporting-text">Activity · {content.modules[0].title}</p>
      <h1>{content.activities[0].title}</h1>
      <p>Practise asking purposeful questions, then write your own structured requirement summary.</p>
    </header>
    <ActivityWorkspace courseId={content.course.id} scenarioId={content.activities[0].scenarioId} />
    <Link className="text-action" href={courseHref(content)}>Back to course</Link>
  </>;
}

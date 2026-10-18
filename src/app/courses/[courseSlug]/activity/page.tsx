import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatusPanel } from "@/components/ui/StatusPanel";
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
    <ol className="activity-stages" aria-label="Activity stages">
      <li>Client Interview</li><li>Structured Summary</li><li>AI Feedback</li><li>Recommendation</li>
    </ol>
    <StatusPanel title="Practice is not available yet">
      <p>The client interview and summary submission are still being prepared. You can read and complete the three lessons now.</p>
      <p>Activity incomplete. No feedback has been received.</p>
    </StatusPanel>
    <Link className="text-action" href={courseHref(content)}>Back to course</Link>
  </>;
}

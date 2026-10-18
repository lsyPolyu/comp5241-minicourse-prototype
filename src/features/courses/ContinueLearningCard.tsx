import type { PublishedCourse } from "@/domain/course";
import { ProgressSummary } from "@/features/progress/ProgressSummary";

export function ContinueLearningCard({ content }: { content: PublishedCourse }) {
  return <section className="continue-workspace" aria-labelledby="continue-course-heading">
    <div>
      <h2 id="continue-course-heading">{content.course.title}</h2>
      <p>{content.course.description}</p>
      <p className="supporting-text">3 short lessons · 1 interactive AI Client activity</p>
    </div>
    <div className="continue-workspace__progress"><ProgressSummary content={content} /></div>
  </section>;
}

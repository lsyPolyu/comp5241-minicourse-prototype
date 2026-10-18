import { Breadcrumbs } from "@/components/Breadcrumbs";
import { courseCards, courseRegistry } from "@/content/courses/registry";
import { CourseCard } from "@/features/courses/CourseCard";
import { ContinueLearningCard } from "@/features/courses/ContinueLearningCard";

export default function Home() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <header className="learning-intro">
        <h1>Continue your learning</h1>
        <p>Pick up where you left off, or explore what is next.</p>
      </header>
      {Object.values(courseRegistry).map((content) => <ContinueLearningCard key={content.course.id} content={content} />)}
      <section aria-labelledby="courses-heading" className="learning-section">
        <h2 id="courses-heading">Explore mini-courses</h2>
        <div className="course-list">
          {courseCards.map((card) => <CourseCard key={card.id} card={card} />)}
        </div>
      </section>
    </>
  );
}

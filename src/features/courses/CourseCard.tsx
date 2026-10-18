import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseCard as CourseCardData } from "@/domain/course";

export function CourseCard({ card }: { card: CourseCardData }) {
  return (
    <article className="course-entry">
      <div>
        <div className="course-entry__title">
          <span className={`availability ${card.availability === "available" ? "availability--available" : ""}`}>
            {card.availability === "available" ? "Available" : "Coming Soon"}
          </span>
          <h3>{card.title}</h3>
        </div>
        {card.availability === "available" && <>
          <p>{card.description}</p>
          <p className="supporting-text">3 short lessons · 1 interactive AI Client activity</p>
        </>}
      </div>
      {card.availability === "available" && (
        <Link className="text-action" href={`/courses/${card.slug}`}>
          View course <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

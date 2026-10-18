import type { Lesson } from "@/domain/course";

export function LessonReader({ lesson }: { lesson: Lesson }) {
  return (
    <article className="lesson-body" aria-label="Lesson content">
      {lesson.blocks.map((block, index) => (
        <section className={`lesson-block lesson-block--${block.kind}`} key={`${lesson.id}-${index}`}>
          <h2>{block.heading}</h2>
          <p>{block.text}</p>
        </section>
      ))}
    </article>
  );
}

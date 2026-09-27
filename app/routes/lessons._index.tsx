import { Link } from "react-router";
import type { Route } from "./+types/lessons._index";
import { getSections } from "~/lib/lesson-sections.server";
import { BookOpen, ChevronRight, Clock } from "lucide-react";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Course Sections · Cadence" },
    {
      name: "description",
      content: "The AI Coding Crash Course, section by section.",
    },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  const sections = getSections();

  return {
    sections: sections.map((section) => ({
      id: section.id,
      number: section.number,
      title: section.title,
      chapters: section.chapters,
    })),
  };
}

export default function LessonsIndexRoute({
  loaderData,
}: Route.ComponentProps) {
  const { sections } = loaderData;
  const chapterCount = sections.reduce(
    (total, s) => total + s.chapters.length,
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Coding Crash Course
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Six sections covering the practices for shipping real code with AI.
          Read them in order — each builds on the last.
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4" />
            {sections.length} sections
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {chapterCount} chapters
          </span>
        </div>
      </header>

      <ol className="space-y-3">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              to={`/lessons/${section.id}`}
              className="group flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                {section.number}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium">{section.title}</span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">
                  {section.chapters.map((chapter) => chapter.title).join(" · ")}
                </span>
              </span>

              <span className="mt-1 flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {section.chapters.length} ch
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

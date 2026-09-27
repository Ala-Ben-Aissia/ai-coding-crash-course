import { useCallback, useEffect, useRef, useState } from "react";
import { Link, data } from "react-router";
import type { Route } from "./+types/lessons.$sectionId";
import {
  getSection,
  getSectionNeighbours,
  getSections,
} from "~/lib/lesson-sections.server";
import { parseParams } from "~/lib/validation";
import { cn } from "~/lib/utils";
import { z } from "zod";
import { ArrowLeft, ArrowRight, BookOpen, Check, List, X } from "lucide-react";

const sectionParamsSchema = z.object({
  sectionId: z.string().min(1),
});

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Section not found · Cadence" }];
  return [
    {
      title: `${loaderData.section.number} ${loaderData.section.title} · Cadence`,
    },
    {
      name: "description",
      content: loaderData.section.chapters[0]?.title ?? "",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { sectionId } = parseParams(params, sectionParamsSchema);
  const section = getSection(sectionId);

  if (!section) {
    throw data("Section not found", { status: 404 });
  }

  const { previous, next } = getSectionNeighbours(sectionId);
  const total = getSections().length;

  return {
    section: {
      id: section.id,
      number: section.number,
      title: section.title,
      html: section.html,
      css: section.css,
      chapters: section.chapters,
    },
    previous,
    next,
    position: { index: section.order + 1, total },
  };
}

export default function LessonSectionRoute({
  loaderData,
}: Route.ComponentProps) {
  const { section, previous, next, position } = loaderData;
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(section.chapters[0]?.id ?? "");
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [tocOpen, setTocOpen] = useState(false);

  // Scroll-spy: highlight the chapter nearest the top of the viewport.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const headings = section.chapters
      .map((chapter) =>
        root.querySelector<HTMLElement>(`#${CSS.escape(chapter.id)}`)
      )
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    // Observe against the app's scroll container rather than the viewport, so
    // the active band tracks what the reader can actually see.
    const scrollRoot = root.closest<HTMLElement>(".overflow-y-auto");

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root: scrollRoot, rootMargin: "-10% 0px -75% 0px", threshold: 0 }
    );

    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
  }, [section.chapters]);

  // Mark chapters as read once they have actually been on screen.
  useEffect(() => {
    if (!activeId) return;
    setReadIds((previousIds) =>
      previousIds.has(activeId)
        ? previousIds
        : new Set(previousIds).add(activeId)
    );
  }, [activeId]);

  /**
   * Scrolls a chapter into view inside the app's scroll container.
   *
   * A plain `href="#id"` cannot be used for this: the app scrolls a nested
   * element rather than the window, so native fragment navigation moves the
   * document (which does not scroll) and nothing appears to happen. Anchors are
   * kept for accessibility and middle-click, but the default is prevented.
   */
  const scrollToChapter = useCallback((id: string) => {
    const target = contentRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`
    );
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setTocOpen(false);
    return true;
  }, []);

  // Intercept in-page anchors inside the authored content.
  const handleContentClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[href]"
      );
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;

      if (scrollToChapter(href.slice(1))) {
        event.preventDefault();
      }
    },
    [scrollToChapter]
  );

  const handleChapterSelect = useCallback(
    (id: string) => scrollToChapter(id),
    [scrollToChapter]
  );

  return (
    <div className="min-h-full">
      {/* Keep headings clear of the viewport edge when jumping to them. */}
      <style>
        {`${section.chapters
          .map((chapter) => `.lesson-reader #${chapter.id}`)
          .join(",")} { scroll-margin-top: 1.5rem; }`}
      </style>
      <style>{section.css}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/lessons"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All sections
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">
            {section.number} {section.title}
          </span>
        </nav>

        {/* Section header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Section {section.number}
            </span>
            <span className="text-xs text-muted-foreground">
              {position.index} of {position.total} · {section.chapters.length}{" "}
              chapters
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {section.title}
          </h1>
          <div
            className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={position.total}
            aria-valuenow={position.index}
            aria-label={`Section ${position.index} of ${position.total}`}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${(position.index / position.total) * 100}%`,
              }}
            />
          </div>
        </header>

        <div className="flex gap-8">
          {/* Table of contents — sticky rail on large screens */}
          <aside className="hidden w-60 shrink-0 xl:block">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pb-2">
              <TableOfContents
                chapters={section.chapters}
                activeId={activeId}
                readIds={readIds}
                onSelect={handleChapterSelect}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Mobile TOC toggle */}
            <button
              type="button"
              onClick={() => setTocOpen((open) => !open)}
              className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent xl:hidden"
              aria-expanded={tocOpen}
            >
              {tocOpen ? <X className="size-4" /> : <List className="size-4" />}
              Chapters
            </button>

            {tocOpen && (
              <div className="mb-6 max-h-96 overflow-y-auto rounded-lg border border-border p-4 xl:hidden">
                <TableOfContents
                  chapters={section.chapters}
                  activeId={activeId}
                  readIds={readIds}
                  onSelect={handleChapterSelect}
                />
              </div>
            )}

            {/* Authored content */}
            <div
              ref={contentRef}
              onClick={handleContentClick}
              className={cn(
                "lesson-reader overflow-hidden rounded-xl border border-border shadow-sm"
              )}
              dangerouslySetInnerHTML={{ __html: section.html }}
            />

            {/* Previous / next */}
            <nav className="mt-8 grid gap-3 sm:grid-cols-2">
              {previous ? (
                <Link
                  to={`/lessons/${previous.id}`}
                  className="group rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowLeft className="size-3.5" />
                    Previous
                  </span>
                  <span className="mt-1.5 block text-sm font-medium">
                    {previous.number} {previous.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next && (
                <Link
                  to={`/lessons/${next.id}`}
                  className="group rounded-lg border border-border p-4 text-right transition-colors hover:bg-accent sm:col-start-2"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                    Next
                    <ArrowRight className="size-3.5" />
                  </span>
                  <span className="mt-1.5 block text-sm font-medium">
                    {next.number} {next.title}
                  </span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableOfContents({
  chapters,
  activeId,
  readIds,
  onSelect,
}: {
  chapters: { id: string; title: string }[];
  activeId: string;
  readIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  if (chapters.length === 0) return null;

  return (
    <nav aria-label="Chapters">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Chapters
      </h2>
      <ol className="space-y-0.5 border-l border-border">
        {chapters.map((chapter) => {
          const isActive = chapter.id === activeId;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={isActive ? "location" : undefined}
                // Keep the href for accessibility and middle-click, but drive
                // the scroll ourselves: the app scrolls a nested element, so the
                // browser's native fragment handling would not move the content.
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  onSelect(chapter.id);
                }}
                className={cn(
                  "-ml-px flex items-start gap-2 border-l-2 py-1.5 pl-3 text-sm transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {readIds.has(chapter.id) ? (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <span className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1">{chapter.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message =
    error instanceof Error ? error.message : "This section could not be found.";

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <BookOpen className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Section unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link
          to="/lessons"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Back to all sections
        </Link>
      </div>
    </div>
  );
}

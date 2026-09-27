/**
 * Loads the authored course section documents and prepares them for rendering
 * inside the app shell.
 *
 * The source files are complete standalone HTML documents. We only take the
 * `<main>` content out of them and rewrite their stylesheet so every selector is
 * scoped to the reader surface. Without that, bare selectors such as `body`,
 * `a:hover` and the `*` reset would leak into the surrounding app and wreck it.
 */

const rawSections = import.meta.glob("../content/sections/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Class selector applied to the reader surface; all lesson CSS is scoped
 * beneath it. Includes the leading dot because it is used directly in selectors.
 */
export const SCOPE = ".lesson-reader";

/**
 * Scope for the authored (dark) stylesheet. Gating it behind `.dark` lets the
 * reader follow the app's light/dark toggle, which adds or removes the `dark`
 * class on `<html>`. The light theme below is the base; these rules win in dark
 * mode through higher specificity.
 */
const DARK_SCOPE = ".dark .lesson-reader";

/**
 * Light theme for the reader surface.
 *
 * The authored documents only ship a dark palette, so every value here is a
 * light-mode counterpart: the palette variables plus overrides for each rule
 * that hardcodes a dark-only color (link hover, inline code, code blocks,
 * callouts, quiz states, …). Anything already expressed through `var(--…)`
 * picks up the palette below automatically and needs no override.
 */
const LIGHT_THEME_CSS = `
${SCOPE} {
  --bg: #ffffff;
  --surface: #f5f7fb;
  --surface2: #eaeef7;
  --border: #dfe5f0;
  --accent: #3b5bdb;
  --accent2: #7048e8;
  --text: #1e293b;
  --muted: #64748b;
  --code-bg: #f4f6fb;
  --code-border: #dfe5f0;
  --green: #0ca678;
  --yellow: #a16207;
  --red: #e03131;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.7;
  font-size: 16px;
}
${SCOPE} a { border-bottom-color: rgba(59, 91, 219, 0.35); }
${SCOPE} a:hover { border-color: var(--accent); color: #2b4acb; }
${SCOPE} code { background: rgba(59, 91, 219, 0.1); color: #3b5bdb; }
${SCOPE} pre code { color: var(--text); }
${SCOPE} td code { color: #3b5bdb; }
${SCOPE} tr:nth-child(even) { background: rgba(15, 23, 42, 0.03); }
${SCOPE} .commit-id { background: rgba(59, 91, 219, 0.12); }
${SCOPE} nav.sidebar li a.active { background: rgba(59, 91, 219, 0.12); }
${SCOPE} .prompt-block { color: var(--text); }
${SCOPE} .topbar { background: rgba(255, 255, 255, 0.9); }
${SCOPE} .lesson-img { box-shadow: 0 4px 24px rgba(15, 23, 42, 0.12); }
${SCOPE} .callout { background: rgba(161, 98, 7, 0.08); }
${SCOPE} .callout-info { background: rgba(59, 91, 219, 0.07); }
${SCOPE} blockquote { background: rgba(112, 72, 232, 0.07); }
${SCOPE} .quiz-choices li.correct { background: rgba(12, 166, 120, 0.1); border-color: rgba(12, 166, 120, 0.35); }
${SCOPE} .quiz-answer { background: rgba(15, 23, 42, 0.05); }
@media (max-width: 768px) {
  ${SCOPE} h1.chapter-title { font-size: 1.5rem; }
}
`;

export interface SectionChapter {
  id: string;
  title: string;
}

export interface LessonSection {
  /** Filename stem, e.g. `01-before-start`. Doubles as the route id. */
  id: string;
  /** Zero-based position in the course. */
  order: number;
  /** Numeric prefix, e.g. `01`. */
  number: string;
  title: string;
  chapters: SectionChapter[];
  /** Scoped CSS, safe to inject into the page. */
  css: string;
  /** Inner HTML of `<main>`. Author-controlled, trusted content. */
  html: string;
}

export interface ParsedSection {
  title: string;
  chapters: SectionChapter[];
  css: string;
  html: string;
}

const SECTION_TITLES: Record<string, string> = {
  "01-before-start": "Before Start",
  "02-concepts": "Concepts",
  "03-getting-to-know-claude-code": "Getting to Know Claude Code",
  "04-fundamentals": "Fundamentals",
  "05-steering": "Steering",
  "06-shipping": "Shipping",
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/* ── CSS scoping ────────────────────────────────────────────────────────── */

/** Removes comments while leaving string literals untouched. */
function stripComments(css: string): string {
  let out = "";
  let i = 0;

  while (i < css.length) {
    const char = css[i];

    if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < css.length) {
        if (css[j] === "\\") {
          j += 2;
          continue;
        }
        if (css[j] === char) break;
        j++;
      }
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    out += char;
    i++;
  }

  return out;
}

/** Splits a selector list on commas that are not inside brackets or parens. */
function splitSelectorList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of list) {
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;

    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Rewrites a single selector so it can only match inside the reader surface.
 * Document-level selectors collapse onto the surface element itself, which is
 * what carries the lesson palette (`--bg`, `--text`, …) and typography.
 */
function scopeSelector(selector: string, scope: string): string {
  if (selector === "html" || selector === "body" || selector === ":root") {
    return scope;
  }

  if (selector === "*") return `${scope} *`;
  if (selector === "*::before") return `${scope} *::before`;
  if (selector === "*::after") return `${scope} *::after`;

  return `${scope} ${selector}`;
}

/** At-rules whose body contains further style rules that also need scoping. */
const NESTED_AT_RULES = /^@(media|supports|layer|container|scope)\b/;

function scopeCss(css: string, scope: string): string {
  const src = stripComments(css);
  let out = "";
  let prelude = "";
  let i = 0;

  while (i < src.length) {
    const char = src[i];

    if (char === "{") {
      const head = prelude.trim();
      prelude = "";

      // Consume the matching close brace to get this block's body.
      let depth = 1;
      let j = i + 1;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        j++;
      }
      const body = src.slice(i + 1, j - 1);
      i = j;

      if (head.startsWith("@")) {
        out += NESTED_AT_RULES.test(head)
          ? `${head} {${scopeCss(body, scope)}}`
          : `${head} {${body}}`;
      } else {
        const selectors = splitSelectorList(head)
          .map((selector) => scopeSelector(selector, scope))
          .join(", ");
        if (selectors) out += `${selectors} {${body}}`;
      }

      continue;
    }

    prelude += char;
    i++;
  }

  return out.trim();
}

/**
 * Theme-independent reader layout.
 *
 * The authored documents style a `<main>` wrapper that we do not render — only
 * its inner chapters reach the page — so its padding and measure never apply.
 * This block restores them on the reader surface itself, in both themes. It is
 * emitted after the dark stylesheet so the `:last-child` trim below wins the
 * specificity tie against the authored `.chapter` rule in dark mode.
 */
const READER_LAYOUT_CSS = `
${SCOPE} {
  scroll-behavior: auto;
  padding: 3rem clamp(1.25rem, 1rem + 3vw, 3rem) 5rem;
}
${SCOPE} .chapter {
  max-width: 46rem;
  margin-left: auto;
  margin-right: auto;
}
${SCOPE} .chapter:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}
${SCOPE} .lesson-img {
  height: auto;
}
${SCOPE} pre {
  max-width: 100%;
}
`;

/* ── HTML parsing ───────────────────────────────────────────────────────── */

function extractChapters(main: string): SectionChapter[] {
  const chapters: SectionChapter[] = [];

  for (const match of main.matchAll(
    /<section class="chapter" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g
  )) {
    const [, id, body] = match;
    const title = body.match(/<h1 class="chapter-title">([\s\S]*?)<\/h1>/)?.[1];
    if (!title) continue;
    chapters.push({
      id,
      title: decodeEntities(title.replace(/<[^>]+>/g, "").trim()),
    });
  }

  return chapters;
}

/** Parses one authored section document into render-ready pieces. */
export function parseSectionDocument(document: string): ParsedSection {
  const styles = [...document.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    (match) => match[1]
  );

  const main =
    document.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ??
    document.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ??
    "";

  const chapters = extractChapters(main);
  const title = document.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";

  // The source documents scroll the window; we scroll a nested container.
  // The authored stylesheet is the dark theme and only applies under `.dark`;
  // the light theme above is the base.
  const css = `${LIGHT_THEME_CSS}\n${scopeCss(styles.join("\n"), DARK_SCOPE)}\n${READER_LAYOUT_CSS}`;

  return {
    title: decodeEntities(title),
    chapters,
    css,
    html: main.trim(),
  };
}

/* ── Section registry ───────────────────────────────────────────────────── */

let cache: LessonSection[] | null = null;

function buildSections(): LessonSection[] {
  const ids = Object.keys(rawSections)
    .map((path) =>
      path
        .split("/")
        .pop()!
        .replace(/\.html$/, "")
    )
    .sort();

  return ids.map((id, order) => {
    const parsed = parseSectionDocument(
      rawSections[`../content/sections/${id}.html`]
    );
    const number = id.slice(0, 2);

    return {
      id,
      order,
      number,
      title: (SECTION_TITLES[id] ?? parsed.title.replace(/^\d+\s*/, "")) || id,
      chapters: parsed.chapters,
      css: parsed.css,
      html: parsed.html,
    };
  });
}

/** All sections in course order. Parsed once, then memoised. */
export function getSections(): LessonSection[] {
  cache ??= buildSections();
  return cache;
}

export function getSection(id: string): LessonSection | undefined {
  return getSections().find((section) => section.id === id);
}

export function getSectionNeighbours(id: string): {
  previous: Pick<LessonSection, "id" | "number" | "title"> | null;
  next: Pick<LessonSection, "id" | "number" | "title"> | null;
} {
  const sections = getSections();
  const index = sections.findIndex((section) => section.id === id);
  const toRef = (section: LessonSection | undefined) =>
    section
      ? { id: section.id, number: section.number, title: section.title }
      : null;

  return {
    previous: toRef(index > 0 ? sections[index - 1] : undefined),
    next: toRef(index >= 0 ? sections[index + 1] : undefined),
  };
}

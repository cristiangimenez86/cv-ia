import type { SectionContent } from "@/lib/content/types";
import { SectionHeading } from "@/components/sectionIcons";

type AboutSectionProps = {
  section: SectionContent;
};

type Kpi = {
  value: string;
  caption: string;
};

/** Tokens we trim from caption boundaries (Spanish + English). */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "que", "un", "una", "en",
  "of", "the", "and", "to", "for", "a", "an", "in", "on", "at",
]);

/** Matches a token that is itself a numeric value (e.g. "+25%", "-30", "14"). */
const NUMERIC_TOKEN_RE = /^[+\-]?\d+(?:[.,]\d+)?\s?%?$/;

/** Characters that close a clause; used to keep captions inside the value's own clause. */
const CLAUSE_BOUNDARIES = [",", ";", ".", ":", "\n"];

/** Strips inline code (`...`) and fenced code blocks before parsing KPIs. */
function stripCode(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
}

/** Removes punctuation, drops empties and pure numeric/percentage tokens. */
function sanitizeTokens(raw: string[]): string[] {
  return raw
    .map((t) => t.replace(/[(),.;:!?¡¿"'`*]/g, "").trim())
    .filter(Boolean)
    .filter((t) => !NUMERIC_TOKEN_RE.test(t));
}

/** Trims stopwords at both edges of an already-sanitized token list. */
function trimStopwordEdges(tokens: string[]): string[] {
  const out = tokens.slice();
  while (out.length > 0 && STOPWORDS.has(out[0].toLowerCase())) out.shift();
  while (out.length > 0 && STOPWORDS.has(out[out.length - 1].toLowerCase())) out.pop();
  return out;
}

/** Index of the latest clause boundary in `text`, or -1 if none. */
function lastClauseBoundary(text: string): number {
  let max = -1;
  for (const ch of CLAUSE_BOUNDARIES) {
    const i = text.lastIndexOf(ch);
    if (i > max) max = i;
  }
  return max;
}

/** Index of the earliest clause boundary in `text`, or -1 if none. */
function firstClauseBoundary(text: string): number {
  let min = -1;
  for (const ch of CLAUSE_BOUNDARIES) {
    const i = text.indexOf(ch);
    if (i >= 0 && (min < 0 || i < min)) min = i;
  }
  return min;
}

/**
 * Words immediately before `idx`, scoped to the value's own clause so a
 * caption can never pull text from a neighboring KPI (e.g. "+25% reduced
 * maintenance" leaking into the caption of "-30%").
 */
function wordsBefore(body: string, idx: number, maxWords: number): string {
  const before = body.slice(0, idx);
  const cut = lastClauseBoundary(before);
  const segment = cut >= 0 ? before.slice(cut + 1) : before;
  const tokens = trimStopwordEdges(sanitizeTokens(segment.split(/\s+/)));
  return tokens.slice(-maxWords).join(" ");
}

/** Words immediately after `idx`, scoped to the value's own clause. */
function wordsAfter(body: string, idx: number, maxWords: number): string {
  const after = body.slice(idx);
  const cut = firstClauseBoundary(after);
  const segment = cut >= 0 ? after.slice(0, cut) : after;
  const tokens = trimStopwordEdges(sanitizeTokens(segment.split(/\s+/)));
  return tokens.slice(0, maxWords).join(" ");
}

/**
 * Extracts up to 4 numeric highlights from the About body in source order.
 * Detects two patterns:
 *  - Percentages:   `+25%`, `-30%`, `20%`, `+ 25 %`
 *  - Years tenure:  `14+ años`, `14 years`, `5+ year`
 * Captions are derived from surrounding words (left for %, right for years),
 * trimmed of stopwords. Returns [] when fewer than 2 KPIs are found.
 */
export function extractAboutKpis(body: string): Kpi[] {
  const text = stripCode(body);
  const kpis: Kpi[] = [];
  const seen = new Set<string>();

  /* Percentages — caption from words before, since the value usually closes a clause
     like "improved system efficiency (+25%)". */
  const pctRegex = /([+\-]?\s?\d+(?:[.,]\d+)?\s?%)/g;
  let match: RegExpExecArray | null;
  while ((match = pctRegex.exec(text)) !== null) {
    const raw = match[1].replace(/\s+/g, "");
    if (seen.has(raw)) continue;
    const caption = wordsBefore(text, match.index, 3) || wordsAfter(text, match.index + match[0].length, 3);
    kpis.push({ value: raw, caption });
    seen.add(raw);
  }

  /* Years of experience — caption from words after, e.g. "14+ years of experience". */
  const yearsRegex = /(\d+\+?)\s+(años|years|year)\b/giu;
  while ((match = yearsRegex.exec(text)) !== null) {
    const valueRaw = `${match[1]}${match[1].endsWith("+") ? "" : ""} ${match[2]}`;
    if (seen.has(valueRaw)) continue;
    const after = wordsAfter(text, match.index + match[0].length, 3);
    const caption = after || wordsBefore(text, match.index, 3);
    kpis.push({ value: valueRaw, caption });
    seen.add(valueRaw);
  }

  return kpis.slice(0, 4);
}

/** Splits the body into paragraphs on blank lines, preserving order. */
function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+\n/g, " ").replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/**
 * Renders the About section as a recruiter-scannable hero:
 * - Optional KPI strip (when ≥ 2 numeric highlights are detected).
 * - Lead paragraph in larger type.
 * - Subsequent paragraphs in muted body type.
 */
export function AboutSection({ section }: AboutSectionProps) {
  const body = section.body ?? "";
  const paragraphs = splitParagraphs(body);
  /* Author-curated KPIs from frontmatter take precedence; the heuristic
     extractor is only a fallback for legacy content without metadata. */
  const kpis = section.kpis && section.kpis.length > 0
    ? section.kpis
    : extractAboutKpis(body);
  const showKpis = kpis.length >= 2;

  const [lead, ...rest] = paragraphs;

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      {showKpis && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {kpis.map((kpi, i) => (
            <div
              key={`${kpi.value}-${i}`}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <dt className="text-lg font-semibold text-foreground leading-tight">
                {kpi.value}
              </dt>
              {kpi.caption && (
                <dd className="text-xs text-muted mt-0.5 leading-snug">
                  {kpi.caption}
                </dd>
              )}
            </div>
          ))}
        </dl>
      )}
      {lead ? (
        <p className="text-[17px] leading-relaxed text-foreground">{lead}</p>
      ) : (
        <p className="text-muted text-sm">—</p>
      )}
      {rest.map((p, i) => (
        <p
          key={i}
          className="text-base leading-relaxed text-muted mt-3"
        >
          {p}
        </p>
      ))}
    </section>
  );
}

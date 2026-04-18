/**
 * About-section helpers: paragraph splitting + heuristic KPI extraction.
 *
 * KPI extraction is a fallback for legacy content that does not declare
 * `kpis:` in the section frontmatter. New content should use the explicit
 * frontmatter list so we can keep this heuristic small.
 */

export type AboutKpi = { value: string; caption: string };

/** Tokens we trim from caption boundaries (Spanish + English connectors). */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "que", "un", "una", "en",
  "of", "the", "and", "to", "for", "a", "an", "in", "on", "at",
]);

/** Token that is itself a numeric value (e.g. "+25%", "-30", "14"). */
const NUMERIC_TOKEN = /^[+\-]?\d+(?:[.,]\d+)?\s?%?$/;

/** Characters that close a clause; used to scope captions to one clause. */
const CLAUSE_BOUNDARIES = [",", ";", ".", ":", "\n"];

const PERCENT_RE = /([+\-]?\s?\d+(?:[.,]\d+)?\s?%)/g;
const YEARS_RE = /(\d+\+?)\s+(años|years|year)\b/giu;

function stripCode(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
}

function sanitizeTokens(raw: string[]): string[] {
  return raw
    .map((t) => t.replace(/[(),.;:!?¡¿"'`*]/g, "").trim())
    .filter(Boolean)
    .filter((t) => !NUMERIC_TOKEN.test(t));
}

function trimStopwords(tokens: string[]): string[] {
  const out = tokens.slice();
  while (out.length && STOPWORDS.has(out[0].toLowerCase())) out.shift();
  while (out.length && STOPWORDS.has(out[out.length - 1].toLowerCase())) out.pop();
  return out;
}

function lastClauseBoundary(text: string): number {
  return CLAUSE_BOUNDARIES.reduce((max, ch) => Math.max(max, text.lastIndexOf(ch)), -1);
}

function firstClauseBoundary(text: string): number {
  let min = -1;
  for (const ch of CLAUSE_BOUNDARIES) {
    const i = text.indexOf(ch);
    if (i >= 0 && (min < 0 || i < min)) min = i;
  }
  return min;
}

function wordsBefore(body: string, idx: number, max: number): string {
  const before = body.slice(0, idx);
  const cut = lastClauseBoundary(before);
  const segment = cut >= 0 ? before.slice(cut + 1) : before;
  return trimStopwords(sanitizeTokens(segment.split(/\s+/))).slice(-max).join(" ");
}

function wordsAfter(body: string, idx: number, max: number): string {
  const after = body.slice(idx);
  const cut = firstClauseBoundary(after);
  const segment = cut >= 0 ? after.slice(0, cut) : after;
  return trimStopwords(sanitizeTokens(segment.split(/\s+/))).slice(0, max).join(" ");
}

/**
 * Extracts up to 4 numeric highlights (percentages + years of tenure) from the
 * About body in source order. Returns an empty array when fewer than 2 KPIs
 * are detected so the caller can hide the strip.
 */
export function extractAboutKpis(body: string): AboutKpi[] {
  const text = stripCode(body);
  const kpis: AboutKpi[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  PERCENT_RE.lastIndex = 0;
  while ((match = PERCENT_RE.exec(text)) !== null) {
    const value = match[1].replace(/\s+/g, "");
    if (seen.has(value)) continue;
    const caption =
      wordsBefore(text, match.index, 3) ||
      wordsAfter(text, match.index + match[0].length, 3);
    kpis.push({ value, caption });
    seen.add(value);
  }

  YEARS_RE.lastIndex = 0;
  while ((match = YEARS_RE.exec(text)) !== null) {
    const value = `${match[1]} ${match[2]}`;
    if (seen.has(value)) continue;
    const caption =
      wordsAfter(text, match.index + match[0].length, 3) ||
      wordsBefore(text, match.index, 3);
    kpis.push({ value, caption });
    seen.add(value);
  }

  return kpis.slice(0, 4);
}

/** Splits `body` into paragraphs (blank lines are the separator). */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+\n/g, " ").replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/**
 * Tiny, dependency-free markdown helpers shared by the section parsers.
 *
 * The CV authoring grammar is intentionally a small subset of Markdown
 * (headings, bullet lists, bold), so a few well-named primitives are far
 * easier to read than pulling a full parser.
 */

/** Matches em dash (—), en dash (–) or hyphen (-) with whitespace around it. */
export const DASH_SEPARATOR = /\s+[—\u2013\u2014-]\s+/;

/**
 * Splits a comma-separated list keeping commas inside parentheses intact.
 * Example: `"AWS (S3, IAM), Azure"` → `["AWS (S3, IAM)", "Azure"]`.
 */
export function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth += 1;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (c === "," && depth === 0) {
      const chunk = text.slice(start, i).trim();
      if (chunk) parts.push(chunk);
      start = i + 1;
    }
  }
  const last = text.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

/**
 * Splits `"Left — Right"` (em/en dash or hyphen) once. Returns `[left, right]`
 * when a separator is found, otherwise `[text, ""]`.
 */
export function splitOnDash(text: string): [string, string] {
  const m = text.match(DASH_SEPARATOR);
  if (!m) return [text.trim(), ""];
  const idx = text.indexOf(m[0]);
  return [text.slice(0, idx).trim(), text.slice(idx + m[0].length).trim()];
}

/**
 * Returns the trimmed content of every `"- item"` line in `body`.
 * Empty lines and non-bullet lines are ignored.
 */
export function parseBulletList(body: string): string[] {
  if (!body?.trim()) return [];
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Splits a body into "## Heading\n…body…" blocks. The leading `##` is stripped
 * and the heading is returned in `title`. Empty blocks are dropped.
 */
export function splitH2Blocks(body: string): Array<{ title: string; body: string }> {
  return body
    .split(/\r?\n## /)
    .filter((b) => b.trim())
    .map((block) => {
      const newline = block.indexOf("\n");
      const firstLine = newline === -1 ? block : block.slice(0, newline);
      const rest = newline === -1 ? "" : block.slice(newline + 1);
      return {
        title: firstLine.replace(/^##\s*/, "").trim(),
        body: rest,
      };
    });
}

/**
 * Splits a body into "### Heading\n…body…" blocks (same shape as
 * {@link splitH2Blocks}, one heading level deeper).
 */
export function splitH3Blocks(body: string): Array<{ title: string; body: string }> {
  return body
    .split(/\r?\n### /)
    .filter((b) => b.trim())
    .map((block) => {
      const newline = block.indexOf("\n");
      const firstLine = newline === -1 ? block : block.slice(0, newline);
      const rest = newline === -1 ? "" : block.slice(newline + 1);
      return {
        title: firstLine.replace(/^###\s*/, "").trim(),
        body: rest.trim(),
      };
    });
}

/**
 * Parsers for the simple CV sections (everything except About + Experience).
 *
 * Each function takes a section's raw markdown body and returns a typed
 * structure ready to render. They share the helpers in `./primitives`.
 */

import {
  parseBulletList,
  splitH2Blocks,
  splitOnDash,
  splitTopLevelCommas,
} from "./primitives";

export type Certification = { name: string; date: string; id?: string };
export type Language = { name: string; level: string };
export type ContactField = { label: string; value: string };
export type EducationBlock = {
  title: string;
  institution?: string;
  items?: string[];
};
export type SkillGroup = { title: string; skills: string[] };

const ID_SUFFIX = /\s*\(ID:\s*([^)]+)\)\s*/;

/**
 * Parses entries shaped like `- Name — Date (ID: xyz)`.
 * The `(ID: …)` segment is optional and stripped from the date.
 */
export function parseCertifications(body: string): Certification[] {
  return parseBulletList(body).map((line) => {
    const [name, rest] = splitOnDash(line);
    if (!rest) return { name, date: "" };
    const idMatch = rest.match(ID_SUFFIX);
    const date = idMatch ? rest.replace(ID_SUFFIX, "").trim() : rest;
    return { name, date, id: idMatch?.[1] };
  });
}

/** Parses entries shaped like `- Language — Level`. */
export function parseLanguages(body: string): Language[] {
  return parseBulletList(body)
    .map((line): Language => {
      const [name, level] = splitOnDash(line);
      return { name, level };
    })
    .filter((l) => l.name);
}

/** Parses entries shaped like `- Label: value`. Lines without `:` are dropped. */
export function parseContactFields(body: string): ContactField[] {
  return parseBulletList(body)
    .map((line): ContactField | null => {
      const colonIdx = line.indexOf(":");
      if (colonIdx < 0) return null;
      return {
        label: line.slice(0, colonIdx).trim(),
        value: line.slice(colonIdx + 1).trim(),
      };
    })
    .filter((f): f is ContactField => f !== null && Boolean(f.value));
}

/**
 * Parses a body of `### Title` blocks where each block has:
 * - an optional one-line institution
 * - optional bullet items
 */
export function parseEducation(body: string): EducationBlock[] {
  if (!body?.trim()) return [];
  return body
    .split(/\r?\n### /)
    .filter((b) => b.trim())
    .map((block) => {
      const lines = block.split("\n");
      const title = (lines[0] ?? "").replace(/^###\s*/, "").trim();
      const rest = lines.slice(1);

      const items = rest
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean);

      const institution = rest
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith("-"));

      return {
        title,
        institution: institution || undefined,
        items: items.length > 0 ? items : undefined,
      };
    })
    .filter((b) => b.title);
}

/**
 * Parses `## Category` blocks where each block lists skills as bullets.
 * Continuation lines (no leading `-`) extend the previous bullet so authors can
 * wrap long lists across several lines without breaking the rendered chips.
 */
export function parseSkillGroups(body: string): SkillGroup[] {
  if (!body?.trim()) return [];
  return splitH2Blocks(body)
    .map(({ title, body: blockBody }) => {
      const skills: string[] = [];
      let current: string | null = null;

      const flush = () => {
        if (current !== null) {
          skills.push(...splitTopLevelCommas(current));
          current = null;
        }
      };

      for (const rawLine of blockBody.split("\n")) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("-")) {
          flush();
          current = trimmed.replace(/^-\s*/, "").trim();
        } else if (current !== null) {
          current += ` ${trimmed}`;
        }
      }
      flush();

      return { title, skills };
    })
    .filter((g) => g.title && g.skills.length > 0);
}

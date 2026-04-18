/**
 * Loads site config and section markdown from /content (filesystem).
 * Used by server components only.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Locale, SiteConfig, SectionContent, SectionKpi } from "./types";

/**
 * Resolves content root across local and CI executions.
 */
function getContentDir(): string {
  const candidates = [
    join(process.cwd(), "content"),
    join(process.cwd(), "..", "content"),
    join(process.cwd(), "..", "..", "content"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "site.json"))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate content root. Checked: ${candidates.join(", ")}`
  );
}

/**
 * Loads and parses content/site.json.
 */
export function loadSiteConfig(contentDir?: string): SiteConfig {
  const base = contentDir ?? getContentDir();
  const path = join(base, "site.json");
  if (!existsSync(path)) {
    throw new Error(`Content config not found: ${path}`);
  }
  const raw = readFileSync(path, "utf-8");
  const config = JSON.parse(raw) as SiteConfig;
  if (!config.sectionsOrder?.length || !config.navSections?.length) {
    throw new Error("site.json must define sectionsOrder and navSections");
  }
  return config;
}

type SectionFrontmatter = {
  kpis?: SectionKpi[];
};

type ParsedSection = {
  body: string;
  meta: SectionFrontmatter;
};

/**
 * Splits a section file into (frontmatter, body). Frontmatter is optional and
 * delimited by leading `---` lines. Returns body unchanged when absent.
 */
function splitFrontmatter(raw: string): { fmBlock: string; body: string } {
  /* Normalize CRLF so downstream regexes don't have to deal with stray \r,
     which broke `(.*)$` captures on the last line of the frontmatter block. */
  const normalized = raw.replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---")) return { fmBlock: "", body: normalized };
  const end = normalized.indexOf("\n---", 3);
  if (end < 0) return { fmBlock: "", body: normalized };
  const fmBlock = normalized.slice(3, end).replace(/^\n/, "");
  const body = normalized.slice(end + 4).replace(/^\n/, "");
  return { fmBlock, body };
}

/**
 * Tiny YAML-ish frontmatter parser tailored to our schema (kpis list).
 * Supports `key: value` scalars and a `kpis:` list of `{ value, caption }`
 * objects authored as `- value: "+25%"\n  caption: improved efficiency`.
 * Anything not recognized is ignored on purpose — keep the surface small.
 */
function parseFrontmatter(fmBlock: string): SectionFrontmatter {
  if (!fmBlock.trim()) return {};
  const lines = fmBlock.split(/\r?\n/);
  const meta: SectionFrontmatter = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i += 1;
      continue;
    }
    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    const [, key, rest] = keyMatch;

    if (key === "kpis" && !rest.trim()) {
      const items: SectionKpi[] = [];
      i += 1;
      let current: Partial<SectionKpi> | null = null;
      while (i < lines.length) {
        const sub = lines[i];
        if (/^[A-Za-z_][A-Za-z0-9_]*:/.test(sub)) break; /* next top-level key */
        const itemStart = sub.match(/^\s*-\s*(?:(value|caption):\s*(.*))?$/);
        const itemField = sub.match(/^\s+(value|caption):\s*(.*)$/);
        if (itemStart) {
          if (current && current.value) items.push({ value: current.value, caption: current.caption ?? "" });
          current = {};
          if (itemStart[1]) {
            (current as Record<string, string>)[itemStart[1]] = unquote(itemStart[2] ?? "");
          }
        } else if (itemField && current) {
          (current as Record<string, string>)[itemField[1]] = unquote(itemField[2] ?? "");
        }
        i += 1;
      }
      if (current && current.value) items.push({ value: current.value, caption: current.caption ?? "" });
      if (items.length > 0) meta.kpis = items;
      continue;
    }

    i += 1;
  }

  return meta;
}

/** Strips matching surrounding single/double quotes. */
function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Loads and parses one section file: optional frontmatter + markdown body.
 */
function loadSectionFile(
  sectionId: string,
  locale: Locale,
  contentDir?: string
): ParsedSection {
  const base = contentDir ?? getContentDir();
  const path = join(base, locale, "sections", `${sectionId}.md`);
  if (!existsSync(path)) {
    return { body: "", meta: {} };
  }
  const raw = readFileSync(path, "utf-8");
  const { fmBlock, body } = splitFrontmatter(raw);
  return { body: body.trim(), meta: parseFrontmatter(fmBlock) };
}

/**
 * Returns section title for the given locale from site config.
 */
function getSectionTitle(
  config: SiteConfig,
  sectionId: string,
  locale: Locale
): string {
  const section = config.requiredSections?.find((s) => s.id === sectionId);
  return section?.title?.[locale] ?? sectionId;
}

/**
 * Loads all sections for the given locale following config.sectionsOrder.
 * Section body is raw markdown (to be rendered by the UI).
 */
export function loadSectionsForLocale(
  config: SiteConfig,
  locale: Locale,
  contentDir?: string
): SectionContent[] {
  return config.sectionsOrder.map((id) => {
    const parsed = loadSectionFile(id, locale, contentDir);
    return {
      id,
      title: getSectionTitle(config, id, locale),
      body: parsed.body,
      kpis: parsed.meta.kpis,
    };
  });
}

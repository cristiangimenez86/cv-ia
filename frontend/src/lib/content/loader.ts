/**
 * Loads site config and section markdown from /content (filesystem).
 * Used by server components only.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Locale, SiteConfig, SectionContent } from "./types";

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

/**
 * Loads one section markdown for the given locale.
 * Returns raw markdown string.
 */
function loadSectionMarkdown(
  sectionId: string,
  locale: Locale,
  contentDir?: string
): string {
  const base = contentDir ?? getContentDir();
  const path = join(base, locale, "sections", `${sectionId}.md`);
  if (!existsSync(path)) {
    return "";
  }
  return readFileSync(path, "utf-8").trim();
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
  return config.sectionsOrder.map((id) => ({
    id,
    title: getSectionTitle(config, id, locale),
    body: loadSectionMarkdown(id, locale, contentDir),
  }));
}

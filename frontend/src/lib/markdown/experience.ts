/**
 * Experience markdown parser.
 *
 * The authoring format (per `## Heading` block) is:
 *
 *   ## Role — Company
 *   **Location | Dates**
 *
 *   <free-form description paragraphs>
 *
 *   **Project:** project name
 *   **Achievements:**
 *     - bullet 1
 *     - bullet 2
 *   **Technologies:** A, B, C (parens, allowed)
 *
 * The Spanish equivalents `Proyecto / Logros / Tecnologías` are also accepted.
 * Multiple project blocks under the same company are grouped together so the
 * UI can render one timeline dot per company.
 */

import type { ExperienceCompany } from "@/lib/content/types";
import { splitOnDash, splitTopLevelCommas } from "./primitives";

export type ExperienceProject = {
  project: string;
  description: string;
  achievements: string[];
  technologies: string[];
};

export type ExperienceGroup = {
  company: string;
  role: string;
  location: string;
  dates: string;
  logoConfig?: ExperienceCompany;
  projects: ExperienceProject[];
};

type ParsedBlock = {
  role: string;
  company: string;
  location: string;
  dates: string;
} & ExperienceProject;

const LOC_DATES_RE = /\*\*([^*]+)\*\*\s*\r?\n/;
const PROJECT_RE = /\*\*(Project|Proyecto):\*\*\s*([^\n*]+)/i;
const ACHIEVEMENTS_RE =
  /\*\*(Achievements|Logros):\*\*\s*\r?\n([\s\S]*?)(?=\*\*(?:Project|Proyecto|Achievements|Logros|Technologies|Tecnolog[íi]as)|$)/i;
const TECH_RE = /\*\*(Technologies|Tecnolog[íi]as):\*\*\s*([^\n]+)/i;
const PROJECT_BLOCK_RE =
  /\*\*(Project|Proyecto):\*\*[^\r\n]+\r?\n\r?\n([\s\S]*?)(?=\*\*(?:Achievements|Logros):\*\*|$)/i;
const NO_PROJECT_BLOCK_RE =
  /\*\*[^*]+\*\*\s*\r?\n\r?\n([\s\S]*?)(?=\*\*(?:Achievements|Logros):\*\*|$)/i;
const SECTION_LABEL_PREFIX = /^\*\*(Project|Proyecto|Technologies|Tecnolog[íi]as)/i;

function parseLocationAndDates(rest: string): { location: string; dates: string } {
  const match = rest.match(LOC_DATES_RE);
  if (!match) return { location: "", dates: "" };
  const [location, dates = ""] = match[1].split("|").map((s) => s.trim());
  return { location, dates };
}

function parseAchievements(rest: string): string[] {
  const match = rest.match(ACHIEVEMENTS_RE);
  if (!match) return [];
  return match[2]
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function parseDescription(rest: string): string {
  const projectBlock = rest.match(PROJECT_BLOCK_RE);
  if (projectBlock) return projectBlock[2].trim();
  const noProjectBlock = rest.match(NO_PROJECT_BLOCK_RE);
  if (!noProjectBlock) return "";
  const candidate = noProjectBlock[1].trim();
  return SECTION_LABEL_PREFIX.test(candidate) ? "" : candidate;
}

function parseExperienceBlocks(body: string): ParsedBlock[] {
  return body
    .split(/\r?\n## /)
    .filter((b) => b.trim())
    .map((block): ParsedBlock => {
      const lines = block.split(/\r?\n/);
      const headLine = (lines[0] ?? "").replace(/^##\s*/, "").trim();
      const rest = lines.slice(1).join("\n");
      const [role, company] = splitOnDash(headLine);
      const { location, dates } = parseLocationAndDates(rest);
      const project = rest.match(PROJECT_RE)?.[2]?.trim() ?? "";
      const techRaw = rest.match(TECH_RE)?.[2] ?? "";
      return {
        role,
        company,
        location,
        dates,
        project,
        description: parseDescription(rest),
        achievements: parseAchievements(rest),
        technologies: techRaw ? splitTopLevelCommas(techRaw) : [],
      };
    });
}

function findCompany(
  name: string,
  companies: readonly ExperienceCompany[],
): ExperienceCompany | undefined {
  const normalized = name.trim().toLowerCase();
  return companies.find((c) => c.name.trim().toLowerCase() === normalized);
}

/**
 * Parses experience markdown and groups consecutive entries that share a
 * company. The first entry in each group provides the headline (role,
 * location, dates); the rest contribute additional projects.
 */
export function parseExperienceGroups(
  body: string,
  companies: readonly ExperienceCompany[] = [],
): ExperienceGroup[] {
  const blocks = parseExperienceBlocks(body);
  const groups: ExperienceGroup[] = [];

  for (const block of blocks) {
    const key = block.company.trim().toLowerCase();
    const project: ExperienceProject = {
      project: block.project,
      description: block.description,
      achievements: block.achievements,
      technologies: block.technologies,
    };
    const existing = groups.find((g) => g.company.trim().toLowerCase() === key);
    if (existing) {
      existing.projects.push(project);
      continue;
    }
    groups.push({
      company: block.company,
      role: block.role,
      location: block.location,
      dates: block.dates,
      logoConfig: findCompany(block.company, companies),
      projects: [project],
    });
  }

  return groups;
}

/**
 * A "simple" entry is a company with a single project that has only a
 * description (no project name, no achievements, no tech). The UI uses this
 * to render a one-line subtitle instead of a full project card.
 */
export function isSimpleExperienceEntry(group: ExperienceGroup): boolean {
  if (group.projects.length !== 1) return false;
  const [only] = group.projects;
  return (
    !only.project &&
    only.achievements.length === 0 &&
    only.technologies.length === 0 &&
    Boolean(only.description)
  );
}

import Image from "next/image";
import type { SectionContent, ExperienceCompany } from "@/lib/content/types";

type ExperienceSectionProps = {
  section: SectionContent;
  companies?: ExperienceCompany[];
};

type ParsedBlock = {
  role: string;
  company: string;
  location: string;
  dates: string;
  project: string;
  description: string;
  achievements: string[];
  technologies: string[];
};

type CompanyGroup = {
  company: string;
  role: string;
  location: string;
  dates: string;
  logoConfig?: ExperienceCompany;
  projects: Array<{
    project: string;
    description: string;
    achievements: string[];
    technologies: string[];
  }>;
};

/** Matches em dash (—), en dash (–), or hyphen (-) with surrounding spaces */
const DASH_SEPARATOR = /\s+[—\u2013\u2014-]\s+/;

function findCompany(
  companyName: string,
  companies: ExperienceCompany[]
): ExperienceCompany | undefined {
  const normalized = companyName.trim().toLowerCase();
  return companies.find(
    (c) => c.name.trim().toLowerCase() === normalized
  );
}

/**
 * Parses experience markdown into structured blocks.
 * Supports both English (Project, Achievements, Technologies) and Spanish (Proyecto, Logros, Tecnologías).
 */
function parseExperienceBlocks(body: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const rawBlocks = body.split(/\n## /).filter((b) => b.trim());

  for (const block of rawBlocks) {
    const lines = block.split("\n");
    const firstLine = (lines[0] ?? "").replace(/^##\s*/, "").trim();
    const rest = lines.slice(1).join("\n");

    const match = firstLine.match(DASH_SEPARATOR);
    let role = firstLine;
    let company = "";

    if (match) {
      const idx = firstLine.indexOf(match[0]);
      role = firstLine.slice(0, idx).trim();
      company = firstLine.slice(idx + match[0].length).trim();
    }

    let location = "";
    let dates = "";
    let project = "";
    let description = "";
    let achievements: string[] = [];
    let technologies: string[] = [];

    const locDatesMatch = rest.match(/\*\*([^*]+)\*\*\s*\n/);
    if (locDatesMatch) {
      const locDates = locDatesMatch[1];
      const pipeIdx = locDates.indexOf("|");
      if (pipeIdx >= 0) {
        location = locDates.slice(0, pipeIdx).trim();
        dates = locDates.slice(pipeIdx + 1).trim();
      } else {
        location = locDates.trim();
      }
    }

    const projectMatch = rest.match(/\*\*(Project|Proyecto):\*\*\s*([^\n*]+)/i);
    if (projectMatch) {
      project = projectMatch[2].trim();
    }

    const achievementsMatch = rest.match(/\*\*(Achievements|Logros):\*\*\s*\n([\s\S]*?)(?=\*\*(?:Project|Proyecto|Achievements|Logros|Technologies|Tecnologías)|$)/i);
    if (achievementsMatch) {
      const bulletText = achievementsMatch[2];
      achievements = bulletText
        .split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean);
    }

    const techMatch = rest.match(/\*\*(Technologies|Tecnologías):\*\*\s*([^\n]+)/i);
    if (techMatch) {
      technologies = techMatch[2]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const projectBlock = rest.match(/\*\*(Project|Proyecto):\*\*[^\n]+\n\n([\s\S]*?)(?=\*\*(?:Achievements|Logros):\*\*|$)/i);
    const noProjectBlock = rest.match(/\*\*[^*]+\*\*\s*\n\n([\s\S]*?)(?=\*\*(?:Achievements|Logros):\*\*|$)/i);
    if (projectBlock) {
      description = projectBlock[2].trim();
    } else if (noProjectBlock) {
      description = noProjectBlock[1].trim();
      if (/^\*\*(Project|Proyecto|Technologies|Tecnologías)/i.test(description)) {
        description = "";
      }
    }

    blocks.push({
      role,
      company,
      location,
      dates,
      project,
      description,
      achievements,
      technologies,
    });
  }

  return blocks;
}

/**
 * Groups blocks by company. One blue dot per company.
 */
function groupByCompany(blocks: ParsedBlock[], companies: ExperienceCompany[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const key = block.company.trim().toLowerCase();
    const existing = groups.find((g) => g.company.trim().toLowerCase() === key);

    const project = {
      project: block.project,
      description: block.description,
      achievements: block.achievements,
      technologies: block.technologies,
    };

    if (existing) {
      existing.projects.push(project);
    } else {
      groups.push({
        company: block.company,
        role: block.role,
        location: block.location,
        dates: block.dates,
        logoConfig: findCompany(block.company, companies),
        projects: [project],
      });
    }
  }

  return groups;
}

/**
 * Renders the Experience section: company header outside, project cards inside.
 * One blue dot per company, centered on the timeline line.
 */
export function ExperienceSection({ section, companies = [] }: ExperienceSectionProps) {
  const blocks = parseExperienceBlocks(section.body ?? "");
  const companyGroups = groupByCompany(blocks, companies);

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {section.title}
      </h2>

      <div className="relative flex gap-4">
        {/* Timeline column: vertical line centered (behind dots) */}
        <div className="relative w-4 shrink-0 self-stretch">
          <div
            className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border rounded-full"
            aria-hidden
          />
        </div>

        <div className="flex-1 min-w-0 space-y-8">
          {companyGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex">
              {/* Timeline dot — blue, prominent, on top of line, aligned with logo */}
              <div className="relative z-10 w-4 -ml-8 shrink-0 flex justify-center">
                <div
                  className="w-3 h-3 rounded-full bg-primary shrink-0 mt-[22px] shadow-sm"
                  aria-hidden
                />
              </div>
              <div className="flex-1 min-w-0">
                {/* Company header — logo aligned with dot center, text to the right */}
                {(() => {
                  const isSimpleEntry =
                    group.projects.length === 1 &&
                    !group.projects[0].project &&
                    group.projects[0].achievements.length === 0 &&
                    group.projects[0].technologies.length === 0 &&
                    !!group.projects[0].description;
                  const subtitle = isSimpleEntry
                    ? `${group.projects[0].description}${group.location ? ` · ${group.location}` : ""}`
                    : `${group.role}${group.location ? ` · ${group.location}` : ""}`;

                  return (
                <div
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 ${isSimpleEntry ? "ml-5" : "mb-4"} ${group.logoConfig ? "ml-4" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {group.logoConfig && (
                      <a
                        href={group.logoConfig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-card-btn shrink-0 w-14 h-14 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden"
                        aria-label={`${group.company} website`}
                      >
                        <Image
                          src={group.logoConfig.logo}
                          alt=""
                          width={56}
                          height={56}
                          className="object-contain w-12 h-12 p-0.5"
                        />
                      </a>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {group.company}
                      </h3>
                      <p className="text-sm text-muted">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                  {group.dates && (
                    <span className="text-sm text-muted shrink-0">
                      {group.dates}
                    </span>
                  )}
                </div>
                  );
                })()}

                {/* Project cards — only for entries with projects/achievements/technologies */}
                {group.projects.some(
                  (p) => p.project || p.achievements.length > 0 || p.technologies.length > 0
                ) && (
                <div
                  className={`space-y-4 mb-4 ${group.logoConfig ? "ml-4" : ""}`}
                >
                {group.projects
                  .filter((p) => p.project || p.achievements.length > 0 || p.technologies.length > 0)
                  .map((proj, projIdx) => (
                  <div
                    key={projIdx}
                    className="experience-card rounded-xl border border-border p-4 md:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {proj.project && (
                      <p className="text-sm font-medium text-foreground mb-2">
                        {proj.project}
                      </p>
                    )}

                    {(proj.description || proj.achievements.length > 0) && (
                      <ul className="list-disc list-inside text-sm text-muted space-y-1 mb-4">
                        {proj.description && <li className="leading-relaxed">{proj.description}</li>}
                        {proj.achievements.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    )}

                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-primary/15 text-primary border border-primary/25 shadow-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

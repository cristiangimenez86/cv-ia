import Image from "next/image";
import type { SectionContent, ExperienceCompany } from "@/lib/content/types";
import {
  isSimpleExperienceEntry,
  parseExperienceGroups,
  type ExperienceGroup,
  type ExperienceProject,
} from "@/lib/markdown/experience";
import { SectionHeading } from "@/components/sectionIcons";

type ExperienceSectionProps = {
  section: SectionContent;
  companies?: ExperienceCompany[];
};

/**
 * Renders Experience as a vertical timeline. One blue dot + company header per
 * company, with one or more project cards underneath.
 */
export function ExperienceSection({ section, companies = [] }: ExperienceSectionProps) {
  const groups = parseExperienceGroups(section.body ?? "", companies);

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="relative flex gap-4">
        <TimelineRail />
        <div className="flex-1 min-w-0 space-y-8">
          {groups.map((group, i) => (
            <CompanyTimelineEntry key={i} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Vertical line behind the timeline dots. */
function TimelineRail() {
  return (
    <div className="relative w-4 shrink-0 self-stretch">
      <div
        className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border rounded-full"
        aria-hidden
      />
    </div>
  );
}

function CompanyTimelineEntry({ group }: { group: ExperienceGroup }) {
  const isSimple = isSimpleExperienceEntry(group);
  const visibleProjects = isSimple
    ? []
    : group.projects.filter(hasProjectContent);

  /* Header indent compensates for the dot/logo gutter so the title aligns
     consistently with the timeline regardless of which mode is rendered. */
  const headerIndent = isSimple
    ? "ml-7"
    : group.logoConfig
      ? "ml-4"
      : "";

  const subtitle = isSimple
    ? group.projects[0]?.description ?? ""
    : `${group.role}${group.location ? ` · ${group.location}` : ""}`;

  return (
    <div className="flex">
      <TimelineDot />
      <div className="flex-1 min-w-0">
        <CompanyHeader
          group={group}
          subtitle={subtitle}
          indentClass={headerIndent}
        />
        {visibleProjects.length > 0 && (
          <div className={`space-y-4 mb-4 ${group.logoConfig ? "ml-4" : ""}`}>
            {visibleProjects.map((project, i) => (
              <ProjectCard key={i} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineDot() {
  return (
    <div className="relative z-10 w-4 -ml-8 shrink-0 flex justify-center">
      <div
        className="w-3 h-3 rounded-full bg-primary shrink-0 mt-[22px] shadow-sm"
        aria-hidden
      />
    </div>
  );
}

function CompanyHeader({
  group,
  subtitle,
  indentClass,
}: {
  group: ExperienceGroup;
  subtitle: string;
  indentClass: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4 ${indentClass}`}
    >
      <div className="flex items-start gap-3">
        {group.logoConfig && (
          <a
            href={group.logoConfig.url}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-card-btn shrink-0 w-14 h-14 rounded-lg border border-border bg-slate-100 dark:bg-slate-100 dark:border-slate-200/40 flex items-center justify-center overflow-hidden"
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
          <h3 className="text-base font-semibold text-foreground">{group.company}</h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      {group.dates && (
        <span className="text-sm text-muted shrink-0">{group.dates}</span>
      )}
    </div>
  );
}

function hasProjectContent(p: ExperienceProject): boolean {
  return Boolean(p.project) || p.achievements.length > 0 || p.technologies.length > 0;
}

function ProjectCard({ project }: { project: ExperienceProject }) {
  const hasBody = Boolean(project.description) || project.achievements.length > 0;

  return (
    <div className="experience-card rounded-xl border border-border p-4 md:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {project.project && (
        <p className="text-base font-medium text-foreground mb-2">{project.project}</p>
      )}

      {hasBody && (
        <div className="mb-4">
          {project.description && <ProjectDescription text={project.description} />}
          {project.achievements.length > 0 && (
            <ul className="list-disc list-inside text-base text-foreground space-y-1">
              {project.achievements.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span key={tech} className="chip-neutral">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const LABELED_LINE = /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s/]+:)\s*(.*)$/;

/**
 * Renders a multi-line description where lines shaped like `Label: value` are
 * styled with a bold label, and the rest become plain paragraphs. Inline
 * `**bold**` markdown is stripped (the label takes that role).
 */
function ProjectDescription({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/\*\*(.*?)\*\*/g, "$1"));

  return (
    <div className="text-base text-foreground space-y-1.5 mb-3">
      {lines.map((line, i) => {
        const labeled = line.match(LABELED_LINE);
        if (!labeled) {
          return (
            <p key={i} className="leading-relaxed">
              {line}
            </p>
          );
        }
        const [, label, value] = labeled;
        return (
          <p key={i} className="leading-relaxed">
            <span className="font-semibold">{label}</span>
            {value ? ` ${value}` : ""}
          </p>
        );
      })}
    </div>
  );
}

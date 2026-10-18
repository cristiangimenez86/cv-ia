import type { SectionContent, ExperienceCompany } from "@/lib/content/types";
import { isSimpleExperienceEntry, parseExperienceGroups, type ExperienceProject } from "@/lib/markdown/experience";
import { SectionHeading } from "@/components/sectionIcons";

type Props = { section: SectionContent; companies?: ExperienceCompany[] };

export function ExperienceSection({ section, companies = [] }: Props) {
  const groups = parseExperienceGroups(section.body ?? "", companies);
  return (
    <section id={section.id} className="cv-section">
      <SectionHeading id={section.id} title={section.title} />
      <div className="cv-jobs">
        {groups.map((group, i) => {
          const companyName = group.logoConfig?.url && group.logoConfig.url !== "#"
            ? <a className="cv-job-company-link" href={group.logoConfig.url} target="_blank" rel="noopener noreferrer">{group.company}</a>
            : group.company;

          return (
            <article className="cv-job" key={`${group.company}-${i}`}>
              <div className="cv-job-date"><span>{group.dates}</span><span>{group.location}</span></div>
              <div className="cv-job-content">
                <div className="cv-job-heading"><h3>{group.role || companyName}</h3>{group.role && <span>{companyName}</span>}</div>
                {isSimpleExperienceEntry(group)
                  ? <Description text={group.projects[0]?.description ?? ""} />
                  : group.projects.map((project, index) => <Project key={index} project={project} />)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Project({ project }: { project: ExperienceProject }) {
  return (
    <div className="cv-project">
      {project.project && <h4>{project.project}</h4>}
      {project.description && <Description text={project.description} />}
      {project.achievements.length > 0 && <ul className="cv-job-achievements">{project.achievements.map((item, i) => <li key={i}>{item}</li>)}</ul>}
      {project.technologies.length > 0 && <div className="cv-tags">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div>}
    </div>
  );
}

function Description({ text }: { text: string }) {
  const paragraphs = text.split("\n").filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div className="cv-job-description">
      {paragraphs.map((line, i) => {
        const label = line.match(/^\*\*(Contexto|Responsabilidad|Context|Responsibility):\*\*\s*(.*)$/i);
        return (
          <p key={i}>
            {label ? <><strong>{label[1]}:</strong> {label[2]}</> : line.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
}

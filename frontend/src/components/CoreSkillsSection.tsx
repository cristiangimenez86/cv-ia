import type { SectionContent } from "@/lib/content/types";
import { parseSkillGroups } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";
import { Braces, Cloud, Database, GitBranch, Layers3, Monitor } from "lucide-react";

const SKILL_ICONS = [Braces, Monitor, Database, Cloud, GitBranch, Layers3];

type CoreSkillsSectionProps = {
  section: SectionContent;
};

/**
 * Renders the authored skill groups as compact category cards.
 */
export function CoreSkillsSection({ section }: CoreSkillsSectionProps) {
  const groups = parseSkillGroups(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="cv-skills">
        {groups.map((group, i) => {
          const Icon = SKILL_ICONS[i % SKILL_ICONS.length];
          return (
            <article key={i} className="cv-skill">
              <div className="cv-skill-top">
                <span className="cv-skill-icon"><Icon size={20} strokeWidth={1.6} aria-hidden /></span>
                <span className="cv-skill-number">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{group.title}</h3>
              <p>{group.skills.join(", ")}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

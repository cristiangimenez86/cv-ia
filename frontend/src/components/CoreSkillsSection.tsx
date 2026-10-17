import type { SectionContent } from "@/lib/content/types";
import { parseSkillGroups } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";

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
        {groups.map((group, i) => (
          <article key={i} className="cv-skill">
            <span className="cv-skill-number">{String(i + 1).padStart(2, "0")}</span>
            <h3>{group.title}</h3>
            <p>{group.skills.join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

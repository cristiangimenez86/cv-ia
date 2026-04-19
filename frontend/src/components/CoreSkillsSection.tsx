import type { SectionContent } from "@/lib/content/types";
import { parseSkillGroups } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";

type CoreSkillsSectionProps = {
  section: SectionContent;
};

/**
 * Renders Core Skills as a 3-column grid of category cards with chip tags.
 * HR-friendly: scannable, ATS keywords visible, grouped by category.
 */
export function CoreSkillsSection({ section }: CoreSkillsSectionProps) {
  const groups = parseSkillGroups(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {groups.map((group, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-4 flex h-full min-h-0 flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted shrink-0">
              {group.title}
            </h3>
            <div className="flex min-h-0 min-w-0 flex-1 flex-wrap content-start gap-2 overflow-x-auto">
              {group.skills.map((skill, j) => (
                <span key={j} className="chip-neutral shrink-0 whitespace-nowrap">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

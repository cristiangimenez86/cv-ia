import { Check } from "lucide-react";
import type { SectionContent } from "@/lib/content/types";
import { parseBulletList } from "@/lib/markdown/primitives";
import { SectionHeading } from "@/components/sectionIcons";

type KeyAchievementsSectionProps = {
  section: SectionContent;
};

/** Renders Key Achievements as a checkmark-bulleted list. */
export function KeyAchievementsSection({ section }: KeyAchievementsSectionProps) {
  const achievements = parseBulletList(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <ul className="space-y-3 list-none pl-0">
        {achievements.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-primary" aria-hidden>
              <Check size={18} strokeWidth={2.5} />
            </span>
            <span className="text-base text-foreground leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

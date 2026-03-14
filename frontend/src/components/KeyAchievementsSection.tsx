import { Check } from "lucide-react";
import type { SectionContent } from "@/lib/content/types";

type KeyAchievementsSectionProps = {
  section: SectionContent;
};

/**
 * Parses markdown bullet list into achievement strings.
 */
function parseAchievements(body: string): string[] {
  if (!body?.trim()) return [];
  return body
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Renders Key Achievements section with checkmark bullets.
 * Style: title, list with blue checkmarks, consistent spacing.
 */
export function KeyAchievementsSection({ section }: KeyAchievementsSectionProps) {
  const achievements = parseAchievements(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-3">
        {section.title}
      </h2>
      <ul className="space-y-3 list-none pl-0">
        {achievements.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="shrink-0 mt-0.5 text-primary"
              aria-hidden
            >
              <Check size={18} strokeWidth={2.5} />
            </span>
            <span className="text-base text-foreground leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

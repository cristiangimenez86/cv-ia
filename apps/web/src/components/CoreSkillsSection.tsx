import type { SectionContent } from "@/lib/content/types";

type CoreSkillsSectionProps = {
  section: SectionContent;
};

type SkillGroup = {
  title: string;
  skills: string[];
};

/**
 * Parses markdown into skill groups: ## Category followed by - skill1, skill2, ...
 */
function parseSkillGroups(body: string): SkillGroup[] {
  if (!body?.trim()) return [];
  const groups: SkillGroup[] = [];
  const blocks = body.split(/\n## /).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    const firstLine = lines[0] ?? "";
    const rest = lines.slice(1).join("\n");

    const title = firstLine.replace(/^##\s*/, "").trim();
    const skills: string[] = [];

    const bulletLines = rest
      .split("\n")
      .filter((l) => l.trim().startsWith("-"));

    for (const line of bulletLines) {
      const content = line.replace(/^-\s*/, "").trim();
      const items = content.split(",").map((s) => s.trim()).filter(Boolean);
      skills.push(...items);
    }

    if (title && skills.length > 0) {
      groups.push({ title, skills });
    }
  }

  return groups;
}

/**
 * Renders Core Skills section as a grid of categories with pill tags.
 * HR-friendly: clear hierarchy, scannable, ATS keywords visible.
 * Avoids repetition by grouping skills logically.
 */
export function CoreSkillsSection({ section }: CoreSkillsSectionProps) {
  const groups = parseSkillGroups(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {group.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill, j) => (
                <span
                  key={j}
                  className="inline-block px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground"
                >
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

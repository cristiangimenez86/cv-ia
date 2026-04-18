import type { SectionContent } from "@/lib/content/types";
import { SectionHeading } from "@/components/sectionIcons";

type CoreSkillsSectionProps = {
  section: SectionContent;
};

type SkillGroup = {
  title: string;
  skills: string[];
};

/** Splits on commas not inside parentheses (e.g. Azure (A, B) stays one item). */
function splitListItems(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") {
      depth += 1;
    } else if (c === ")") {
      depth = Math.max(0, depth - 1);
    } else if (c === "," && depth === 0) {
      const chunk = text.slice(start, i).trim();
      if (chunk) {
        parts.push(chunk);
      }
      start = i + 1;
    }
  }
  const last = text.slice(start).trim();
  if (last) {
    parts.push(last);
  }
  return parts;
}

/**
 * Parses markdown into skill groups: ## Category followed by list items.
 * Supports multi-line bullets (continuation lines without a leading "-").
 */
function parseSkillGroups(body: string): SkillGroup[] {
  if (!body?.trim()) return [];
  const groups: SkillGroup[] = [];
  const blocks = body.split(/\n## /).filter((b) => b.trim());

  const flushBullet = (text: string, skills: string[]) => {
    const items = splitListItems(text);
    skills.push(...items);
  };

  for (const block of blocks) {
    const lines = block.split("\n");
    const firstLine = lines[0] ?? "";
    const restLines = lines.slice(1);

    const title = firstLine.replace(/^##\s*/, "").trim();
    const skills: string[] = [];

    let currentBullet: string | null = null;
    for (const rawLine of restLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        continue;
      }
      if (trimmed.startsWith("-")) {
        if (currentBullet !== null) {
          flushBullet(currentBullet, skills);
        }
        currentBullet = trimmed.replace(/^-\s*/, "").trim();
      } else if (currentBullet !== null) {
        currentBullet += ` ${trimmed}`;
      }
    }
    if (currentBullet !== null) {
      flushBullet(currentBullet, skills);
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
                <span key={j} className="chip-neutral shrink-0">
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

import type { SectionContent } from "@/lib/content/types";

type EducationSectionProps = {
  section: SectionContent;
};

type EducationBlock = {
  title: string;
  institution?: string;
  items?: string[];
};

/**
 * Parses education markdown: ### Degree, institution line, ### Additional Courses, - bullet list
 */
function parseEducation(body: string): EducationBlock[] {
  if (!body?.trim()) return [];
  const blocks: EducationBlock[] = [];
  const rawBlocks = body.split(/\n### /).filter((b) => b.trim());

  for (const block of rawBlocks) {
    const lines = block.split("\n");
    const firstLine = (lines[0] ?? "").replace(/^###\s*/, "").trim();
    const rest = lines.slice(1).join("\n").trim();

    const items = rest
      .split("\n")
      .filter((l) => l.trim().startsWith("-"))
      .map((l) => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);

    const nonBulletLines = rest
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("-"))
      .map((l) => l.trim());

    const institution = nonBulletLines[0];

    if (firstLine) {
      blocks.push({
        title: firstLine,
        institution: institution || undefined,
        items: items.length > 0 ? items : undefined,
      });
    }
  }

  return blocks;
}

const CARD_CLASS =
  "rounded-xl border border-border bg-surface p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

/**
 * Renders Education section with card layout.
 * Main degree and additional courses each in their own card.
 */
export function EducationSection({ section }: EducationSectionProps) {
  const blocks = parseEducation(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-3">
        {section.title}
      </h2>
      <div className="space-y-4">
        {blocks.map((block, i) => (
          <div key={i} className={CARD_CLASS}>
            <p className="text-base font-semibold text-foreground">
              {block.title}
            </p>
            {block.institution && (
              <p className="text-base text-muted mt-1">{block.institution}</p>
            )}
            {block.items && block.items.length > 0 && (
              <ul className="list-disc list-inside text-base text-muted mt-3 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

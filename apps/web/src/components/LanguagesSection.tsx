import type { SectionContent } from "@/lib/content/types";

type LanguagesSectionProps = {
  section: SectionContent;
};

type Language = {
  name: string;
  level: string;
};

/**
 * Parses languages markdown: - Language — Level
 */
function parseLanguages(body: string): Language[] {
  if (!body?.trim()) return [];
  const sep = /\s+[—\u2013\u2014-]\s+/;
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => {
      const content = l.replace(/^-\s*/, "").trim();
      const m = content.match(sep);
      if (!m) return { name: content, level: "" };
      const idx = content.indexOf(m[0]);
      return {
        name: content.slice(0, idx).trim(),
        level: content.slice(idx + m[0].length).trim(),
      };
    })
    .filter((l) => l.name);
}

const CARD_CLASS =
  "rounded-xl border border-border bg-surface p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

/**
 * Renders Languages section with 2-column card grid.
 */
export function LanguagesSection({ section }: LanguagesSectionProps) {
  const languages = parseLanguages(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {languages.map((lang, i) => (
          <div key={i} className={CARD_CLASS}>
            <p className="text-sm font-semibold text-foreground">
              {lang.name}
            </p>
            {lang.level && (
              <p className="text-sm text-muted mt-1">{lang.level}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

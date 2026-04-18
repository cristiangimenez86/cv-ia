import type { SectionContent } from "@/lib/content/types";
import { parseLanguages } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";

type LanguagesSectionProps = {
  section: SectionContent;
};

/** Renders Languages as a 2-column card grid. */
export function LanguagesSection({ section }: LanguagesSectionProps) {
  const languages = parseLanguages(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {languages.map((lang, i) => (
          <div key={i} className="card-tile">
            <p className="text-base font-semibold text-foreground">{lang.name}</p>
            {lang.level && (
              <p className="text-base text-muted mt-1">{lang.level}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

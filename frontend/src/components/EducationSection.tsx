import type { SectionContent } from "@/lib/content/types";
import { parseEducation } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";
import { BookOpen, GraduationCap } from "lucide-react";
import { CardIcon } from "@/components/CardIcon";

type EducationSectionProps = {
  section: SectionContent;
};

/** Renders Education entries as a stack of cards (degree + optional bullets). */
export function EducationSection({ section }: EducationSectionProps) {
  const blocks = parseEducation(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="space-y-4">
        {blocks.map((block, i) => (
          <div key={i} className="card-tile cv-detail-card">
            <CardIcon icon={block.institution ? GraduationCap : BookOpen} />
            <div className="cv-detail-content">
              <p className="text-base font-semibold text-foreground">{block.title}</p>
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
          </div>
        ))}
      </div>
    </section>
  );
}

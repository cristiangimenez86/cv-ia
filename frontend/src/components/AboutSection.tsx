import type { SectionContent } from "@/lib/content/types";
import { extractAboutKpis, splitParagraphs } from "@/lib/markdown/about";
import { SectionHeading } from "@/components/sectionIcons";

type AboutSectionProps = {
  section: SectionContent;
};

/**
 * Renders the About section as a recruiter-scannable hero:
 * - Optional KPI strip (when ≥ 2 numeric highlights are detected).
 * - Lead paragraph in larger type.
 * - Subsequent paragraphs in muted body type.
 *
 * KPIs come from the section frontmatter when authored; otherwise we fall back
 * to a heuristic extracted from the body text (see `lib/markdown/about`).
 */
export function AboutSection({ section }: AboutSectionProps) {
  const body = section.body ?? "";
  const paragraphs = splitParagraphs(body);
  const kpis =
    section.kpis && section.kpis.length > 0 ? section.kpis : extractAboutKpis(body);
  const showKpis = kpis.length >= 2;
  const [lead, ...rest] = paragraphs;

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      {showKpis && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {kpis.map((kpi, i) => (
            <div
              key={`${kpi.value}-${i}`}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <dt className="text-lg font-semibold text-foreground leading-tight">
                {kpi.value}
              </dt>
              {kpi.caption && (
                <dd className="text-xs text-muted mt-0.5 leading-snug">
                  {kpi.caption}
                </dd>
              )}
            </div>
          ))}
        </dl>
      )}
      {lead ? (
        <p className="text-base leading-relaxed text-foreground">{lead}</p>
      ) : (
        <p className="text-muted text-sm">—</p>
      )}
      {rest.map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-foreground mt-3">
          {p}
        </p>
      ))}
    </section>
  );
}

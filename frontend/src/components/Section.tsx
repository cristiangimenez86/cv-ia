import ReactMarkdown from "react-markdown";
import type { SectionContent as SectionContentType } from "@/lib/content/types";
import { SectionHeading } from "@/components/sectionIcons";

type Props = {
  section: SectionContentType;
};

/**
 * Renders a CV section with anchor and markdown body.
 * Content comes from /content; no hardcoded CV text.
 */
export function Section({ section }: Props) {
  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="prose prose-neutral dark:prose-invert max-w-none w-full min-w-0 text-foreground">
        {section.body ? (
          <ReactMarkdown>{section.body}</ReactMarkdown>
        ) : (
          <p className="text-muted text-sm">—</p>
        )}
      </div>
    </section>
  );
}

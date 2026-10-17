import type { SectionContent } from "@/lib/content/types";
import { splitParagraphs } from "@/lib/markdown/about";
import { SectionHeading } from "@/components/sectionIcons";

type AboutSectionProps = {
  section: SectionContent;
};

/** Renders the authored profile copy alongside a compact summary of existing focus areas. */
export function AboutSection({ section }: AboutSectionProps) {
  const body = section.body ?? "";
  const paragraphs = splitParagraphs(body);
  const [lead, ...rest] = paragraphs;
  const es = section.title === "Sobre mí";

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="cv-about-grid">
        <div className="cv-about-copy">
          {lead ? <p>{lead}</p> : <p>—</p>}
          {rest.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <aside className="cv-focus">
          <span className="cv-eyebrow">{es ? "Áreas de trabajo" : "Focus areas"}</span>
          <ul>
            {(es
              ? ["Backend y arquitectura .NET", "Cloud e integraciones", "Desarrollo full stack", "IA generativa aplicada"]
              : [".NET backend and architecture", "Cloud and integrations", "Full stack development", "Applied generative AI"]
            ).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </aside>
      </div>
    </section>
  );
}

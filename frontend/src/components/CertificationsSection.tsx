import type { SectionContent } from "@/lib/content/types";
import { parseCertifications } from "@/lib/markdown/sections";
import { SectionHeading } from "@/components/sectionIcons";

type CertificationsSectionProps = {
  section: SectionContent;
};

/** Renders Certifications as a 2-column card grid. */
export function CertificationsSection({ section }: CertificationsSectionProps) {
  const certs = parseCertifications(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certs.map((cert, i) => (
          <div key={i} className="card-tile">
            <p className="text-base font-semibold text-foreground">{cert.name}</p>
            <p className="text-base text-muted mt-1">{cert.date}</p>
            {cert.id && (
              <p className="text-base text-muted mt-0.5">ID: {cert.id}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

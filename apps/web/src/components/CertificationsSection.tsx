import type { SectionContent } from "@/lib/content/types";

type CertificationsSectionProps = {
  section: SectionContent;
};

type Certification = {
  name: string;
  date: string;
  id?: string;
};

/**
 * Parses certifications markdown: - Name — Date (ID: xxx)
 */
function parseCertifications(body: string): Certification[] {
  if (!body?.trim()) return [];
  const sep = /\s+[—\u2013\u2014-]\s+/;
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => {
      const content = l.replace(/^-\s*/, "").trim();
      const m = content.match(sep);
      if (!m) return { name: content, date: "", id: undefined };
      const idx = content.indexOf(m[0]);
      const name = content.slice(0, idx).trim();
      const rest = content.slice(idx + m[0].length).trim();
      const idMatch = rest.match(/\(ID:\s*([^)]+)\)/);
      const date = idMatch ? rest.replace(/\s*\(ID:\s*[^)]+\)\s*/, "").trim() : rest;
      return { name, date, id: idMatch?.[1] };
    });
}

const CARD_CLASS =
  "rounded-xl border border-border bg-surface p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

/**
 * Renders Certifications section with 2-column card grid.
 */
export function CertificationsSection({ section }: CertificationsSectionProps) {
  const certs = parseCertifications(section.body ?? "");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {section.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certs.map((cert, i) => (
          <div key={i} className={CARD_CLASS}>
            <p className="text-sm font-semibold text-foreground">
              {cert.name}
            </p>
            <p className="text-sm text-muted mt-1">{cert.date}</p>
            {cert.id && (
              <p className="text-sm text-muted mt-0.5">
                ID: {cert.id}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

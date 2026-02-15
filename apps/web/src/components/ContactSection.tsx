import type { SectionContent, Profile } from "@/lib/content/types";

type ContactSectionProps = {
  section: SectionContent;
  profile?: Profile;
  locale: "es" | "en";
};

type ContactField = {
  label: string;
  value: string;
};

/**
 * Parses contact markdown: - Label: value
 */
function parseContactFields(body: string): ContactField[] {
  if (!body?.trim()) return [];
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => {
      const content = l.replace(/^-\s*/, "").trim();
      const colonIdx = content.indexOf(":");
      if (colonIdx >= 0) {
        return {
          label: content.slice(0, colonIdx).trim(),
          value: content.slice(colonIdx + 1).trim(),
        };
      }
      return null;
    })
    .filter((f): f is ContactField => f !== null && !!f.value);
}

const CARD_CLASS =
  "rounded-xl border border-border bg-surface p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

/**
 * Renders Contact section with card layout.
 * Fields from markdown, buttons use profile links.
 */
export function ContactSection({ section, profile, locale }: ContactSectionProps) {
  const fields = parseContactFields(section.body ?? "");
  const contactLabel = locale === "es" ? "Contactar" : "Contact me";
  const linkedIn = profile?.links?.find((l) => l.label === "LinkedIn");
  const github = profile?.links?.find((l) => l.label === "GitHub");

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        {section.title}
      </h2>
      <div className={CARD_CLASS}>
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i}>
              <span className="text-sm font-semibold text-foreground">
                {field.label}:
              </span>{" "}
              <span className="text-sm text-muted">{field.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-divider">
          {profile?.email && (
            <a
              href={`mailto:${profile.email}`}
              className="profile-card-btn profile-card-btn-primary inline-flex h-9 px-4 text-sm font-semibold rounded-lg bg-primary text-primary-foreground shadow-sm items-center justify-center"
            >
              {contactLabel}
            </a>
          )}
          {linkedIn && (
            <a
              href={linkedIn.href}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-card-btn inline-flex h-9 px-4 text-sm font-semibold rounded-lg bg-surface-2 text-foreground border border-border items-center justify-center"
            >
              LinkedIn
            </a>
          )}
          {github && (
            <a
              href={github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-card-btn inline-flex h-9 px-4 text-sm font-semibold rounded-lg bg-surface-2 text-foreground border border-border items-center justify-center"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

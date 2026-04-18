import type { SectionContent, Profile } from "@/lib/content/types";
import { parseContactFields } from "@/lib/markdown/sections";
import { getWhatsAppUrl } from "@/lib/profile";
import { SectionHeading } from "@/components/sectionIcons";

type ContactSectionProps = {
  section: SectionContent;
  profile?: Profile;
  locale: "es" | "en";
};

/* These contact channels are already covered by the action buttons below, so we
   hide them in the field list to avoid duplication. */
const REDUNDANT_FIELDS = new Set(["whatsapp", "linkedin", "github"]);

const SECONDARY_BUTTON_CLASS =
  "profile-card-btn inline-flex h-9 px-4 text-sm font-semibold rounded-lg bg-surface-2 text-foreground border border-border items-center justify-center";

/** Renders Contact info card + action buttons (email + social links). */
export function ContactSection({ section, profile, locale }: ContactSectionProps) {
  const fields = parseContactFields(section.body ?? "").filter(
    (f) => !REDUNDANT_FIELDS.has(f.label.trim().toLowerCase()),
  );
  const contactLabel = locale === "es" ? "Contactar" : "Contact me";
  const linkedIn = profile?.links?.find((l) => l.label === "LinkedIn");
  const github = profile?.links?.find((l) => l.label === "GitHub");
  const whatsappUrl = profile?.phone ? getWhatsAppUrl(profile.phone) : null;

  return (
    <section id={section.id} className="scroll-mt-20 w-full min-w-0">
      <SectionHeading id={section.id} title={section.title} />
      <div className="card-tile">
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i}>
              <span className="text-base font-semibold text-foreground">
                {field.label}:
              </span>{" "}
              <span className="text-base text-muted">{field.value}</span>
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
              className={SECONDARY_BUTTON_CLASS}
            >
              LinkedIn
            </a>
          )}
          {github && (
            <a
              href={github.href}
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_BUTTON_CLASS}
            >
              GitHub
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_BUTTON_CLASS}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

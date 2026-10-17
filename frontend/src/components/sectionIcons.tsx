import {
  Award,
  BadgeCheck,
  Briefcase,
  Code2,
  GraduationCap,
  Languages,
  Mail,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * Map of canonical CV section ids → lucide icon component.
 * Keep keys aligned with `content/site.json`'s `sectionsOrder` and the
 * dispatch in `frontend/src/app/[locale]/page.tsx`. Unknown ids fall back
 * to an icon-less heading (see `SectionHeading`).
 */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  about: User,
  "core-skills": Code2,
  "key-achievements": Award,
  experience: Briefcase,
  education: GraduationCap,
  certifications: BadgeCheck,
  languages: Languages,
  contact: Mail,
};

type SectionHeadingProps = {
  id: string;
  title: string;
  className?: string;
};

/**
 * Shared section heading: optional icon + h2.
 * Icon is decorative (`aria-hidden`). When the section id is not in
 * SECTION_ICONS, only the h2 is rendered (backwards compatible).
 */
export function SectionHeading({ id, title, className = "" }: SectionHeadingProps) {
  const labels: Record<string, [string, string]> = {
    about: ["01 / Perfil", "01 / Profile"],
    "core-skills": ["02 / Herramientas", "02 / Tools"],
    experience: ["03 / Trayectoria", "03 / Career"],
    "key-achievements": ["04 / Logros", "04 / Highlights"],
    education: ["05 / Formación", "05 / Education"],
    certifications: ["06 / Certificaciones", "06 / Credentials"],
    languages: ["07 / Idiomas", "07 / Languages"],
    contact: ["08 / Contacto", "08 / Contact"],
  };
  const spanishTitles = new Set(["Sobre mí", "Habilidades", "Logros", "Experiencia", "Educación", "Certificaciones", "Idiomas", "Contacto"]);
  const label = labels[id]?.[spanishTitles.has(title) ? 0 : 1] ?? "CV";
  return (
    <div className={`cv-section-heading ${className}`}>
      <span className="cv-eyebrow" aria-hidden="true">{label}</span>
      <h2>{title}</h2>
    </div>
  );
}

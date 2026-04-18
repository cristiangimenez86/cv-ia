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
  const Icon = SECTION_ICONS[id];
  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      {Icon ? (
        <Icon
          size={20}
          className="text-primary shrink-0"
          aria-hidden
        />
      ) : null}
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

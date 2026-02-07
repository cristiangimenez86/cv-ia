/**
 * Content types for CV site config and section data loaded from /content.
 */

export type Locale = "es" | "en";

/** Picks the value for the given locale, falling back to English. */
export function getLocalized<T extends Record<Locale, string>>(
  obj: T,
  locale: Locale
): string {
  return obj[locale] ?? obj.en;
}

export interface SectionTitle {
  en: string;
  es: string;
}

export interface RequiredSection {
  id: string;
  title: SectionTitle;
}

export interface ProfileLink {
  label: string;
  href: string;
}

export interface Profile {
  fullName: string;
  headline: SectionTitle;
  location: SectionTitle;
  email: string;
  phone?: string;
  links: ProfileLink[];
  photoSrc: string;
}

export interface ExperienceCompany {
  name: string;
  logo: string;
  url: string;
}

export interface SiteConfig {
  projectName: string;
  defaultLocale: Locale;
  languages: Locale[];
  sectionsOrder: string[];
  requiredSections: RequiredSection[];
  navSections: string[];
  profile?: Profile;
  experienceCompanies?: ExperienceCompany[];
}

export interface SectionContent {
  id: string;
  title: string;
  body: string;
}

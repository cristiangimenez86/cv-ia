import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { loadSiteConfig, loadSectionsForLocale } from "@/lib/content/loader";
import type {
  ExperienceCompany,
  Locale,
  Profile,
  SectionContent,
  SiteConfig,
} from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";
import { PUBLIC_API_BASE_URL, publicApiBearer, publicApiUrl } from "@/lib/publicApi";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { CertificationsSection } from "@/components/CertificationsSection";
import { CoreSkillsSection } from "@/components/CoreSkillsSection";
import { EducationSection } from "@/components/EducationSection";
import { KeyAchievementsSection } from "@/components/KeyAchievementsSection";
import { LanguagesSection } from "@/components/LanguagesSection";
import { ContactSection } from "@/components/ContactSection";
import { ProfileCard } from "@/components/ProfileCard";

const VALID_LOCALES: Locale[] = ["es", "en"];

type SectionRenderContext = {
  locale: Locale;
  companies?: ExperienceCompany[];
  profile?: Profile;
};

type SectionRenderer = (
  section: SectionContent,
  ctx: SectionRenderContext,
) => ReactNode;

/**
 * Maps a `section.id` from `content/site.json` to the component that renders
 * it. Adding a new section type is a one-line entry here; sections without an
 * entry fall back to the generic `<Section>` renderer below.
 */
const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  about: (section) => <AboutSection section={section} />,
  experience: (section, { companies }) => (
    <ExperienceSection section={section} companies={companies} />
  ),
  "core-skills": (section) => <CoreSkillsSection section={section} />,
  "key-achievements": (section) => <KeyAchievementsSection section={section} />,
  education: (section) => <EducationSection section={section} />,
  certifications: (section) => <CertificationsSection section={section} />,
  languages: (section) => <LanguagesSection section={section} />,
  contact: (section, { profile, locale }) => (
    <ContactSection section={section} profile={profile} locale={locale} />
  ),
};

function renderSection(section: SectionContent, ctx: SectionRenderContext): ReactNode {
  const renderer = SECTION_RENDERERS[section.id];
  return renderer ? renderer(section, ctx) : <Section section={section} />;
}

function isValidLocale(value: string): value is Locale {
  return VALID_LOCALES.includes(value as Locale);
}

/** Vertical rhythm + divider between stacked main sections (not first). */
function SectionSpacing({
  showDivider,
  children,
}: {
  showDivider: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        showDivider
          ? "min-w-0 mt-12 border-t border-border pt-12"
          : "min-w-0"
      }
    >
      {children}
    </div>
  );
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return { title: "CV" };
  }
  const config = loadSiteConfig();
  const headline = config.profile
    ? getLocalized(config.profile.headline, locale)
    : null;
  const title = config.profile?.fullName ?? config.projectName;
  const description = headline
    ? `${title} — ${headline}`
    : `${title} | CV`;

  /* hreflang + canonical help search engines index each locale variant
     separately and pick the right one per visitor. `x-default` points to
     the configured defaultLocale so users with unsupported browser
     languages land on a predictable page. */
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl =
    rawSiteUrl && rawSiteUrl.length > 0
      ? rawSiteUrl.replace(/\/$/, "")
      : "http://localhost:3000";
  const languages: Record<string, string> = {};
  for (const lang of VALID_LOCALES) {
    languages[lang] = `${siteUrl}/${lang}`;
  }
  languages["x-default"] = `${siteUrl}/${config.defaultLocale}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages,
    },
  };
}

/**
 * CV page for a given locale. Renders all sections from content following sectionsOrder.
 * Header shows only navSections; content comes from /content (no hardcoded CV text).
 * Layout: full-width sticky header; below it a centered wide container (max 1440px) with 2 columns on lg+
 * (left sticky sidebar, right content). Mobile: single column stacked.
 */
export default async function LocalePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const config: SiteConfig = loadSiteConfig();
  const sections = loadSectionsForLocale(config, localeParam);
  const cvPdfFetchUrl = publicApiUrl(`/api/v1/cv?lang=${localeParam}`);
  const browserBearer = publicApiBearer();
  const cvPdfAccessToken = PUBLIC_API_BASE_URL ? browserBearer : undefined;

  const renderCtx: SectionRenderContext = {
    locale: localeParam,
    companies: config.experienceCompanies,
    profile: config.profile,
  };

  const mainSections = sections.map((section, index) => (
    <SectionSpacing key={section.id} showDivider={index > 0}>
      {renderSection(section, renderCtx)}
    </SectionSpacing>
  ));

  return (
    <>
      <Header
        config={config}
        locale={localeParam}
        cvPdfFetchUrl={cvPdfFetchUrl}
        cvPdfAccessToken={cvPdfAccessToken}
      />
      <main className="w-full pt-6 pb-8">
        <div className="max-w-[var(--max-content-width)] mx-auto px-4 md:px-6 w-full">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] gap-6 lg:gap-8">
            {config.profile && (
              <div className="relative">
                {/* Spacer: keeps grid flow; fixed card overlays on lg */}
                <div className="hidden lg:block lg:w-[var(--sidebar-width)] lg:shrink-0" aria-hidden />
                <div
                  className={`hidden lg:block lg:fixed lg:left-[var(--sidebar-left)] lg:top-[var(--sidebar-offset)] lg:w-[var(--sidebar-width)] lg:z-10`}
                >
                  <ProfileCard
                    profile={config.profile}
                    locale={localeParam}
                    cvPdfFetchUrl={cvPdfFetchUrl}
                    cvPdfAccessToken={cvPdfAccessToken}
                  />
                </div>
                {/* Mobile: inline card */}
                <div className="lg:hidden">
                  <ProfileCard
                    profile={config.profile}
                    locale={localeParam}
                    cvPdfFetchUrl={cvPdfFetchUrl}
                    cvPdfAccessToken={cvPdfAccessToken}
                  />
                </div>
              </div>
            )}
            <div className="min-w-0 w-full">
              <div className="card w-full p-6 md:p-8">
                <div className="flex flex-col">{mainSections}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { loadSiteConfig, loadSectionsForLocale } from "@/lib/content/loader";
import type { Locale } from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";
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

  const config = loadSiteConfig();
  const sections = loadSectionsForLocale(config, localeParam);
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const cvPdfFetchUrl = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/cv?lang=${localeParam}`
    : `/api/v1/cv?lang=${localeParam}`;
  const cvPdfAccessToken = apiBaseUrl
    ? (process.env.NEXT_PUBLIC_API_ACCESS_TOKEN ?? "").trim()
    : undefined;

  const mainSections: ReactNode[] = [];
  for (const section of sections) {
    const showDivider = mainSections.length > 0;

    let block: ReactNode;
    switch (section.id) {
      case "about":
        block = <AboutSection section={section} />;
        break;
      case "experience":
        block = (
          <ExperienceSection
            section={section}
            companies={config.experienceCompanies}
          />
        );
        break;
      case "core-skills":
        block = <CoreSkillsSection section={section} />;
        break;
      case "key-achievements":
        block = <KeyAchievementsSection section={section} />;
        break;
      case "education":
        block = <EducationSection section={section} />;
        break;
      case "certifications":
        block = <CertificationsSection section={section} />;
        break;
      case "languages":
        block = <LanguagesSection section={section} />;
        break;
      case "contact":
        block = (
          <ContactSection
            section={section}
            profile={config.profile}
            locale={localeParam}
          />
        );
        break;
      default:
        block = <Section section={section} />;
    }

    mainSections.push(
      <SectionSpacing key={section.id} showDivider={showDivider}>
        {block}
      </SectionSpacing>
    );
  }

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

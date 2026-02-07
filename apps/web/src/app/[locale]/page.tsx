import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSiteConfig, loadSectionsForLocale } from "@/lib/content/loader";
import type { Locale } from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { ExperienceSection } from "@/components/ExperienceSection";
import { ProfileCard } from "@/components/ProfileCard";

const VALID_LOCALES: Locale[] = ["es", "en"];

function isValidLocale(value: string): value is Locale {
  return VALID_LOCALES.includes(value as Locale);
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

  return {
    title,
    description,
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

  return (
    <>
      <Header config={config} locale={localeParam} />
      <main className="w-full pt-6 pb-8">
        <div className="max-w-[var(--max-content-width)] mx-auto px-4 md:px-6 w-full">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8">
            {config.profile && (
              <div className="relative">
                {/* Spacer: keeps grid flow; fixed card overlays on lg */}
                <div className="hidden lg:block lg:w-[var(--sidebar-width)] lg:shrink-0" aria-hidden />
                <div
                  className={`hidden lg:block lg:fixed lg:left-[var(--sidebar-left)] lg:top-[var(--sidebar-offset)] lg:w-[var(--sidebar-width)] lg:z-10`}
                >
                  <ProfileCard profile={config.profile} locale={localeParam} />
                </div>
                {/* Mobile: inline card */}
                <div className="lg:hidden">
                  <ProfileCard profile={config.profile} locale={localeParam} />
                </div>
              </div>
            )}
            <div className="min-w-0 w-full">
              <div className="card w-full p-6 md:p-8">
                <div className="space-y-6">
                  {sections.map((section) =>
                    section.id === "experience" ? (
                      <ExperienceSection
                        key={section.id}
                        section={section}
                        companies={config.experienceCompanies}
                      />
                    ) : (
                      <Section key={section.id} section={section} />
                    )
                  )}
                </div>
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

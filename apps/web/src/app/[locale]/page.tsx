import { notFound } from "next/navigation";
import { loadSiteConfig, loadSectionsForLocale } from "@/lib/content/loader";
import type { Locale } from "@/lib/content/types";
import { Header, SIDEBAR_STICKY_TOP } from "@/components/Header";
import { Section } from "@/components/Section";
import { ProfileCard } from "@/components/ProfileCard";

const VALID_LOCALES: Locale[] = ["es", "en"];

function isValidLocale(value: string): value is Locale {
  return VALID_LOCALES.includes(value as Locale);
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

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
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 w-full">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 lg:gap-8">
            {/* Mobile/tablet: ProfileCard above sections, no sticky */}
            {config.profile && (
              <div className="lg:hidden">
                <ProfileCard profile={config.profile} locale={localeParam} />
              </div>
            )}
            {/* Desktop: left column wrapper controls sticky, does not overlap right column */}
            {config.profile && (
              <div className={`hidden lg:block sticky self-start ${SIDEBAR_STICKY_TOP}`}>
                <ProfileCard profile={config.profile} locale={localeParam} />
              </div>
            )}
            <div className="min-w-0 w-full">
              <div className="w-full rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm">
                <div className="space-y-6">
                  {sections.map((section) => (
                    <Section key={section.id} section={section} />
                  ))}
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

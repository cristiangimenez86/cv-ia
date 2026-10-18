import type { Metadata } from "next";
import { ArrowRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { loadSiteConfig, loadSectionsForLocale } from "@/lib/content/loader";
import type { ExperienceCompany, Locale, Profile, SectionContent, SiteConfig } from "@/lib/content/types";
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
import { CvPdfDownloadButton } from "@/components/CvPdfDownloadButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";

const VALID_LOCALES: Locale[] = ["es", "en"];
type PageProps = { params: Promise<{ locale: string }> };

function isValidLocale(value: string): value is Locale {
  return VALID_LOCALES.includes(value as Locale);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { title: "CV" };
  const config = loadSiteConfig();
  const title = config.profile?.fullName ?? config.projectName;
  const headline = config.profile ? getLocalized(config.profile.headline, locale) : null;
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = rawSiteUrl ? rawSiteUrl.replace(/\/$/, "") : "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title,
    description: headline ? `${title} — ${headline}` : `${title} | CV`,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        es: `${siteUrl}/es`,
        en: `${siteUrl}/en`,
        "x-default": `${siteUrl}/${config.defaultLocale}`,
      },
    },
  };
}

function renderSection(
  section: SectionContent,
  context: { locale: Locale; companies?: ExperienceCompany[]; profile?: Profile },
) {
  switch (section.id) {
    case "about": return <AboutSection section={section} />;
    case "experience": return <ExperienceSection section={section} companies={context.companies} />;
    case "core-skills": return <CoreSkillsSection section={section} />;
    case "key-achievements": return <KeyAchievementsSection section={section} />;
    case "education": return <EducationSection section={section} />;
    case "certifications": return <CertificationsSection section={section} />;
    case "languages": return <LanguagesSection section={section} />;
    case "contact": return <ContactSection section={section} profile={context.profile} locale={context.locale} />;
    default: return <Section section={section} />;
  }
}

export default async function LocalePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();

  const config: SiteConfig = loadSiteConfig();
  const sections = loadSectionsForLocale(config, localeParam);
  const displaySections = [...sections].sort((a, b) => {
    if (a.id === "experience" && b.id === "key-achievements") return -1;
    if (a.id === "key-achievements" && b.id === "experience") return 1;
    return 0;
  });
  const achievementsIndex = displaySections.findIndex((section) => section.id === "key-achievements");
  const aboutIndex = displaySections.findIndex((section) => section.id === "about");
  if (achievementsIndex >= 0 && aboutIndex >= 0) {
    const [achievements] = displaySections.splice(achievementsIndex, 1);
    const insertionIndex = displaySections.findIndex((section) => section.id === "about") + 1;
    displaySections.splice(insertionIndex, 0, achievements);
  }
  const cvPdfFetchUrl = publicApiUrl(`/api/v1/cv?lang=${localeParam}`);
  const cvPdfAccessToken = PUBLIC_API_BASE_URL ? publicApiBearer() : undefined;
  const profile = config.profile;
  const es = localeParam === "es";

  return (
    <div className="cv-shell">
      <Header config={config} locale={localeParam} />
      <main id="inicio" className="cv-main">
        <div className="cv-content">
          <div className="cv-topline">
            <span>{es ? "Perfil profesional" : "Professional profile"} <span aria-hidden="true">/</span> {profile?.fullName}</span>
            <div className="cv-topline-controls">
              <ThemeToggle locale={localeParam} />
              <LocaleToggle currentLocale={localeParam} />
            </div>
          </div>
          <header className="cv-hero">
            <span className="cv-eyebrow">{es ? "Ingeniería de software · .NET · Cloud" : "Software engineering · .NET · Cloud"}</span>
            <h1>Senior Software <span>Engineer.</span></h1>
            <p className="cv-hero-copy">
              {es
                ? "Diseño e implemento aplicaciones escalables e integraciones de producto. Trabajo con .NET, Azure y React, con foco en calidad, observabilidad y seguridad."
                : "I design and build scalable applications and product integrations. I work with .NET, Azure, and React, focusing on quality, observability, and security."}
            </p>
            <div className="cv-hero-actions">
              <a className="cv-button" href="#experience">{es ? "Ver experiencia" : "View experience"} <ArrowRight size={16} aria-hidden /></a>
              <a className="cv-button" href={`mailto:${profile?.email ?? ""}`}>{es ? "Contactar" : "Get in touch"} <ArrowRight size={16} aria-hidden /></a>
              <CvPdfDownloadButton fetchUrl={cvPdfFetchUrl} locale={localeParam} accessToken={cvPdfAccessToken} variant="header" downloadLabel={es ? "Descargar PDF" : "Download PDF"} />
            </div>
            {profile && <p className="cv-hero-note"><MapPin size={16} aria-hidden />{getLocalized(profile.location, localeParam)}</p>}
          </header>
          <div className="cv-sections">
            {displaySections.map((section) => (
              <div className="cv-section-wrap" data-section={section.id} key={section.id}>
                {renderSection(section, { locale: localeParam, companies: config.experienceCompanies, profile })}
              </div>
            ))}
          </div>
          <footer className="cv-footer"><span>{profile?.fullName} · Senior Software Engineer</span><span>{es ? "CV · Español · 10.2026" : "CV · English · 10.2026"}</span></footer>
        </div>
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

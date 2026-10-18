import { Mail, MapPin, MessageCircle } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import type { SiteConfig, Locale } from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";
import { getWhatsAppUrl } from "@/lib/profile";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  config: SiteConfig;
  locale: Locale;
};

function navLinkTitle(sectionId: string, locale: Locale, fallback?: string) {
  if (sectionId === "core-skills") return locale === "es" ? "Habilidades" : "Skills";
  return fallback ?? sectionId;
}

export function Header({ config, locale }: Props) {
  const profile = config.profile;
  const es = locale === "es";
  const navItems = [
    { id: "inicio", title: es ? "Inicio" : "Home" },
    ...config.navSections.map((id) => {
      const section = config.requiredSections.find((item) => item.id === id);
      return { id, title: navLinkTitle(id, locale, section?.title?.[locale]) };
    }),
  ];

  return (
    <>
      <aside className="cv-sidebar" aria-label={es ? "Navegación del CV" : "CV navigation"}>
        <a className="cv-identity" href="#inicio" aria-label={es ? "Ir al inicio" : "Go to top"}>
          <span className="cv-monogram" aria-hidden="true">CG</span>
          <span><strong>{profile?.fullName ?? config.projectName}</strong><small>Senior Software Engineer</small></span>
        </a>
        <div className="cv-rail-rule" />
        <p className="cv-rail-label">{es ? "Explorar perfil" : "Explore profile"}</p>
        <NavLinks navItems={navItems} />
        <div className="cv-rail-bottom">
          <div className="cv-rail-rule" />
          <p className="cv-rail-label">{es ? "Contacto directo" : "Direct contact"}</p>
          {profile && (
            <div className="cv-rail-contact">
              <a href={`mailto:${profile.email}`}><Mail size={15} aria-hidden /> <span>{profile.email}</span></a>
              {profile.phone && <a href={getWhatsAppUrl(profile.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp: ${profile.phone}`}><MessageCircle size={15} aria-hidden /> <span>{profile.phone}</span></a>}
              <a href="#contact"><MapPin size={15} aria-hidden /> <span>{getLocalized(profile.location, locale)}</span></a>
            </div>
          )}
          <div className="cv-rail-socials">
            {profile?.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
          </div>
          <span className="cv-rail-footer">{es ? "CV · Español · 10.2026" : "CV · English · 10.2026"}</span>
        </div>
      </aside>
      <div className="cv-mobile-bar">
        <a href="#inicio" className="cv-mobile-brand"><span className="cv-monogram" aria-hidden="true">CG</span><strong>{profile?.fullName ?? config.projectName}</strong></a>
        <div className="cv-mobile-controls">
          <ThemeToggle locale={locale} />
          <LocaleToggle currentLocale={locale} />
        </div>
      </div>
    </>
  );
}

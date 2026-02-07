import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";
import { NavLinks } from "@/components/NavLinks";
import type { SiteConfig, Locale } from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";

/** Tailwind class for sidebar sticky top offset (uses CSS var from globals.css). */
export const SIDEBAR_STICKY_TOP = "top-[var(--sidebar-offset)]";

type Props = {
  config: SiteConfig;
  locale: Locale;
};

/**
 * Sticky header per docs/product/header-design.md:
 * - Left: name + headline
 * - Right: nav (scroll-spy) + Download PDF + locale + theme
 */
export function Header({ config, locale }: Props) {
  const navItems = config.navSections
    .map((id) => {
      const section = config.requiredSections?.find((s) => s.id === id);
      const title = section?.title?.[locale] ?? id;
      return { id, title };
    })
    .filter((item) => item.title);

  const headline = config.profile
    ? getLocalized(config.profile.headline, locale)
    : null;

  const downloadLabel = locale === "es" ? "Descargar PDF" : "Download PDF";

  return (
    <header className="header sticky top-0 z-50 w-full bg-surface card-header">
      <div className="max-w-[var(--max-content-width)] mx-auto h-[var(--header-height-mobile)] md:h-[var(--header-height-desktop)] px-4 md:px-6 flex items-center gap-6">
        {/* Left — pl-[7px] aligns with profile card content on mobile and desktop */}
        <div className="min-w-0 flex flex-col justify-center leading-tight pl-[7px]">
          <span className="text-xl font-semibold text-foreground truncate">
            {config.profile?.fullName ?? config.projectName}
          </span>
          {headline ? (
            <span className="text-sm text-muted truncate">{headline}</span>
          ) : null}
        </div>

        {/* Right: nav + actions */}
        <div className="ml-auto flex items-center gap-4 min-w-0">
          <NavLinks navItems={navItems} />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="header-btn-primary h-9 px-4 text-sm font-semibold rounded-lg bg-primary text-primary-foreground shadow-sm flex items-center justify-center"
              aria-label={downloadLabel}
            >
              {downloadLabel}
            </button>

            <LocaleToggle currentLocale={locale} />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

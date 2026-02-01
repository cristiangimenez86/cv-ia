import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleToggle } from "@/components/LocaleToggle";
import type { SiteConfig, Locale } from "@/lib/content/types";

/** Sticky header height: 64px mobile, 72px desktop. Sidebar offset = 88px (72 + 16 spacing). */
export const SIDEBAR_STICKY_TOP = "top-[88px]";

type Props = {
  config: SiteConfig;
  locale: Locale;
};

/**
 * Sticky header (compact, like cv.cristiangimenez.com):
 * - Left: name + subtitle
 * - Right: nav (aligned right) + actions
 * Fixed height: 64px mobile, 72px desktop.
 */
export function Header({ config, locale }: Props) {
  const navItems = config.navSections
    .map((id) => {
      const section = config.requiredSections?.find((s) => s.id === id);
      const title = section?.title?.[locale] ?? id;
      return { id, title };
    })
    .filter((item) => item.title);

  const headline = config.profile?.headline
    ? config.profile.headline[locale] ?? config.profile.headline.en
    : null;

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-border">
      <div className="max-w-[1440px] mx-auto h-16 md:h-[72px] px-4 md:px-6 flex items-center gap-6">
        {/* Left */}
        <div className="min-w-0 flex flex-col justify-center leading-tight">
          <span className="text-xl font-semibold text-foreground truncate">
            {config.profile?.fullName ?? config.projectName}
          </span>
          {headline ? (
            <span className="text-sm opacity-80 truncate">{headline}</span>
          ) : null}
        </div>

        {/* Right side: nav + actions (aligned to the right) */}
        <div className="ml-auto flex items-center gap-4 min-w-0">
          <nav
            className="hidden md:flex items-center gap-6 whitespace-nowrap"
            aria-label="CV sections"
          >
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-foreground hover:text-primary hover:underline whitespace-nowrap"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled
              aria-hidden
              className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground font-medium opacity-60 cursor-not-allowed flex items-center"
            >
              PDF
            </button>

            <LocaleToggle
              currentLocale={locale}
              className="h-9 px-3 text-sm flex items-center text-primary hover:underline"
            />

            <ThemeToggle className="h-9 px-3 text-sm" />
          </div>
        </div>
      </div>
    </header>
  );
}

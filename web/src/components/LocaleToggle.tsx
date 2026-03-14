"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/content/types";

type Props = {
  currentLocale: Locale;
  className?: string;
};

/**
 * Simple es/en toggle. Switches to the other locale keeping the same path.
 */
export function LocaleToggle({ currentLocale, className }: Props) {
  const pathname = usePathname();
  const otherLocale: Locale = currentLocale === "es" ? "en" : "es";
  // Path is /[locale] so replace segment; for root locale page we get /es or /en
  const base = pathname?.replace(/^\/[^/]+/, "") || "";
  const href = `/${otherLocale}${base}`;

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      className={`header-btn-secondary ${className ?? ""}`}
      aria-label={`Switch to ${otherLocale === "es" ? "Spanish" : "English"}`}
    >
      {otherLocale === "es" ? "ES" : "EN"}
    </Link>
  );
}

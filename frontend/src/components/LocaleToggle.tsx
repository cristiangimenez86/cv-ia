"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/content/types";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "@/lib/locale/config";

type Props = {
  currentLocale: Locale;
  className?: string;
};

/**
 * Persists the user's explicit locale choice so the root middleware ("/")
 * honours it on subsequent visits (without HttpOnly: this is a UX preference,
 * not a credential).
 */
function persistLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/**
 * Simple es/en toggle. Switches to the other locale keeping the same path
 * and records the choice in a long-lived cookie so the auto-detection at "/"
 * respects it on future visits.
 */
export function LocaleToggle({ currentLocale, className }: Props) {
  const pathname = usePathname();
  const otherLocale: Locale = currentLocale === "es" ? "en" : "es";
  const base = pathname?.replace(/^\/[^/]+/, "") || "";
  const href = `/${otherLocale}${base}`;

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      onClick={() => persistLocaleCookie(otherLocale)}
      className={`header-btn-secondary ${className ?? ""}`}
      aria-label={`Switch to ${otherLocale === "es" ? "Spanish" : "English"}`}
    >
      {otherLocale === "es" ? "ES" : "EN"}
    </Link>
  );
}

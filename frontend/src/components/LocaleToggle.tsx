"use client";

import Link from "next/link";
import { useEffect } from "react";
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

/** Keeps the current path when changing language and remembers the selection. */
export function LocaleToggle({ currentLocale, className }: Props) {
  const pathname = usePathname();
  const base = pathname?.replace(/^\/[^/]+/, "") || "";

  useEffect(() => {
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  return (
    <div className={`cv-locale-switch ${className ?? ""}`} role="group" aria-label={currentLocale === "es" ? "Idioma" : "Language"}>
      {(["es", "en"] as const).map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${base}`}
          prefetch={true}
          scroll={false}
          onClick={() => persistLocaleCookie(locale)}
          className={currentLocale === locale ? "is-active" : ""}
          aria-current={currentLocale === locale ? "page" : undefined}
          hrefLang={locale}
          lang={locale}
          aria-label={locale === "es" ? "Español" : "English"}
          title={locale === "es" ? "Español" : "English"}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

/**
 * Locale constants shared by the Edge middleware and server code.
 *
 * These MUST stay in sync with `content/site.json` (`languages` and
 * `defaultLocale`). They live in a dedicated module because the middleware
 * runs on the Edge runtime and cannot read from the filesystem.
 */

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

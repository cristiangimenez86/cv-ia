import { NextResponse, type NextRequest } from "next/server";
import { resolveLocale } from "@/lib/locale/resolveLocale";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/locale/config";

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Two responsibilities, one file:
 *
 * 1. **Root auto-detect (`/`)**: negotiate the best locale from the
 *    `NEXT_LOCALE` cookie (wins when valid) or `Accept-Language`, then 307
 *    redirect to `/<locale>`. Response carries `Vary: Accept-Language, Cookie`
 *    and `Cache-Control: private, no-cache` so shared caches never pin the
 *    wrong target.
 * 2. **Locale-aware `<html lang>` (`/es`, `/en`, and their subpaths)**:
 *    forward an `x-locale` request header that `app/layout.tsx` reads to
 *    render `<html lang={locale}>`. This preserves the existing ATS / SEO
 *    guarantees from `ats-ssg-cv-guardrails`.
 *
 * API routes, `/_next/*`, and static assets are excluded via the `matcher`.
 */
export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    return redirectFromRoot(request);
  }

  return propagateLocaleHeader(pathname);
}

function redirectFromRoot(request: NextRequest): NextResponse {
  const cookieValue = request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null;
  const acceptLanguage = request.headers.get("accept-language");

  const locale = resolveLocale({
    acceptLanguage,
    cookieValue,
    supported: SUPPORTED_LOCALES,
    fallback: DEFAULT_LOCALE,
  });

  const target = new URL(`/${locale}`, request.url);
  const response = NextResponse.redirect(target, 307);

  response.headers.set("Vary", "Accept-Language, Cookie");
  response.headers.set("Cache-Control", "private, no-cache");

  if (process.env.NODE_ENV !== "production") {
    response.headers.set("X-Resolved-Locale", locale);
  }

  return response;
}

function propagateLocaleHeader(pathname: string): NextResponse {
  const segment = pathname.split("/")[1] ?? "";
  const locale: SupportedLocale = isSupportedLocale(segment)
    ? segment
    : DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export const config = {
  matcher: ["/", "/es", "/en", "/es/:path*", "/en/:path*"],
};

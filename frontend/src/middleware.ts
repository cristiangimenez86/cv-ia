import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_LOCALES = ["es", "en"] as const;

/**
 * Extracts locale from pathname and sets x-locale header for root layout (html lang).
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segment = pathname.split("/")[1];
  const locale = VALID_LOCALES.includes(segment as (typeof VALID_LOCALES)[number])
    ? segment
    : "en";

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: ["/", "/es", "/en", "/es/:path*", "/en/:path*"],
};

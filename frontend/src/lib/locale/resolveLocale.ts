/**
 * Pure locale negotiation used by the root middleware.
 *
 * Priority:
 *   1. A previously persisted cookie value, if it is one of the supported locales.
 *   2. The browser's Accept-Language header, negotiated against the supported set.
 *   3. The provided fallback.
 *
 * This module has no Next.js / DOM dependencies so it can be unit-tested with the
 * Node test runner and reused from the server middleware.
 */

import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";

export type ResolveLocaleInput = {
  acceptLanguage: string | null | undefined;
  cookieValue: string | null | undefined;
  supported: readonly string[];
  fallback: string;
};

export function resolveLocale({
  acceptLanguage,
  cookieValue,
  supported,
  fallback,
}: ResolveLocaleInput): string {
  if (cookieValue && supported.includes(cookieValue)) {
    return cookieValue;
  }

  const headerValue =
    typeof acceptLanguage === "string" ? acceptLanguage.trim() : "";
  if (headerValue.length === 0) {
    return fallback;
  }

  // Negotiator safely parses malformed headers and returns an ordered list.
  let requested: string[] = [];
  try {
    const negotiator = new Negotiator({
      headers: { "accept-language": headerValue },
    });
    requested = negotiator.languages();
  } catch {
    return fallback;
  }

  // Strip the wildcard; intl-localematcher treats '*' as "any" and would
  // return the first supported locale instead of our explicit fallback.
  const cleaned = requested.filter((tag) => tag && tag !== "*");
  if (cleaned.length === 0) {
    return fallback;
  }

  try {
    return match(cleaned, supported as string[], fallback);
  } catch {
    return fallback;
  }
}

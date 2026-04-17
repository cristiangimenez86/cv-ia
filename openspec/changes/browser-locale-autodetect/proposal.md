## Why

Today the site always redirects `/` to `/{defaultLocale}` (hardcoded to `en` in `content/site.json`). A Spanish-speaking recruiter landing on `cv.cristiangimenez.com` is shown the English CV even though their browser clearly advertises `Accept-Language: es-*`, and has to discover the "ES" toggle in the header to switch. Once they do, their preference is lost on the next visit — they land on `/en` again. We want a more welcoming, first-impression-friendly behavior that respects both the browser signal and the visitor's explicit choice.

## What Changes

Affects **frontend only**. No backend, API contract, or content changes.

- Add a Next.js 16 `proxy.ts` (the renamed `middleware.ts` convention) in `/frontend/src` that, on a request to `/` (the root path only), picks the best locale using a standard algorithm:
  1. Honor the `NEXT_LOCALE` cookie if present and still valid.
  2. Otherwise, negotiate against `Accept-Language` using the supported set (`es`, `en`) with `en` as the fallback.
  3. Redirect (`307`) to `/{locale}` with a `Vary: Accept-Language, Cookie` header.
- Update `LocaleToggle` to write the `NEXT_LOCALE` cookie (`Max-Age=1y`, `SameSite=Lax`, `Secure` in prod, `Path=/`) whenever the visitor switches languages, so the sticky preference is honored on subsequent visits landing on `/`.
- Keep explicit `/es` and `/en` URLs fully navigable and canonical; the proxy does NOT rewrite, interfere with, or redirect away from them. Deep links to `/es/...` and `/en/...` stay stable.
- Add `<link rel="alternate" hreflang>` tags (including `x-default → /en`) to both locale pages so search engines index each locale correctly and do not treat the auto-redirect as cloaking.
- Document the behavior (cookie name, cache/CDN implications, `Vary` header) alongside existing product/architecture docs.

## Non-goals

- No new runtime dependencies beyond `@formatjs/intl-localematcher` + `negotiator` (standard Next.js i18n negotiation).
- No persistence server-side (the cookie lives only in the visitor's browser).
- No changes to chat, content, backend, or API contracts.
- No switch away from the current `/[locale]/...` URL structure.
- No automatic locale switching after the visitor is on a locale page (toggle remains the only in-session switch).

## Capabilities

### New Capabilities
- `browser-locale-autodetect`: root-path locale negotiation from `Accept-Language` and a persistent cookie, with explicit locale routes, `hreflang` SEO, and CDN-safe caching semantics.

### Modified Capabilities
<!-- None: existing ATS/SSG guardrails for /es and /en pages are unchanged. -->

## Impact

- **Frontend**: new `frontend/src/proxy.ts` (Next.js 16 Proxy) + `frontend/src/lib/locale/config.ts` shared constants, updates to `frontend/src/components/LocaleToggle.tsx` and `frontend/src/app/page.tsx` (root becomes a safety net under the proxy), new `hreflang` metadata in `frontend/src/app/[locale]/page.tsx`, a small locale negotiation utility module and its unit tests.
- **Dependencies**: add `@formatjs/intl-localematcher` and `negotiator` (plus `@types/negotiator`).
- **Caching / CDN**: the root response now varies by `Accept-Language` and `Cookie`; document the `Vary` requirement for any reverse-proxy or CDN in front of the app.
- **SEO**: search engines see canonical `/es` and `/en` pages with proper `hreflang`; `x-default` points at `/en`.
- **QA**: needs manual verification in both locales and with / without the cookie.

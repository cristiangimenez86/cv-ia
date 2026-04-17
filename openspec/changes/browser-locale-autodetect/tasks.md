# Implementation tasks

## 1. Pure locale negotiation module

- [x] 1.1 Add `@formatjs/intl-localematcher`, `negotiator`, and `@types/negotiator` to `frontend/package.json` via `npm install`. Pin exact versions.
- [x] 1.2 Create `frontend/src/lib/locale/resolveLocale.ts` exporting a pure function `resolveLocale({ acceptLanguage, cookieValue, supported, fallback }): string`. It SHALL: (a) trust `cookieValue` only when it is in `supported`; (b) otherwise negotiate against `acceptLanguage` using `negotiator` + `@formatjs/intl-localematcher`; (c) fall back to `fallback` when nothing matches.
- [x] 1.3 Add unit tests at `frontend/tests/resolve-locale.test.mjs` (Node test runner) covering: cookie-wins, ES-browser-no-cookie → es, EN-browser-no-cookie → en, unknown-cookie-ignored, empty-Accept-Language → fallback, unsupported-Accept-Language → fallback, malformed header → fallback.

## 2. Proxy wiring (Next.js 16)

- [x] 2.1 Extend `frontend/src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`; file pre-existed to propagate the `x-locale` header used by `app/layout.tsx`) so the exported `proxy(request)` function branches on `request.nextUrl.pathname`: on `/` it reads `NEXT_LOCALE` cookie + `Accept-Language`, calls `resolveLocale(...)` with `supported = ["es", "en"]` and `fallback = DEFAULT_LOCALE` (from a small `frontend/src/lib/locale/config.ts` constants module that mirrors `content/site.json`), and returns `NextResponse.redirect(new URL(\`/${locale}\`, request.url), 307)`; on `/es`, `/en`, `/es/:path*`, `/en/:path*` it preserves the pre-existing behaviour of `NextResponse.next()` with `x-locale: <locale>`. Matcher becomes `["/", "/es", "/en", "/es/:path*", "/en/:path*"]`.
- [x] 2.2 Set the following headers on the redirect response: `Vary: Accept-Language, Cookie` and `Cache-Control: private, no-cache`. In non-production, also set `X-Resolved-Locale: <locale>` for debugging.
- [x] 2.3 Keep the `frontend/src/app/page.tsx` root as a safety net: if the proxy is somehow bypassed (e.g. in a test harness), it SHALL still redirect to `/{defaultLocale}` as today. No user-facing behavior change here.

## 3. Toggle persists the cookie

- [x] 3.1 Update `frontend/src/components/LocaleToggle.tsx` so the `<Link>` click handler (before navigation) writes a `NEXT_LOCALE` cookie with the target locale. Attributes: `Path=/`, `Max-Age=31536000`, `SameSite=Lax`, and `Secure` when `window.location.protocol === 'https:'`. Do NOT set `HttpOnly` (cookie is a UX preference).
- [x] 3.2 Keep the link navigation itself unchanged (client-side Next router navigation to `/{other}/...`) so the component remains lightweight and bot-navigable.

## 4. SEO: hreflang + canonical

- [x] 4.1 Update the `generateMetadata` function in `frontend/src/app/[locale]/page.tsx` (the nearest metadata hook covering both locale routes) to emit `alternates.languages` with entries for each supported locale plus `x-default`, and `alternates.canonical` set to the current locale URL (not the bare `/`). Base URL comes from `process.env.NEXT_PUBLIC_SITE_URL` with a localhost fallback.
- [x] 4.2 Verify the rendered HTML at `/es` and `/en` includes three `<link rel="alternate" hreflang="...">` elements (`es`, `en`, `x-default → /en`) plus a self-canonical tag. (Verified via `Invoke-WebRequest http://localhost:3000/en` showing `<link rel="canonical" …/en>`, `<link rel="alternate" hrefLang="es"/>`, `<link rel="alternate" hrefLang="en"/>`, `<link rel="alternate" hrefLang="x-default" …/en>` — React renders the attribute camelCased as `hrefLang`, which browsers and Googlebot treat as equivalent to `hreflang`.)

## 5. Docs and ops

- [x] 5.1 Add a short section to `docs/architecture/` (or `docs/product/` if more appropriate) describing the cookie name (`NEXT_LOCALE`), the `Vary` header contract, and what any CDN / reverse-proxy in front of the app must honor at the root path. (Added `docs/architecture/locale-autodetect.md`.)
- [x] 5.2 Update `README.md` with a one-liner under "Local development" noting that the root `/` behavior now depends on `Accept-Language` and the `NEXT_LOCALE` cookie.

## 6. Verification

- [x] 6.1 Run `npm run lint` (`tsc --noEmit`) from `frontend/` and confirm it exits with code 0.
- [x] 6.2 Run `npm test` from `frontend/` and confirm all existing tests plus the new `resolve-locale.test.mjs` pass. (36 tests pass, including 10 new `resolve-locale` cases.)
- [x] 6.3 Run `openspec validate browser-locale-autodetect --strict` and confirm it reports the change as valid.
- [ ] 6.4 Manual QA in a fresh browser / incognito: (a) set browser language to Spanish, open `/` → lands on `/es`; (b) click the EN toggle → cookie `NEXT_LOCALE=en` appears in DevTools → Application → Cookies; (c) close the tab, reopen `/` → lands on `/en`; (d) visit `/es/experience` directly → page loads with Spanish content, the proxy does NOT redirect; (e) confirm `View Source` on `/en` contains the three `<link rel="alternate" hreflang>` tags; (f) confirm `/api/...` routes, `/_next/*`, and static assets are not affected by the proxy.

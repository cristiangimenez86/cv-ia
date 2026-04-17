## Context

The site is a Next.js App Router application (TypeScript strict) with content authored under `/content/{en|es}/sections/*.md`. Routing today is:

- `frontend/src/app/page.tsx` (the root `/`) reads `content/site.json → defaultLocale` and calls `redirect(\`/${defaultLocale}\`)`. There is **no** `proxy.ts` (Next.js 16's renamed `middleware.ts`) in the project today.
- `frontend/src/app/[locale]/...` renders the CV for the requested locale.
- `frontend/src/components/LocaleToggle.tsx` is a simple `<Link>` to `/{other}/...`; it does not persist any preference.
- Supported locales are declared in `content/site.json`: `languages: ["es", "en"]`, `defaultLocale: "en"`.
- The locale pages are covered by `ats-ssg-cv-guardrails` — SSR/SSG semantic HTML, correct `lang` attribute, no JS-only rendering. This change must not break those guarantees.

Stakeholders: recruiters (primary; expect content in their language immediately), search engines (need canonical URLs + `hreflang`), and the visitor after they have used the ES/EN toggle (expects the choice to stick).

## Goals / Non-Goals

**Goals:**

- When a new visitor lands on `/`, send them to the locale that best matches their browser's `Accept-Language` header from the supported set, falling back to `en`.
- When a returning visitor who has previously used the ES/EN toggle lands on `/`, honor that choice via a `NEXT_LOCALE` cookie (the toggle's preference wins over `Accept-Language`).
- Keep `/es` and `/en` as canonical, stable URLs that bots and shared links can rely on unchanged.
- Emit `<link rel="alternate" hreflang>` pairs (plus `x-default`) so Google and other engines do not treat the auto-redirect as cloaking.
- Ship the change as a small, well-scoped Next.js 16 Proxy (`frontend/src/proxy.ts`, the renamed successor of `middleware.ts`) with unit tests for the pure negotiation logic.

**Non-Goals:**

- Automatic locale switching once the visitor is already on a locale page (the toggle remains the only in-session switch).
- Full i18n routing with locale prefixes negotiated for every route; we only care about the bare `/` entry point.
- Persistence beyond the visitor's browser (no server-side user records).
- Swapping the URL structure to a path-less convention (e.g. `/` serving both locales through content-negotiation).

## Decisions

### 1. Source of truth: Accept-Language first, cookie overrides

On request to `/`, the proxy computes the target locale in this order:

1. If the request carries a `NEXT_LOCALE` cookie whose value is in the supported set (`["es", "en"]`), use that.
2. Otherwise, negotiate the best match between `Accept-Language` and the supported set, with `en` as the default if no acceptable match exists.

The toggle-expressed preference (cookie) deliberately takes precedence over the browser header, because it represents the visitor's explicit latest choice.

**Alternatives considered:**

- *Accept-Language only*: simpler but ignores the returning-visitor experience. Rejected because the whole motivation of the change is that the toggle should stick.
- *Cookie only*: requires every visitor to toggle once to get their language. Rejected because the first visit is exactly when a Spanish-speaking recruiter forms their impression.
- *Let the toggle do both* (set cookie **and** keep root-page redirect dumb): does not solve the first-visit case. Rejected.

### 2. Negotiation library: `@formatjs/intl-localematcher` + `negotiator`

This is the combination the Next.js i18n guide recommends for App-Router proxy/middleware-based routing. It:

- Correctly parses `Accept-Language` quality values (`q=…`) via `negotiator`.
- Implements the RFC 4647 "basic + lookup" matching via `@formatjs/intl-localematcher`, handling fallbacks like `es-AR → es`, `en-GB → en`, and graceful degradation when the header is empty or malformed.

Both are small, well-maintained, and pure JS (safe for both Edge and Node runtimes).

**Alternatives considered:**

- *Hand-rolled parser*: easy to get subtly wrong on `q`-value ordering and `*` wildcards. Rejected for correctness.
- *`accept-language-parser`*: single-purpose library; still requires us to implement matching. Rejected.

### 3. Proxy scope: two responsibilities, one file

The repository already shipped a `proxy.ts` whose single job was to forward an `x-locale` header so `app/layout.tsx` could render `<html lang={locale}>`. That behaviour MUST be preserved (it is relied on by the ATS/SSG guardrails capability). Rather than split the logic across two files (Next.js 16 enforces a single `proxy.ts` per project), the new proxy merges both responsibilities and branches on `request.nextUrl.pathname`:

- **`pathname === '/'`**: run the auto-detect + 307 redirect described in Decision 1, with the caching headers from Decision 5.
- **`pathname` starts with `/es` or `/en`**: extract the locale segment and set the `x-locale` header on a `NextResponse.next()` (no redirect, no rewrite). This keeps the existing SSR/SSG output and `ats-ssg-cv-guardrails` guarantees intact.

The matcher is therefore `["/", "/es", "/en", "/es/:path*", "/en/:path*"]`. API routes (`/api/*`), Next internals (`/_next/*`), and static assets are excluded so shared links, ATS parsers hitting `/en` directly, and cache keys for locale pages behave exactly as today — only the bare `/` gets redirected.

### 4. Cookie attributes

The `NEXT_LOCALE` cookie is set client-side by `LocaleToggle` when the visitor switches:

- `Name`: `NEXT_LOCALE` (Next.js community convention; easy to recognize).
- `Path`: `/`.
- `Max-Age`: 60 \* 60 \* 24 \* 365 (1 year).
- `SameSite`: `Lax` — adequate for a navigation-based preference; avoids the third-party cookie concerns of `None`.
- `Secure`: set in production (`location.protocol === 'https:'`), omitted in local dev.
- Not `HttpOnly`: the toggle is a client component; the cookie is not a security boundary.

**Alternative considered:** setting the cookie from the proxy whenever it redirects. Rejected because the redirect response's `Set-Cookie` would pin the browser-detected language as if the visitor had chosen it explicitly, defeating the "cookie = explicit user preference" rule.

### 5. Redirect semantics: `307` + strong `Vary`

The proxy returns `NextResponse.redirect(url, 307)` with:

- `Vary: Accept-Language, Cookie` — prevents any caching layer from serving the wrong redirect target to the wrong visitor.
- `Cache-Control: private, no-cache` — belt-and-suspenders against shared caches.

`307` (temporary) rather than `308`/`301` because the target is not a permanent rename — it depends on the visitor.

### 6. SEO: `hreflang` + `x-default`

`frontend/src/app/[locale]/page.tsx` (the nearest metadata hook for the locale route) emits:

```html
<link rel="alternate" hreflang="es" href="https://…/es" />
<link rel="alternate" hreflang="en" href="https://…/en" />
<link rel="alternate" hreflang="x-default" href="https://…/en" />
```

Plus each locale page declares its own canonical URL (`/es` or `/en`, not `/`). This satisfies Google's guidance on auto-redirecting and avoids the "cloaking" penalty.

### 7. Testing strategy

The negotiation logic is pulled into a pure module (`resolveLocale({ acceptLanguage, cookieValue, supported, fallback })`) so it can be unit-tested with `node --test` like the other pure modules in this repo. The proxy itself is a thin wrapper that:

- reads the cookie and header from the `NextRequest`,
- calls `resolveLocale`,
- returns a `NextResponse.redirect(...)` with the headers above.

### 8. Next.js 16 naming: `proxy.ts` replaces `middleware.ts`

Starting with Next.js 16 (shipped in this project), the `middleware.ts` convention was renamed to `proxy.ts` and the exported function name from `middleware` to `proxy`. The runtime semantics are equivalent for our use case (a redirect at `/`). The proxy file lives at `frontend/src/proxy.ts`; booting the dev server with both names present triggers a hard error, so only `proxy.ts` exists in the tree.

### 9. Shared locale constants for Edge runtime

The Next.js proxy can run on the Edge runtime, which does not expose Node's `fs`. To avoid depending on `loadSiteConfig()` (which reads `content/site.json` from disk), the supported locales, default locale, and cookie name/TTL live in `frontend/src/lib/locale/config.ts` as plain constants. These MUST stay in sync with `content/site.json`; a comment in the module documents the invariant.

## Risks / Trade-offs

- **Toggle click needed for sticky ES preference to carry across sessions** → visitor must use the toggle at least once for the cookie to set. Mitigation: browser detection already sends most Spanish speakers to `/es` on first visit, so the toggle is only needed by users whose browser is set to English but prefer Spanish (and vice versa). Acceptable.
- **CDN / reverse-proxy misconfiguration could cache the wrong redirect target** → explicit `Vary: Accept-Language, Cookie` + `Cache-Control: private, no-cache` on the root redirect, and documentation for any proxy layer.
- **Bots without `Accept-Language` always see `en`** → intentional: `en` is our canonical/default. `hreflang` ensures the `es` version is discovered and indexed.
- **Corrupted or spoofed `NEXT_LOCALE` values** → the middleware explicitly validates the cookie value against the supported set before using it; an unknown value is ignored.
- **Edge runtime limitations** → `negotiator` and `@formatjs/intl-localematcher` are both pure JS and work in the edge runtime where the proxy executes. Static locale constants (`lib/locale/config.ts`) avoid any `fs` dependency at the proxy layer.
- **Hydration mismatch from a client-side cookie read** → avoided: the cookie is set by the toggle action (a navigation `<Link>` click) and consumed server-side by the proxy on the **next** navigation to `/`. Locale pages continue to read the locale from the URL path, not from the cookie, so SSR output is unchanged.
- **Deep-link share behavior** → shared links to `/es/...` or `/en/...` intentionally bypass the proxy; the shared URL wins over the receiver's browser language. This is the expected behavior for shared content.

## Migration Plan

- Deploy is a pure code change with an additive dependency bump; no data migration or coordination with backend required.
- Rollback: revert the PR — the proxy disappears, the root redirect returns to the current static behavior, and the `NEXT_LOCALE` cookie becomes dead (no readers). No database or contract state to reconcile.
- Post-deploy verification: open in a browser configured for `es-AR` (expect `/es`), then use the "EN" toggle, close the browser, reopen `/` (expect `/en`). Repeat in reverse. Confirm `/es` and `/en` deep links keep working.

## Open Questions

- Do we want to expose the resolved locale as a response header (`X-Resolved-Locale: es`) for debugging during rollout? Default: yes, behind `NODE_ENV !== 'production'` only, to keep prod responses clean.

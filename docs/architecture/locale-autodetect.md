# Browser locale auto-detect at `/`

**Status**: active (see OpenSpec change `browser-locale-autodetect`).

## What the frontend does at the root path

A request to the bare `/` is intercepted by a Next.js 16 **Proxy** (`frontend/src/proxy.ts`, the renamed successor of `middleware.ts`). The proxy resolves the best locale for the visitor and issues a `307` redirect to `/es` or `/en`.

Priority of signals:

1. **`NEXT_LOCALE` cookie** (explicit user preference via the ES/EN toggle). If its value is in the supported set (`["es", "en"]`), it wins.
2. **`Accept-Language` header** (browser signal). Negotiated with `@formatjs/intl-localematcher` + `negotiator`, covering q-values and region subtags (`es-AR → es`, `en-GB → en`, …).
3. **`DEFAULT_LOCALE`** (`en` today, mirrored from `content/site.json`).

All other paths (`/es/*`, `/en/*`, `/api/*`, `/_next/*`, static assets) are **excluded** via `matcher: "/"`.

## CDN / reverse-proxy contract

Because the redirect target depends on both a request header and a cookie, the proxy emits:

| Header          | Value                       | Why                                                               |
| --------------- | --------------------------- | ----------------------------------------------------------------- |
| `Vary`          | `Accept-Language, Cookie`   | Any shared cache MUST key the response on both.                   |
| `Cache-Control` | `private, no-cache`         | Belt-and-suspenders against intermediary caches and browser reuse. |

In non-production builds the proxy also sets `X-Resolved-Locale: <locale>` for debugging; the header is omitted in production.

**Any CDN, reverse proxy, or load balancer in front of the app MUST either honor `Vary` on both dimensions or forward `/` uncached to the origin.** Caching the redirect target without varying on `Accept-Language` and `Cookie` will pin the wrong locale across visitors.

## `NEXT_LOCALE` cookie

Set client-side by `frontend/src/components/LocaleToggle.tsx` whenever the visitor clicks the ES/EN toggle.

| Attribute  | Value                          |
| ---------- | ------------------------------ |
| Name       | `NEXT_LOCALE`                  |
| Path       | `/`                            |
| `Max-Age`  | `31536000` (1 year)            |
| `SameSite` | `Lax`                          |
| `Secure`   | set when served over HTTPS     |
| `HttpOnly` | **not** set (UX preference)    |

An unknown cookie value (e.g. `NEXT_LOCALE=fr`) is ignored by the proxy and the visitor is re-negotiated against `Accept-Language`.

## SEO

Each locale page declares its own canonical URL (`/es` or `/en`, never bare `/`) plus three `<link rel="alternate" hreflang>` tags (`es`, `en`, `x-default → /en`). Base URL is taken from the `NEXT_PUBLIC_SITE_URL` env var (with a localhost fallback for dev). See `frontend/src/app/[locale]/page.tsx → generateMetadata`.

## Keeping constants in sync

The supported locales and the default locale live in `frontend/src/lib/locale/config.ts` because the proxy can run on the Edge runtime and must not touch the filesystem. Any change to `content/site.json → languages` / `defaultLocale` **MUST** be reflected in that module in the same commit.

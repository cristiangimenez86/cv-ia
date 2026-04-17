## ADDED Requirements

### Requirement: Root path SHALL resolve to a locale using the visitor's cookie and Accept-Language

A request to the bare `/` path on the frontend SHALL be redirected to one of the supported locale routes (`/es` or `/en`) using the following priority:

1. If the request carries a `NEXT_LOCALE` cookie whose value is in the supported set, use that locale.
2. Otherwise, negotiate the best match between the `Accept-Language` header and the supported set using RFC 4647 basic-lookup semantics; select that locale when a match exists.
3. Otherwise, use the configured default locale (`en` today).

The redirect SHALL use HTTP status `307` and the response SHALL include `Vary: Accept-Language, Cookie` and `Cache-Control: private, no-cache` so shared caches never pin the wrong target.

#### Scenario: Spanish browser, no cookie

- **WHEN** a visitor requests `/` with `Accept-Language: es-AR,es;q=0.9,en;q=0.8` and no `NEXT_LOCALE` cookie
- **THEN** the response SHALL be a `307` redirect to `/es`
- **AND** the response SHALL include `Vary: Accept-Language, Cookie`

#### Scenario: English browser, no cookie

- **WHEN** a visitor requests `/` with `Accept-Language: en-US,en;q=0.9` and no `NEXT_LOCALE` cookie
- **THEN** the response SHALL be a `307` redirect to `/en`

#### Scenario: Cookie overrides Accept-Language

- **WHEN** a visitor requests `/` with `Accept-Language: es-AR,es;q=0.9` and a `NEXT_LOCALE=en` cookie
- **THEN** the response SHALL be a `307` redirect to `/en`

#### Scenario: Unknown cookie value is ignored

- **WHEN** a visitor requests `/` with `NEXT_LOCALE=fr` (not in the supported set) and `Accept-Language: es;q=0.9`
- **THEN** the cookie SHALL be treated as absent
- **AND** the response SHALL redirect to `/es` based on `Accept-Language`

#### Scenario: Missing or empty Accept-Language falls back to default

- **WHEN** a visitor requests `/` with no `NEXT_LOCALE` cookie and an empty or missing `Accept-Language` header
- **THEN** the response SHALL redirect to `/{defaultLocale}` (currently `/en`)

#### Scenario: Accept-Language with no supported match falls back to default

- **WHEN** a visitor requests `/` with `Accept-Language: fr-FR,de;q=0.8` and no cookie
- **THEN** the response SHALL redirect to `/{defaultLocale}` (currently `/en`)

### Requirement: Explicit locale routes MUST NOT be redirected by the proxy

Deep links and shared URLs to explicit locale routes (for example `/es`, `/es/...`, `/en`, `/en/...`) SHALL be served as-is: the proxy SHALL NOT emit any redirect or URL rewrite for those paths. The only header the proxy MAY set on these responses is the existing `x-locale` request header that the root layout consumes to render `<html lang={locale}>`. API routes, static assets, and Next.js internals (e.g. `/_next/*`, `/api/*`, images, fonts) SHALL be excluded from the proxy matcher entirely.

#### Scenario: Spanish-speaking visitor opens a shared English deep link

- **WHEN** a visitor with `Accept-Language: es-AR` and `NEXT_LOCALE=es` requests `/en/experience`
- **THEN** the server SHALL respond with the English experience page as it does today
- **AND** no redirect SHALL be emitted by the proxy

#### Scenario: ATS parser requests a locale page directly

- **WHEN** an ATS parser requests `/en` with no cookie
- **THEN** the server SHALL respond with the SSR/SSG English CV page as it does today
- **AND** no redirect SHALL be emitted by the proxy

#### Scenario: Locale page renders `<html lang>` matching the URL

- **WHEN** a visitor requests `/es` or `/es/experience`
- **THEN** the proxy SHALL forward an `x-locale: es` header on the `NextResponse.next()`
- **AND** the root layout SHALL render `<html lang="es">`

#### Scenario: API or static asset requests are untouched

- **WHEN** any request targets a path starting with `/api/`, `/_next/`, or a static asset (image, font, etc.)
- **THEN** the proxy SHALL NOT run for that request

### Requirement: Locale toggle SHALL persist the visitor's choice in a cookie

When the visitor switches locales via the header toggle, the toggle SHALL write a `NEXT_LOCALE` cookie containing the newly selected locale so that the choice is honored on subsequent visits that land on `/`.

The cookie SHALL have the following attributes: `Path=/`, `Max-Age` of one year, `SameSite=Lax`, and `Secure` when the current page is served over HTTPS. The cookie SHALL NOT be `HttpOnly` (it is a UX preference, not a security credential).

#### Scenario: Visitor switches from English to Spanish

- **WHEN** the visitor clicks the toggle on an English page
- **THEN** before navigation completes, a cookie `NEXT_LOCALE=es` SHALL be written with `Path=/`, `Max-Age=31536000`, `SameSite=Lax`, and `Secure` if the page is HTTPS

#### Scenario: Visitor switches back to English

- **WHEN** the visitor clicks the toggle on a Spanish page after previously choosing Spanish
- **THEN** the cookie SHALL be overwritten with `NEXT_LOCALE=en` preserving the same attributes

#### Scenario: Cookie value is always from the supported set

- **WHEN** the toggle is activated
- **THEN** the cookie value SHALL be exactly one of `"es"` or `"en"` (or any future supported code), never an invalid or derived value

### Requirement: Locale pages SHALL declare hreflang alternates so search engines index both locales

Both locale pages (`/es` and `/en`) SHALL render `<link rel="alternate" hreflang="...">` tags for each supported locale plus an `x-default` entry, so search engines and metadata tools can discover the full set of locales without following the auto-redirect from `/`. The `x-default` URL SHALL point at the default locale route (`/en` today).

#### Scenario: English page metadata

- **WHEN** `/en` is rendered
- **THEN** the page SHALL include `<link rel="alternate" hreflang="en" href=".../en" />`, `<link rel="alternate" hreflang="es" href=".../es" />`, and `<link rel="alternate" hreflang="x-default" href=".../en" />`

#### Scenario: Spanish page metadata

- **WHEN** `/es` is rendered
- **THEN** the page SHALL include the same three `hreflang` alternates with the URL set to `.../es` for `hreflang="es"`

#### Scenario: Each locale page declares its own canonical URL

- **WHEN** `/en` or `/es` is rendered
- **THEN** the page SHALL declare a `canonical` link pointing at itself (not at the bare `/`) so search engines never treat `/` as the canonical locale URL

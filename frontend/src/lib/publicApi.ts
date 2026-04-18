/**
 * Public API config (browser-side).
 *
 * The browser may call the .NET API in two modes:
 *  - **Same-origin proxy**: `NEXT_PUBLIC_API_BASE_URL` is empty → requests go to
 *    `/api/...` and are forwarded by the Next route handler with the
 *    server-only `BACKEND_API_ACCESS_TOKEN`.
 *  - **Direct browser → API**: `NEXT_PUBLIC_API_BASE_URL` is set → the bearer
 *    must be included in the request, taken from
 *    `NEXT_PUBLIC_API_ACCESS_TOKEN`.
 *
 * `process.env.NEXT_PUBLIC_*` reads are inlined at build time, so accessing
 * them from a single helper does not affect runtime perf.
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export const PUBLIC_API_BASE_URL: string = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
);

export const PUBLIC_API_ACCESS_TOKEN: string = (
  process.env.NEXT_PUBLIC_API_ACCESS_TOKEN ?? ""
).trim();

/** Builds an absolute API URL when the base is configured, otherwise a path on the same origin. */
export function publicApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return PUBLIC_API_BASE_URL ? `${PUBLIC_API_BASE_URL}${normalized}` : normalized;
}

/**
 * Returns the bearer token to use when calling `path` from the browser.
 * Returns an empty string when no auth header should be set (same-origin
 * proxy case — the Next route handler attaches the server-side token).
 */
export function publicApiBearer(): string {
  return PUBLIC_API_BASE_URL ? PUBLIC_API_ACCESS_TOKEN : "";
}

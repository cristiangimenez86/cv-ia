/**
 * Server-side only: URL of the .NET API (local dev or Docker internal network).
 * Not exposed to the browser — use empty NEXT_PUBLIC_API_BASE_URL + app proxies.
 */
export function getBackendBaseUrl(): string {
  const raw = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8080";
  return raw.replace(/\/$/, "");
}

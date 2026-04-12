/**
 * Server-only: bearer for Next Route Handlers that proxy to the .NET API.
 * Set `BACKEND_API_ACCESS_TOKEN` in the Next.js runtime (Docker / `.env.local`), not in client bundles.
 */
export function backendProxyAuthHeaders(): HeadersInit {
  const token = process.env.BACKEND_API_ACCESS_TOKEN?.trim();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

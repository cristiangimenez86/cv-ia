import { NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-url";

export const runtime = "nodejs";

/**
 * Proxies GET /health to the .NET API so the client can use same-origin /health
 * when NEXT_PUBLIC_API_BASE_URL is empty (see BackendHealthIndicator).
 */
export async function GET() {
  const backend = getBackendBaseUrl();
  try {
    const res = await fetch(`${backend}/health`, { cache: "no-store" });
    const body = await res.arrayBuffer();
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) {
      headers.set("content-type", ct);
    }
    return new NextResponse(body, { status: res.status, headers });
  } catch (err) {
    console.error("[health proxy] backend unreachable:", err);
    return NextResponse.json(
      { status: "unhealthy", error: "backend_unreachable" },
      { status: 502 },
    );
  }
}

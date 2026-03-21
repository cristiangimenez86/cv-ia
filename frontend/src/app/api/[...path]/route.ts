import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend-url";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const path = (segments ?? []).join("/");
  const backend = getBackendBaseUrl();
  const target = new URL(`${backend}/api/${path}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (["host", "connection", "transfer-encoding", "content-length"].includes(k)) {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const body = await response.arrayBuffer();
    const outHeaders = new Headers();
    response.headers.forEach((value, key) => {
      outHeaders.set(key, value);
    });
    return new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: outHeaders,
    });
  } catch (err) {
    console.error("[api proxy] backend unreachable:", err);
    return NextResponse.json(
      {
        code: "backend_unreachable",
        message:
          "Could not connect to the backend. Is it running on port 8080? (Set BACKEND_INTERNAL_URL if not.)",
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

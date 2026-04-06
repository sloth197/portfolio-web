import { NextRequest, NextResponse } from "next/server";
import { getPublicApiBaseUrl } from "@/lib/api-base";

const API_BASE = getPublicApiBaseUrl();
const SUPPORTED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const PROXY_UNAVAILABLE_RESPONSE = {
  success: false,
  code: "UPSTREAM_UNAVAILABLE",
  message: "Admin notice service is unavailable.",
};

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const allowedHeaders = ["content-type", "accept", "cookie", "origin", "referer", "authorization"];

  for (const headerName of allowedHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  return headers;
}

function sanitizeUpstreamHeaders(headers: Headers): Headers {
  const safeHeaders = new Headers(headers);
  safeHeaders.delete("content-length");
  safeHeaders.delete("transfer-encoding");
  safeHeaders.delete("content-encoding");
  safeHeaders.delete("access-control-allow-origin");
  safeHeaders.delete("access-control-allow-credentials");
  safeHeaders.delete("access-control-allow-methods");
  safeHeaders.delete("access-control-allow-headers");
  safeHeaders.delete("access-control-expose-headers");
  safeHeaders.delete("access-control-max-age");
  safeHeaders.set("cache-control", "no-store");
  return safeHeaders;
}

async function resolvePathSegments(context: RouteContext): Promise<string[]> {
  const resolvedParams = await context.params;
  return Array.isArray(resolvedParams.path) ? resolvedParams.path : [];
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<Response> {
  if (!API_BASE) {
    return NextResponse.json(
      {
        success: false,
        code: "API_BASE_NOT_SET",
        message: "API base URL is not configured.",
      },
      { status: 500 },
    );
  }

  const method = request.method.toUpperCase();
  if (!SUPPORTED_METHODS.has(method)) {
    return NextResponse.json(
      {
        success: false,
        code: "METHOD_NOT_ALLOWED",
        message: `Method ${method} is not allowed.`,
      },
      { status: 405, headers: { Allow: [...SUPPORTED_METHODS].join(", ") } },
    );
  }

  const pathSegments = await resolvePathSegments(context);
  const pathSuffix = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const upstreamUrl = `${API_BASE}/api/admin/notices${pathSuffix}${request.nextUrl.search}`;

  const requestInit: RequestInit = {
    method,
    headers: buildProxyHeaders(request),
    cache: "no-store",
    redirect: "follow",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      requestInit.body = body;
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, requestInit);
    const responseBody = await upstreamResponse.arrayBuffer();
    return new NextResponse(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstreamResponse.status,
      headers: sanitizeUpstreamHeaders(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json(PROXY_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<Response> {
  return proxyRequest(request, context);
}

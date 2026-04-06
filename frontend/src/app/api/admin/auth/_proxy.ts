import { NextRequest, NextResponse } from "next/server";
import { getPublicApiBaseUrl } from "@/lib/api-base";

const API_BASE = getPublicApiBaseUrl();

type ProxyMethod = "GET" | "POST";

const AUTH_SERVICE_UNAVAILABLE_RESPONSE = {
  success: false,
  code: "UPSTREAM_UNAVAILABLE",
  message: "Authentication service is unavailable.",
};

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const origin = request.headers.get("origin");
  if (origin) {
    headers.set("origin", origin);
  }
  const referer = request.headers.get("referer");
  if (referer) {
    headers.set("referer", referer);
  }
  return headers;
}

function sanitizeUpstreamHeaders(headers: Headers): Headers {
  const safeHeaders = new Headers(headers);
  // Prevent browser HTTP auth prompt from upstream challenge headers.
  safeHeaders.delete("www-authenticate");
  // NextResponse recalculates body metadata.
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

export async function proxyAdminAuthRequest(
  request: NextRequest,
  upstreamPath: string,
  method: ProxyMethod,
): Promise<Response> {
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

  const requestInit: RequestInit = {
    method,
    headers: buildProxyHeaders(request),
    cache: "no-store",
    redirect: "follow",
  };

  if (method === "POST") {
    requestInit.body = await request.text();
  }

  try {
    const upstreamResponse = await fetch(`${API_BASE}${upstreamPath}`, requestInit);
    const responseBody = await upstreamResponse.arrayBuffer();
    return new NextResponse(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstreamResponse.status,
      headers: sanitizeUpstreamHeaders(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json(AUTH_SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

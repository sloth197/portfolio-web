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

function getSetCookieValues(headers: Headers): string[] {
  const maybeGetSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof maybeGetSetCookie === "function") {
    const values = maybeGetSetCookie.call(headers);
    if (Array.isArray(values) && values.length > 0) {
      return values.filter((value) => value && value.trim().length > 0);
    }
  }

  const single = headers.get("set-cookie");
  return single && single.trim().length > 0 ? [single] : [];
}

function isLocalHttpRequest(request: NextRequest): boolean {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const protocolHeader = request.headers.get("x-forwarded-proto");
  const protocol = protocolHeader
    ? protocolHeader.split(",")[0]?.trim().toLowerCase()
    : request.nextUrl.protocol.replace(":", "").toLowerCase();

  const isLocalHost = host.startsWith("localhost:")
    || host.startsWith("127.0.0.1:")
    || host.startsWith("[::1]:")
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "[::1]";

  return isLocalHost && protocol === "http";
}

function normalizeSetCookieForLocalHttp(value: string): string {
  return value
    .replace(/;\s*Secure/gi, "")
    .replace(/;\s*Domain=[^;]+/gi, "");
}

function sanitizeUpstreamHeaders(headers: Headers, request: NextRequest): Headers {
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

  if (isLocalHttpRequest(request)) {
    const setCookieValues = getSetCookieValues(headers);
    if (setCookieValues.length > 0) {
      safeHeaders.delete("set-cookie");
      setCookieValues
        .map(normalizeSetCookieForLocalHttp)
        .forEach((setCookie) => safeHeaders.append("set-cookie", setCookie));
    }
  }

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
      headers: sanitizeUpstreamHeaders(upstreamResponse.headers, request),
    });
  } catch {
    return NextResponse.json(AUTH_SERVICE_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getPublicApiBaseUrl } from "@/lib/api-base";

const API_BASE = getPublicApiBaseUrl();

const UPSTREAM_UNAVAILABLE_RESPONSE = {
  success: false,
  code: "UPSTREAM_UNAVAILABLE",
  message: "Notice service is unavailable.",
};

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

export async function GET(): Promise<Response> {
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

  try {
    const upstreamResponse = await fetch(`${API_BASE}/api/public/notices`, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });
    const responseBody = await upstreamResponse.arrayBuffer();
    return new NextResponse(responseBody.byteLength > 0 ? responseBody : null, {
      status: upstreamResponse.status,
      headers: sanitizeUpstreamHeaders(upstreamResponse.headers),
    });
  } catch {
    return NextResponse.json(UPSTREAM_UNAVAILABLE_RESPONSE, { status: 502 });
  }
}

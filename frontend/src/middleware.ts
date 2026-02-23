import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "PORTFOLIO_SESSION";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";
const AUTH_ENABLED = (process.env.NEXT_PUBLIC_AUTH_ENABLED ?? "true").toLowerCase() === "true";

async function validateSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/public/auth/session`, {
      method: "GET",
      cache: "no-store",
      headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` },
    });
    if (!response.ok) {
      return false;
    }
    const payload = (await response.json()) as { authenticated?: boolean };
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthPage = pathname === "/auth";

  if (!token) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await validateSession(token);
  if (!valid) {
    const response = isAuthPage ? NextResponse.next() : NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};

import "server-only";

import { cookies } from "next/headers";
import type { ProjectCategory, ProjectDto } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const SESSION_COOKIE_NAME = "PORTFOLIO_SESSION";

if (!BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local");
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function buildAuthHeader(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return {};
  }
  return { Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}` };
}

export async function fetchProjects(category?: ProjectCategory): Promise<ProjectDto[]> {
  const url = new URL(`${BASE}/api/public/projects`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: await buildAuthHeader(),
  });
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectDto> {
  const res = await fetch(`${BASE}/api/public/projects/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: await buildAuthHeader(),
  });
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch project(${slug}): ${res.status}`);
  return res.json();
}

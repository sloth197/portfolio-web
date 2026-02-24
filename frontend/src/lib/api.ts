import "server-only";

import type { ProjectCategory, ProjectDto } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export async function fetchProjects(category?: ProjectCategory): Promise<ProjectDto[]> {
  const url = new URL(`${BASE}/api/public/projects`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectDto> {
  const res = await fetch(`${BASE}/api/public/projects/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch project(${slug}): ${res.status}`);
  return res.json();
}

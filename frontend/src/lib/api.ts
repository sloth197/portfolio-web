import "server-only";

import { getPublicApiBaseUrl } from "./api-base";
import type { ProjectCategory, ProjectDto, ProjectSummaryDto } from "./types";

const BASE = getPublicApiBaseUrl();
export const PROJECT_REVALIDATE_SECONDS = 600;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ProjectFetchPolicy = "live" | "cached";

type ProjectFetchOptions = {
  policy?: ProjectFetchPolicy;
  revalidateSeconds?: number;
};

function resolveProjectFetchInit(
  options?: ProjectFetchOptions,
): RequestInit & { next?: { revalidate: number } } {
  const policy = options?.policy ?? "live";

  if (policy === "cached") {
    return {
      cache: "force-cache",
      next: { revalidate: options?.revalidateSeconds ?? PROJECT_REVALIDATE_SECONDS },
    };
  }

  return { cache: "no-store" };
}

export async function fetchProjects(
  category?: ProjectCategory,
  options?: ProjectFetchOptions,
): Promise<ProjectDto[]> {
  const url = new URL(`${BASE}/api/public/projects`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), resolveProjectFetchInit(options));
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function fetchProjectSummaries(
  category?: ProjectCategory,
  options?: ProjectFetchOptions,
): Promise<ProjectSummaryDto[]> {
  const url = new URL(`${BASE}/api/public/projects/summary`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString(), resolveProjectFetchInit(options));
  if (res.status === 404) {
    return fetchProjects(category, options);
  }
  if (!res.ok) throw new ApiError(res.status, `Failed to fetch project summaries: ${res.status}`);
  return res.json();
}

export async function fetchProjectBySlug(
  slug: string,
  options?: ProjectFetchOptions,
): Promise<ProjectDto> {
  const res = await fetch(
    `${BASE}/api/public/projects/${encodeURIComponent(slug)}`,
    resolveProjectFetchInit(options),
  );

  if (!res.ok) throw new ApiError(res.status, `Failed to fetch project(${slug}): ${res.status}`);
  return res.json();
}

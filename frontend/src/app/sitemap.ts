import type { MetadataRoute } from "next";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import type { ProjectDto } from "@/lib/types";

const DEFAULT_SITE_URL = "https://www.xhbt.dev";
const API_BASE = getPublicApiBaseUrl();

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).toString().replace(/\/+$/, "");
    } catch {
      // Fall back to the public production domain.
    }
  }
  return DEFAULT_SITE_URL;
}

async function fetchProjectsForSitemap(): Promise<ProjectDto[]> {
  if (!API_BASE) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE}/api/public/projects`, {
      cache: "force-cache",
      next: { revalidate: 600 },
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as ProjectDto[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();
  const now = new Date();
  const projects = await fetchProjectsForSitemap();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/notice`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const projectEntries: MetadataRoute.Sitemap = projects.map((project) => {
    const rawDate = project.updatedAt ?? project.createdAt;
    const lastModified = rawDate ? new Date(rawDate) : now;
    const safeLastModified = Number.isNaN(lastModified.getTime()) ? now : lastModified;

    return {
      url: `${siteUrl}/projects/${encodeURIComponent(project.slug)}`,
      lastModified: safeLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [...staticEntries, ...projectEntries];
}

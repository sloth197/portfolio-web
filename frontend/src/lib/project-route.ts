import type { ProjectCategory } from "./types";

export type ProjectCategorySegment = "software" | "firmware";

export function categoryToSegment(category: ProjectCategory): ProjectCategorySegment {
  return category === "SOFTWARE" ? "software" : "firmware";
}

export function segmentToCategory(segment: string): ProjectCategory | null {
  const lower = segment.toLowerCase();
  if (lower === "software") {
    return "SOFTWARE";
  }
  if (lower === "firmware") {
    return "FIRMWARE";
  }
  return null;
}

export function projectDetailPath(category: ProjectCategory, slug: string): string {
  return `/projects/${categoryToSegment(category)}/${encodeURIComponent(slug)}`;
}

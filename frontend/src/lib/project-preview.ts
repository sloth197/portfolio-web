import type { ProjectCategory, ProjectDto } from "./types";

export const PREVIEW_PROJECTS: ProjectDto[] = [
  {
    id: 1001,
    category: "SOFTWARE",
    title: "Landing Page Website",
    slug: "landing-page-website",
    summary: "Marketing-focused landing page with reusable sections and responsive layout.",
    contentMarkdown: `## Layout preview

- Hero section
- Category filters
- Card grid

This is sample markdown content for local detail-page layout checks.`,
    githubUrl: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: 1002,
    category: "SOFTWARE",
    title: "Admin Dashboard",
    slug: "admin-dashboard",
    summary: "Role-based dashboard UI with chart modules, filters, and audit timeline.",
    contentMarkdown: `## Dashboard modules

1. User metrics
2. Event timeline
3. Access control checks`,
    githubUrl: null,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: 1003,
    category: "FIRMWARE",
    title: "Low Latency Controller",
    slug: "low-latency-controller",
    summary: "Real-time control firmware with deterministic cycle scheduling and diagnostics.",
    contentMarkdown: `## Firmware notes

- Deterministic loop timing
- Fault-safe fallback path
- Peripheral health monitor`,
    githubUrl: null,
    createdAt: "2025-12-21T00:00:00.000Z",
    updatedAt: "2025-12-21T00:00:00.000Z",
  },
  {
    id: 1004,
    category: "SOFTWARE",
    title: "Portfolio Website",
    slug: "portfolio-website",
    summary: "Personal project gallery with category filters and markdown detail pages.",
    contentMarkdown: `## Website structure

- Home
- Projects
- About
- Contact`,
    githubUrl: null,
    createdAt: "2026-02-11T00:00:00.000Z",
    updatedAt: "2026-02-11T00:00:00.000Z",
  },
  {
    id: 1005,
    category: "FIRMWARE",
    title: "Sensor Bridge Firmware",
    slug: "sensor-bridge-firmware",
    summary: "UART-to-CAN bridge firmware with fault handling and packet integrity checks.",
    contentMarkdown: `## Bridge pipeline

UART RX -> validation -> packet map -> CAN TX`,
    githubUrl: null,
    createdAt: "2025-11-13T00:00:00.000Z",
    updatedAt: "2025-11-13T00:00:00.000Z",
  },
  {
    id: 1006,
    category: "SOFTWARE",
    title: "Travel Planner App",
    slug: "travel-planner-app",
    summary: "Trip planning web app with itinerary blocks, map notes, and export support.",
    contentMarkdown: `## Feature draft

- Itinerary timeline
- Map note pins
- PDF export`,
    githubUrl: null,
    createdAt: "2026-01-24T00:00:00.000Z",
    updatedAt: "2026-01-24T00:00:00.000Z",
  },
];

export function filterProjectsByCategory(items: ProjectDto[], category?: ProjectCategory): ProjectDto[] {
  if (!category) {
    return items;
  }
  return items.filter((project) => project.category === category);
}

export function normalizeProjectCategory(value?: string): ProjectCategory | undefined {
  if (!value) {
    return undefined;
  }
  const upper = value.toUpperCase();
  if (upper === "FIRMWARE" || upper === "SOFTWARE") {
    return upper;
  }
  return undefined;
}

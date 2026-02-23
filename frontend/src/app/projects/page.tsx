import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProjectsListPanel from "@/components/projects-list-panel";
import { ApiError, fetchProjects } from "@/lib/api";
import type { ProjectCategory } from "@/lib/types";

function normalizeCategory(value?: string): ProjectCategory | undefined {
  if (!value) {
    return undefined;
  }
  const upper = value.toUpperCase();
  if (upper === "FIRMWARE" || upper === "SOFTWARE") {
    return upper;
  }
  return undefined;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = normalizeCategory(params.category);

  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    projects = await fetchProjects(selectedCategory);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        redirect("/auth");
      }
      if (error.status === 404) {
        notFound();
      }
    }
    throw error;
  }

  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section className="surface-card" style={{ padding: "16px clamp(14px, 4vw, 20px)", display: "grid", gap: 12 }}>
        <span className="badge">Projects</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="badge" href="/projects?category=SOFTWARE">
            Software
          </Link>
          <Link className="badge" href="/projects?category=FIRMWARE">
            Firmware
          </Link>
          <Link className="badge" href="/projects">
            All
          </Link>
        </div>
      </section>

      <ProjectsListPanel projects={sortedProjects} selectedCategory={selectedCategory} />
    </div>
  );
}

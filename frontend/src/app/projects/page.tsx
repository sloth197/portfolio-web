import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectsListPanel from "@/components/projects-list-panel";
import { ApiError, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS, filterProjectsByCategory, normalizeProjectCategory } from "@/lib/project-preview";
import type { ProjectCategory } from "@/lib/types";

const PROJECTS_REVALIDATE_SECONDS = 120;

function buildProjectsPath(category?: ProjectCategory): string {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

function getLanguageLabelByCategory(category: ProjectCategory): string {
  return category === "SOFTWARE" ? "C#" : "Java";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = normalizeProjectCategory(params.category);

  let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];

  try {
    allProjects = await fetchProjects(undefined, {
      policy: "cached",
      revalidateSeconds: PROJECTS_REVALIDATE_SECONDS,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        notFound();
      }
    }

    if (process.env.NODE_ENV !== "production") {
      allProjects = PREVIEW_PROJECTS;
    } else {
      throw error;
    }
  }

  const filteredProjects = filterProjectsByCategory(allProjects, selectedCategory);
  const totalCount = allProjects.length;
  const csharpProjectCount = allProjects.filter((project) => project.category === "SOFTWARE").length;
  const javaProjectCount = allProjects.filter((project) => project.category === "FIRMWARE").length;
  const sortedProjects = [...filteredProjects].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="projects-layout-preview">
      <div style={{ display: "grid", justifyItems: "center" }}>
        <h1 className="section-title" style={{ textAlign: "center", margin: 0 }}>
          Featured Project
        </h1>
      </div>

      <section className="projects-filter-bar">
        <Link className={`projects-filter-pill ${!selectedCategory ? "is-active" : ""}`} href={buildProjectsPath()}>
          {`All projects (${totalCount})`}
        </Link>
        <Link
          className={`projects-filter-pill ${selectedCategory === "SOFTWARE" ? "is-active" : ""}`}
          href={buildProjectsPath("SOFTWARE")}
        >
          {`${getLanguageLabelByCategory("SOFTWARE")} (${csharpProjectCount})`}
        </Link>
        <Link
          className={`projects-filter-pill ${selectedCategory === "FIRMWARE" ? "is-active" : ""}`}
          href={buildProjectsPath("FIRMWARE")}
        >
          {`${getLanguageLabelByCategory("FIRMWARE")} (${javaProjectCount})`}
        </Link>
      </section>

      <ProjectsListPanel projects={sortedProjects} selectedCategory={selectedCategory} />
    </div>
  );
}

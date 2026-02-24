import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectsListPanel from "@/components/projects-list-panel";
import { ApiError, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS, filterProjectsByCategory, normalizeProjectCategory } from "@/lib/project-preview";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = normalizeProjectCategory(params.category);

  let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];

  try {
    allProjects = await fetchProjects();
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
  const softwareCount = allProjects.filter((project) => project.category === "SOFTWARE").length;
  const firmwareCount = allProjects.filter((project) => project.category === "FIRMWARE").length;
  const sortedProjects = [...filteredProjects].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="projects-layout-preview">
      <section
        className="surface-card top-banner top-banner-projects"
        style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}
      >
        <span className="badge">My Projects</span>
        <h1 className="section-title">Featured Projects</h1>
      </section>

      <section className="projects-filter-bar">
        <Link className={`projects-filter-pill ${!selectedCategory ? "is-active" : ""}`} href="/projects">
          All ({totalCount})
        </Link>
        <Link className={`projects-filter-pill ${selectedCategory === "SOFTWARE" ? "is-active" : ""}`} href="/projects?category=SOFTWARE">
          Software ({softwareCount})
        </Link>
        <Link className={`projects-filter-pill ${selectedCategory === "FIRMWARE" ? "is-active" : ""}`} href="/projects?category=FIRMWARE">
          Firmware ({firmwareCount})
        </Link>
      </section>

      <ProjectsListPanel projects={sortedProjects} selectedCategory={selectedCategory} />
    </div>
  );
}

import { notFound } from "next/navigation";
import ProjectsListPanel from "@/components/projects-list-panel";
import { ApiError, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";

const PROJECTS_REVALIDATE_SECONDS = 120;

export default async function ProjectsPage() {
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

  const sortedProjects = [...allProjects].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="projects-layout-preview">
      <div style={{ display: "grid", justifyItems: "center" }}>
        <h1 className="section-title" style={{ textAlign: "center", margin: 0 }}>
          Projects
        </h1>
      </div>

      <ProjectsListPanel projects={sortedProjects} />
    </div>
  );
}

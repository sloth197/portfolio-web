import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectsListPanel from "@/components/projects-list-panel";
import { ApiError, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS } from "@/lib/project-preview";

const PROJECTS_REVALIDATE_SECONDS = 120;

export const metadata: Metadata = {
  title: "Projects",
  description: "소프트웨어/펌웨어 프로젝트 목록과 주요 요약을 확인할 수 있습니다.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | JWS Portfolio",
    description: "소프트웨어/펌웨어 프로젝트 목록과 주요 요약을 확인할 수 있습니다.",
    url: "/projects",
  },
};

export default async function ProjectsPage() {
  let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];
  let loadWarning: string | null = null;

  try {
    allProjects = await fetchProjects(undefined, {
      policy: "cached",
      revalidateSeconds: PROJECTS_REVALIDATE_SECONDS,
    });
  } catch (error) {
    let handledApiError = false;

    if (error instanceof ApiError) {
      if (error.status === 404) {
        notFound();
      }

      if (error.status === 401 || error.status === 403 || error.status >= 500) {
        allProjects = [];
        loadWarning =
          error.status === 401 || error.status === 403
            ? "Projects API is requiring authentication (401/403). Check backend auth settings."
            : "Projects API is temporarily unavailable. Please check backend deployment status.";
        handledApiError = true;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      allProjects = PREVIEW_PROJECTS;
      if (!loadWarning) {
        loadWarning = "Development fallback data is shown because live API fetch failed.";
      }
    } else if (!handledApiError) {
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
      {loadWarning ? <div className="projects-empty-state">{loadWarning}</div> : null}

      <ProjectsListPanel projects={sortedProjects} />
    </div>
  );
}

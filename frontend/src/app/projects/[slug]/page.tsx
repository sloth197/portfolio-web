import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ProjectAdminActions from "@/components/project-admin-actions";
import { ApiError, fetchProjectBySlug, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS, normalizeProjectCategory } from "@/lib/project-preview";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

function buildProjectsPath(selectedCategory?: ProjectCategory): string {
  if (!selectedCategory) {
    return "/projects";
  }
  return `/projects?category=${selectedCategory}`;
}

function buildProjectDetailPath(slug: string, selectedCategory?: ProjectCategory): string {
  const params = new URLSearchParams();
  if (selectedCategory) {
    params.set("category", selectedCategory);
  }
  return params.size > 0 ? `/projects/${slug}?${params.toString()}` : `/projects/${slug}`;
}

function sortProjectsForSidebar(items: ProjectDto[]): ProjectDto[] {
  return [...items].sort((a, b) => {
    const order = (category: ProjectCategory) => (category === "SOFTWARE" ? 0 : 1);
    const byCategory = order(a.category) - order(b.category);
    if (byCategory !== 0) {
      return byCategory;
    }
    return a.title.localeCompare(b.title);
  });
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const selectedCategory = normalizeProjectCategory(query.category);

  let project: ProjectDto | null = null;
  let allProjects: ProjectDto[] = [];
  let usesPreviewData = false;

  try {
    [project, allProjects] = await Promise.all([fetchProjectBySlug(slug), fetchProjects()]);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        notFound();
      }
    }

    if (process.env.NODE_ENV !== "production") {
      allProjects = PREVIEW_PROJECTS;
      project = PREVIEW_PROJECTS.find((item) => item.slug === slug) ?? null;
      usesPreviewData = true;
      if (!project) {
        notFound();
      }
    } else {
      throw error;
    }
  }

  if (!project) {
    notFound();
  }

  const sortedProjects = sortProjectsForSidebar(allProjects);

  return (
    <div id="project-detail-layout" className="project-detail-layout">
      <section className="surface-card project-detail-head top-banner top-banner-project-detail">
        <div className="project-detail-top-row">
          <Link className="btn-ghost" href={buildProjectsPath(selectedCategory)} style={{ width: "fit-content" }}>
            Back to projects
          </Link>
          {usesPreviewData ? <span className="badge">Preview Data</span> : null}
        </div>

        <span className="badge">{project.category}</span>
        <h1 className="project-detail-title">{project.title}</h1>
        <p className="section-copy" style={{ margin: 0 }}>{project.summary}</p>

        {project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn" style={{ width: "fit-content" }}>
            Open GitHub
          </a>
        ) : null}
      </section>

      <ProjectAdminActions
        project={project}
        returnPath={buildProjectsPath(selectedCategory)}
        disabled={usesPreviewData}
      />

      <section className="project-detail-main">
        <article className="panel project-detail-content">
          <h2 className="project-detail-subtitle">Project Details</h2>
          {project.contentMarkdown ? (
            <div className="project-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.contentMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <p className="section-copy" style={{ margin: 0 }}>
              No detailed notes available yet.
            </p>
          )}
        </article>

        <aside className="panel project-detail-sidebar">
          <h2 className="project-detail-subtitle">Other Projects</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="badge" href="/projects?category=SOFTWARE">
              Software
            </Link>
            <Link className="badge" href="/projects?category=FIRMWARE">
              Firmware
            </Link>
            <Link className="badge" href="/projects">
              Projects
            </Link>
          </div>

          <div className="project-detail-related-list">
            {sortedProjects.map((item) => {
              const isCurrent = item.slug === project.slug;
              return (
                <Link
                  key={item.id}
                  href={buildProjectDetailPath(item.slug, selectedCategory)}
                  className={`project-detail-related-item ${isCurrent ? "is-current" : ""}`}
                >
                  <span className="badge">{item.category}</span>
                  <div className="project-detail-related-title">{item.title}</div>
                  <p className="section-copy" style={{ margin: 0, fontSize: 13 }}>
                    {item.summary}
                  </p>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}

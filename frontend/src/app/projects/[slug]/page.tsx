import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import ProjectAdminActions from "@/components/project-admin-actions";
import { ApiError, fetchProjectBySlug, fetchProjects } from "@/lib/api";
import { PREVIEW_PROJECTS, normalizeProjectCategory } from "@/lib/project-preview";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

function resolveAssetUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (API_BASE) {
    return `${API_BASE}${url}`;
  }
  return url;
}

function isImageAsset(contentType: string | null, url: string): boolean {
  if (contentType?.toLowerCase().startsWith("image/")) {
    return true;
  }
  const lowered = url.toLowerCase();
  return lowered.endsWith(".png")
    || lowered.endsWith(".jpg")
    || lowered.endsWith(".jpeg")
    || lowered.endsWith(".gif")
    || lowered.endsWith(".webp")
    || lowered.endsWith(".svg");
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
    if (error instanceof ApiError && error.status === 404) {
      notFound();
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
  const projectAssets = project.assets ?? [];

  return (
    <div id="project-detail-layout" className="project-detail-layout">
      <section className="surface-card project-detail-head top-banner top-banner-project-detail">
        <div className="project-detail-top-row">
          <Link className="btn-ghost" href={buildProjectsPath(selectedCategory)} style={{ width: "fit-content" }}>
            Back to projects
          </Link>
          {usesPreviewData ? (
            <span className="badge">Preview Data</span>
          ) : null}
        </div>

        <div className="project-badge-row">
          <span className="badge">
            {project.category === "SOFTWARE" ? "software" : "firmware"}
          </span>
          {project.projectPeriod ? <span className="project-period-badge">{project.projectPeriod}</span> : null}
        </div>
        <h1 className="project-detail-title">{project.title}</h1>
        <p className="section-copy" style={{ margin: 0 }}>{project.summary}</p>

        {project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn" style={{ width: "fit-content" }}>
            Open Github
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
          <h2 className="project-detail-subtitle">Details</h2>
          {project.contentMarkdown ? (
            <div className="project-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{project.contentMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <p className="section-copy" style={{ margin: 0 }}>
              No detailed notes available yet.
            </p>
          )}

          {projectAssets.length > 0 ? (
            <section style={{ display: "grid", gap: 10 }}>
              <h3 className="project-detail-subtitle" style={{ fontSize: "1rem" }}>File</h3>
              <div className="project-asset-grid">
                {projectAssets.map((asset) => {
                  const assetUrl = resolveAssetUrl(asset.url);
                  const imageAsset = asset.assetType === "IMAGE" || isImageAsset(asset.contentType, assetUrl);
                  return (
                    <a key={asset.id} href={assetUrl} target="_blank" rel="noreferrer" className="project-asset-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {imageAsset ? <img src={assetUrl} alt={asset.originalName} className="project-asset-thumb" /> : null}
                      <span className="project-asset-name">{asset.originalName}</span>
                      <span className="project-asset-meta">
                        {imageAsset ? "Image" : "File"}
                        {" \u00B7 "}
                        {(asset.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="panel project-detail-sidebar">
          <h2 className="project-detail-subtitle">Other Projects</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="badge" href="/projects?category=SOFTWARE">software</Link>
            <Link className="badge" href="/projects?category=FIRMWARE">firmware</Link>
            <Link className="badge" href="/projects">Projects</Link>
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
                  <span className="badge">
                    {item.category === "SOFTWARE" ? "software" : "firmware"}
                  </span>
                  <div className="project-detail-related-title">{item.title}</div>
                  {item.projectPeriod ? (
                    <span className="project-tag-pill" style={{ width: "fit-content" }}>{item.projectPeriod}</span>
                  ) : null}
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

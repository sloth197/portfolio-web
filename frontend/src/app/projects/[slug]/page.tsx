import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import I18nText from "@/components/i18n-text";
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

function getLanguageLabelByCategory(category: ProjectCategory): string {
  return category === "SOFTWARE" ? "C#" : "Java";
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

function escapeMarkdownAltText(value: string): string {
  return value.replace(/]/g, "\\]");
}

function buildMarkdownWithImageAssets(
  contentMarkdown: string,
  imageAssets: Array<{ originalName: string; url: string }>,
): string {
  const baseMarkdown = contentMarkdown.trim();
  if (imageAssets.length === 0) {
    return baseMarkdown;
  }

  const imageMarkdown = imageAssets
    .map((asset) => `![${escapeMarkdownAltText(asset.originalName)}](${asset.url})`)
    .join("\n\n");

  return [baseMarkdown, imageMarkdown].filter((value) => value.length > 0).join("\n\n");
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
  const resolvedAssets = projectAssets.map((asset) => {
    const assetUrl = resolveAssetUrl(asset.url);
    return {
      ...asset,
      assetUrl,
      imageAsset: asset.assetType === "IMAGE" || isImageAsset(asset.contentType, assetUrl),
    };
  });
  const markdownWithImages = buildMarkdownWithImageAssets(
    project.contentMarkdown,
    resolvedAssets.filter((asset) => asset.imageAsset).map((asset) => ({
      originalName: asset.originalName,
      url: asset.assetUrl,
    })),
  );
  const fileAssets = resolvedAssets.filter((asset) => !asset.imageAsset);

  return (
    <div id="project-detail-layout" className="project-detail-layout">
      <section className="surface-card project-detail-head top-banner top-banner-project-detail">
        <div className="project-detail-top-row">
          <Link className="btn-ghost" href={buildProjectsPath(selectedCategory)} style={{ width: "fit-content" }}>
            Back to projects
          </Link>
          {usesPreviewData ? (
            <span className="badge">
              <I18nText ko="미리보기 데이터" en="Preview Data" />
            </span>
          ) : null}
        </div>

        <div className="project-badge-row">
          <span className="badge">
            {getLanguageLabelByCategory(project.category)}
          </span>
          {project.projectPeriod ? <span className="project-period-badge">{project.projectPeriod}</span> : null}
        </div>
        <h1 className="project-detail-title">{project.title}</h1>
        <p className="section-copy" style={{ margin: 0 }}>{project.summary}</p>

        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="project-github-icon-link"
            aria-label="Open Github"
            title="Open Github"
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.08.55-.17.55-.38l-.01-1.35c-2.01.44-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
            </svg>
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
          <h2 className="project-detail-subtitle">
            <I18nText ko="상세" en="Details" />
          </h2>
          {markdownWithImages ? (
            <div className="project-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdownWithImages}</ReactMarkdown>
            </div>
          ) : (
            <p className="section-copy" style={{ margin: 0 }}>
              <I18nText ko="아직 상세 내용이 없습니다." en="No detailed notes available yet." />
            </p>
          )}

          {fileAssets.length > 0 ? (
            <section style={{ display: "grid", gap: 10 }}>
              <h3 className="project-detail-subtitle" style={{ fontSize: "1rem" }}>
                <I18nText ko="파일" en="File" />
              </h3>
              <div className="project-asset-grid">
                {fileAssets.map((asset) => {
                  return (
                    <a key={asset.id} href={asset.assetUrl} target="_blank" rel="noreferrer" className="project-asset-card">
                      <span className="project-asset-name">{asset.originalName}</span>
                      <span className="project-asset-meta">
                        <I18nText ko="파일" en="File" />
                        {" · "}
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
          <h2 className="project-detail-subtitle">
            <I18nText ko="다른 프로젝트" en="Other Projects" />
          </h2>

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
                    {getLanguageLabelByCategory(item.category)}
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

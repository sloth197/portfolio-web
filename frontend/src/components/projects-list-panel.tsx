import Link from "next/link";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

type Props = {
  projects: ProjectDto[];
  selectedCategory?: ProjectCategory;
};

function buildAdminCreatePath(selectedCategory?: ProjectCategory): string {
  const params = new URLSearchParams();
  if (selectedCategory) {
    params.set("category", selectedCategory);
  }
  return params.size > 0 ? `/projects/admin/new?${params.toString()}` : "/projects/admin/new";
}

function buildAdminLoginPath(selectedCategory?: ProjectCategory): string {
  const next = buildAdminCreatePath(selectedCategory);
  return `/admin/login?next=${encodeURIComponent(next)}`;
}

function buildProjectDetailPath(slug: string, selectedCategory?: ProjectCategory): string {
  const params = new URLSearchParams();
  if (selectedCategory) {
    params.set("category", selectedCategory);
  }
  return params.size > 0 ? `/projects/${slug}?${params.toString()}` : `/projects/${slug}`;
}

function formatCreatedLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recent";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}.${month}`;
}

function buildSectionTitle(selectedCategory?: ProjectCategory): string {
  if (selectedCategory === "SOFTWARE") {
    return "Software Projects";
  }
  if (selectedCategory === "FIRMWARE") {
    return "Firmware Projects";
  }
  return "All Projects";
}

export default function ProjectsListPanel({ projects, selectedCategory }: Props) {
  return (
    <section className="projects-gallery">
      <div className="projects-gallery-head">
        <div style={{ display: "grid", gap: 6 }}>
          <h2 className="projects-gallery-title">{buildSectionTitle(selectedCategory)}</h2>
          <p className="projects-gallery-copy">{projects.length} projects available</p>
        </div>
        <Link className="btn-ghost projects-admin-button" href={buildAdminLoginPath(selectedCategory)}>
          Add Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">
          No projects yet for this category.
        </div>
      ) : (
        <div className="projects-showcase-grid">
          {projects.map((project, index) => (
            <article key={project.id} className="project-showcase-card">
              <div className={`project-showcase-shot shot-variant-${index % 6}`}>
                <span className="project-showcase-category">{project.category}</span>
                <span className="project-showcase-slug">{project.slug}</span>
              </div>

              <div className="project-showcase-body">
                <h3 className="project-showcase-title">{project.title}</h3>
                <p className="project-showcase-summary">{project.summary}</p>

                <div className="project-tag-row">
                  <span className="project-tag-pill">{project.category.toLowerCase()}</span>
                  <span className="project-tag-pill">{formatCreatedLabel(project.createdAt)}</span>
                </div>

                <Link href={buildProjectDetailPath(project.slug, selectedCategory)} className="btn project-showcase-link">
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

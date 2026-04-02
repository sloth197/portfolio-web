"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { canAdminManageProjects, subscribeAdminAuth } from "@/lib/admin-auth";
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

function getServerSnapshot(): boolean {
  return false;
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

function buildLanguageSectionTitle(selectedCategory?: ProjectCategory): string {
  if (selectedCategory === "SOFTWARE") {
    return "C# projects";
  }
  if (selectedCategory === "FIRMWARE") {
    return "Java projects";
  }
  return "All projects";
}

function getLanguageLabelByCategory(category: ProjectCategory): string {
  return category === "SOFTWARE" ? "C#" : "Java";
}

export default function ProjectsListPanel({ projects, selectedCategory }: Props) {
  const canManageProjects = useSyncExternalStore(subscribeAdminAuth, canAdminManageProjects, getServerSnapshot);

  return (
    <section className="projects-gallery">
      <div className="projects-gallery-head">
        <div style={{ display: "grid", gap: 6 }}>
          <h2 className="projects-gallery-title">{buildLanguageSectionTitle(selectedCategory)}</h2>
          <p className="projects-gallery-copy">{`${projects.length} projects available`}</p>
        </div>
        {canManageProjects ? (
          <Link className="btn-ghost projects-admin-button" href={buildAdminCreatePath(selectedCategory)}>
            Add Project
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">No projects yet for this category.</div>
      ) : (
        <div className="projects-showcase-grid">
          {projects.map((project, index) => (
            <article key={project.id} className="project-showcase-card">
              <div className={`project-showcase-shot shot-variant-${index % 6}`}>
                <span className="project-showcase-category">{getLanguageLabelByCategory(project.category)}</span>
                <span className="project-showcase-slug">{project.slug}</span>
              </div>

              <div className="project-showcase-body">
                <h3 className="project-showcase-title">{project.title}</h3>
                <p className="project-showcase-summary">{project.summary}</p>

                <div className="project-tag-row">
                  <span className="project-tag-pill">{getLanguageLabelByCategory(project.category)}</span>
                  <span className="project-tag-pill">{project.projectPeriod?.trim() || formatCreatedLabel(project.createdAt)}</span>
                </div>

                <Link href={buildProjectDetailPath(project.slug, selectedCategory)} className="btn project-showcase-link">
                  view
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

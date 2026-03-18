"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { canAdminManageProjects, subscribeAdminAuth } from "@/lib/admin-auth";
import I18nText, { type SiteLanguage, useSiteLanguage } from "@/components/i18n-text";
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

function buildSectionTitle(selectedCategory: ProjectCategory | undefined, language: SiteLanguage): string {
  if (selectedCategory === "SOFTWARE") {
    return language === "ko" ? "소프트웨어 프로젝트" : "Software Projects";
  }
  if (selectedCategory === "FIRMWARE") {
    return language === "ko" ? "펌웨어 프로젝트" : "Firmware Projects";
  }
  return language === "ko" ? "전체 프로젝트" : "All Projects";
}

export default function ProjectsListPanel({ projects, selectedCategory }: Props) {
  const canManageProjects = useSyncExternalStore(subscribeAdminAuth, canAdminManageProjects, getServerSnapshot);
  const language = useSiteLanguage();

  return (
    <section className="projects-gallery">
      <div className="projects-gallery-head">
        <div style={{ display: "grid", gap: 6 }}>
          <h2 className="projects-gallery-title">{buildSectionTitle(selectedCategory, language)}</h2>
          <p className="projects-gallery-copy">
            {language === "ko" ? `${projects.length}개 프로젝트` : `${projects.length} projects available`}
          </p>
        </div>
        {canManageProjects ? (
          <Link className="btn-ghost projects-admin-button" href={buildAdminCreatePath(selectedCategory)}>
            <I18nText ko="프로젝트 추가" en="Add Project" />
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">
          <I18nText ko="이 카테고리에 프로젝트가 없습니다." en="No projects yet for this category." />
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
                  <span className="project-tag-pill">
                    {project.category === "SOFTWARE"
                      ? (language === "ko" ? "소프트웨어" : "software")
                      : (language === "ko" ? "펌웨어" : "firmware")}
                  </span>
                  <span className="project-tag-pill">{project.projectPeriod?.trim() || formatCreatedLabel(project.createdAt)}</span>
                </div>

                <Link href={buildProjectDetailPath(project.slug, selectedCategory)} className="btn project-showcase-link">
                  <I18nText ko="보기" en="View" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { canAdminManageProjects, subscribeAdminAuth } from "@/lib/admin-auth";
import ProjectShowcaseCard from "@/components/project-showcase-card";
import type { ProjectDto } from "@/lib/types";

type Props = {
  projects: ProjectDto[];
};

function buildAdminCreatePath(): string {
  return "/projects/admin/new";
}

function getServerSnapshot(): boolean {
  return false;
}

function buildProjectDetailPath(slug: string): string {
  return `/projects/${slug}`;
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

export default function ProjectsListPanel({ projects }: Props) {
  const canManageProjects = useSyncExternalStore(subscribeAdminAuth, canAdminManageProjects, getServerSnapshot);

  return (
    <section className="projects-gallery">
      <div className="projects-gallery-head">
        <div style={{ display: "grid", gap: 6 }}>
          <h2 className="projects-gallery-title">All projects</h2>
          <p className="projects-gallery-copy">{`${projects.length} projects available`}</p>
        </div>
        {canManageProjects ? (
          <Link className="btn-ghost projects-admin-button" href={buildAdminCreatePath()}>
            Add Project
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty-state">No projects yet.</div>
      ) : (
        <div className="projects-showcase-grid">
          {projects.map((project, index) => (
            <ProjectShowcaseCard
              key={project.id}
              href={buildProjectDetailPath(project.slug)}
              index={index}
              periodText={project.projectPeriod?.trim() || formatCreatedLabel(project.createdAt)}
              project={project}
            />
          ))}
        </div>
      )}
    </section>
  );
}

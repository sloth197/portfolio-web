"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { projectDetailPath } from "@/lib/project-route";
import type { ProjectCategory, ProjectDto } from "@/lib/types";

const PAGE_SIZE = 4;

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

export default function ProjectsListPanel({ projects, selectedCategory }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const visibleProjects = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return projects.slice(start, start + PAGE_SIZE);
  }, [projects, safePage]);

  return (
    <section className="panel" style={{ padding: 14, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <p className="section-copy" style={{ fontSize: 13 }}>
          {selectedCategory ? `${selectedCategory} 선택 중` : "카테고리를 선택해 주세요"}
        </p>
        <Link className="btn-ghost" href={buildAdminLoginPath(selectedCategory)} style={{ padding: "8px 16px", borderRadius: 999 }}>
          추가
        </Link>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {visibleProjects.map((project) => (
          <Link
            key={project.id}
            href={projectDetailPath(project.category, project.slug)}
            className="panel project-card"
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>{project.title}</span>
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <p className="section-copy" style={{ fontSize: 13 }}>
          표시할 프로젝트가 없습니다.
        </p>
      ) : null}

      {totalPages > 1 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 4 }}>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={num === safePage ? "btn" : "btn-ghost"}
              onClick={() => setPage(num)}
              style={{
                minWidth: 34,
                height: 34,
                padding: 0,
                borderRadius: 10,
                boxShadow: "none",
              }}
            >
              {num}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

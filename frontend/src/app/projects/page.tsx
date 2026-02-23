import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError, fetchProjects } from "@/lib/api";
import type { ProjectCategory } from "@/lib/types";

function normalizeCategory(value?: string): ProjectCategory | undefined {
  if (!value) {
    return undefined;
  }
  const upper = value.toUpperCase();
  if (upper === "FIRMWARE" || upper === "SOFTWARE") {
    return upper;
  }
  return undefined;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = normalizeCategory(params.category);

  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    projects = await fetchProjects(selectedCategory);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        redirect("/auth");
      }
      if (error.status === 404) {
        notFound();
      }
    }
    throw error;
  }

  const sortedProjects = [...projects].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 10 }}>
        <span className="badge">Projects</span>
        <h1 className="section-title">프로젝트</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="badge" href="/projects?category=SOFTWARE">
            Software
          </Link>
          <Link className="badge" href="/projects?category=FIRMWARE">
            Firmware
          </Link>
          <Link className="badge" href="/projects">
            All
          </Link>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {sortedProjects.map((project) => (
          <article key={project.id} className="panel" style={{ padding: 16, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="badge">{project.category}</span>
            </div>

            <Link href={`/projects/${project.slug}`} style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {project.title}
            </Link>

            <div className="section-copy" style={{ fontSize: 14 }}>
              {project.summary}
            </div>
          </article>
        ))}
      </section>

      {sortedProjects.length === 0 ? <p className="section-copy">해당 카테고리의 프로젝트가 없습니다.</p> : null}
    </div>
  );
}

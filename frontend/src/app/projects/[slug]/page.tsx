import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, fetchProjectBySlug, fetchProjects } from "@/lib/api";
import type { ProjectCategory } from "@/lib/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let project: Awaited<ReturnType<typeof fetchProjectBySlug>>;
  let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];

  try {
    const { slug } = await params;
    project = await fetchProjectBySlug(slug);
    allProjects = await fetchProjects();
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        notFound();
      }
    }
    throw error;
  }

  const sortedProjects = [...allProjects].sort((a, b) => {
    const order = (category: ProjectCategory) => (category === "SOFTWARE" ? 0 : 1);
    const byCategory = order(a.category) - order(b.category);
    if (byCategory !== 0) {
      return byCategory;
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Link className="btn-ghost" href="/projects" style={{ width: "fit-content" }}>
        프로젝트 목록으로
      </Link>

      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 12 }}>
        <span className="badge">{project.category}</span>
        <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {project.title}
        </h1>
        <p className="section-copy" style={{ margin: 0 }}>
          {project.summary}
        </p>
        {project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn" style={{ width: "fit-content" }}>
            GitHub 보기
          </a>
        ) : null}
      </section>

      <section className="panel" style={{ padding: "18px clamp(14px, 4vw, 22px)", display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>프로젝트 선택</h2>

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {sortedProjects.map((item) => {
            const isCurrent = item.slug === project.slug;
            return (
              <Link
                key={item.id}
                href={`/projects/${item.slug}`}
                className="panel project-card"
                style={{
                  padding: 14,
                  display: "grid",
                  gap: 6,
                  borderColor: isCurrent ? "var(--accent)" : undefined,
                }}
              >
                <span className="badge">{item.category}</span>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>{item.title}</div>
                <div className="section-copy" style={{ fontSize: 14 }}>
                  {item.summary}
                </div>
              </Link>
            );
          })}
        </div>

        {sortedProjects.length === 0 ? (
          <div className="section-copy" style={{ fontSize: 14 }}>
            표시할 프로젝트가 없습니다.
          </div>
        ) : null}
      </section>
    </div>
  );
}

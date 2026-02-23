import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError, fetchProjectBySlug } from "@/lib/api";
import { categoryToSegment, projectDetailPath, segmentToCategory } from "@/lib/project-route";

export default async function ProjectDetailByCategoryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const selectedCategory = segmentToCategory(category);
  if (!selectedCategory) {
    notFound();
  }

  let project: Awaited<ReturnType<typeof fetchProjectBySlug>>;
  try {
    project = await fetchProjectBySlug(slug);
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

  if (project.category !== selectedCategory) {
    redirect(projectDetailPath(project.category, project.slug));
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Link className="btn-ghost" href={`/projects?category=${project.category}`} style={{ width: "fit-content" }}>
        프로젝트 목록으로
      </Link>

      <section className="surface-card" style={{ padding: "22px clamp(18px, 4vw, 30px)", display: "grid", gap: 12 }}>
        <span className="badge">{categoryToSegment(project.category).toUpperCase()}</span>
        <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {project.title}
        </h1>
        <p className="section-copy" style={{ margin: 0 }}>
          {project.summary}
        </p>
        {project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn" style={{ width: "fit-content" }}>
            링크 보기
          </a>
        ) : null}
      </section>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { ApiError, fetchProjectBySlug } from "@/lib/api";
import { projectDetailPath } from "@/lib/project-route";

export default async function LegacyProjectSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const project = await fetchProjectBySlug(slug);
    redirect(projectDetailPath(project.category, project.slug));
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
}

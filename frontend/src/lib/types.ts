export type ProjectCategory = "FIRMWARE" | "SOFTWARE";

export type ProjectDto = {
  id: number;
  category: ProjectCategory;
  title: string;
  slug: string;
  summary: string;
  contentMarkdown: string;
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
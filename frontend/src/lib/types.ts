export type ProjectCategory = "FIRMWARE" | "SOFTWARE";
export type ProjectAssetType = "IMAGE" | "FILE";

export type ProjectAssetDto = {
  id: number;
  assetType: ProjectAssetType;
  originalName: string;
  contentType: string | null;
  fileSize: number;
  url: string;
  createdAt: string;
};

export type ProjectDto = {
  id: number;
  category: ProjectCategory;
  title: string;
  slug: string;
  summary: string;
  projectPeriod: string | null;
  contentMarkdown: string;
  githubUrl: string | null;
  assets?: ProjectAssetDto[];
  createdAt: string;
  updatedAt: string;
};

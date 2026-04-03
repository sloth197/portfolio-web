import type { ProjectAssetDto, ProjectDto } from "./types";
import { resolvePublicAssetUrl } from "./asset-url";

function hasImageExtension(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.endsWith(".png")
    || lower.endsWith(".jpg")
    || lower.endsWith(".jpeg")
    || lower.endsWith(".gif")
    || lower.endsWith(".webp")
    || lower.endsWith(".svg")
    || lower.endsWith(".avif");
}

function isImageAsset(asset: ProjectAssetDto): boolean {
  if (asset.assetType === "IMAGE") {
    return true;
  }
  const contentType = asset.contentType?.toLowerCase() ?? "";
  if (contentType.startsWith("image/")) {
    return true;
  }
  return hasImageExtension(asset.originalName) || hasImageExtension(asset.url);
}

export type ProjectPreviewMedia = {
  alt: string;
  url: string;
};

export function pickProjectPreviewMedia(project: ProjectDto): ProjectPreviewMedia | null {
  const assets = project.assets ?? [];
  const imageAsset = assets.find(isImageAsset);
  if (!imageAsset) {
    return null;
  }

  return {
    url: resolvePublicAssetUrl(imageAsset.url),
    alt: imageAsset.originalName?.trim() || `${project.title} preview`,
  };
}

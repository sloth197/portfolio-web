"use client";

import type { ComponentPropsWithoutRef, SyntheticEvent } from "react";
import { useMemo, useState } from "react";

type MarkdownImageWithFallbackProps = ComponentPropsWithoutRef<"img"> & {
  projectGithubUrl?: string | null;
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];
const GITHUB_BRANCH_CANDIDATES = ["main", "master"];
const GITHUB_PATH_CANDIDATES = [
  "PortfolioUI/docs/gif",
  "docs/gif",
  "docs/images",
  "docs",
  "assets/images",
  "assets",
  "",
];

type GithubRepo = {
  owner: string;
  repo: string;
};

function hasImageExtension(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => lowerValue.endsWith(extension));
}

function extractGithubRepo(githubUrl?: string | null): GithubRepo | null {
  if (!githubUrl) {
    return null;
  }

  try {
    const parsed = new URL(githubUrl);
    if (!parsed.hostname.toLowerCase().includes("github.com")) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, "");
    if (!owner || !repo) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

function extractFileName(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "https://placeholder.local");
    const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
    const fileName = segments.at(-1);
    if (!fileName) {
      return null;
    }
    return decodeURIComponent(fileName);
  } catch {
    return null;
  }
}

function buildGithubRawCandidates(githubUrl: string | null | undefined, fileName: string): string[] {
  const repo = extractGithubRepo(githubUrl);
  if (!repo) {
    return [];
  }

  const encodedFileName = encodeURIComponent(fileName);
  return GITHUB_BRANCH_CANDIDATES.flatMap((branch) => {
    return GITHUB_PATH_CANDIDATES.map((pathPrefix) => {
      const normalizedPath = pathPrefix ? `${pathPrefix}/${encodedFileName}` : encodedFileName;
      return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}/${normalizedPath}`;
    });
  });
}

function buildCandidateSources(
  src: string | Blob | undefined,
  alt: string | undefined,
  githubUrl: string | null | undefined,
): string[] {
  const candidates = new Set<string>();
  const primarySrc = typeof src === "string" ? src.trim() : "";

  if (primarySrc) {
    candidates.add(primarySrc);
  }

  const sourceFileName = extractFileName(primarySrc);
  const altFileName = extractFileName(alt);
  const fallbackFileName = [sourceFileName, altFileName].find(
    (value): value is string => Boolean(value && hasImageExtension(value)),
  );

  if (fallbackFileName) {
    for (const candidate of buildGithubRawCandidates(githubUrl, fallbackFileName)) {
      candidates.add(candidate);
    }
  }

  return [...candidates];
}

export default function MarkdownImageWithFallback({
  projectGithubUrl,
  src,
  alt,
  loading,
  decoding,
  referrerPolicy,
  onError,
  ...rest
}: MarkdownImageWithFallbackProps) {
  const sourceValue = typeof src === "string" ? src : "";
  const altValue = typeof alt === "string" ? alt : "";
  const candidates = useMemo(
    () => buildCandidateSources(sourceValue, altValue, projectGithubUrl),
    [altValue, projectGithubUrl, sourceValue],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  const activeSrc = candidates[candidateIndex];
  if (!activeSrc) {
    return null;
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);
    setCandidateIndex((previousIndex) => {
      if (previousIndex >= candidates.length - 1) {
        return previousIndex;
      }
      return previousIndex + 1;
    });
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={activeSrc}
      alt={altValue}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      referrerPolicy={referrerPolicy ?? "no-referrer"}
      onError={handleError}
    />
  );
}

export type GithubRepo = {
  owner: string;
  repo: string;
};

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const SAFE_GITHUB_SEGMENT = /^[A-Za-z0-9_.-]+$/;

function isSafeGithubSegment(value: string): boolean {
  return value.length > 0 && value !== "." && value !== ".." && SAFE_GITHUB_SEGMENT.test(value);
}

export function extractGithubRepo(githubUrl?: string | null): GithubRepo | null {
  if (!githubUrl) {
    return null;
  }

  try {
    const parsed = new URL(githubUrl.trim());
    if (parsed.protocol !== "https:" || !GITHUB_HOSTS.has(parsed.hostname.toLowerCase())) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, "");
    if (!isSafeGithubSegment(owner) || !isSafeGithubSegment(repo)) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

export function getSafeGithubRepositoryUrl(githubUrl?: string | null): string | null {
  const repo = extractGithubRepo(githubUrl);
  if (!repo) {
    return null;
  }

  return `https://github.com/${repo.owner}/${repo.repo}`;
}

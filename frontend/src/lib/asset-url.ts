import { getPublicApiBaseUrl, getPublicApiOrigin } from "./api-base";

function getApiOrigin(): string | null {
  return getPublicApiOrigin();
}

function isLegacyPortfolioApiHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.includes("portfolio-api") && host.endsWith(".onrender.com");
}

export function resolvePublicAssetUrl(url: string): string {
  const apiBase = getPublicApiBaseUrl();
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (isLegacyPortfolioApiHost(parsed.hostname)) {
        const apiOrigin = getApiOrigin();
        if (apiOrigin) {
          return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return apiBase ? `${apiBase}${trimmed}` : trimmed;
}

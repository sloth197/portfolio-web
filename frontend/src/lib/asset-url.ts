const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function getApiOrigin(): string | null {
  if (!API_BASE) {
    return null;
  }
  try {
    return new URL(API_BASE).origin;
  } catch {
    return null;
  }
}

function isLegacyPortfolioApiHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.includes("portfolio-api") && host.endsWith(".onrender.com");
}

export function resolvePublicAssetUrl(url: string): string {
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

  return API_BASE ? `${API_BASE}${trimmed}` : trimmed;
}

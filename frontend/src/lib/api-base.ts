const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const FALLBACK_API_BASE = process.env.NEXT_PUBLIC_FALLBACK_API_BASE_URL ?? "https://api.xhbt.dev";

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isLegacyOnrenderApiUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host.includes("portfolio-api") && host.endsWith(".onrender.com");
  } catch {
    return false;
  }
}

export function getPublicApiBaseUrl(): string {
  const configured = normalizeBaseUrl(RAW_API_BASE);
  const fallback = normalizeBaseUrl(FALLBACK_API_BASE);
  if (!configured) {
    return fallback;
  }
  if (isLegacyOnrenderApiUrl(configured)) {
    return fallback;
  }
  return configured;
}

export function getPublicApiOrigin(): string | null {
  try {
    return new URL(getPublicApiBaseUrl()).origin;
  } catch {
    return null;
  }
}

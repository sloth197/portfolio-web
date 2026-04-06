const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const FALLBACK_API_BASE = process.env.NEXT_PUBLIC_FALLBACK_API_BASE_URL ?? "https://portfolio-api-y5yr.onrender.com";

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getPublicApiBaseUrl(): string {
  const configured = normalizeBaseUrl(RAW_API_BASE);
  const fallback = normalizeBaseUrl(FALLBACK_API_BASE);
  return configured || fallback;
}

export function getPublicApiOrigin(): string | null {
  try {
    return new URL(getPublicApiBaseUrl()).origin;
  } catch {
    return null;
  }
}

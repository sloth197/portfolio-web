const RAW_CRM_API_BASE = process.env.NEXT_PUBLIC_CRM_API_BASE_URL ?? "/crm/api";
const FALLBACK_CRM_API_BASE = "/crm/api";

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getCrmApiBaseUrl(): string {
  const configured = normalizeBaseUrl(RAW_CRM_API_BASE);
  const fallback = normalizeBaseUrl(FALLBACK_CRM_API_BASE);
  return configured || fallback;
}

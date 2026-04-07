export const HARD_RELOAD_SESSION_KEY = "portfolio-hard-reload";
export const CRM_VISITOR_ID_STORAGE_KEY = "portfolio-crm-visitor-id";
export const CRM_SESSION_ID_STORAGE_KEY = "portfolio-crm-session-id";
export const CRM_VISIT_LOGS_STORAGE_KEY = "portfolio-crm-visit-logs";
export const CRM_PROJECT_CLICK_EVENTS_STORAGE_KEY = "portfolio-crm-project-click-events";
export const CRM_PROJECT_STAY_EVENTS_STORAGE_KEY = "portfolio-crm-project-stay-events";

const CRM_MAX_STORED_EVENTS = 800;

export type CrmVisitLogEvent = {
  id: string;
  visitorId: string;
  sessionId: string;
  visitedAt: string;
  pagePath: string;
  browser: string;
  device: string;
  referrer: string;
};

export type CrmProjectClickEvent = {
  id: string;
  visitorId: string;
  sessionId: string;
  projectSlug: string;
  clickType: "detail" | "github";
  clickedAt: string;
};

export type CrmProjectStayEvent = {
  id: string;
  visitorId: string;
  sessionId: string;
  projectSlug: string;
  staySeconds: number;
  enteredAt: string;
  leftAt: string;
};

export function consumeHardReloadFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const flagged = window.sessionStorage.getItem(HARD_RELOAD_SESSION_KEY) === "1";
    if (flagged) {
      window.sessionStorage.removeItem(HARD_RELOAD_SESSION_KEY);
    }
    return flagged;
  } catch {
    return false;
  }
}

function createClientId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureCrmVisitorId(): string {
  if (typeof window === "undefined") {
    return createClientId("anon");
  }

  try {
    const existing = window.localStorage.getItem(CRM_VISITOR_ID_STORAGE_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const created = createClientId("anon");
    window.localStorage.setItem(CRM_VISITOR_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return createClientId("anon");
  }
}

export function ensureCrmSessionId(): string {
  if (typeof window === "undefined") {
    return createClientId("sess");
  }

  try {
    const existing = window.sessionStorage.getItem(CRM_SESSION_ID_STORAGE_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const created = createClientId("sess");
    window.sessionStorage.setItem(CRM_SESSION_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return createClientId("sess");
  }
}

export function readCrmStorageEvents<T>(storageKey: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch {
    return [];
  }
}

export function appendCrmStorageEvent<T>(storageKey: string, event: T, maxSize = CRM_MAX_STORED_EVENTS): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = readCrmStorageEvents<T>(storageKey);
    const next = [...existing, event];
    const trimmed = next.slice(Math.max(next.length - maxSize, 0));
    window.localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch {
    // no-op
  }
}

export function detectBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) {
    return "Edge";
  }
  if (ua.includes("opr/") || ua.includes("opera")) {
    return "Opera";
  }
  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return "Chrome";
  }
  if (ua.includes("firefox/")) {
    return "Firefox";
  }
  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return "Safari";
  }
  return "Unknown";
}

export function detectDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) {
    return "Tablet";
  }
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) {
    return "Mobile";
  }
  return "Desktop";
}

export function extractProjectSlug(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/?#]+)/);
  if (!match?.[1]) {
    return null;
  }

  const slug = decodeURIComponent(match[1]).trim().toLowerCase();
  if (!slug || slug === "admin") {
    return null;
  }

  return slug;
}

export function toProjectDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1) : ""))
    .join(" ");
}

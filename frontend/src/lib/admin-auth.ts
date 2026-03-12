export const ADMIN_AUTH_KEY = "portfolio_admin_basic_auth";
export const ADMIN_ROLE_KEY = "portfolio_admin_role";
export const ADMIN_AUTH_CHANGE_EVENT = "portfolio-admin-auth-change";
export type AdminRole = "ADMIN" | "CRM";

export function getAdminAuthHeader(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(ADMIN_AUTH_KEY);
}

export function getAdminRole(): AdminRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(ADMIN_ROLE_KEY);
  if (stored === "ADMIN" || stored === "CRM") {
    return stored;
  }

  // Backward compatibility for older sessions that stored only the auth header.
  return getAdminAuthHeader() ? "ADMIN" : null;
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminAuthHeader());
}

export function canAdminManageProjects(): boolean {
  return getAdminRole() === "ADMIN";
}

export function setAdminAuthSession(value: string, role: AdminRole = "ADMIN"): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(ADMIN_AUTH_KEY, value);
  window.sessionStorage.setItem(ADMIN_ROLE_KEY, role);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function clearAdminAuthHeader(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
  window.sessionStorage.removeItem(ADMIN_ROLE_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function subscribeAdminAuth(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ADMIN_AUTH_KEY || event.key === ADMIN_ROLE_KEY) {
      onStoreChange();
    }
  };
  const onCustomEvent = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_AUTH_CHANGE_EVENT, onCustomEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_AUTH_CHANGE_EVENT, onCustomEvent);
  };
}

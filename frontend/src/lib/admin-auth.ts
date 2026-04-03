export const ADMIN_LOGIN_KEY = "portfolio_admin_logged_in";
export const ADMIN_ROLE_KEY = "portfolio_admin_role";
export const ADMIN_AUTH_CHANGE_EVENT = "portfolio-admin-auth-change";
export type AdminRole = "ADMIN" | "CRM";

export function getAdminRole(): AdminRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(ADMIN_ROLE_KEY);
  if (stored === "ADMIN" || stored === "CRM") {
    return stored;
  }
  return null;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(ADMIN_LOGIN_KEY) === "1";
}

export function canAdminManageProjects(): boolean {
  return getAdminRole() === "ADMIN";
}

export function setAdminAuthSession(role: AdminRole = "ADMIN"): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(ADMIN_LOGIN_KEY, "1");
  window.sessionStorage.setItem(ADMIN_ROLE_KEY, role);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function clearAdminAuthHeader(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(ADMIN_LOGIN_KEY);
  window.sessionStorage.removeItem(ADMIN_ROLE_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function subscribeAdminAuth(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ADMIN_LOGIN_KEY || event.key === ADMIN_ROLE_KEY) {
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

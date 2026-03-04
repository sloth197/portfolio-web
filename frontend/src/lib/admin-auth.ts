export const ADMIN_AUTH_KEY = "portfolio_admin_basic_auth";
export const ADMIN_AUTH_CHANGE_EVENT = "portfolio-admin-auth-change";

export function getAdminAuthHeader(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(ADMIN_AUTH_KEY);
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminAuthHeader());
}

export function setAdminAuthHeader(value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(ADMIN_AUTH_KEY, value);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function clearAdminAuthHeader(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function subscribeAdminAuth(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ADMIN_AUTH_KEY) {
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

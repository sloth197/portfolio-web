export const HARD_RELOAD_SESSION_KEY = "portfolio-hard-reload";

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

"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark";

const STORAGE_KEY = "portfolio-theme";
const STORAGE_USER_SET_KEY = "portfolio-theme-user-set";
const SESSION_USER_SET_KEY = "portfolio-theme-session-user-set";
const THEME_CHANGE_EVENT = "portfolio-theme-change";

function applyTheme() {
  document.documentElement.dataset.theme = "dark";
  window.localStorage.setItem(STORAGE_KEY, "dark");
  window.localStorage.setItem(STORAGE_USER_SET_KEY, "1");
  window.sessionStorage.setItem(SESSION_USER_SET_KEY, "1");
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function readStoredTheme(): Theme {
  // Light theme is disabled. Always return dark.
  return "dark";
}

function readTheme(): Theme {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "dark";
  }
  const nextTheme = readStoredTheme();
  if (document.documentElement.dataset.theme !== nextTheme) {
    document.documentElement.dataset.theme = nextTheme;
  }
  return nextTheme;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY || event.key === STORAGE_USER_SET_KEY) {
      const next = readStoredTheme();
      document.documentElement.dataset.theme = next;
      onStoreChange();
    }
  };

  const onThemeChange = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  };
}

function getServerSnapshot(): Theme {
  return "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  return (
    <div className="theme-switch" role="group" aria-label="Theme selection">
      {/*
      <button
        type="button"
        className={`theme-pill ${theme === "light" ? "is-active" : ""}`}
        onClick={() => applyTheme("light")}
      >
        Gen
      </button>
      */}
      <button
        type="button"
        className={`theme-pill ${theme === "dark" ? "is-active" : ""}`}
        onClick={() => applyTheme()}
      >
        Black
      </button>
    </div>
  );
}

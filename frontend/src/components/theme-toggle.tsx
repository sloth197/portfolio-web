"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-theme";
const THEME_CHANGE_EVENT = "portfolio-theme-change";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function readTheme(): Theme {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "light";
  }
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      const next = window.localStorage.getItem(STORAGE_KEY);
      if (next === "dark" || next === "light") {
        document.documentElement.dataset.theme = next;
      }
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
  return "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  function onSelect(nextTheme: Theme) {
    applyTheme(nextTheme);
  }

  return (
    <div className="theme-switch" role="group" aria-label="Theme selection">
      <button
        type="button"
        className={`theme-pill ${theme === "light" ? "is-active" : ""}`}
        onClick={() => onSelect("light")}
      >
        Gen
      </button>
      <button
        type="button"
        className={`theme-pill ${theme === "dark" ? "is-active" : ""}`}
        onClick={() => onSelect("dark")}
      >
        Black
      </button>
    </div>
  );
}

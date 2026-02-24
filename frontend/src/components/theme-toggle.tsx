"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

function readTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
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

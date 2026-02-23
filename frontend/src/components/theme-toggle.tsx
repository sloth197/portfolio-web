"use client";

import { useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

function getInitialTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function onSelect(nextTheme: Theme) {
    applyTheme(nextTheme);
    setTheme(nextTheme);
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

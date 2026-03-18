"use client";

import { useSyncExternalStore } from "react";

type SiteLanguage = "ko" | "en";

const STORAGE_KEY = "portfolio-language";
const LANGUAGE_CHANGE_EVENT = "portfolio-language-change";

function applyLanguage(language: SiteLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dataset.lang = language;
  window.localStorage.setItem(STORAGE_KEY, language);
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

function readLanguage(): SiteLanguage {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "ko";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ko" || saved === "en") {
    return saved;
  }

  return document.documentElement.lang === "en" ? "en" : "ko";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      const next = window.localStorage.getItem(STORAGE_KEY);
      if (next === "ko" || next === "en") {
        document.documentElement.lang = next;
        document.documentElement.dataset.lang = next;
      }
      onStoreChange();
    }
  };

  const onLanguageChange = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
  };
}

function getServerSnapshot(): SiteLanguage {
  return "ko";
}

export default function LanguageToggle() {
  const language = useSyncExternalStore(subscribe, readLanguage, getServerSnapshot);
  const nextLanguage: SiteLanguage = language === "ko" ? "en" : "ko";

  return (
    <button
      type="button"
      className="btn-ghost header-lang-toggle"
      aria-label={nextLanguage === "ko" ? "Switch language to Korean" : "Switch language to English"}
      onClick={() => applyLanguage(nextLanguage)}
    >
      {language === "ko" ? "KO/EN" : "EN/KO"}
    </button>
  );
}

"use client";

import { useSyncExternalStore } from "react";

export type SiteLanguage = "ko" | "en";

const STORAGE_KEY = "portfolio-language";
const LANGUAGE_CHANGE_EVENT = "portfolio-language-change";

function readSiteLanguage(): SiteLanguage {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ko" || saved === "en") {
    return saved;
  }

  return document.documentElement.lang === "ko" ? "ko" : "en";
}

function subscribeSiteLanguage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
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

function getServerSiteLanguage(): SiteLanguage {
  return "en";
}

export function useSiteLanguage(): SiteLanguage {
  return useSyncExternalStore(subscribeSiteLanguage, readSiteLanguage, getServerSiteLanguage);
}

export function setSiteLanguage(language: SiteLanguage): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.dataset.lang = language;
  window.localStorage.setItem(STORAGE_KEY, language);
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

type I18nTextProps = {
  ko: string;
  en: string;
};

export default function I18nText({ ko, en }: I18nTextProps) {
  const language = useSiteLanguage();
  return <>{language === "en" ? en : ko}</>;
}

"use client";

import { setSiteLanguage, useSiteLanguage, type SiteLanguage } from "@/components/i18n-text";

export default function LanguageToggle() {
  const language = useSiteLanguage();
  const nextLanguage: SiteLanguage = language === "ko" ? "en" : "ko";
  const label = language === "ko" ? "KO" : "EN";

  return (
    <button
      type="button"
      className="btn-ghost header-lang-toggle"
      aria-label={nextLanguage === "ko" ? "Switch language to Korean" : "Switch language to English"}
      onClick={() => setSiteLanguage(nextLanguage)}
    >
      {label}
    </button>
  );
}

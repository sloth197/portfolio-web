"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useSiteLanguage } from "@/components/i18n-text";
import { clearAdminAuthHeader, getAdminRole, isAdminLoggedIn, subscribeAdminAuth, type AdminRole } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

function getServerRoleSnapshot(): AdminRole | null {
  return null;
}

export default function HeaderAuthButton() {
  const language = useSiteLanguage();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);

  if (!adminLoggedIn) {
    return (
      <Link className="btn-ghost header-login-link" href="/admin/login">
        {language === "en" ? "Login" : "\uB85C\uADF8\uC778"}
      </Link>
    );
  }

  return (
    <div className="header-auth-group">
      <span className="header-greeting">
        {adminRole === "CRM"
          ? (language === "en" ? "Hello, temporary admin." : "\uC784\uC2DC \uAD00\uB9AC\uC790\uB2D8 \uC548\uB155\uD558\uC138\uC694!")
          : (language === "en" ? "Hello, admin." : "\uAD00\uB9AC\uC790\uB2D8 \uC548\uB155\uD558\uC138\uC694!")}
      </span>
      <button
        type="button"
        className="btn-ghost header-login-link"
        onClick={() => {
          const confirmed = window.confirm(language === "en" ? "Do you want to log out?" : "\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?");
          if (confirmed) {
            clearAdminAuthHeader();
          }
        }}
      >
        {language === "en" ? "Logout" : "\uB85C\uADF8\uC544\uC6C3"}
      </button>
    </div>
  );
}

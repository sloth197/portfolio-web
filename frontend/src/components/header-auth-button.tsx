"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useSiteLanguage } from "@/components/i18n-text";
import {
  clearAdminAuthHeader,
  getAdminRole,
  isAdminLoggedIn,
  setAdminAuthSession,
  subscribeAdminAuth,
  type AdminRole,
} from "@/lib/admin-auth";
import { getPublicApiBaseUrl } from "@/lib/api-base";

function getServerSnapshot(): boolean {
  return false;
}

function getServerRoleSnapshot(): AdminRole | null {
  return null;
}

const API_BASE = getPublicApiBaseUrl();

function normalizeRole(value: unknown): AdminRole {
  return value === "CRM" ? "CRM" : "ADMIN";
}

export default function HeaderAuthButton() {
  const language = useSiteLanguage();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);

  useEffect(() => {
    if (!API_BASE) {
      return;
    }
    const controller = new AbortController();

    async function syncSession() {
      try {
        const response = await fetch(`${API_BASE}/api/admin/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          clearAdminAuthHeader();
          return;
        }
        const payload = (await response.json().catch(() => null)) as { authenticated?: boolean; role?: string } | null;
        if (!payload?.authenticated) {
          clearAdminAuthHeader();
          return;
        }
        setAdminAuthSession(normalizeRole(payload.role));
      } catch {
        // no-op
      }
    }

    void syncSession();

    return () => {
      controller.abort();
    };
  }, []);

  if (!adminLoggedIn) {
    return (
      <Link className="btn-ghost header-login-link" href="/admin/login">
        Login
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
        onClick={async () => {
          const confirmed = window.confirm(language === "en" ? "Do you want to log out?" : "\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?");
          if (confirmed) {
            if (API_BASE) {
              try {
                await fetch(`${API_BASE}/api/admin/auth/logout`, {
                  method: "POST",
                  credentials: "include",
                });
              } catch {
                // no-op
              }
            }
            clearAdminAuthHeader();
          }
        }}
      >
        Logout
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearAdminAuthHeader, getAdminAuthHeader, isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

function resolveAdminName(): string | null {
  const authHeader = getAdminAuthHeader();
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }
  try {
    const decoded = atob(authHeader.slice("Basic ".length));
    const [username] = decoded.split(":");
    const trimmed = username?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

export default function HeaderAuthButton() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);

  if (!adminLoggedIn) {
    return (
      <Link className="btn-ghost header-login-link" href="/admin/login">
        Login
      </Link>
    );
  }

  const adminName = resolveAdminName() ?? "관리자";

  return (
    <div className="header-auth-group">
      <span className="header-greeting">{adminName}님 안녕하세요!</span>
      <button
        type="button"
        className="btn-ghost header-login-link"
        onClick={() => {
          clearAdminAuthHeader();
        }}
      >
        Logout
      </button>
    </div>
  );
}

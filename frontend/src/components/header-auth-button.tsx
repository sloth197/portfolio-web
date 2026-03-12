"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearAdminAuthHeader, getAdminRole, isAdminLoggedIn, subscribeAdminAuth, type AdminRole } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

function getServerRoleSnapshot(): AdminRole | null {
  return null;
}

export default function HeaderAuthButton() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const adminRole = useSyncExternalStore(subscribeAdminAuth, getAdminRole, getServerRoleSnapshot);

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
        {adminRole === "CRM" ? "임시 관리자님 안녕하세요!" : "관리자님 안녕하세요!"}
      </span>
      <button
        type="button"
        className="btn-ghost header-login-link"
        onClick={() => {
          const confirmed = window.confirm("로그아웃 하시겠습니까?");
          if (confirmed) {
            clearAdminAuthHeader();
          }
        }}
      >
        Logout
      </button>
    </div>
  );
}

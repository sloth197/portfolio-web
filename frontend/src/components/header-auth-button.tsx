"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearAdminAuthHeader, isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
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

  return (
    <button
      type="button"
      className="btn-ghost header-login-link"
      onClick={() => {
        clearAdminAuthHeader();
      }}
    >
      Logout
    </button>
  );
}

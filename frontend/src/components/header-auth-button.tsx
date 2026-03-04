"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearAdminAuthHeader, isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

export default function HeaderAuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);

  const query = searchParams.toString();
  const nextPath = `${pathname}${query ? `?${query}` : ""}`;

  if (!adminLoggedIn) {
    return (
      <Link className="btn-ghost header-login-link" href={`/admin/login?next=${encodeURIComponent(nextPath)}`}>
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
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}

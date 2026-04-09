"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";
import useHydrated from "@/lib/use-hydrated";

function getServerSnapshot(): boolean {
  return false;
}

export default function AdminCrmBanner() {
  const hydrated = useHydrated();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);

  if (!hydrated || !adminLoggedIn) {
    return null;
  }

  return (
    <Link className="nav-link crm-nav-link" href="/crm">
      CRM
    </Link>
  );
}

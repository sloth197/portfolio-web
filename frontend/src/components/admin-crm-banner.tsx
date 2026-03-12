"use client";

import { useSyncExternalStore } from "react";
import { isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

export default function AdminCrmBanner() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL?.trim() || "https://crm.xhbt.dev";

  if (!adminLoggedIn) {
    return null;
  }

  return (
    <a className="nav-link crm-nav-link" href={crmUrl}>
      CRM
    </a>
  );
}

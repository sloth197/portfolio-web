"use client";

import { useSyncExternalStore } from "react";
import { isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

export default function AdminCrmBanner() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);

  if (!adminLoggedIn) {
    return null;
  }

  return <span className="crm-nav-badge">CRM</span>;
}

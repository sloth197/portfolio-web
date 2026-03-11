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

  return (
    <div className="crm-admin-banner" role="status" aria-live="polite">
      <div className="crm-admin-banner-inner">
        <span className="crm-admin-pill">CRM</span>
        <span className="crm-admin-copy">Admin session active</span>
      </div>
    </div>
  );
}

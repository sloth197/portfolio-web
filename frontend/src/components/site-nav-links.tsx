"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";
import useHydrated from "@/lib/use-hydrated";

function getServerSnapshot(): boolean {
  return false;
}

export default function SiteNavLinks() {
  const hydrated = useHydrated();
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);
  const showNoticeLink = hydrated && adminLoggedIn;

  return (
    <>
      <Link className="nav-link" href="/projects">
        Project
      </Link>
      {showNoticeLink ? (
        <Link className="nav-link" href="/notice">
          Notice
        </Link>
      ) : null}
    </>
  );
}

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
      <Link href="/#about">
        About
      </Link>
      <Link href="/projects">
        Projects
      </Link>
      {showNoticeLink ? (
        <Link href="/notice">
          Notice
        </Link>
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { isAdminLoggedIn, subscribeAdminAuth } from "@/lib/admin-auth";

function getServerSnapshot(): boolean {
  return false;
}

export default function SiteNavLinks() {
  const adminLoggedIn = useSyncExternalStore(subscribeAdminAuth, isAdminLoggedIn, getServerSnapshot);

  return (
    <>
      <Link className="nav-link" href="/projects">
        Project
      </Link>
      {adminLoggedIn ? (
        <Link className="nav-link" href="/notice">
          Notice
        </Link>
      ) : null}
    </>
  );
}

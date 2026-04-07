"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  appendCrmStorageEvent,
  CRM_PROJECT_CLICK_EVENTS_STORAGE_KEY,
  CRM_PROJECT_STAY_EVENTS_STORAGE_KEY,
  CRM_VISIT_LOGS_STORAGE_KEY,
  detectBrowserName,
  detectDeviceName,
  ensureCrmSessionId,
  ensureCrmVisitorId,
  extractProjectSlug,
  HARD_RELOAD_SESSION_KEY,
  type CrmProjectClickEvent,
  type CrmProjectStayEvent,
  type CrmVisitLogEvent,
} from "@/lib/hard-reload";

function isHardRefreshShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const hasMetaOrCtrl = event.metaKey || event.ctrlKey;

  if (event.key === "F5") {
    return event.ctrlKey || event.shiftKey || event.metaKey;
  }

  if (key === "r") {
    return hasMetaOrCtrl && event.shiftKey;
  }

  return false;
}

function toReferrerText(rawReferrer: string): string {
  if (!rawReferrer) {
    return "direct";
  }

  try {
    const url = new URL(rawReferrer);
    if (!url.hostname) {
      return "direct";
    }
    return `${url.hostname}${url.pathname && url.pathname !== "/" ? ` ${url.pathname}` : ""}`;
  } catch {
    return rawReferrer;
  }
}

function createEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HardReloadTracker() {
  const pathname = usePathname();
  const activeProjectRef = useRef<{ slug: string; enteredAtMs: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isHardRefreshShortcut(event)) {
        return;
      }
      try {
        window.sessionStorage.setItem(HARD_RELOAD_SESSION_KEY, "1");
      } catch {
        // no-op
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const visitorId = ensureCrmVisitorId();
    const sessionId = ensureCrmSessionId();
    const userAgent = navigator.userAgent ?? "";

    const visitEvent: CrmVisitLogEvent = {
      id: createEventId("visit"),
      visitorId,
      sessionId,
      visitedAt: new Date().toISOString(),
      pagePath: pathname || "/",
      browser: detectBrowserName(userAgent),
      device: detectDeviceName(userAgent),
      referrer: toReferrerText(document.referrer),
    };

    appendCrmStorageEvent(CRM_VISIT_LOGS_STORAGE_KEY, visitEvent);

    const nowMs = Date.now();
    const previousProject = activeProjectRef.current;
    if (previousProject) {
      const staySeconds = Math.max(1, Math.round((nowMs - previousProject.enteredAtMs) / 1000));
      const stayEvent: CrmProjectStayEvent = {
        id: createEventId("stay"),
        visitorId,
        sessionId,
        projectSlug: previousProject.slug,
        staySeconds,
        enteredAt: new Date(previousProject.enteredAtMs).toISOString(),
        leftAt: new Date(nowMs).toISOString(),
      };
      appendCrmStorageEvent(CRM_PROJECT_STAY_EVENTS_STORAGE_KEY, stayEvent);
    }

    const nextProjectSlug = extractProjectSlug(pathname || "");
    if (nextProjectSlug) {
      activeProjectRef.current = { slug: nextProjectSlug, enteredAtMs: nowMs };
    } else {
      activeProjectRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const clickedElement = event.target instanceof Element ? event.target : null;
      const anchor = clickedElement?.closest("a");
      if (!anchor) {
        return;
      }

      const visitorId = ensureCrmVisitorId();
      const sessionId = ensureCrmSessionId();
      const clickedAt = new Date().toISOString();

      let targetUrl: URL | null = null;
      const hrefAttr = anchor.getAttribute("href");
      if (hrefAttr) {
        try {
          targetUrl = new URL(hrefAttr, window.location.origin);
        } catch {
          targetUrl = null;
        }
      }

      if (!targetUrl && anchor.href) {
        try {
          targetUrl = new URL(anchor.href);
        } catch {
          targetUrl = null;
        }
      }

      if (!targetUrl) {
        return;
      }

      const detailProjectSlug = extractProjectSlug(targetUrl.pathname);
      if (detailProjectSlug) {
        const detailClickEvent: CrmProjectClickEvent = {
          id: createEventId("click"),
          visitorId,
          sessionId,
          projectSlug: detailProjectSlug,
          clickType: "detail",
          clickedAt,
        };
        appendCrmStorageEvent(CRM_PROJECT_CLICK_EVENTS_STORAGE_KEY, detailClickEvent);
      }

      const host = targetUrl.hostname.toLowerCase();
      if (host.includes("github.com")) {
        const currentProjectSlug = extractProjectSlug(window.location.pathname);
        if (!currentProjectSlug) {
          return;
        }

        const githubClickEvent: CrmProjectClickEvent = {
          id: createEventId("click"),
          visitorId,
          sessionId,
          projectSlug: currentProjectSlug,
          clickType: "github",
          clickedAt,
        };
        appendCrmStorageEvent(CRM_PROJECT_CLICK_EVENTS_STORAGE_KEY, githubClickEvent);
      }
    };

    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      const activeProject = activeProjectRef.current;
      if (!activeProject) {
        return;
      }

      const nowMs = Date.now();
      const staySeconds = Math.max(1, Math.round((nowMs - activeProject.enteredAtMs) / 1000));
      const stayEvent: CrmProjectStayEvent = {
        id: createEventId("stay"),
        visitorId: ensureCrmVisitorId(),
        sessionId: ensureCrmSessionId(),
        projectSlug: activeProject.slug,
        staySeconds,
        enteredAt: new Date(activeProject.enteredAtMs).toISOString(),
        leftAt: new Date(nowMs).toISOString(),
      };
      appendCrmStorageEvent(CRM_PROJECT_STAY_EVENTS_STORAGE_KEY, stayEvent);
      activeProjectRef.current = null;
    };
  }, []);

  return null;
}

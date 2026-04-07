"use client";

import { useEffect } from "react";
import { HARD_RELOAD_SESSION_KEY } from "@/lib/hard-reload";

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

export default function HardReloadTracker() {
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

  return null;
}

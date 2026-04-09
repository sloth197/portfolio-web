"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop(): () => void {
  return () => {};
}

export default function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

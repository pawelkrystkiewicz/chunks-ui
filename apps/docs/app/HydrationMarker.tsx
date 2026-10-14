"use client";

import { useEffect } from "react";

/**
 * Marks `<html data-hydrated="true">` once React has hydrated the page: the effect runs after the
 * hydration commit. scripts/check-a11y.ts waits for the attribute before it audits a page.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}

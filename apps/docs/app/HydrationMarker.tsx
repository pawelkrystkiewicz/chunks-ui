"use client";

import { useEffect } from "react";

/** Sets `data-hydrated` on `<html>` once React has hydrated; scripts/check-a11y.ts waits for it. */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { PRELOADED_FONTS } from "./configurator-constants";

export function FontLoader({ fonts }: { fonts: string[] }) {
  const injectedRef = useRef<Map<string, HTMLLinkElement>>(new Map());

  useEffect(() => {
    const needed = fonts.filter((f) => !PRELOADED_FONTS.has(f));
    const current = injectedRef.current;

    for (const font of needed) {
      if (current.has(font)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
      current.set(font, link);
    }

    // Remove fonts no longer needed
    for (const [font, link] of current) {
      if (!needed.includes(font)) {
        link.remove();
        current.delete(font);
      }
    }
  }, [fonts]);

  return null;
}

"use client";

import { useEffect, useState } from "react";

type MotionReact = typeof import("motion/react");

let _cache: MotionReact | null | undefined;

function loadMotion() {
  if (_cache !== undefined) return;
  import("motion/react")
    .then((m) => {
      _cache = m;
    })
    .catch(() => {
      _cache = null;
    });
}

if (typeof window !== "undefined") {
  loadMotion();
}

/**
 * Lazily loads motion/react. Returns the module when available, null otherwise.
 * Always returns null on the first render (SSR-safe), then upgrades after mount.
 */
export function useMotion(): MotionReact | null {
  const [mod, setMod] = useState<MotionReact | null>(null);

  useEffect(() => {
    if (_cache !== undefined) {
      setMod(_cache);
      return;
    }
    import("motion/react")
      .then((m) => {
        _cache = m;
        setMod(m);
      })
      .catch(() => {
        _cache = null;
      });
  }, []);

  return mod;
}

/**
 * Returns true when the user has requested reduced motion via
 * the `prefers-reduced-motion: reduce` media query.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

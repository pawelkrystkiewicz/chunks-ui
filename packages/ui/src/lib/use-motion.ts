"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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
 * Tests only: forget the loaded module and load it again. A popup that opens before the
 * returned promise settles mounts while Motion is still loading, as on a fresh page.
 */
export function reloadMotion(): Promise<unknown> {
  _cache = undefined;
  return import("motion/react").then((m) => {
    _cache = m;
  });
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
 * For popups: the Motion module if it has already loaded, otherwise null, fixed for the
 * caller's lifetime. Switching an open popup to a `motion.div` would remount it and lose its
 * focus and typed input, so one that opens before Motion loads keeps CSS until it closes.
 * Popups render in client-only portals, so reading the cache on the first render is safe.
 */
export function useLoadedMotion(): MotionReact | null {
  const [mod] = useState(() => _cache ?? null);
  return mod;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Returns true when the user has requested reduced motion via
 * the `prefers-reduced-motion: reduce` media query.
 *
 * False on the server and while hydrating, so server markup matches; true right after
 * hydration for a reduced-motion user. A client-only render (a popup in a portal) reads the
 * real preference on its first render.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

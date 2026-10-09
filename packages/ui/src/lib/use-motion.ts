"use client";

import { useState, useSyncExternalStore } from "react";

type MotionReact = typeof import("motion/react");

let _cache: MotionReact | null | undefined;
const motionListeners = new Set<() => void>();
// Bumped by reloadMotion(), so a load it superseded can't deliver Motion afterwards
let loads = 0;

function setMotion(load: number, m: MotionReact | null) {
  if (load !== loads) return;
  _cache = m;
  for (const notify of motionListeners) notify();
}

function loadMotion() {
  if (_cache !== undefined) return;
  const load = loads;
  import("motion/react").then(
    (m) => setMotion(load, m),
    () => setMotion(load, null),
  );
}

if (typeof window !== "undefined") {
  loadMotion();
}

/**
 * Tests only: forget the loaded module and load it again. A popup that opens before the
 * returned promise settles mounts while Motion is still loading, as on a fresh page.
 * `arrival` holds the module back until it settles, so a test can choose when Motion arrives.
 */
export function reloadMotion(arrival?: Promise<unknown>): Promise<unknown> {
  _cache = undefined;
  const load = ++loads;
  return Promise.all([import("motion/react"), arrival]).then(([m]) => setMotion(load, m));
}

function subscribeToMotion(onLoad: () => void) {
  motionListeners.add(onLoad);
  return () => {
    motionListeners.delete(onLoad);
  };
}

/**
 * Lazily loads motion/react. Returns the module when available, null otherwise.
 * Null on the server and while hydrating, so server markup matches. A component that mounts
 * after Motion has loaded gets it on its first render, so it never swaps in Motion elements
 * later; one mounted earlier re-renders with it once it loads.
 */
export function useMotion(): MotionReact | null {
  return useSyncExternalStore(
    subscribeToMotion,
    () => _cache ?? null,
    () => null,
  );
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

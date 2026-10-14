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

// `motion` is optional. webpack (and Next.js in webpack mode) treats an `import()` inside a `try`
// block as optional: with Motion missing it prints a "Module not found" warning instead of failing
// the build, and with Motion present it emits a normal async chunk. `turbopackOptional` is
// Turbopack's equivalent. Never mark this import as ignored by the bundler (webpack's "ignore"
// magic comment): it leaves a bare "motion/react" specifier in the bundle that a browser cannot
// resolve, so apps WITH Motion would lose the animations.
// check:dist asserts this shape survives the build; check:no-motion bundles both consumers.
function loadMotion() {
  if (_cache !== undefined) return;
  const load = loads;
  (async () => {
    let m: MotionReact | null = null;
    try {
      m = await import(/* turbopackOptional: true */ "motion/react");
    } catch {}
    setMotion(load, m);
  })();
}

if (typeof window !== "undefined") {
  loadMotion();
}

/**
 * Tests only: forget the loaded module and load it again. A popup that opens before the
 * returned promise settles mounts while Motion is still loading, as on a fresh page.
 * Not in the dist (tree-shaken), so the plain import needs no `try`.
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

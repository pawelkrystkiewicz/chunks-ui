"use client";

import type { ComponentType, CSSProperties, HTMLAttributes, Ref } from "react";
import { useState, useSyncExternalStore } from "react";

type MotionValues = Record<string, number | string>;
/** The animation options chunks-ui passes to Motion. Closed, so a misspelled key fails to compile. */
export type MotionOptions = {
  type?: "spring" | "tween" | "inertia";
  stiffness?: number;
  damping?: number;
  bounce?: number;
  mass?: number;
  restDelta?: number;
  restSpeed?: number;
  duration?: number;
};

/** The props chunks-ui passes to `motion.div`: HTML attributes plus Motion's animation props. */
export type MotionElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  // Motion gives these its own signatures
  "style" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  initial?: MotionValues;
  animate?: Record<string, number | string | (number | string)[]>;
  transition?: MotionOptions;
  onAnimationStart?: () => void;
};

/** The controls of a running `animate()` that chunks-ui uses. */
export interface MotionAnimationControls {
  stop: () => void;
  complete: () => void;
}

/**
 * The part of `motion/react` that chunks-ui uses. The package types describe Motion through
 * this interface instead of `typeof import("motion/react")`, so they compile without Motion
 * installed (`skipLibCheck: false` included). For Motion's full types, cast the module in your
 * own code: `useMotion() as typeof import("motion/react") | null`.
 */
export interface MotionLike {
  motion: { div: ComponentType<MotionElementProps> };
  animate: (
    element: Element,
    keyframes: Record<string, number | string | (number | string)[]>,
    options?: MotionOptions,
  ) => MotionAnimationControls;
  frame: {
    render: (callback: () => void) => unknown;
    postRender: (callback: () => void) => unknown;
  };
  cancelFrame: (callback: () => void) => void;
}

let _cache: MotionLike | null | undefined;
const motionListeners = new Set<() => void>();
// Bumped by reloadMotion(), so a load it superseded can't deliver Motion afterwards
let loads = 0;

function setMotion(load: number, m: MotionLike | null) {
  if (load !== loads) return;
  _cache = m;
  for (const notify of motionListeners) notify();
}

// `motion` is optional. webpack builds without it only when the import() sits in a `try`; Turbopack
// accepts the `try` or the `turbopackOptional` comment alone (#420). Keep both: check:dist requires
// both. Never use `webpackIgnore`: it leaves a bare "motion/react" specifier a browser cannot resolve.
function loadMotion() {
  if (_cache !== undefined) return;
  const load = loads;
  (async () => {
    let m: MotionLike | null = null;
    try {
      // Typed as Motion's module, so this assignment checks MotionLike against it.
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
export function useMotion(): MotionLike | null {
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
export function useLoadedMotion(): MotionLike | null {
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

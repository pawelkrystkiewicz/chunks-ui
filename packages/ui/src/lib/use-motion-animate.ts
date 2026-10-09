"use client";

import { type Ref, type RefCallback, useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useMotion, useReducedMotion } from "./use-motion";

type MotionModule = NonNullable<ReturnType<typeof useMotion>>;
type AnimatedValues = Record<string, string | number>;

type MotionAnimateOptions = {
  /** Transition for changes while Motion drives the element. */
  transition: Record<string, unknown>;
  /** Inline properties Motion sets that the CSS fallback does not; removed when Motion stops. */
  clear?: string[];
};

function runningTransitions(element: Element) {
  if (typeof element.getAnimations !== "function" || typeof CSSTransition === "undefined") {
    return [];
  }
  return element.getAnimations().filter((animation) => animation instanceof CSSTransition);
}

// Switches between Motion and the CSS fallback scheduled for the same frame commit together,
// in one flushSync, so many controls handing over at once cost one React commit
const pendingSwitches = new Set<() => void>();

function switchAfterMotionWrites(m: MotionModule, apply: () => void) {
  if (pendingSwitches.size === 0) {
    m.frame.postRender(() => {
      const batch = [...pendingSwitches];
      pendingSwitches.clear();
      flushSync(() => {
        for (const run of batch) run();
      });
    });
  }
  pendingSwitches.add(apply);
  return () => {
    pendingSwitches.delete(apply);
  };
}

/**
 * Animates an element that stays mounted with Motion's `animate()`, so it is the same element
 * before and after Motion loads. Swapping in a `motion.*` element instead would remount it.
 *
 * Returns a ref for the element and whether Motion drives it. While it doesn't (Motion not
 * loaded yet, or reduced motion), render the CSS fallback; while it does, render no transform or
 * transition classes that would stack with Motion's values.
 *
 * - Motion takes over once no CSS transition runs on the element, so a change made while it
 *   loads finishes as a CSS transition. It starts from the current values without animating.
 * - Reduced motion turned on mid-animation finishes the animation at once.
 * - Unmounting stops the animation.
 *
 * Motion writes styles in its next render step, so switching between Motion and the CSS
 * fallback happens in that step's post-render callback, in the same frame as Motion's write.
 */
export function useMotionAnimate<E extends HTMLElement | SVGElement>(
  values: AnimatedValues | null,
  { transition, clear }: MotionAnimateOptions,
  forwardedRef?: Ref<E>,
): [RefCallback<E>, boolean] {
  const m = useMotion();
  const reduced = useReducedMotion();
  const available = m !== null && !reduced;
  // Mounted after Motion loaded: drive the element from the first render
  const [driving, setDriving] = useState(available);

  const element = useRef<E | null>(null);
  const ref = useCallback(
    (node: E | null) => {
      element.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const target = values && JSON.stringify(values);
  const latest = useRef({ target, transition, clear });
  useLayoutEffect(() => {
    latest.current = { target, transition, clear };
  });
  const controls = useRef<{ complete(): void; stop(): void } | null>(null);
  const animated = useRef<E | null>(null);

  // Motion arrived (or reduced motion turned off): take over once no CSS transition runs
  useLayoutEffect(() => {
    if (!available || driving || !m) return;
    let cancelled = false;
    let switched = false;
    let instant: E | null = null;
    let cancelSwitch: (() => void) | undefined;
    const handOver = () => {
      if (cancelled) return;
      const node = element.current;
      const running = node ? runningTransitions(node) : [];
      if (running.length > 0) {
        void Promise.allSettled(running.map((animation) => animation.finished)).then(handOver);
        return;
      }
      const { target } = latest.current;
      if (node && target) {
        controls.current = m.animate(node, JSON.parse(target), { duration: 0 });
        animated.current = node;
        instant = node;
      }
      cancelSwitch = switchAfterMotionWrites(m, () => {
        switched = true;
        setDriving(true);
      });
    };
    handOver();
    return () => {
      cancelled = true;
      cancelSwitch?.();
      if (!instant || switched) return;
      // Cancelled after the instant write was queued: the CSS fallback stays, so undo the
      // write after it lands
      const node = instant;
      controls.current?.stop();
      controls.current = null;
      animated.current = null;
      m.frame.postRender(() => {
        for (const name of latest.current.clear ?? []) node.style.removeProperty(name);
      });
    };
  }, [available, driving, m]);

  // Reduced motion turned on: finish the animation, then go back to the CSS fallback.
  // `m` going back to null while driving only happens through reloadMotion() in tests; the
  // element then keeps Motion's last values.
  const cleared = clear?.join(" ");
  useLayoutEffect(() => {
    if (available || !driving || !m) return;
    const node = animated.current;
    animated.current = null;
    controls.current?.complete();
    controls.current = null;
    return switchAfterMotionWrites(m, () => {
      if (node && cleared) {
        for (const name of cleared.split(" ")) node.style.removeProperty(name);
      }
      setDriving(false);
    });
  }, [available, driving, m, cleared]);

  useLayoutEffect(() => {
    const node = element.current;
    if (!driving || !available || !m || !node || !target) return;
    // A new element jumps to its values instead of animating
    const first = animated.current !== node;
    if (first) controls.current?.stop();
    animated.current = node;
    controls.current = m.animate(
      node,
      JSON.parse(target),
      first ? { duration: 0 } : latest.current.transition,
    );
  }, [driving, available, m, target]);

  // On unmount, and when StrictMode or <Activity> clean effects up before running them again:
  // stop, and forget the element, so a re-run jumps to the values instead of animating to them
  useLayoutEffect(
    () => () => {
      controls.current?.stop();
      controls.current = null;
      animated.current = null;
    },
    [],
  );

  return [ref, driving];
}

/**
 * `value` while the CSS fallback renders; while Motion drives the element, the value from when
 * it took over. Render it into attributes that Motion animates: React then leaves what Motion
 * writes alone, instead of resetting it on a change or removing it when Motion takes over.
 */
export function useHeldWhileDriving<T>(driving: boolean, value: T): T {
  const [held, setHeld] = useState(value);
  if (!driving && held !== value) setHeld(value);
  return driving ? held : value;
}

"use client";

import { type Ref, type RefCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { type MotionInternals, releaseValues, renderNow } from "./render-now";
import { useMergedRef } from "./use-merged-ref";
import {
  type MotionLike,
  type MotionOptions,
  onMainThread,
  useMotion,
  useReducedMotion,
} from "./use-motion";

type AnimatedValues = Record<string, string | number>;

type MotionAnimateOptions = {
  /** Transition for changes while Motion drives the element. */
  transition: MotionOptions;
  /** Inline properties Motion sets that the CSS fallback does not; removed when Motion stops. */
  clear?: string[];
};

function runningTransitions(element: Element) {
  if (typeof element.getAnimations !== "function" || typeof CSSTransition === "undefined") {
    return [];
  }
  return element.getAnimations().filter((animation) => animation instanceof CSSTransition);
}

/**
 * Keyframes for a jump: each value twice. A fresh element has no motion value, so a 0 ms jump
 * to one value becomes an animation from the value read off the element; for opacity, which Motion
 * runs with WAAPI, a late first frame holds that first keyframe for a frame or two (#632). Two
 * equal keyframes leave nothing to animate: Motion sets the value.
 */
function jumpTo(values: AnimatedValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]): [string, AnimatedValues[string][]] => [
      key,
      [value, value],
    ]),
  );
}

/** Removes inline properties Motion set, for the CSS fallback */
function clearProperties(element: HTMLElement | SVGElement, names?: string[]) {
  if (!names?.length) return;
  for (const name of names) element.style.removeProperty(name);
}

type Schedule = (m: MotionLike & MotionInternals, callback: () => void) => void;

/** After the write of the values Motion renders next, such as those of a finished animation */
const afterRender: Schedule = (m, callback) => {
  m.frame.postRender(callback);
};

/** After a microtask, where Motion 14 writes transforms started outside its frame */
const afterTransformJump: Schedule = (_m, callback) => {
  queueMicrotask(callback);
};

/**
 * Where to switch after a jump to `values`, started now, lands. Motion 12 writes every value in
 * its next render step. Motion 14 (the one with `releaseElement`) does too, except transforms
 * (`x`, `scale`…) started outside its frame, which it writes in a microtask: before the next
 * paint, but maybe a frame before its next post-render step.
 * ponytail: a jump that mixes transforms with other values switches after the render step, so one
 * started after Motion's frame and before the paint (a ResizeObserver callback) can paint its
 * transforms on the CSS fallback for a frame; switching after each kind of write would fix it.
 */
function afterJump(m: MotionLike & MotionInternals, values: AnimatedValues): Schedule {
  const transforms = m.transformProps;
  const transformsOnly = transforms && Object.keys(values).every((key) => transforms.has(key));
  return m.releaseElement && transformsOnly && !m.frameData?.isProcessing
    ? afterTransformJump
    : afterRender;
}

// Switches between Motion and the CSS fallback scheduled for the same write commit together,
// in one flushSync per queue, so many controls handing over at once cost one React commit each
function batchedSwitches(schedule: Schedule) {
  const pending = new Set<() => void>();
  return (m: MotionLike, apply: () => void) => {
    if (pending.size === 0) {
      schedule(m, () => {
        const batch = [...pending];
        pending.clear();
        flushSync(() => {
          for (const run of batch) run();
        });
      });
    }
    pending.add(apply);
    return () => {
      pending.delete(apply);
    };
  };
}

const switchAfterTransformJump = batchedSwitches(afterTransformJump);
const switchAfterRender = batchedSwitches(afterRender);

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
 * - `values` of null mean there is nothing to show: the animation stops, and the next values
 *   jump into place instead of animating from the last ones.
 * - Unmounting stops the animation.
 *
 * Switching between Motion and the CSS fallback happens right after Motion's write, before the
 * frame paints: in the post-render step of the render step that writes, or after the microtask
 * Motion 14 writes some transforms in (see `afterJump`).
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
  const ref = useMergedRef(element, forwardedRef);

  const target = values && JSON.stringify(values);
  const latest = useRef({ target, transition, clear });
  useLayoutEffect(() => {
    latest.current = { target, transition, clear };
  });
  const controls = useRef<{ complete(): void; stop(): void } | null>(null);
  const animated = useRef<E | null>(null);
  // A cancelled hand-off's undo, waiting for Motion's next post-render step
  const pendingUndo = useRef<(() => void) | null>(null);

  // Motion arrived (or reduced motion turned off): take over once no CSS transition runs
  useLayoutEffect(() => {
    if (!available || driving || !m) return;
    let cancelled = false;
    let switched = false;
    let instant: E | null = null;
    let landed: Schedule = afterRender;
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
        // A hand-off cancelled earlier in this frame must not strip the values written now
        if (pendingUndo.current) m.cancelFrame(pendingUndo.current);
        pendingUndo.current = null;
        releaseValues(m, node);
        const values: AnimatedValues = JSON.parse(target);
        controls.current = m.animate(node, jumpTo(values), onMainThread({ duration: 0 }));
        landed = afterJump(m, values);
        // Render all values, so the ones Motion still holds come back after the CSS fallback
        // removed them
        renderNow(m, node);
        animated.current = node;
        instant = node;
      }
      const switchAfter =
        landed === afterTransformJump ? switchAfterTransformJump : switchAfterRender;
      cancelSwitch = switchAfter(m, () => {
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
      const undo = () => {
        // Stale: a hand-off started since. cancelFrame misses this callback when that hand-off
        // ran from an earlier callback in the same post-render step
        if (pendingUndo.current !== undo) return;
        pendingUndo.current = null;
        clearProperties(node, latest.current.clear);
      };
      pendingUndo.current = undo;
      landed(m, undo);
    };
  }, [available, driving, m]);

  // Motion took over. Its write and the switch land in one frame, but under Motion 14 the browser
  // can recalculate styles between them, while the fallback's transition classes are still on:
  // that starts a CSS transition from the fallback's value to Motion's, a jump back. The hand-off
  // waited for the fallback's own transitions, so any running now is that one: Motion owns the
  // value, so drop it. Runs in the switch's commit, before the frame paints.
  // ponytail: a consumer's own transition on the element (a colour) still running then snaps to
  // its end; cancel only the properties Motion writes if that ever shows
  useLayoutEffect(() => {
    const node = element.current;
    if (!driving || !node) return;
    for (const transition of runningTransitions(node)) transition.cancel();
  }, [driving]);

  // Reduced motion turned on: finish the animation, then go back to the CSS fallback.
  // `m` going back to null while driving only happens through reloadMotion() in tests; the
  // element then keeps Motion's last values.
  useLayoutEffect(() => {
    if (available || !driving || !m) return;
    // Turned on while <Activity> hid the element, or while `values` were null: the element was
    // forgotten, but Motion's values stay
    const node = animated.current ?? element.current;
    animated.current = null;
    controls.current?.complete();
    controls.current = null;
    return switchAfterRender(m, () => {
      if (node) clearProperties(node, latest.current.clear);
      setDriving(false);
    });
  }, [available, driving, m]);

  useLayoutEffect(() => {
    const node = element.current;
    if (!driving || !available || !m || !node) return;
    if (!target) {
      // Nothing to show: stop, and forget the element, so the next values jump into place
      // instead of animating from the last ones
      controls.current?.stop();
      controls.current = null;
      animated.current = null;
      return;
    }
    // A new element jumps to its values instead of animating
    const first = animated.current !== node;
    if (first) {
      controls.current?.stop();
      releaseValues(m, node);
    }
    animated.current = node;
    const values: AnimatedValues = JSON.parse(target);
    controls.current = m.animate(
      node,
      first ? jumpTo(values) : values,
      onMainThread(first ? { duration: 0 } : latest.current.transition),
    );
    // On a jump, render all values, as in the hand-off above
    if (first) renderNow(m, node);
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

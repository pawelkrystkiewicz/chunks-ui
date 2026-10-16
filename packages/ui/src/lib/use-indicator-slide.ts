"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { springs } from "./motion";
import type { MotionOptions } from "./use-motion";

export const BOX_EDGES = ["left", "top", "width", "height"] as const;
/** Where an indicator sits within its container, in CSS px */
export type IndicatorBox = Record<(typeof BOX_EDGES)[number], number>;

/** Moves the indicator at once: Motion writes the values in its next frame */
const SNAP: MotionOptions = { duration: 0 };

/**
 * Whether the indicator is still sliding: the CSS fallback runs a transition, or Motion has not
 * written `box` inline yet. A Motion spring ends exactly on its target.
 */
function isSliding(node: HTMLElement, box: IndicatorBox | null) {
  if (typeof node.getAnimations === "function" && typeof CSSTransition !== "undefined") {
    if (node.getAnimations().some((animation) => animation instanceof CSSTransition)) return true;
  }
  return (
    box !== null &&
    BOX_EDGES.some((edge) => {
      const written = node.style[edge];
      return written !== "" && Math.abs(Number.parseFloat(written) - box[edge]) > 0.5;
    })
  );
}

/**
 * Whether an indicator (the pill behind the selected tab or the pressed item) slides to `box`,
 * and the transition for `useMotionAnimate`: a spring while it slides, a jump otherwise. Only a
 * change of `target` (the selected value) slides it. A resize of what it covers (a font or
 * padding change, a narrower container) moves it at once instead of trailing behind, and a
 * resize during a slide retargets the slide. The slide ends once the CSS fallback's transition
 * is over, or Motion has written `box`.
 *
 * `element` is the ref for the indicator's element: pass it on to `useMotionAnimate`. `endSlide`
 * ends a slide at once, for an indicator shown again while it slid.
 */
export function useIndicatorSlide<E extends HTMLElement>(
  target: unknown,
  box: IndicatorBox | null,
) {
  const [slideTarget, setSlideTarget] = useState(target);
  const [sliding, setSliding] = useState(false);
  if (target !== slideTarget) {
    setSlideTarget(target);
    setSliding(true);
  }
  const element = useRef<E | null>(null);
  const latestBox = useRef(box);
  const latestSliding = useRef(sliding);
  useLayoutEffect(() => {
    latestBox.current = box;
    latestSliding.current = sliding;
  });
  useEffect(() => {
    if (!sliding) return;
    let frame = requestAnimationFrame(function settle() {
      const node = element.current;
      if (node && isSliding(node, latestBox.current)) frame = requestAnimationFrame(settle);
      else setSliding(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [sliding]);
  // Only while it slides: at rest, setSliding(false) changes nothing, yet React applied that
  // update again once the next slide started, and cancelled it
  const endSlide = useCallback(() => {
    if (latestSliding.current) setSliding(false);
  }, []);
  const transition: MotionOptions = sliding ? springs.indicator : SNAP;
  return { element, sliding, transition, endSlide };
}

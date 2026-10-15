"use client";

import { createPopupRenderer } from "./PopupMotion";
import { useLoadedMotion, useReducedMotion } from "./use-motion";

/** The spring and the `from`/`to` values, as `createPopupRenderer` takes them. */
type PopupRenderOptions = Omit<Parameters<typeof createPopupRenderer>[0], "m">;

/**
 * A consumer's `render` replaces the animated element, so that part keeps the CSS transition.
 * `useSpring` says which path ran, for the part's class list. Motion counts as loaded only if it had
 * loaded when the part mounted (`useLoadedMotion`); reduced motion is read live.
 */
export function usePopupRender<Render>(renderProp: Render, options: PopupRenderOptions) {
  const m = useLoadedMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced && !renderProp;
  const render = useSpring ? createPopupRenderer({ m, ...options }) : renderProp;
  return { useSpring, render };
}

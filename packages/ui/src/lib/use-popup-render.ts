"use client";

import { createPopupRenderer } from "./PopupMotion";
import { useLoadedMotion, useReducedMotion } from "./use-motion";

/** The spring and the `from`/`to` values, as `createPopupRenderer` takes them. */
type PopupRenderOptions = Omit<Parameters<typeof createPopupRenderer>[0], "m">;

/**
 * Picks a popup part's `render`: the Motion spring renderer when Motion has loaded and the user
 * has not asked for reduced motion, else the consumer's `render` (or none), so the part keeps its
 * CSS transition. A consumer's `render` replaces the animated element, so that part takes the CSS
 * path too. `useSpring` says which path was taken, for the part's class list.
 */
export function usePopupRender<Render>(
  renderProp: Render,
  { spring, from, to }: PopupRenderOptions,
) {
  const m = useLoadedMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced && !renderProp;
  const render = useSpring ? createPopupRenderer({ m, spring, from, to }) : renderProp;
  return { useSpring, render };
}

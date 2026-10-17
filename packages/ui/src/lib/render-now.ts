import type { MotionLike } from "./use-motion";

/** `visualElementStore` is Motion internals (an undocumented export of motion 12), hence optional. */
export type MotionInternals = {
  visualElementStore?: { get: (element: Element) => { scheduleRender?: () => void } | undefined };
  /** Exported by Motion since 12.7.5, so optional */
  flushKeyframeResolvers?: () => void;
};

/**
 * Motion only writes values that change. Renders every value Motion holds for `element`, so
 * values the CSS fallback removed while Motion still held them come back.
 */
export function renderNow(m: MotionLike & MotionInternals, element: Element) {
  m.visualElementStore?.get(element)?.scheduleRender?.();
}

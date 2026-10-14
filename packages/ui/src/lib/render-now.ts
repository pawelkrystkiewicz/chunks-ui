import type { MotionLike } from "./use-motion";

/** `visualElementStore` is Motion internals (an undocumented export of motion 12), hence optional. */
export type MotionInternals = {
  visualElementStore?: { get: (element: Element) => { scheduleRender?: () => void } | undefined };
};

/**
 * Motion only writes values that change. Renders every value Motion holds for `element`, so
 * values the CSS fallback removed while Motion still held them come back.
 *
 * Optional chaining throughout, for Motion versions without the internals.
 */
export function renderNow(m: MotionLike & MotionInternals, element: Element) {
  m.visualElementStore?.get(element)?.scheduleRender?.();
}

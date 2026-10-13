import type { useMotion } from "./use-motion";

type MotionModule = NonNullable<ReturnType<typeof useMotion>>;

/**
 * Motion only writes values that change. Renders every value Motion holds for `element`, so
 * values the CSS fallback removed while Motion still held them come back.
 *
 * `visualElementStore` is Motion internals (an undocumented export of motion 12), hence the
 * optional chaining for other Motion versions.
 */
export function renderNow(m: MotionModule, element: Element) {
  m.visualElementStore?.get(element)?.scheduleRender?.();
}

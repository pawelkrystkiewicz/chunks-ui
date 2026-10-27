import type { MotionLike } from "./use-motion";

/** `visualElementStore` is Motion internals (an undocumented export of motion 12), hence optional. */
export type MotionInternals = {
  visualElementStore?: { get: (element: Element) => { scheduleRender?: () => void } | undefined };
  /** Exported by Motion since 12.7.5, so optional */
  flushKeyframeResolvers?: () => void;
  /** Exported by Motion 14, which binds a plain element's values to a style effect instead */
  releaseElement?: (element: Element) => void;
  /** The transform values (`x`, `scale`…) Motion composes into `transform` */
  transformProps?: Set<string>;
  /** Whether Motion is running its frame's steps now */
  frameData?: { isProcessing: boolean };
};

/**
 * Call before a jump that must write every value, as renderNow() does after it. Motion 14 binds a
 * plain element's values to a style effect, which keeps no VisualElement for renderNow() and
 * writes a value only when it changes: released, the jump binds them again and writes them all.
 */
export function releaseValues(m: MotionLike & MotionInternals, element: Element) {
  m.releaseElement?.(element);
}

/**
 * The key that animates an SVG path's `d` attribute. Motion 14 writes `d` to the CSS `d` property
 * where the browser has one (Chromium), which takes `path("…")`, not path data, so the morph never
 * shows; its `attr` prefix writes the attribute, as Motion 12 does for plain `d`.
 */
export function pathDataKey(m: (MotionLike & MotionInternals) | null): "d" | "attrD" {
  return m?.releaseElement ? "attrD" : "d";
}

/**
 * Motion only writes values that change. Renders every value Motion holds for `element`, so
 * values the CSS fallback removed while Motion still held them come back.
 */
export function renderNow(m: MotionLike & MotionInternals, element: Element) {
  m.visualElementStore?.get(element)?.scheduleRender?.();
}

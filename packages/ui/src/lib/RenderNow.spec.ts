import { it } from "vitest";
import type { MotionInternals } from "./render-now";
import type { MotionLike } from "./use-motion";

// The assertion is checked by `check-types`; vitest only needs one test. Motion's module must still
// carry what MotionLike and MotionInternals describe, and `flushKeyframeResolvers`, which
// MotionLike leaves optional. A Motion release that drops `visualElementStore` or
// `flushKeyframeResolvers` fails here instead of turning renderNow or the popup exits' flush into
// a silent no-op.
const _motion: MotionLike &
  Required<MotionInternals> &
  Required<Pick<MotionLike, "flushKeyframeResolvers">> = {} as typeof import("motion/react");

it("compiles", () => {
  void _motion;
});

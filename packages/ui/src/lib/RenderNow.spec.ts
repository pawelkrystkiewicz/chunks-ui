import { it } from "vitest";
import type { MotionInternals } from "./render-now";
import type { MotionLike } from "./use-motion";

// The assertion is checked by `check-types`; vitest only needs one test. Motion's module must still carry what MotionLike and
// MotionInternals describe, so a Motion release that drops `visualElementStore` fails here
// instead of turning renderNow into a silent no-op. `releaseElement` is Motion 14's alone (the
// floors job checks Motion 12): without it on Motion 14 the hook takes Motion 12's paths, which
// the chromium-motion specs catch.
const _motion: MotionLike & Required<Omit<MotionInternals, "releaseElement">> =
  {} as typeof import("motion/react");

it("compiles", () => {
  void _motion;
});

import { it } from "vitest";
import type { MotionInternals } from "./render-now";
import type { MotionLike } from "./use-motion";

// The assertion is checked by `check-types`; vitest only needs one test. Motion's module must still carry what MotionLike and
// MotionInternals describe, so a Motion release that drops `visualElementStore` fails here
// instead of turning renderNow into a silent no-op.
const _motion: MotionLike & Required<MotionInternals> = {} as typeof import("motion/react");

it("compiles", () => {
  void _motion;
});

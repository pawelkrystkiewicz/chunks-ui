import { expect, it } from "vitest";
import type { MotionInternals } from "./render-now";
import type { MotionLike } from "./use-motion";

// Checked by `check-types` only: Motion's module must still carry what MotionLike and
// MotionInternals describe, so a Motion release that drops `visualElementStore` fails here
// instead of turning renderNow into a silent no-op.
const _motion: MotionLike & Required<MotionInternals> = {} as typeof import("motion/react");

it("describes Motion's module with MotionLike and MotionInternals", () => {
  expect(_motion).toBeDefined();
});

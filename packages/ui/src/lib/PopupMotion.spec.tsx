import { render, waitFor } from "@testing-library/react";
import * as m from "motion/react";
import type { HTMLAttributes } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { springs } from "./motion";
import { createPopupRenderer } from "./PopupMotion";
import type { MotionLike } from "./use-motion";

const options = { m, spring: springs.popup, from: { opacity: 0 }, to: { opacity: 1 } };

afterEach(() => vi.restoreAllMocks());

// Mounts the popup open and waits for Motion to start its entry. `target` is what the consumer's
// `onAnimationStart` got last; `close` rerenders the popup closed.
async function mountOpen(motion: MotionLike) {
  const popup = createPopupRenderer({ ...options, m: motion });
  const onAnimationStart = vi.fn();
  const props = { onAnimationStart } as HTMLAttributes<HTMLElement>;
  const { rerender } = render(popup(props, { open: true }));
  const target = () => onAnimationStart.mock.lastCall?.[0];
  await waitFor(() => expect(target()).toEqual({ opacity: 1 }));
  return { target, close: () => rerender(popup(props, { open: false })) };
}

// A consumer's `onAnimationStart` reaches the renderer through Base UI's props, and Motion calls it
// with the target it animates to
it("passes on onAnimationStart as the popup opens and closes", async () => {
  const { target, close } = await mountOpen(m);
  close();
  await waitFor(() => expect(target()).toEqual({ opacity: 0 }));
});

// Motion fires `AnimationStart` before it creates the exit's animation, so the flush waits for a
// microtask: called at once, it would find nothing to flush. Only a close needs it, not an open.
it("flushes Motion's keyframe resolvers in a microtask, once, as the popup closes", async () => {
  const flushKeyframeResolvers = vi.fn();
  const { target, close } = await mountOpen({ ...m, flushKeyframeResolvers });
  await Promise.resolve();
  expect(flushKeyframeResolvers).not.toHaveBeenCalled();
  close();
  expect(flushKeyframeResolvers).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(flushKeyframeResolvers).toHaveBeenCalledTimes(1);
  expect(target()).toEqual({ opacity: 0 });
});

// `motion/react` exports `flushKeyframeResolvers`, a motion-dom internal, since 12.7.5. Passing a
// missing one to `queueMicrotask` throws in Motion's effect, which has no try/catch, so React would
// unmount the whole root on the first close. Calling it in the microtask throws where `rerender`
// never sees it: catch what the microtasks throw.
it("starts the exit on a Motion without flushKeyframeResolvers, and nothing throws", async () => {
  const errors: unknown[] = [];
  const queue = globalThis.queueMicrotask;
  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((callback) =>
    queue(() => {
      try {
        callback();
      } catch (error) {
        errors.push(error);
      }
    }),
  );
  const { target, close } = await mountOpen({ ...m, flushKeyframeResolvers: undefined });
  close();
  await waitFor(() => expect(target()).toEqual({ opacity: 0 }));
  expect(errors).toEqual([]);
});

import { render, waitFor } from "@testing-library/react";
import * as m from "motion/react";
import type { HTMLAttributes } from "react";
import { expect, it, vi } from "vitest";
import { springs } from "./motion";
import { createPopupRenderer } from "./PopupMotion";

const options = { m, spring: springs.popup, from: { opacity: 0 }, to: { opacity: 1 } };

// A consumer's `onAnimationStart` reaches the renderer through Base UI's props, and Motion calls it
// with the target it animates to
it("passes on onAnimationStart as the popup opens and closes", async () => {
  const popup = createPopupRenderer(options);
  const onAnimationStart = vi.fn();
  const props = { onAnimationStart } as HTMLAttributes<HTMLElement>;
  const { rerender } = render(popup(props, { open: true }));
  const target = () => onAnimationStart.mock.lastCall?.[0];
  await waitFor(() => expect(target()).toEqual({ opacity: 1 }));
  rerender(popup(props, { open: false }));
  await waitFor(() => expect(target()).toEqual({ opacity: 0 }));
});

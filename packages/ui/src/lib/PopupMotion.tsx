"use client";

import type { CSSProperties, HTMLAttributes, JSX, Ref } from "react";

type MotionModule = typeof import("motion/react");

type RenderProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

type PopupMotionConfig = {
  m: MotionModule;
  spring: Record<string, unknown>;
  from: Record<string, number | string>;
  to: Record<string, number | string>;
};

/**
 * Creates a Base UI–compatible `render` callback that swaps the default
 * element for a `motion.div`, enabling spring enter/exit animations.
 *
 * Designed for popup-style components (Popover, Tooltip, Dialog, etc.)
 * that use Base UI's `open` state.
 */
export function createPopupRenderer({ m, spring, from, to }: PopupMotionConfig) {
  return (renderProps: RenderProps, state: { open: boolean }): JSX.Element => {
    const style: CSSProperties = { ...(renderProps.style ?? {}) };

    if (!state.open) {
      style.pointerEvents = "none";
    }

    return (
      <m.motion.div
        {...(renderProps as Record<string, unknown>)}
        style={style}
        initial={false}
        animate={state.open ? to : from}
        transition={spring}
      />
    );
  };
}

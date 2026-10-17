"use client";

import type { CSSProperties, HTMLAttributes, JSX, Ref } from "react";
import type { MotionLike, MotionOptions } from "./use-motion";

type RenderProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

type PopupMotionConfig = {
  m: MotionLike;
  spring: MotionOptions;
  from: Record<string, number | string>;
  to: Record<string, number | string>;
  /** Jump to the target with no spring while Base UI's `instant` state is this value */
  skipInstant?: string;
  /**
   * Starts the exit as the popup closes. Base UI unmounts a closed popup once a check on the next
   * frame finds no `getAnimations()` on it. A Root that passes `open` to the popup in a layout
   * effect (Select) closes the popup a commit late, so that check runs before Motion's frame
   * resolves the exit's keyframes. The effect that starts the exit calls `onAnimationStart` first,
   * so a microtask from it resolves them at once. Needs Motion 12.8 or later, which exports
   * `flushKeyframeResolvers`; on older versions the exit still waits for Motion's frame.
   */
  exitAtOnce?: boolean;
};

/**
 * Creates a Base UI–compatible `render` callback that swaps the default
 * element for a `motion.div`, enabling spring enter/exit animations.
 *
 * Designed for popup-style components (Popover, Tooltip, Dialog, etc.)
 * that use Base UI's `open` state. The scale runs about the element's CSS
 * `transform-origin`, so an anchored popup's `origin-(--transform-origin)`
 * class makes it grow out of its trigger, as on the CSS path.
 */
export function createPopupRenderer({
  m,
  spring,
  from,
  to,
  skipInstant,
  exitAtOnce,
}: PopupMotionConfig) {
  // Not on `MotionLike` (see `exitAtOnce`)
  const { flushKeyframeResolvers } = m as MotionLike & { flushKeyframeResolvers?: () => void };
  const startExit = exitAtOnce ? () => queueMicrotask(() => flushKeyframeResolvers?.()) : undefined;

  return (
    renderProps: RenderProps,
    state: { open: boolean; side?: string; instant?: string },
  ): JSX.Element => {
    const style: CSSProperties = { ...(renderProps.style ?? {}) };

    if (!state.open) {
      style.pointerEvents = "none";
    }

    // A Select aligned over its trigger (`side: "none"`) only fades, as in Base UI's own reference
    // styles: it lands with the selected item over the trigger's value, so a scale would move it.
    // Motion reads `initial` at mount only, so a Select that Base UI moves off its trigger after
    // mount (too close to the viewport's edge to align) opens without the scale too.
    const closed = state.side === "none" ? { ...from, scale: 1 } : from;
    const target = state.open ? to : closed;

    // Base UI sets `instant: "delay"` a render after the popup mounts or starts to close, once the
    // spring has started, and Motion ignores a new transition while the target values are
    // unchanged. One-keyframe lists count as a new target, so Motion takes them and, with no
    // duration, sets them before the frame paints.
    const jump = skipInstant !== undefined && state.instant === skipInstant;
    const animate = jump
      ? Object.fromEntries(Object.entries(target).map(([key, value]) => [key, [value]]))
      : target;

    return (
      <m.motion.div
        {...(renderProps as Record<string, unknown>)}
        style={style}
        // Base UI mounts the popup as it opens, so animate in from the closed values
        initial={closed}
        animate={animate}
        transition={jump ? { duration: 0 } : spring}
        onAnimationStart={state.open ? undefined : startExit}
      />
    );
  };
}

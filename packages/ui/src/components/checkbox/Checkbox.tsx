"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cn, cnState, FOCUS_RING, RING_ANIMATION_CLASSES, springs } from "chunks-ui-core";
import type { ComponentProps } from "react";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useHeldWhileDriving, useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

export type CheckboxRootProps = ComponentProps<typeof BaseCheckbox.Root>;

function CheckboxRoot({ className, ...props }: CheckboxRootProps) {
  return (
    <BaseCheckbox.Root
      className={cnState(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded-[min(calc(var(--radius)-4px),4px)] border border-input",
        ...RING_ANIMATION_CLASSES,
        FOCUS_RING,
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground",
        // No pointer-events-none: it would hide the cursor, and Base UI ignores the click anyway
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type CheckboxIndicatorProps = ComponentProps<typeof BaseCheckbox.Indicator>;

const CHECKMARK = "M4,12 L9,17 L20,6";
const MINUS = "M4,12 L12,12 L20,12";

function CheckboxIndicator({ className, render, ...props }: CheckboxIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  return (
    <BaseCheckbox.Indicator
      // With Motion it stays mounted while unchecked, so it can animate out
      keepMounted={(m !== null && !reduced) || undefined}
      {...props}
      render={(renderProps, state) => (
        <CheckboxIndicatorElement
          {...renderProps}
          state={state}
          render={render}
          className={typeof className === "function" ? className(state) : className}
        />
      )}
    />
  );
}

// The default check and minus. Its own component, so its state starts fresh each time it mounts
// (after children or `render` go away): the path then jumps to the right shape, not the one held
// from before.
function CheckboxGlyph({ d }: { d: string }) {
  const [pathRef, pathDriven] = useMotionAnimate<SVGPathElement>(
    { d },
    { transition: springs.micro },
  );
  // Motion morphs `d` between the check and the minus; React keeps the value it had then
  const pathD = useHeldWhileDriving(pathDriven, d);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
      aria-hidden="true"
    >
      <path ref={pathRef} d={pathD} />
    </svg>
  );
}

// The same element with and without Motion, so it isn't remounted when Motion loads.
// Children replace the check and the minus; with `render` and no children, there is neither: the
// render element draws its own, and may be a void element (#581). The element still springs in
// and out; the path, and its morph, are the default glyph's alone.
function CheckboxIndicatorElement({
  state,
  render,
  className,
  children,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseCheckbox.Indicator.State;
  render: PartRenderProp<BaseCheckbox.Indicator.State>;
}) {
  const shown = state.checked || state.indeterminate;
  const [indicatorRef] = useMotionAnimate<HTMLElement>(
    { opacity: shown ? 1 : 0, scale: shown ? 1 : 0.5 },
    { transition: springs.micro, clear: ["transform", "opacity"] },
    ref,
  );
  return useRenderPart(render, state, indicatorRef, {
    ...props,
    className: cn("flex items-center justify-center text-current", className),
    children:
      children == null && !render ? (
        <CheckboxGlyph d={state.indeterminate ? MINUS : CHECKMARK} />
      ) : (
        children
      ),
  });
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

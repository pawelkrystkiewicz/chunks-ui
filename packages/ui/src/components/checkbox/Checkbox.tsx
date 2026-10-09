"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useHeldWhileDriving, useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

export type CheckboxRootProps = ComponentProps<typeof BaseCheckbox.Root>;

function CheckboxRoot({ className, ...props }: CheckboxRootProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-[min(calc(var(--radius)-4px),4px)] border border-input",
        "micro-interactions",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        "data-[indeterminate]:border-primary data-[indeterminate]:bg-primary data-[indeterminate]:text-primary-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

// The same element and path with and without Motion, so they aren't remounted when Motion loads
function CheckboxIndicatorElement({
  state,
  render,
  className,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseCheckbox.Indicator.State;
  render: PartRenderProp<BaseCheckbox.Indicator.State>;
}) {
  const shown = state.checked || state.indeterminate;
  const d = state.indeterminate ? MINUS : CHECKMARK;
  const [indicatorRef] = useMotionAnimate<HTMLElement>(
    { opacity: shown ? 1 : 0, scale: shown ? 1 : 0.5 },
    { transition: springs.micro, clear: ["transform", "opacity"] },
    ref,
  );
  const [pathRef, pathDriven] = useMotionAnimate<SVGPathElement>(
    { d },
    { transition: springs.micro },
  );
  // Motion morphs `d` between the check and the minus; React keeps the value it had then
  const pathD = useHeldWhileDriving(pathDriven, d);
  return useRenderPart(render, state, indicatorRef, {
    ...props,
    className: cn("flex items-center justify-center text-current", className),
    children: (
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
    ),
  });
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useMotionAnimate } from "../../lib/use-motion-animate";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cn("flex flex-col gap-2 data-[disabled]:opacity-50", className)}
      {...props}
    />
  );
}

export type RadioRootProps = ComponentProps<typeof BaseRadio.Root>;

function RadioRoot({ className, ...props }: RadioRootProps) {
  return (
    <BaseRadio.Root
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-input",
        "micro-interactions cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:border-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export type RadioIndicatorProps = ComponentProps<typeof BaseRadio.Indicator>;

function RadioIndicator({ className, ...props }: RadioIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  return (
    <BaseRadio.Indicator
      // With Motion it stays mounted while unchecked, so it can animate out
      keepMounted={(m !== null && !reduced) || undefined}
      render={(renderProps, state) => (
        <RadioIndicatorElement
          {...renderProps}
          checked={state.checked}
          className={typeof className === "function" ? className(state) : className}
        />
      )}
      {...props}
    />
  );
}

// The same span with and without Motion, so it isn't remounted when Motion loads
function RadioIndicatorElement({
  checked,
  className,
  ref,
  ...props
}: ComponentProps<"span"> & { checked: boolean }) {
  const [indicatorRef] = useMotionAnimate<HTMLSpanElement>(
    { scale: checked ? 1 : 0, opacity: checked ? 1 : 0 },
    { transition: springs.micro, clear: ["transform", "opacity"] },
    ref,
  );
  return (
    <span
      {...props}
      ref={indicatorRef}
      className={cn("flex items-center justify-center", className)}
    >
      <span className="size-2 rounded-full bg-primary" />
    </span>
  );
}

export type RadioItemProps = Omit<RadioRootProps, "children"> & {
  /**
   * Label text displayed next to the radio indicator.
   */
  children: ReactNode;
};

function RadioItem({ children, className, disabled, ...props }: RadioItemProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      <RadioRoot disabled={disabled} {...props}>
        <RadioIndicator />
      </RadioRoot>
      <span>{children}</span>
    </label>
  );
}

export const Radio = {
  Group: RadioGroup,
  Root: RadioRoot,
  Indicator: RadioIndicator,
  Item: RadioItem,
};

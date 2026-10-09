"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn, cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

export type RadioGroupProps = ComponentProps<typeof BaseRadioGroup>;

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cnState("flex flex-col gap-2 data-[disabled]:opacity-50", className)}
      {...props}
    />
  );
}

export type RadioRootProps = ComponentProps<typeof BaseRadio.Root>;

function RadioRoot({ className, ...props }: RadioRootProps) {
  return (
    <BaseRadio.Root
      className={cnState(
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

function RadioIndicator({ className, render, ...props }: RadioIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  return (
    <BaseRadio.Indicator
      // With Motion it stays mounted while unchecked, so it can animate out
      keepMounted={(m !== null && !reduced) || undefined}
      {...props}
      render={(renderProps, state) => (
        <RadioIndicatorElement
          {...renderProps}
          state={state}
          render={render}
          className={typeof className === "function" ? className(state) : className}
        />
      )}
    />
  );
}

// The same element with and without Motion, so it isn't remounted when Motion loads
function RadioIndicatorElement({
  state,
  render,
  className,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseRadio.Indicator.State;
  render: PartRenderProp<BaseRadio.Indicator.State>;
}) {
  const [indicatorRef] = useMotionAnimate<HTMLElement>(
    { scale: state.checked ? 1 : 0, opacity: state.checked ? 1 : 0 },
    { transition: springs.micro, clear: ["transform", "opacity"] },
    ref,
  );
  return useRenderPart(render, state, indicatorRef, {
    ...props,
    className: cn("flex items-center justify-center", className),
    children: <span className="size-2 rounded-full bg-primary" />,
  });
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

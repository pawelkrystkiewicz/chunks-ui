"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cn, cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";
import { FOCUS_RING, RING_ANIMATION_CLASSES } from "../shared";

/**
 * `Value` is the type of `value`, `defaultValue` and the value `onValueChange` receives. It is
 * inferred from `value`, `defaultValue` or an annotated `onValueChange`, so a typed `useState` setter is an `onValueChange`.
 * Without either it is `unknown`.
 */
export type RadioGroupProps<Value = unknown> = BaseRadioGroup.Props<Value>;

function RadioGroup<Value = unknown>({ className, ...props }: RadioGroupProps<Value>) {
  return (
    <BaseRadioGroup
      className={cnState(
        "group/radio-group flex flex-col gap-2 data-disabled:opacity-50",
        className,
      )}
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
        ...RING_ANIMATION_CLASSES,
        "cursor-pointer",
        FOCUS_RING,
        "data-checked:border-primary",
        // No pointer-events-none: it would hide the cursor, and Base UI ignores the click anyway.
        // A disabled Radio.Group dims itself, so inside one the root drops its own dim and isn't
        // dimmed twice.
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "group-data-disabled/radio-group:data-disabled:opacity-100",
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

// The same element with and without Motion, so it isn't remounted when Motion loads. Children
// replace the dot; with `render` and no children, there is no dot: the render element draws its
// own, and may be a void element (#581). The element springs in and out either way.
function RadioIndicatorElement({
  state,
  render,
  className,
  children,
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
    children:
      children == null && !render ? <span className="size-2 rounded-full bg-primary" /> : children,
  });
}

export type RadioItemProps = Omit<RadioRootProps, "children" | "className"> & {
  /**
   * Label text displayed next to the radio indicator.
   */
  children: ReactNode;
  /**
   * Classes for the item's `<label>`. A string only: the label has no Base UI state to pass
   * to a function. Style the radio itself with `Radio.Root`.
   */
  className?: string;
};

function RadioItem({ children, className, ...props }: RadioItemProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2",
        // Dims the radio and its text together when the radio is disabled, whichever disables it:
        // its own prop, its Radio.Group or a Field.Root. Base UI marks the radio with
        // `data-disabled` in every case; the item's `disabled` prop alone would miss the field.
        "has-[>[data-disabled]]:cursor-not-allowed has-[>[data-disabled]]:opacity-50",
        // A disabled Radio.Group dims itself, so inside one the item drops its own dim and isn't
        // dimmed twice. Stacked on `has-`: Tailwind sorts a `group-` variant before `has-`, so a
        // `group-` class alone would lose to the dim at the same specificity.
        "group-data-disabled/radio-group:has-[>[data-disabled]]:opacity-100",
        className,
      )}
    >
      {/* The label above, or a disabled group, dims the radio with its text: no second dim */}
      <RadioRoot className="data-disabled:opacity-100" {...props}>
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

"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type CheckboxRootProps = ComponentProps<typeof BaseCheckbox.Root>;

function CheckboxRoot({ className, ...props }: CheckboxRootProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded border border-input",
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

function CheckboxIndicator({ className, ...props }: CheckboxIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  if (useSpring) {
    return (
      <BaseCheckbox.Indicator
        keepMounted
        render={(renderProps, state) => (
          <m.motion.span
            {...(renderProps as Record<string, unknown>)}
            className={cn("flex items-center justify-center text-current", className)}
            initial={false}
            animate={{
              opacity: state.checked || state.indeterminate ? 1 : 0,
              scale: state.checked || state.indeterminate ? 1 : 0.5,
            }}
            transition={springs.micro}
          >
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
              <m.motion.path
                initial={false}
                animate={{ d: state.indeterminate ? MINUS : CHECKMARK }}
                transition={springs.micro}
              />
            </svg>
          </m.motion.span>
        )}
        {...props}
      />
    );
  }

  return (
    <BaseCheckbox.Indicator
      render={(renderProps, state) => (
        <span
          {...renderProps}
          className={cn("flex items-center justify-center text-current", className)}
        >
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
            <path d={state.indeterminate ? MINUS : CHECKMARK} />
          </svg>
        </span>
      )}
      {...props}
    />
  );
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

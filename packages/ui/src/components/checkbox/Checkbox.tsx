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
        "peer size-4 shrink-0 rounded border border-input",
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

function CheckboxIndicator({ className, ...props }: CheckboxIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  /* v8 ignore next */
  const useSpring = !!m && !reduced;

  if (!useSpring) {
    return (
      <BaseCheckbox.Indicator
        className={cn("flex items-center justify-center text-current", className)}
        {...props}
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
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </BaseCheckbox.Indicator>
    );
  }

  /* v8 ignore start */
  return (
    <BaseCheckbox.Indicator
      keepMounted
      render={(renderProps, state) => (
        <m.motion.span
          {...(renderProps as Record<string, unknown>)}
          className={cn("flex items-center justify-center text-current", className)}
          initial={false}
          animate={{
            opacity: state.checked ? 1 : 0,
            scale: state.checked ? 1 : 0.5,
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
              d="M20 6 9 17l-5-5"
              initial={false}
              animate={{ pathLength: state.checked ? 1 : 0 }}
              transition={springs.micro}
            />
          </svg>
        </m.motion.span>
      )}
      {...props}
    />
  );
  /* v8 ignore stop */
}

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

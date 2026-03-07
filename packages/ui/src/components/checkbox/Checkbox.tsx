import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type CheckboxRootProps = ComponentProps<typeof BaseCheckbox.Root>;

function CheckboxRoot({ className, ...props }: CheckboxRootProps) {
  return (
    <BaseCheckbox.Root
      className={cn(
        "peer size-4 shrink-0 rounded border border-input",
        "micro-interactions",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:bg-primary data-[checked]:border-primary data-[checked]:text-primary-foreground",
        "data-[indeterminate]:bg-primary data-[indeterminate]:border-primary data-[indeterminate]:text-primary-foreground",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export type CheckboxIndicatorProps = ComponentProps<typeof BaseCheckbox.Indicator>;

function CheckboxIndicator({ className, ...props }: CheckboxIndicatorProps) {
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

export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type LabelProps = ComponentProps<"label">;

export function Label({ className, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Label is a primitive; htmlFor is passed by consumers via props spread
    <label
      className={cn(
        "font-medium text-sm leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        // Dims when the control right after it (its next sibling) is disabled, whatever `htmlFor`
        // points at: a native control is :disabled, a Base UI part gets data-disabled. No
        // `peer-data-disabled:`, because Checkbox, Switch and Radio.Root carry `peer` and it would
        // dim every later label in the same parent.
        "has-[+:disabled]:cursor-not-allowed has-[+:disabled]:opacity-50",
        "has-[+[data-disabled]]:cursor-not-allowed has-[+[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

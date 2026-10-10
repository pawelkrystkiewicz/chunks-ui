import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type LabelProps = ComponentProps<"label">;

export function Label({ className, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Label is a primitive; htmlFor is passed by consumers via props spread
    <label
      className={cn(
        "font-medium text-sm leading-none",
        // Dims next to a disabled control. Before the label, the control needs the `peer` class
        // (Checkbox, Switch and Radio.Root have it): a native input is :disabled, a Base UI part
        // gets data-disabled.
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50",
        // After the label, the control must be its next sibling
        "has-[+:disabled]:cursor-not-allowed has-[+:disabled]:opacity-50",
        "has-[+[data-disabled]]:cursor-not-allowed has-[+[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "chunks-ui-core";
import type { ComponentProps } from "react";

export type LabelProps = ComponentProps<"label"> & {
  /**
   * Dims the label and shows a not-allowed cursor. It does not read its control's state: pass
   * `disabled` to both.
   */
  disabled?: boolean;
};

export function Label({ className, disabled, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Label is a primitive; htmlFor is passed by consumers via props spread
    <label
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "font-medium text-sm leading-none",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

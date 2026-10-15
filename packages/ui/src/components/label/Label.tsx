import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type LabelProps = ComponentProps<"label"> & {
  /**
   * Dims the label and shows a not-allowed cursor, for the label of a disabled control. The label
   * does not read its control's state: pass `disabled` to both. It sets `data-disabled` on the
   * label, as Base UI does on `Field.Label`, so one `data-disabled:` class in `className`
   * restyles the disabled look.
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

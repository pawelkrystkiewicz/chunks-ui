import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import type { ElementBaseVariant, ElementColor } from "../../types";
import { ClearButton } from "../clear-button";
import { chipVariants } from "./Chip.Variants";

export type ChipProps = ComponentProps<"span"> &
  Omit<VariantProps<typeof chipVariants>, "color" | "variant"> & {
    /** Callback fired when the remove button is clicked; shows a remove button when provided. */
    onRemove?: () => void;
    /**
     * Semantic color of the chip.
     * @default "secondary"
     * @remarks `"primary" | "destructive" | "success" | "warning" | "secondary"`
     */
    color?: ElementColor;
    /**
     * Fill style of the chip.
     * @default "contained"
     * @remarks `"contained" | "outlined"`
     */
    variant?: ElementBaseVariant;
  };

export function Chip({ color, variant, onRemove, className, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ color, variant }), className)} {...props}>
      {children}
      {onRemove && <ClearButton label="Remove" onClick={onRemove} />}
    </span>
  );
}

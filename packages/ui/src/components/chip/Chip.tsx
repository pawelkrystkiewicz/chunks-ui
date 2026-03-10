import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { ClearButton } from "../clear-button";
import { chipVariants } from "./Chip.Variants";

export type ChipProps = ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & {
    onRemove?: () => void;
  };

export function Chip({ color, variant, size, onRemove, className, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ color, variant, size }), className)} {...props}>
      {children}
      {onRemove && <ClearButton label="Remove" onClick={onRemove} />}
    </span>
  );
}

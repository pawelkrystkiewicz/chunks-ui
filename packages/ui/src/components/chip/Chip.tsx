import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import type { ElementColor } from "../../types";
import { ClearButton } from "../clear-button";
import { chipVariants } from "./Chip.Variants";

export type ChipProps = ComponentProps<"span"> & {
  onRemove?: () => void;
  color?: ElementColor;
};

export function Chip({ color, onRemove, className, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ color }), className)} {...props}>
      {children}
      {onRemove && <ClearButton label="Remove" onClick={onRemove} />}
    </span>
  );
}

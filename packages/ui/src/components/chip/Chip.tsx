import type { VariantProps } from "class-variance-authority";
import { type ComponentProps, useId } from "react";
import { cn } from "../../lib/cn";
import type { ElementBaseVariant, ElementColor } from "../../types";
import { ClearButton } from "../clear-button";
import { chipVariants } from "./Chip.Variants";

/** The built-in English strings of `Chip`. */
export type ChipLabels = {
  /**
   * Name of the remove button. The chip's text follows it, so the button reads "Remove Apple".
   * @default "Remove"
   */
  remove: string;
};

export const DEFAULT_CHIP_LABELS: ChipLabels = { remove: "Remove" };

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
    /**
     * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
     * default from `DEFAULT_CHIP_LABELS`.
     */
    labels?: Partial<ChipLabels>;
  };

export function Chip({
  color,
  variant,
  onRemove,
  labels,
  className,
  children,
  ...props
}: ChipProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const removeId = `${id}-remove`;
  const { remove } = { ...DEFAULT_CHIP_LABELS, ...labels };

  return (
    <span className={cn(chipVariants({ color, variant }), className)} {...props}>
      {/* `contents` keeps the layout of bare children. The span gives the text an id for the
          remove button, and is always there so that adding or dropping `onRemove` doesn't
          remount the children */}
      <span id={onRemove ? labelId : undefined} className="contents">
        {children}
      </span>
      {onRemove && (
        // Named by its own label, then the chip's text: "Remove Apple"
        <ClearButton
          id={removeId}
          label={remove}
          aria-labelledby={`${removeId} ${labelId}`}
          onClick={onRemove}
        />
      )}
    </span>
  );
}

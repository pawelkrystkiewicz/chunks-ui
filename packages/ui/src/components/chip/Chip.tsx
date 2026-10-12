import type { VariantProps } from "class-variance-authority";
import { type ComponentProps, useId } from "react";
import { cn } from "../../lib/cn";
import type { ElementBaseVariant, ElementColor } from "../../types";
import { ClearButton } from "../clear-button";
import { chipVariants } from "./Chip.Variants";

/** The built-in English strings of `Chip`. */
export type ChipLabels = {
  /**
   * Name of the remove button, read with the chip's text. `{chip}` marks where the text goes:
   * `"{chip} を削除"` reads "Apple を削除". Without `{chip}`, the text follows the label, so the
   * default reads "Remove Apple".
   * @default "Remove"
   */
  remove: string;
};

export const DEFAULT_CHIP_LABELS: Readonly<ChipLabels> = { remove: "Remove" };

const CHIP_PLACEHOLDER = "{chip}";

/**
 * Names a remove button after its chip. `label` may hold `{chip}`, where the chip's content goes;
 * without it, the label comes before the content. Render `hiddenText` inside the button or next to
 * it, and give the button `labelledBy` as its `aria-labelledby`. `withoutChip` is the label
 * alone, for a button with no chip content to read.
 */
export function removeButtonName(label: string, chipId: string, id: string) {
  const at = label.indexOf(CHIP_PLACEHOLDER);
  const before = (at === -1 ? label : label.slice(0, at)).trim();
  const after = at === -1 ? "" : label.slice(at + CHIP_PLACEHOLDER.length).trim();
  const beforeId = `${id}-before`;
  const afterId = `${id}-after`;
  return {
    labelledBy: [before && beforeId, chipId, after && afterId].filter(Boolean).join(" "),
    withoutChip: [before, after].filter(Boolean).join(" "),
    // One hidden wrapper: a name read from the chip's content skips the wrapper without entering
    // it, so a button inside the chip still gets each part where aria-labelledby puts it (Testing
    // Library reads a node once, and would drop a hidden part it had passed in the chip)
    hiddenText: (
      <span hidden>
        {before && <span id={beforeId}>{before}</span>}
        {after && <span id={afterId}>{after}</span>}
      </span>
    ),
  };
}

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
  const removeName = removeButtonName({ ...DEFAULT_CHIP_LABELS, ...labels }.remove, labelId, id);

  return (
    <span className={cn(chipVariants({ color, variant }), className)} {...props}>
      {/* `contents` keeps the layout of bare children. The span gives the text an id for the
          remove button, and is always there so that adding or dropping `onRemove` doesn't
          remount the children */}
      <span id={onRemove ? labelId : undefined} className="contents">
        {children}
      </span>
      {onRemove && (
        // Named by hidden text around the chip's text: "Remove Apple", or "Apple を削除"
        <>
          {removeName.hiddenText}
          <ClearButton
            label={removeName.withoutChip}
            aria-labelledby={removeName.labelledBy}
            onClick={onRemove}
          />
        </>
      )}
    </span>
  );
}

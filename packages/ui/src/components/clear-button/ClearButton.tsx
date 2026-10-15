import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { CloseIcon } from "../CloseIcon";
import { BUTTON_ANIMATION_CLASSES, FOCUS_RING } from "../shared";
import { type ClearButtonLabels, DEFAULT_CLEAR_BUTTON_LABELS } from "./ClearButton.Labels";

export type ClearButtonProps = ComponentProps<"button"> & {
  /**
   * Accessible label for the clear button, used as `aria-label`. Takes precedence over `labels`.
   * @default "Clear"
   * @deprecated Use `labels={{ clear: "…" }}`, as on the other components, or `aria-label`.
   * `label` still works, and still takes precedence over `labels`.
   */
  label?: string;
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_CLEAR_BUTTON_LABELS`. `label` and `aria-label` take precedence, and
   * `aria-labelledby` turns the default off: the button is then named by what it references.
   */
  labels?: Partial<ClearButtonLabels>;
};

export function ClearButton({ className, label, labels, ...props }: ClearButtonProps) {
  // No default next to aria-labelledby: when the referenced element contains this button, its
  // text would take the default in, and "Remove Apple" would read "Remove Apple Clear"
  const defaultLabel = props["aria-labelledby"]
    ? undefined
    : mergeLabels(DEFAULT_CLEAR_BUTTON_LABELS, labels).clear;
  const resolvedLabel = props["aria-label"] ?? label ?? defaultLabel;
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        "text-muted-foreground enabled:hover:bg-destructive/5 enabled:hover:text-foreground",
        FOCUS_RING,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "enabled:hover:text-destructive-text",
        "cursor-pointer",
        ...BUTTON_ANIMATION_CLASSES,
        "enabled:hover:scale-105",
        className,
      )}
      {...props}
    >
      <CloseIcon className="size-4" />
    </button>
  );
}

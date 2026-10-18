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

// Children replace the X, and the button keeps its aria-label (#564)
export function ClearButton({ className, label, labels, children, ...props }: ClearButtonProps) {
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
        "text-muted-foreground hover:bg-destructive/5 hover:text-foreground",
        FOCUS_RING,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:text-destructive-text",
        "cursor-pointer",
        ...BUTTON_ANIMATION_CLASSES,
        "hover:scale-105",
        // Chromium applies :hover and :active to a disabled button: turn the library's feedback off
        "disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:scale-100 disabled:active:scale-100",
        className,
      )}
      {...props}
    >
      {children ?? <CloseIcon className="size-4" />}
    </button>
  );
}

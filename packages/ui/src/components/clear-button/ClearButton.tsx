import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { BUTTON_ANIMATION_CLASSES } from "../shared";

/** The built-in English strings of `ClearButton`. */
export type ClearButtonLabels = {
  /**
   * Accessible name of the button.
   * @default "Clear"
   */
  clear: string;
};

export const DEFAULT_CLEAR_BUTTON_LABELS: Readonly<ClearButtonLabels> = { clear: "Clear" };

export type ClearButtonProps = ComponentProps<"button"> & {
  /**
   * Accessible label for the clear button, used as `aria-label`. Takes precedence over `labels`.
   * @default "Clear"
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
  const resolvedLabel = label ?? props["aria-label"] ?? defaultLabel;
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        "text-muted-foreground hover:bg-destructive/5 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:text-destructive-text",
        "cursor-pointer",
        ...BUTTON_ANIMATION_CLASSES,
        "hover:scale-105",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  );
}

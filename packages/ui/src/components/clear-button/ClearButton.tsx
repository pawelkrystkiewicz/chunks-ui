import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { BUTTON_ANIMATION_CLASSES } from "../shared";

export type ClearButtonProps = ComponentProps<"button"> & {
  label?: string;
};

const DEFAULT_LABEL = "Clear";

export function ClearButton({ className, label, ...props }: ClearButtonProps) {
  const resolvedLabel = label ?? props["aria-label"] ?? DEFAULT_LABEL;
  return (
    <button
      type="button"
      aria-label={resolvedLabel}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        "text-muted-foreground hover:bg-destructive/5 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:text-destructive",
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

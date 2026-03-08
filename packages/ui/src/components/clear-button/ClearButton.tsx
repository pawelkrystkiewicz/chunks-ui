import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type ClearButtonProps = ComponentProps<"button"> & {
  label?: string;
};

export function ClearButton({ label = "Clear", className, ...props }: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        "micro-interactions focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "cursor-pointer",
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-3.5"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

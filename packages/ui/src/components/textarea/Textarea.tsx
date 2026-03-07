import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TextareaProps = ComponentProps<"textarea"> & {
  autoResize?: boolean;
};

export function Textarea({ autoResize, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
        "text-foreground placeholder:text-muted-foreground",
        "transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        autoResize && "field-sizing-content",
        className,
      )}
      {...props}
    />
  );
}

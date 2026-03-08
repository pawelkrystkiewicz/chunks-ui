import { cva } from "class-variance-authority";
import type { ElementColor } from "../../types";

export const chipVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
    "text-xs font-medium micro-interactions",
    // TODO: add const height?
  ],
  {
    variants: {
      color: {
        primary: "border-primary/30 bg-primary/10 text-primary",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        secondary: "border-border bg-secondary text-secondary-foreground",
      } satisfies Record<ElementColor, string>,
    },
    defaultVariants: {
      color: "secondary",
    },
  },
);

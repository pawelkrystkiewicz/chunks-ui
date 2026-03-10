import { cva } from "class-variance-authority";
import type { ElementBaseVariant, ElementColor } from "../../types";

export const chipVariants = cva(
  [
    "inline-flex",
    "items-center",
    "gap-2",
    "rounded-full",
    "border",
    "px-2.5",
    "py-0.5",
    "text-xs",
    "leading-5",
    "font-medium",
    "micro-interactions",
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
      variant: {
        contained: "",
        outlined: "bg-transparent",
      } satisfies Record<ElementBaseVariant, string>,
    },
    defaultVariants: {
      color: "secondary",
      variant: "contained",
    },
  },
);

import { cva } from "class-variance-authority";
import type { ElementColor } from "../../types";

export const badgeVariants = cva(
  ["inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"],
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
      },
    },
    compoundVariants: [
      { variant: "outlined", color: "primary", className: "bg-transparent" },
      { variant: "outlined", color: "destructive", className: "bg-transparent" },
      { variant: "outlined", color: "success", className: "bg-transparent" },
      { variant: "outlined", color: "warning", className: "bg-transparent" },
      { variant: "outlined", color: "secondary", className: "bg-transparent" },
    ],
    defaultVariants: {
      color: "secondary",
      variant: "contained",
    },
  },
);

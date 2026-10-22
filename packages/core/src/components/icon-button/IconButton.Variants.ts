import { cva } from "../../lib/cva";
import type { ElementColor, ElementVariant } from "../../types";
import { BUTTON_ANIMATION_CLASSES, FOCUS_RING } from "../shared";

export const iconButtonVariants = cva(
  [
    "inline-flex size-8 items-center justify-center rounded-md",
    FOCUS_RING,
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
    "cursor-pointer",
    ...BUTTON_ANIMATION_CLASSES,
  ],
  {
    variants: {
      variant: {
        contained: [],
        outlined: ["border bg-transparent"],
        text: ["bg-transparent"],
      } satisfies Record<ElementVariant, string | string[]>,
      color: {
        primary: "",
        success: "",
        warning: "",
        destructive: "",
        secondary: "",
      } satisfies Record<ElementColor, string>,
    },
    compoundVariants: [
      // Contained
      {
        variant: "contained",
        color: "primary",
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        variant: "contained",
        color: "destructive",
        className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      {
        variant: "contained",
        color: "success",
        className: "bg-success text-success-foreground hover:bg-success/90",
      },
      {
        variant: "contained",
        color: "warning",
        className: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      {
        variant: "contained",
        color: "secondary",
        className: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      },
      // Outlined
      {
        variant: "outlined",
        color: "primary",
        className: "border-primary text-primary-text hover:bg-primary/10",
      },
      {
        variant: "outlined",
        color: "destructive",
        className: "border-destructive text-destructive-text hover:bg-destructive/10",
      },
      {
        variant: "outlined",
        color: "success",
        className: "border-success-border text-success-text hover:bg-success/10",
      },
      {
        variant: "outlined",
        color: "warning",
        className: "border-warning-border text-warning-text hover:bg-warning/10",
      },
      {
        variant: "outlined",
        color: "secondary",
        className: "border-border text-secondary-foreground hover:bg-accent",
      },
      // Text
      {
        variant: "text",
        color: "primary",
        className: "text-primary-text hover:bg-primary/10",
      },
      {
        variant: "text",
        color: "destructive",
        className: "text-destructive-text hover:bg-destructive/10",
      },
      {
        variant: "text",
        color: "success",
        className: "text-success-text hover:bg-success/10",
      },
      {
        variant: "text",
        color: "warning",
        className: "text-warning-text hover:bg-warning/10",
      },
      {
        variant: "text",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-accent",
      },
    ],
    defaultVariants: {
      variant: "text",
      color: "secondary",
    },
  },
);

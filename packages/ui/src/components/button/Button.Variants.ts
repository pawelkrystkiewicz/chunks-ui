import { cva } from "class-variance-authority";
import type { ElementColor, ElementVariant } from "../../types";
import { BUTTON_ANIMATION_CLASSES } from "../shared";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded",
    "h-ui-height px-4 text-sm font-medium",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        className: "border-primary text-primary hover:bg-primary/10",
      },
      {
        variant: "outlined",
        color: "destructive",
        className: "border-destructive text-destructive hover:bg-destructive/10",
      },
      {
        variant: "outlined",
        color: "success",
        className: "border-success text-success hover:bg-success/10",
      },
      {
        variant: "outlined",
        color: "warning",
        className: "border-warning text-warning hover:bg-warning/10",
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
        className: "text-primary hover:bg-primary/10",
      },
      {
        variant: "text",
        color: "destructive",
        className: "text-destructive hover:bg-destructive/10",
      },
      {
        variant: "text",
        color: "success",
        className: "text-success hover:bg-success/10",
      },
      {
        variant: "text",
        color: "warning",
        className: "text-warning hover:bg-warning/10",
      },
      {
        variant: "text",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-accent",
      },
    ],
    defaultVariants: {
      variant: "contained",
      color: "primary",
    },
  },
);

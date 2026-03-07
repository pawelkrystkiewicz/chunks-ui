import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
    "h-ui-height px-4 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",

    "micro-interactions",
  ],
  {
    variants: {
      variant: {
        contained: ["active:scale-95"],
        outlined: ["border bg-transparent", "active:scale-95"],
        ghost: ["bg-transparent", "active:scale-95"],
        link: "bg-transparent underline-offset-4 hover:underline",
      },
      color: {
        primary: "",
        destructive: "",
        success: "",
        warning: "",
        secondary: "",
      },
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
      // Ghost
      {
        variant: "ghost",
        color: "primary",
        className: "text-primary hover:bg-primary/10",
      },
      {
        variant: "ghost",
        color: "destructive",
        className: "text-destructive hover:bg-destructive/10",
      },
      {
        variant: "ghost",
        color: "success",
        className: "text-success hover:bg-success/10",
      },
      {
        variant: "ghost",
        color: "warning",
        className: "text-warning hover:bg-warning/10",
      },
      {
        variant: "ghost",
        color: "secondary",
        className: "text-secondary-foreground hover:bg-accent",
      },
      // Link
      {
        variant: "link",
        color: "primary",
        className: "text-primary",
      },
      {
        variant: "link",
        color: "destructive",
        className: "text-destructive",
      },
      {
        variant: "link",
        color: "success",
        className: "text-success",
      },
      {
        variant: "link",
        color: "warning",
        className: "text-warning",
      },
      {
        variant: "link",
        color: "secondary",
        className: "text-secondary-foreground",
      },
    ],
    defaultVariants: {
      variant: "contained",
      color: "primary",
    },
  },
);

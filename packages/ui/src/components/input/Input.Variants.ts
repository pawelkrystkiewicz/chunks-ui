import { cva } from "class-variance-authority";

export const inputVariants = cva(
  [
    "flex w-full rounded-lg border border-input bg-background px-3 text-sm",
    "text-foreground placeholder:text-muted-foreground",
    "transition-colors",
    "focus-visible:outline-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[invalid]:border-destructive",
  ],
  {
    variants: {
      size: {
        sm: "h-8 text-xs",
        md: "h-9",
        lg: "h-10 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

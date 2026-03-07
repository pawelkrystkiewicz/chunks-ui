import { cva } from "class-variance-authority";

export const loaderVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
    color: {
      current: "text-current",
      primary: "text-primary",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    color: "current",
  },
});

import { cva } from "class-variance-authority";

export const loaderVariants = cva("animate-spin size-ui-icon-height", {
  variants: {
    color: {
      current: "text-current",
      primary: "text-primary",
      muted: "text-muted-foreground",
    },
  },
  defaultVariants: {
    color: "current",
  },
});

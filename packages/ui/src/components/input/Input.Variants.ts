import { cva } from "class-variance-authority";

export const inputVariants = cva([
  "flex w-full rounded-lg border border-input bg-background px-3 h-ui-height text-sm",
  "text-foreground placeholder:text-muted-foreground",
  "micro-interactions",
  "focus-visible:outline-2 focus-visible:outline-ring",
  "disabled:pointer-events-none disabled:opacity-50",
  "data-[invalid]:border-destructive",
]);

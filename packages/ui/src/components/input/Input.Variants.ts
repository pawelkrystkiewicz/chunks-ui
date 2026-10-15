import { cva } from "../../lib/cva";
import { RING_ANIMATION_CLASSES } from "../shared";

export const inputVariants = cva([
  "flex w-full rounded-md border border-input bg-background px-3 h-ui-height text-sm",
  "text-foreground placeholder:text-muted-foreground",
  ...RING_ANIMATION_CLASSES,
  "focus-visible:outline-2 focus-visible:outline-ring",
  "disabled:pointer-events-none disabled:opacity-50",
  "data-[invalid]:border-destructive",
]);

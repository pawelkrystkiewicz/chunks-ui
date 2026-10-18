import { cva } from "../../lib/cva";
import { FOCUS_RING, RING_ANIMATION_CLASSES } from "../shared";

export const inputVariants = cva([
  "flex w-full rounded-md border border-input bg-background px-3 h-ui-height",
  // 16px below md: iOS Safari zooms the page when a field under 16px takes focus (#562).
  // max-md: keeps a text size in className working from md up, as before
  "text-sm max-md:text-base",
  "text-foreground placeholder:text-muted-foreground",
  ...RING_ANIMATION_CLASSES,
  FOCUS_RING,
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-invalid:border-destructive",
]);

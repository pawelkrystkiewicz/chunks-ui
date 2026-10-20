import { cva } from "../../lib/cva";
/**
 * The group is a flex box along its axis. `min-*-0` lets it shrink inside a flex parent, and it
 * fills its parent: a vertical group needs a parent with a height, like a vertical slider.
 */
export const resizableGroupVariants = cva("flex h-full min-h-0 w-full min-w-0", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

/**
 * `min-*-0` lets a panel shrink below its content, and `overflow-hidden` keeps that content in the
 * panel. Its size comes from an inline `flex` that reads the panel's CSS variable.
 */
export const resizablePanelClasses = "min-h-0 min-w-0 overflow-hidden";

/**
 * The handle is a 1px line between two panels. `orientation` is the line's, as `aria-orientation`
 * has it: a horizontal group has vertical lines. `touch-target` grows the hit area past the line,
 * to 12px for a mouse and 44px on a touch screen, without taking space from the panels.
 * `touch-none` hands touch moves to the drag. Nothing animates.
 */
export const resizableHandleVariants = cva(
  [
    "group/handle relative z-10 flex shrink-0 touch-none select-none items-center justify-center bg-border",
    "touch-target [--touch-target-size:12px] [@media(pointer:coarse)]:[--touch-target-size:44px]",
    "not-data-disabled:hover:bg-ring data-dragging:bg-ring",
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
    // A ring offset from a 1px line draws two lines around it; drawn on the line it is one bar
    "focus-visible:outline-2 focus-visible:outline-ring",
    // Forced-colors mode repaints backgrounds in the page colour, which would hide a 1px line.
    // System colours keep it visible, and Highlight marks the active state as the ring does.
    "forced-colors:bg-[CanvasText] forced-colors:not-data-disabled:hover:bg-[Highlight] forced-colors:data-dragging:bg-[Highlight]",
  ],
  {
    variants: {
      orientation: {
        vertical: "w-px self-stretch not-data-disabled:cursor-col-resize",
        horizontal: "h-px w-full not-data-disabled:cursor-row-resize",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

/**
 * The optional grabber on the handle: a small pill centred on the line with a few dots in it. The
 * handle centres it with flex, which is direction-safe and lets it overflow the 1px line evenly.
 * It turns with the line by the handle's `data-orientation`: a vertical line gets a tall pill with
 * stacked dots, a horizontal line a wide one. The pill is at most 12px across, so the handle's
 * `touch-target` (12px) still covers it; `pointer-events-none` leaves every press to the handle.
 * The dots are one `radial-gradient` tile repeated three times, so they need no icon. Hover, drag
 * and keyboard focus follow the handle (not on a disabled one). Nothing animates.
 */
export const resizableGripVariants = cva([
  "pointer-events-none flex shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground",
  "group-data-[orientation=vertical]/handle:h-5 group-data-[orientation=vertical]/handle:w-3",
  "group-data-[orientation=horizontal]/handle:h-3 group-data-[orientation=horizontal]/handle:w-5",
  "after:block after:bg-[radial-gradient(circle,currentColor_1px,transparent_1.5px)] after:[background-size:4px_4px] after:content-['']",
  "group-data-[orientation=vertical]/handle:after:h-3 group-data-[orientation=vertical]/handle:after:w-1",
  "group-data-[orientation=horizontal]/handle:after:h-1 group-data-[orientation=horizontal]/handle:after:w-3",
  "group-not-data-disabled/handle:group-hover/handle:border-ring group-not-data-disabled/handle:group-hover/handle:text-foreground",
  "group-data-dragging/handle:border-ring group-data-dragging/handle:text-foreground",
  "group-focus-visible/handle:border-ring group-focus-visible/handle:text-foreground",
  // The pill keeps a visible border in forced-colors mode, Highlight while active
  "forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
  "forced-colors:group-not-data-disabled/handle:group-hover/handle:border-[Highlight]",
  "forced-colors:group-data-dragging/handle:border-[Highlight] forced-colors:group-focus-visible/handle:border-[Highlight]",
]);

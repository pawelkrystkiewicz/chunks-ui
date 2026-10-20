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
    "touch-target [--touch-target-size:12px] pointer-coarse:[--touch-target-size:44px]",
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

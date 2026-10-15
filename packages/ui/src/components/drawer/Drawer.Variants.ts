import { cva } from "../../lib/cva";

/**
 * Shared by the CSS variants and the Motion path, which positions the popup with its own classes.
 * The popup takes focus when nothing inside is tabbable or `initialFocus` points at it; its ring
 * is drawn 3px inside the edge (1px border, then the 2px ring), so the border on the open side
 * still shows.
 */
export const drawerBase = [
  "fixed overflow-y-auto overscroll-contain border-border bg-background p-6 shadow-xl",
  "focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-ring",
];

// Only the slide
const cssSlide = "micro-interactions [transition-property:translate] duration-300";

export const drawerPopupVariants = cva([drawerBase, cssSlide], {
  variants: {
    side: {
      left: [
        "inset-y-0 left-0 w-80 border-r",
        "data-[starting-style]:-translate-x-full",
        "data-[ending-style]:-translate-x-full",
      ],
      right: [
        "inset-y-0 right-0 w-80 border-l",
        "data-[starting-style]:translate-x-full",
        "data-[ending-style]:translate-x-full",
      ],
      bottom: [
        "inset-x-0 bottom-0 h-auto max-h-[80dvh] border-t rounded-t-xl",
        "data-[starting-style]:translate-y-full",
        "data-[ending-style]:translate-y-full",
      ],
    },
  },
  defaultVariants: {
    side: "right",
  },
});

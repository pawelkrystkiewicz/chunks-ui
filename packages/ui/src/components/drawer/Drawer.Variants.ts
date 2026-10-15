import { cva } from "../../lib/cva";

/** The edge of the viewport a drawer slides in from. */
export type DrawerSide = "left" | "right" | "bottom";

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

/** Where each side pins the popup, with the border on its open edge. Shared like `drawerBase`. */
export const drawerSidePosition: Record<DrawerSide, string> = {
  left: "inset-y-0 left-0 w-80 border-r",
  right: "inset-y-0 right-0 w-80 border-l",
  bottom: "inset-x-0 bottom-0 h-auto max-h-[80dvh] border-t rounded-t-xl",
};

/**
 * The Motion path's slide for each side. `transform` rather than x/y: Motion runs it as a browser
 * animation, which Base UI waits for (element.getAnimations()) before it unmounts a closing popup,
 * so the drawer can slide out.
 */
export const drawerSlide: Record<
  DrawerSide,
  { from: Record<string, string>; to: Record<string, string> }
> = {
  left: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0%)" } },
  right: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0%)" } },
  bottom: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0%)" } },
};

// Only the slide
const cssSlide = "micro-interactions [transition-property:translate] duration-300";

export const drawerPopupVariants = cva([drawerBase, cssSlide], {
  variants: {
    side: {
      left: [
        drawerSidePosition.left,
        "data-[starting-style]:-translate-x-full",
        "data-[ending-style]:-translate-x-full",
      ],
      right: [
        drawerSidePosition.right,
        "data-[starting-style]:translate-x-full",
        "data-[ending-style]:translate-x-full",
      ],
      bottom: [
        drawerSidePosition.bottom,
        "data-[starting-style]:translate-y-full",
        "data-[ending-style]:translate-y-full",
      ],
    },
  },
  defaultVariants: {
    side: "right",
  },
});

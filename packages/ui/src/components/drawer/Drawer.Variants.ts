import { cva } from "class-variance-authority";

/** Shared by the CSS variants and the Motion path, which positions the popup with its own classes. */
export const drawerBase =
  "fixed overflow-y-auto overscroll-contain border-border bg-background p-6 shadow-xl";

export const drawerPopupVariants = cva([drawerBase, "micro-interactions"], {
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

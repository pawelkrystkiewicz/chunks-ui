import { cva } from "class-variance-authority";

export const drawerPopupVariants = cva(
  [
    "fixed z-drawers border-border bg-background p-6 shadow-xl",
    "transition-transform duration-200 ease-snappy",
  ],
  {
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
          "inset-x-0 bottom-0 h-auto border-t rounded-t-xl",
          "data-[starting-style]:translate-y-full",
          "data-[ending-style]:translate-y-full",
        ],
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

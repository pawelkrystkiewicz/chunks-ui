import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme.css tokens; cn.spec.ts fails when theme.css gains one that is missing here
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["ui-height", "ui-icon-height"],
      font: ["heading"],
      ease: ["fluid", "snappy"],
    },
    classGroups: {
      // tailwind-merge has no z-index theme key, so extend the class group itself
      z: [
        {
          z: [
            "base",
            "dropdowns",
            "tooltips",
            "overlays",
            "drawers",
            "modals",
            "notifications",
            "toasts",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

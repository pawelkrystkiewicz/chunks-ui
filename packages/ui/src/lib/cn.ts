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

/** A Base UI part's `className`: a string, or a function of the part's state. */
type StateClassName<State> = string | ((state: State) => string | undefined) | undefined;

/**
 * `cn` for a Base UI part. The last argument is the consumer's `className`, which Base UI also
 * accepts as a function of the part's state; `cn` alone would drop that function. A string
 * merges like `cn`; a function becomes a function of the state that merges its result.
 */
export function cnState<State>(...inputs: [...ClassValue[], StateClassName<State>]) {
  const className = inputs[inputs.length - 1];
  if (typeof className !== "function") return cn(inputs as ClassValue[]);
  const base = inputs.slice(0, -1) as ClassValue[];
  return (state: State) => cn(base, className(state));
}

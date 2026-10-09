import { type ClassDictionary, type ClassValue, clsx } from "clsx";
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

/**
 * What `cn` accepts: clsx's `ClassValue` without functions. clsx types a dictionary as
 * `Record<string, any>`, which a function also matches, and then drops the function silently.
 * A dictionary here may not have `call` (every function does) or `[Symbol.iterator]` (every
 * array does), so functions fail to type-check and arrays, readonly ones included, take the
 * array branch, where each item is checked.
 */
export type ClassInput =
  | Exclude<ClassValue, ClassDictionary | ClassValue[]>
  | readonly ClassInput[]
  | (ClassDictionary & { call?: never; [Symbol.iterator]?: never });

/** Merges class names with clsx, then resolves Tailwind conflicts (the last class wins). */
export function cn(...inputs: ClassInput[]) {
  return twMerge(clsx(inputs as ClassValue[]));
}

/** A Base UI part's `className`: a string, or a function of the part's state. */
export type StateClassName<State> = string | ((state: State) => string | undefined) | undefined;

/**
 * `cn` for a Base UI part: the last argument is the consumer's `className`, which Base UI also
 * accepts as a function of the part's state. A string merges like `cn`. A function becomes a
 * function of the state that merges its result with the other arguments.
 *
 * @example
 * <BaseSelect.Item className={cnState("px-2 data-highlighted:bg-accent", className)} {...props} />
 */
export function cnState<State>(...inputs: [...ClassInput[], StateClassName<State>]) {
  const className = inputs[inputs.length - 1];
  if (typeof className !== "function") return cn(...(inputs as ClassInput[]));
  const base = inputs.slice(0, -1) as ClassInput[];
  return (state: State) => cn(base, className(state));
}

"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;

function SwitchRoot({ className, ...props }: SwitchRootProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        // The padding scales with --spacing, so the inner box is always two thumbs wide
        // (8 units for a 4-unit thumb) and the thumb travels exactly its own width.
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5",
        // Forced-colors mode drops backgrounds. An overlaid ring marks the track edge there
        // without changing the layout.
        "forced-colors:relative forced-colors:before:absolute forced-colors:before:inset-0",
        "forced-colors:before:rounded-full forced-colors:before:border-2",
        "micro-interactions bg-input",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-checked:bg-primary",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export type SwitchThumbProps = ComponentProps<typeof BaseSwitch.Thumb>;

const THUMB_CLASSES = cn(
  "pointer-events-none block size-4 rounded-full bg-background shadow-sm",
  // Forced-colors mode would paint the thumb in the page colour. System colours keep it
  // visible, and the checked colour adds a second cue to the position.
  "forced-colors:bg-[CanvasText] forced-colors:data-checked:bg-[Highlight]",
);

function SwitchThumb({ className, ...props }: SwitchThumbProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  if (useSpring) {
    return (
      <BaseSwitch.Thumb
        render={(renderProps, state) => (
          <m.motion.span
            {...(renderProps as Record<string, unknown>)}
            className={cn(THUMB_CLASSES, className)}
            initial={false}
            animate={{ x: state.checked ? "100%" : "0%" }}
            transition={springs.micro}
          />
        )}
        {...props}
      />
    );
  }

  return (
    <BaseSwitch.Thumb
      className={cn(
        THUMB_CLASSES,
        "micro-interactions",
        "data-checked:translate-x-full data-unchecked:translate-x-0",
        className,
      )}
      {...props}
    />
  );
}

export const Switch = {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
};

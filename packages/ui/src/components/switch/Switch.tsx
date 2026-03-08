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
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent",
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
            className={cn(
              "pointer-events-none block size-4 rounded-full bg-background shadow-sm",
              className,
            )}
            initial={false}
            animate={{ x: state.checked ? 16 : 0 }}
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
        "pointer-events-none block size-4 rounded-full bg-background shadow-sm",
        "micro-interactions",
        "data-checked:translate-x-4 data-unchecked:translate-x-0",
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

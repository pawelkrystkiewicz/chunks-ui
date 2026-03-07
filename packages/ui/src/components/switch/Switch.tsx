import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;

function SwitchRoot({ className, ...props }: SwitchRootProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent",
        "bg-input transition-colors",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "data-[checked]:bg-primary",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export type SwitchThumbProps = ComponentProps<typeof BaseSwitch.Thumb>;

function SwitchThumb({ className, ...props }: SwitchThumbProps) {
  return (
    <BaseSwitch.Thumb
      className={cn(
        "pointer-events-none block size-4 rounded-full bg-background shadow-sm",
        "transition-transform",
        "data-[checked]:translate-x-4 data-[unchecked]:translate-x-0",
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

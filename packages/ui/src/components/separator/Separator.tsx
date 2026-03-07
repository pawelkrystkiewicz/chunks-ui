import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SeparatorProps = ComponentProps<typeof BaseSeparator>;

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      className={cn(
        "bg-border shrink-0",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

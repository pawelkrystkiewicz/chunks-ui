import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cnState } from "chunks-ui-core";
import type { ComponentProps } from "react";

export type SeparatorProps = ComponentProps<typeof BaseSeparator>;

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      className={cnState(
        "bg-border",
        "shrink-0",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

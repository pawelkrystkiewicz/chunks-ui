import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import type { ElementColor, ElementVariant } from "../../types";
import { iconButtonVariants } from "./IconButton.Variants";

export type IconButtonProps = ComponentProps<typeof BaseButton> & {
  variant?: ElementVariant;
  color?: ElementColor;
};

export function IconButton({ variant, color, className, ...props }: IconButtonProps) {
  return (
    <BaseButton className={cn(iconButtonVariants({ variant, color }), className)} {...props} />
  );
}

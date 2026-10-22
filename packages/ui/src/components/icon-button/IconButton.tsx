import { Button as BaseButton } from "@base-ui/react/button";
import {
  cnState,
  type ElementColor,
  type ElementVariant,
  iconButtonVariants,
} from "chunks-ui-core";
import type { ComponentProps } from "react";

export type IconButtonProps = ComponentProps<typeof BaseButton> & {
  variant?: ElementVariant;
  color?: ElementColor;
};

export function IconButton({ variant, color, className, ...props }: IconButtonProps) {
  return (
    <BaseButton className={cnState(iconButtonVariants({ variant, color }), className)} {...props} />
  );
}

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { ElementColor, ElementVariant } from "../../types";
import { Loader } from "../loader";
import { buttonVariants } from "./Button.Variants";

export type ButtonProps = ComponentProps<typeof BaseButton> & {
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  variant?: ElementVariant;
  color?: ElementColor;
};

export function Button({
  variant,
  color,
  loading = false,
  disabled,
  startIcon,
  endIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      className={cn(buttonVariants({ variant, color }), className)}
      {...props}
    >
      {loading ? <Loader /> : startIcon}
      {children}
      {!loading && endIcon}
    </BaseButton>
  );
}

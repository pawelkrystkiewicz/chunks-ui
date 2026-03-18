import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { ElementColor, ElementVariant } from "../../types";
import { Loader } from "../loader";
import { buttonVariants } from "./Button.Variants";

export type ButtonProps = ComponentProps<typeof BaseButton> & {
  /**
   * Show a loading spinner and disable interaction.
   * @default false
   */
  loading?: boolean;
  /** Icon rendered before `children`. Replaced by `Loader` when loading. */
  startIcon?: ReactNode;
  /** Icon rendered after `children`. Hidden when loading. */
  endIcon?: ReactNode;
  /**
   * Visual style of the button.
   * @default "contained"
   * @remarks `"contained" | "outlined" | "text"`
   */
  variant?: ElementVariant;
  /**
   * Semantic color theme.
   * @default "primary"
   * @remarks `"primary" | "destructive" | "success" | "warning" | "secondary"`
   */
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

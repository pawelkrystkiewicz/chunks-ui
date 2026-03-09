import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { badgeVariants } from "./Badge.Variants";

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ color, variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ color, variant }), className)} {...props} />;
}

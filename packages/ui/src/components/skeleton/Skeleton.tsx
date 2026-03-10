import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type SkeletonProps = ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} {...props} />
  );
}

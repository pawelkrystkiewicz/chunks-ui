import { cn } from "chunks-ui-core";
import type { ComponentProps } from "react";

export type SkeletonProps = ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} {...props} />
  );
}

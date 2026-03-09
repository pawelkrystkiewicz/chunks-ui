"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProgressRootProps = ComponentProps<typeof BaseProgress.Root>;
export type ProgressTrackProps = ComponentProps<typeof BaseProgress.Track>;
export type ProgressIndicatorProps = ComponentProps<typeof BaseProgress.Indicator>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ProgressRoot({ className, ...props }: ProgressRootProps) {
  return <BaseProgress.Root className={cn("w-full", className)} {...props} />;
}

function ProgressTrack({ className, ...props }: ProgressTrackProps) {
  return (
    <BaseProgress.Track
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    />
  );
}

function ProgressIndicator({ className, ...props }: ProgressIndicatorProps) {
  return (
    <BaseProgress.Indicator
      className={cn(
        "h-full rounded-full bg-primary",
        "transition-[width] duration-300 ease-out",
        "data-[indeterminate]:w-full data-[indeterminate]:animate-pulse data-[indeterminate]:opacity-75",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Progress = {
  Root: ProgressRoot,
  Track: ProgressTrack,
  Indicator: ProgressIndicator,
};

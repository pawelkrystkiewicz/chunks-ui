"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SliderRootProps = ComponentProps<typeof BaseSlider.Root>;
export type SliderValueProps = ComponentProps<typeof BaseSlider.Value>;
export type SliderControlProps = ComponentProps<typeof BaseSlider.Control>;
export type SliderTrackProps = ComponentProps<typeof BaseSlider.Track>;
export type SliderIndicatorProps = ComponentProps<typeof BaseSlider.Indicator>;
export type SliderThumbProps = ComponentProps<typeof BaseSlider.Thumb>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SliderRoot({ className, ...props }: SliderRootProps) {
  return (
    <BaseSlider.Root
      className={cn(
        "flex w-full flex-col gap-2",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-row",
        className,
      )}
      {...props}
    />
  );
}

function SliderValue({ className, ...props }: SliderValueProps) {
  return (
    <BaseSlider.Value
      className={cn("text-foreground text-sm tabular-nums", className)}
      {...props}
    />
  );
}

function SliderControl({ className, ...props }: SliderControlProps) {
  return (
    <BaseSlider.Control
      className={cn(
        "flex w-full cursor-pointer touch-none select-none items-center py-1",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-1 data-[orientation=vertical]:py-0",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function SliderTrack({ className, ...props }: SliderTrackProps) {
  return (
    <BaseSlider.Track
      className={cn(
        "relative h-1.5 w-full grow rounded-full bg-muted",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        className,
      )}
      {...props}
    />
  );
}

function SliderIndicator({ className, ...props }: SliderIndicatorProps) {
  return (
    <BaseSlider.Indicator
      className={cn("absolute rounded-full bg-primary", className)}
      {...props}
    />
  );
}

function SliderThumb({ className, ...props }: SliderThumbProps) {
  return (
    <BaseSlider.Thumb
      className={cn(
        "size-4 rounded-full border-2 border-primary bg-background shadow-sm",
        // animate only colors to avoid resize slugishness
        "micro-interactions transition-colors!",
        "data-[dragging]:scale-110 data-[dragging]:shadow-md",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Slider = {
  Root: SliderRoot,
  Value: SliderValue,
  Control: SliderControl,
  Track: SliderTrack,
  Indicator: SliderIndicator,
  Thumb: SliderThumb,
};

"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScrollAreaRootProps = ComponentProps<typeof BaseScrollArea.Root>;
export type ScrollAreaViewportProps = ComponentProps<typeof BaseScrollArea.Viewport>;
export type ScrollAreaContentProps = ComponentProps<typeof BaseScrollArea.Content>;
export type ScrollAreaScrollbarProps = ComponentProps<typeof BaseScrollArea.Scrollbar>;
export type ScrollAreaThumbProps = ComponentProps<typeof BaseScrollArea.Thumb>;
export type ScrollAreaCornerProps = ComponentProps<typeof BaseScrollArea.Corner>;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ScrollAreaRoot({ className, ...props }: ScrollAreaRootProps) {
  return <BaseScrollArea.Root className={cn("relative overflow-hidden", className)} {...props} />;
}

function ScrollAreaViewport({ className, ...props }: ScrollAreaViewportProps) {
  return (
    <BaseScrollArea.Viewport
      className={cn(
        "h-full w-full overflow-scroll",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function ScrollAreaContent({ className, ...props }: ScrollAreaContentProps) {
  return <BaseScrollArea.Content className={cn(className)} {...props} />;
}

function ScrollAreaScrollbar({ className, ...props }: ScrollAreaScrollbarProps) {
  return (
    <BaseScrollArea.Scrollbar
      className={cn(
        "flex touch-none select-none",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:p-0.5",
        "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:p-0.5",
        "opacity-0 transition-opacity duration-300",
        "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps) {
  return (
    <BaseScrollArea.Thumb
      className={cn(
        "micro-interactions relative flex-1 rounded-full bg-border hover:bg-muted-foreground/50",
        "before:absolute before:inset-0 before:-m-3",
        className,
      )}
      {...props}
    />
  );
}

function ScrollAreaCorner({ className, ...props }: ScrollAreaCornerProps) {
  return <BaseScrollArea.Corner className={cn("bg-muted", className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const ScrollArea = {
  Root: ScrollAreaRoot,
  Viewport: ScrollAreaViewport,
  Content: ScrollAreaContent,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
};

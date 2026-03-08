"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type PopoverRootProps = ComponentProps<typeof BasePopover.Root>;
export type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger>;
export type PopoverCloseProps = ComponentProps<typeof BasePopover.Close>;
export type PopoverArrowProps = ComponentProps<typeof BasePopover.Arrow>;
export type PopoverTitleProps = ComponentProps<typeof BasePopover.Title>;
export type PopoverDescriptionProps = ComponentProps<typeof BasePopover.Description>;

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  /** @default 8 */
  sideOffset?: ComponentProps<typeof BasePopover.Positioner>["sideOffset"];
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  alignOffset?: ComponentProps<typeof BasePopover.Positioner>["alignOffset"];
};

function PopoverContent({
  className,
  sideOffset = 8,
  side,
  align,
  alignOffset,
  ...props
}: PopoverContentProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  /* v8 ignore next */
  const useSpring = !!m && !reduced;

  /* v8 ignore next 8 */
  const render = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.popup,
        from: { opacity: 0, scale: 0.95 },
        to: { opacity: 1, scale: 1 },
      })
    : undefined;

  return (
    <BasePopover.Portal keepMounted={useSpring}>
      <BasePopover.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignOffset={alignOffset}
      >
        <BasePopover.Popup
          render={render}
          className={cn(
            "z-dropdowns rounded border border-border bg-popover p-4 text-popover-foreground shadow-md",
            !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
            !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
            !useSpring && "micro-interactions",
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  return <BasePopover.Arrow className={cn("fill-popover stroke-border", className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return <BasePopover.Title className={cn("font-semibold text-sm", className)} {...props} />;
}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export const Popover = {
  Root: BasePopover.Root,
  Trigger: BasePopover.Trigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: BasePopover.Close,
};

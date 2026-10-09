"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { usePortalContainer } from "../../lib/portal-container";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type TooltipRootProps = ComponentProps<typeof BaseTooltip.Root>;
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;

function TooltipPortal(props: TooltipPortalProps) {
  return <BaseTooltip.Portal container={usePortalContainer()} {...props} />;
}

function TooltipPopup({ className, ...props }: TooltipPopupProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const render = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.popup,
        from: { opacity: 0, scale: 0.95 },
        to: { opacity: 1, scale: 1 },
      })
    : undefined;

  return (
    <BaseTooltip.Popup
      render={render}
      className={cn(
        "relative rounded-md bg-foreground px-2.5 py-1 text-background text-xs shadow-md",
        // The gap to the trigger is a margin, not a px `sideOffset`, so it scales with the
        // arrow and the tip clears the trigger at any --spacing.
        "data-[side=top]:mb-2 data-[side=bottom]:mt-2 data-[side=left]:mr-2 data-[side=right]:ml-2",
        "data-[side=inline-start]:me-2 data-[side=inline-end]:ms-2",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // !useSpring && "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return (
    <BaseTooltip.Arrow
      className={cn(
        "absolute size-2.5 rotate-45 bg-foreground",
        // Half the arrow's size, so its centre sits on the popup edge at any --spacing.
        "data-[side=top]:-bottom-1.25",
        "data-[side=bottom]:-top-1.25",
        "data-[side=left]:-right-1.25",
        "data-[side=right]:-left-1.25",
        // Logical sides: the arrow is on the popup edge that faces back toward the trigger.
        "data-[side=inline-start]:-inset-e-1.25",
        "data-[side=inline-end]:-inset-s-1.25",
        className,
      )}
      {...props}
    />
  );
}

function TooltipPositioner({ className, ...props }: TooltipPositionerProps) {
  return <BaseTooltip.Positioner className={cn("z-tooltips", className)} {...props} />;
}

function TooltipTrigger({ delay = 50, ...props }: TooltipTriggerProps) {
  return <BaseTooltip.Trigger delay={delay} {...props} />;
}

export const Tooltip = {
  Root: BaseTooltip.Root,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Provider: BaseTooltip.Provider,
};

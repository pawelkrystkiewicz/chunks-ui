"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type TooltipRootProps = ComponentProps<typeof BaseTooltip.Root>;
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
export type TooltipPortalProps = ComponentProps<typeof BaseTooltip.Portal>;
export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;

function TooltipPortal({ keepMounted, ...props }: TooltipPortalProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  /* v8 ignore next */
  const useSpring = !!m && !reduced;

  return <BaseTooltip.Portal keepMounted={keepMounted ?? useSpring} {...props} />;
}

function TooltipPopup({ className, ...props }: TooltipPopupProps) {
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
    <BaseTooltip.Popup
      render={render}
      className={cn(
        "z-tooltips rounded bg-foreground px-2.5 py-1 text-background text-xs shadow-md",
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
  // TODO: not visible in docs example
  return <BaseTooltip.Arrow className={cn("fill-foreground", className)} {...props} />;
}

function TooltipPositioner({ className, ...props }: TooltipPositionerProps) {
  return <BaseTooltip.Positioner sideOffset={6} className={cn(className)} {...props} />;
}

function TooltipTrigger({ delay = 100, ...props }: TooltipTriggerProps) {
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

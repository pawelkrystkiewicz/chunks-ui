import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type TooltipRootProps = ComponentProps<typeof BaseTooltip.Root>;
export type TooltipTriggerProps = ComponentProps<typeof BaseTooltip.Trigger>;
export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
export type TooltipPopupProps = ComponentProps<typeof BaseTooltip.Popup>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;

function TooltipPopup({ className, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      className={cn(
        "z-tooltips rounded bg-foreground px-2.5 py-1 text-xs text-background shadow-md",
        "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
        "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
        "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return <BaseTooltip.Arrow className={cn("fill-foreground", className)} {...props} />;
}

function TooltipPositioner({ className, ...props }: TooltipPositionerProps) {
  return <BaseTooltip.Positioner sideOffset={6} className={cn(className)} {...props} />;
}

export const Tooltip = {
  Root: BaseTooltip.Root,
  Trigger: BaseTooltip.Trigger,
  Portal: BaseTooltip.Portal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Provider: BaseTooltip.Provider,
};

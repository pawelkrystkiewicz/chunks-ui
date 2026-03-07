import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type PopoverRootProps = ComponentProps<typeof BasePopover.Root>;
export type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger>;
export type PopoverPositionerProps = ComponentProps<typeof BasePopover.Positioner>;
export type PopoverPopupProps = ComponentProps<typeof BasePopover.Popup>;
export type PopoverArrowProps = ComponentProps<typeof BasePopover.Arrow>;
export type PopoverTitleProps = ComponentProps<typeof BasePopover.Title>;
export type PopoverDescriptionProps = ComponentProps<typeof BasePopover.Description>;
export type PopoverCloseProps = ComponentProps<typeof BasePopover.Close>;

function PopoverPopup({ className, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup
      className={cn(
        "z-dropdowns rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md",
        "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
        "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
        "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function PopoverPositioner({ className, ...props }: PopoverPositionerProps) {
  return <BasePopover.Positioner sideOffset={8} className={cn(className)} {...props} />;
}

function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  return <BasePopover.Arrow className={cn("fill-popover stroke-border", className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return <BasePopover.Title className={cn("text-sm font-semibold", className)} {...props} />;
}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export const Popover = {
  Root: BasePopover.Root,
  Trigger: BasePopover.Trigger,
  Portal: BasePopover.Portal,
  Positioner: PopoverPositioner,
  Popup: PopoverPopup,
  Arrow: PopoverArrow,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: BasePopover.Close,
};

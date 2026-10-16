"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { usePortalContainer } from "../../lib/portal-container";
import { usePopupRender } from "../../lib/use-popup-render";
import { FOCUS_RING, RING_TRANSITION } from "../shared";

export type SelectRootProps = ComponentProps<typeof BaseSelect.Root>;
export type SelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger>;
export type SelectValueProps = ComponentProps<typeof BaseSelect.Value>;
export type SelectIconProps = ComponentProps<typeof BaseSelect.Icon>;
export type SelectPositionerProps = ComponentProps<typeof BaseSelect.Positioner>;
export type SelectPopupProps = ComponentProps<typeof BaseSelect.Popup>;
export type SelectItemProps = ComponentProps<typeof BaseSelect.Item>;
export type SelectItemTextProps = ComponentProps<typeof BaseSelect.ItemText>;
export type SelectItemIndicatorProps = ComponentProps<typeof BaseSelect.ItemIndicator>;
export type SelectGroupProps = ComponentProps<typeof BaseSelect.Group>;
export type SelectGroupLabelProps = ComponentProps<typeof BaseSelect.GroupLabel>;

function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cnState(
        "flex h-ui-height w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm",
        "placeholder:text-muted-foreground",
        FOCUS_RING,
        RING_TRANSITION,
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectIcon({ className, ...props }: SelectIconProps) {
  return (
    <BaseSelect.Icon className={cnState("ms-auto", className)} {...props}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-4 text-muted-foreground"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </BaseSelect.Icon>
  );
}

function SelectPopup({ className, render: renderProp, ...props }: SelectPopupProps) {
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseSelect.Popup
      render={render}
      className={cnState(
        "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        // Grows out of the trigger, from the point Base UI sets as --transform-origin
        "origin-(--transform-origin)",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // The fade and scale of the spring path, so both paths match
        !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({ className, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cnState(
        "relative flex w-full cursor-default items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

function SelectItemIndicator({ className, ...props }: SelectItemIndicatorProps) {
  return (
    <BaseSelect.ItemIndicator
      className={cnState("absolute end-2 flex items-center", className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </BaseSelect.ItemIndicator>
  );
}

function SelectPositioner({ className, ...props }: SelectPositionerProps) {
  return <BaseSelect.Positioner className={cnState("z-dropdowns", className)} {...props} />;
}

function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <BaseSelect.GroupLabel
      className={cnState("cursor-default px-2 py-1 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function SelectPortal(props: ComponentProps<typeof BaseSelect.Portal>) {
  return <BaseSelect.Portal container={usePortalContainer()} {...props} />;
}

export const Select = {
  Group: BaseSelect.Group,
  GroupLabel: SelectGroupLabel,
  Icon: SelectIcon,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  ItemText: BaseSelect.ItemText,
  Popup: SelectPopup,
  Portal: SelectPortal,
  Positioner: SelectPositioner,
  Root: BaseSelect.Root,
  Trigger: SelectTrigger,
  Value: BaseSelect.Value,
};

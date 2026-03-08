"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

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
      className={cn(
        "flex h-9 w-full items-center justify-between rounded border border-input bg-background px-3 text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectIcon({ className, ...props }: SelectIconProps) {
  return (
    <BaseSelect.Icon className={cn("ml-auto", className)} {...props}>
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

function SelectPopup({ className, ...props }: SelectPopupProps) {
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
    <BaseSelect.Popup
      render={render}
      className={cn(
        "z-dropdowns rounded border border-border bg-popover p-1 text-popover-foreground shadow-md",
        !useSpring && "data-starting-style:opacity-0",
        !useSpring && "data-ending-style:opacity-0",
        !useSpring && "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({ className, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cn(
        "relative flex w-full cursor-default items-center rounded py-1.5 pr-8 pl-2 text-sm outline-none",
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
      className={cn("absolute right-2 flex items-center", className)}
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

function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return (
    <BaseSelect.GroupLabel
      className={cn("cursor-default px-2 py-1 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export const Select = {
  Group: BaseSelect.Group,
  GroupLabel: SelectGroupLabel,
  Icon: SelectIcon,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  ItemText: BaseSelect.ItemText,
  Popup: SelectPopup,
  Portal: BaseSelect.Portal,
  Positioner: BaseSelect.Positioner,
  Root: BaseSelect.Root,
  Trigger: SelectTrigger,
  Value: BaseSelect.Value,
};

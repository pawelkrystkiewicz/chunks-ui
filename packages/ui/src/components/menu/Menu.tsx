"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type MenuRootProps = ComponentProps<typeof BaseMenu.Root>;
export type MenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;
export type MenuSeparatorProps = ComponentProps<typeof BaseMenu.Separator>;
export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group>;
export type MenuGroupLabelProps = ComponentProps<typeof BaseMenu.GroupLabel>;
export type MenuRadioGroupProps = ComponentProps<typeof BaseMenu.RadioGroup>;
export type MenuArrowProps = ComponentProps<typeof BaseMenu.Arrow>;

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> & {
  /**
   * Distance from the trigger element in pixels.
   * @default 4
   */
  sideOffset?: ComponentProps<typeof BaseMenu.Positioner>["sideOffset"];
  /**
   * Preferred side of the trigger to render against.
   * @remarks `"top" | "bottom" | "left" | "right"`
   */
  side?: ComponentProps<typeof BaseMenu.Positioner>["side"];
  /**
   * Alignment along the chosen side.
   * @remarks `"start" | "center" | "end"`
   */
  align?: ComponentProps<typeof BaseMenu.Positioner>["align"];
  /**
   * Offset from the alignment edge in pixels.
   * @default 0
   */
  alignOffset?: ComponentProps<typeof BaseMenu.Positioner>["alignOffset"];
};

export type MenuItemProps = ComponentProps<typeof BaseMenu.Item>;
export type MenuRadioItemProps = ComponentProps<typeof BaseMenu.RadioItem>;
export type MenuCheckboxItemProps = ComponentProps<typeof BaseMenu.CheckboxItem>;
export type MenuRadioItemIndicatorProps = ComponentProps<typeof BaseMenu.RadioItemIndicator>;
export type MenuCheckboxItemIndicatorProps = ComponentProps<typeof BaseMenu.CheckboxItemIndicator>;

function MenuContent({
  className,
  sideOffset = 4,
  side,
  align,
  alignOffset,
  ...props
}: MenuContentProps) {
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
    <BaseMenu.Portal keepMounted={useSpring}>
      <BaseMenu.Positioner
        className="z-dropdowns"
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignOffset={alignOffset}
      >
        <BaseMenu.Popup
          render={render}
          className={cn(
            "min-w-[8rem] rounded border border-border bg-popover p-1 text-popover-foreground shadow-md",
            !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
            !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
            !useSpring && "micro-interactions",
            className,
          )}
          {...props}
        />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function MenuRadioItem({ className, children, ...props }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.RadioItem>
  );
}

function MenuCheckboxItem({ className, children, ...props }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.CheckboxItem>
  );
}

function MenuRadioItemIndicator({ className, ...props }: MenuRadioItemIndicatorProps) {
  return (
    <BaseMenu.RadioItemIndicator
      className={cn("absolute left-2 flex size-3.5 items-center justify-center", className)}
      {...props}
    />
  );
}

function MenuCheckboxItemIndicator({ className, ...props }: MenuCheckboxItemIndicatorProps) {
  return (
    <BaseMenu.CheckboxItemIndicator
      className={cn("absolute left-2 flex size-3.5 items-center justify-center", className)}
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

function MenuGroupLabel({ className, ...props }: MenuGroupLabelProps) {
  return (
    <BaseMenu.GroupLabel
      className={cn("px-2 py-1.5 font-semibold text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function MenuArrow({ className, ...props }: MenuArrowProps) {
  return <BaseMenu.Arrow className={cn("fill-popover stroke-border", className)} {...props} />;
}

export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Content: MenuContent,
  Item: MenuItem,
  RadioItem: MenuRadioItem,
  RadioGroup: BaseMenu.RadioGroup,
  CheckboxItem: MenuCheckboxItem,
  RadioItemIndicator: MenuRadioItemIndicator,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
  Separator: MenuSeparator,
  Group: BaseMenu.Group,
  GroupLabel: MenuGroupLabel,
  Arrow: MenuArrow,
};

"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { usePortalContainer } from "../../lib/portal-container";
import { useLoadedMotion, useReducedMotion } from "../../lib/use-motion";

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

function MenuContent(props: MenuContentProps) {
  return (
    <BaseMenu.Portal container={usePortalContainer()}>
      {/* Mounts only while open, so it picks Motion or CSS each time the menu opens */}
      <MenuContentPopup {...props} />
    </BaseMenu.Portal>
  );
}

function MenuContentPopup({
  className,
  sideOffset = 4,
  side,
  align,
  alignOffset,
  ...props
}: MenuContentProps) {
  const m = useLoadedMotion();
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
    <BaseMenu.Positioner
      className="z-dropdowns"
      sideOffset={sideOffset}
      side={side}
      align={align}
      alignOffset={alignOffset}
    >
      <BaseMenu.Popup
        render={render}
        className={cnState(
          "min-w-[8rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
          // Fits the space Base UI measures between the trigger and the viewport edge, then scrolls
          "max-h-[var(--available-height)] overflow-y-auto overscroll-contain scroll-py-1",
          !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
          !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
          !useSpring && "micro-interactions",
          className,
        )}
        {...props}
      />
    </BaseMenu.Positioner>
  );
}

function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cnState(
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
      className={cnState(
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
      className={cnState(
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
      className={cnState("absolute left-2 flex size-3.5 items-center justify-center", className)}
      {...props}
    />
  );
}

function MenuCheckboxItemIndicator({ className, ...props }: MenuCheckboxItemIndicatorProps) {
  return (
    <BaseMenu.CheckboxItemIndicator
      className={cnState("absolute left-2 flex size-3.5 items-center justify-center", className)}
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return (
    <BaseMenu.Separator className={cnState("-mx-1 my-1 h-px bg-border", className)} {...props} />
  );
}

function MenuGroupLabel({ className, ...props }: MenuGroupLabelProps) {
  return (
    <BaseMenu.GroupLabel
      className={cnState("px-2 py-1.5 font-semibold text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

function MenuArrow({ className, ...props }: MenuArrowProps) {
  return <BaseMenu.Arrow className={cnState("fill-popover stroke-border", className)} {...props} />;
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

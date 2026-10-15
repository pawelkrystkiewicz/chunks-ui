"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { type ComponentProps, useState } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { arrowClasses, arrowPopupClasses } from "../../lib/popup-arrow";
import { usePortalContainer } from "../../lib/portal-container";
import { useArrowPadding } from "../../lib/use-arrow-padding";
import { useLoadedMotion, useReducedMotion } from "../../lib/use-motion";
import { RING_TRANSITION_MOTION } from "../shared";

export type MenuRootProps = ComponentProps<typeof BaseMenu.Root>;
export type MenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;
export type MenuSeparatorProps = ComponentProps<typeof BaseMenu.Separator>;
export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group>;
export type MenuGroupLabelProps = ComponentProps<typeof BaseMenu.GroupLabel>;
export type MenuRadioGroupProps = ComponentProps<typeof BaseMenu.RadioGroup>;
export type MenuArrowProps = ComponentProps<typeof BaseMenu.Arrow>;

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> & {
  /**
   * Distance from the trigger element in pixels; as on Popover, wide enough for the focus ring.
   * @default 8
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
  /**
   * How close the arrow may come to the popup's ends, in pixels. The default, read when the popup
   * mounts, keeps the arrow's foot off the popup's rounded corner at any `--radius` and `--spacing`.
   * @default corner radius + 0.21 × arrow size (≈ 10.07)
   */
  arrowPadding?: ComponentProps<typeof BaseMenu.Positioner>["arrowPadding"];
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
  children,
  sideOffset = 8,
  side,
  align,
  alignOffset,
  arrowPadding,
  onPointerMove,
  onKeyDown,
  render: renderProp,
  ...props
}: MenuContentProps) {
  const m = useLoadedMotion();
  const reduced = useReducedMotion();
  // A consumer's `render` replaces the animated element, so that popup keeps the CSS transition
  const useSpring = !!m && !reduced && !renderProp;
  const [positioner, arrowPaddingByDefault] = useArrowPadding();
  // Pointer over the popup until the next key press keeps its ring off (W151); a reopen during the
  // exit animation keeps a stale flag until the next key press (accepted).
  const [pointer, setPointer] = useState(false);
  const popupRenderer = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.popup,
        from: { opacity: 0, scale: 0.95 },
        to: { opacity: 1, scale: 1 },
      })
    : renderProp;

  return (
    <BaseMenu.Positioner
      ref={positioner}
      className="z-dropdowns"
      sideOffset={sideOffset}
      side={side}
      align={align}
      alignOffset={alignOffset}
      arrowPadding={arrowPadding ?? arrowPaddingByDefault}
    >
      <BaseMenu.Popup
        render={popupRenderer}
        data-pointer={pointer || undefined}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          // WebKit fires a move with no movement when the layout shifts under a still pointer;
          // Base UI ignores those too (isStationaryWebKitPointer)
          if (event.movementX !== 0 || event.movementY !== 0) setPointer(true);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          setPointer(false);
        }}
        className={cnState(
          "flex min-w-[8rem] flex-col rounded-md border border-border bg-popover text-popover-foreground shadow-md",
          arrowPopupClasses,
          "data-pointer:focus-visible:outline-none data-pointer:focus-visible:after:hidden",
          "max-h-[calc(var(--available-height)-var(--popup-arrow-reach))]",
          !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
          !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
          // Only the fade and scale: `all` would also animate the max-height that --available-height drives
          !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
          // Motion animates the popup: a list with no outline keeps a timing utility off the ring
          useSpring && RING_TRANSITION_MOTION,
          className,
        )}
        {...props}
      >
        {/* The items scroll in here, so the popup clips nothing: Menu.Arrow sits outside its box */}
        <div className="min-h-0 overflow-y-auto overscroll-contain scroll-py-1 rounded-[inherit] p-1">
          {children}
        </div>
      </BaseMenu.Popup>
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
        "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none",
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
        "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none",
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
      className={cnState("absolute start-2 flex size-3.5 items-center justify-center", className)}
      {...props}
    />
  );
}

function MenuCheckboxItemIndicator({ className, ...props }: MenuCheckboxItemIndicatorProps) {
  return (
    <BaseMenu.CheckboxItemIndicator
      className={cnState("absolute start-2 flex size-3.5 items-center justify-center", className)}
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
  return <BaseMenu.Arrow className={cnState(arrowClasses, className)} {...props} />;
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

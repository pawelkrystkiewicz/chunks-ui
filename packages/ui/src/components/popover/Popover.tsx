"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { type ComponentProps, createContext, useContext, useRef } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { arrowClasses, arrowPopupClasses } from "../../lib/popup-arrow";
import {
  PortalContainerProvider,
  usePortalContainer,
  usePortalNode,
} from "../../lib/portal-container";
import { ArrowChangeProvider, useArrowChange, useArrowPadding } from "../../lib/use-arrow-padding";
import { type CloseFocus, useCloseFocusRoot, useFocusOnClose } from "../../lib/use-focus-on-close";
import { usePopupRender } from "../../lib/use-popup-render";
import { RING_TRANSITION_MOTION } from "../shared";

export type PopoverRootProps = ComponentProps<typeof BasePopover.Root>;
export type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger>;
export type PopoverCloseProps = ComponentProps<typeof BasePopover.Close>;
export type PopoverArrowProps = ComponentProps<typeof BasePopover.Arrow>;
export type PopoverTitleProps = ComponentProps<typeof BasePopover.Title>;
export type PopoverDescriptionProps = ComponentProps<typeof BasePopover.Description>;

export type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> & {
  /**
   * Distance from the trigger element in pixels.
   * @default 8
   */
  sideOffset?: ComponentProps<typeof BasePopover.Positioner>["sideOffset"];
  /**
   * Preferred side of the trigger to render against.
   * @remarks `"top" | "bottom" | "left" | "right"`
   */
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  /**
   * Alignment along the chosen side.
   * @remarks `"start" | "center" | "end"`
   */
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  /**
   * Offset from the alignment edge in pixels.
   * @default 0
   */
  alignOffset?: ComponentProps<typeof BasePopover.Positioner>["alignOffset"];
  /**
   * How close the arrow may come to the popup's ends, in pixels. The default, read when the popup
   * mounts and when its arrow mounts or unmounts, keeps the arrow's foot off the popup's rounded
   * corner at any `--radius` and `--spacing`.
   * @default corner radius + 0.21 × arrow size (≈ 10.07)
   */
  arrowPadding?: ComponentProps<typeof BasePopover.Positioner>["arrowPadding"];
};

// For the popup's focus hand-off (#633); `null` under a Base UI Root
const PopoverCloseFocusContext = createContext<CloseFocus | null>(null);

function PopoverRoot<Payload>({ onOpenChange, ...props }: BasePopover.Root.Props<Payload>) {
  const [closeFocus, handleOpenChange] = useCloseFocusRoot(onOpenChange);
  // ponytail: Base UI 1.9's FloatingFocusManager closes a popup that is already closing, as
  // "focus-out", when focus leaves the trigger during the exit. So every close is dropped while the
  // popup is not open; remove this once Base UI checks `open` before its focus-out close. It is
  // open if `open` says so or the last change not cancelled did: a controlled parent may not have
  // re-rendered yet when an open and a close come in one batch.
  const lastOpen = useRef(props.open ?? props.defaultOpen ?? false);
  const reportOpenChange: typeof handleOpenChange = (open, details) => {
    if (!open && !(props.open || lastOpen.current)) return;
    handleOpenChange(open, details);
    if (!details.isCanceled) lastOpen.current = open;
  };
  return (
    <PopoverCloseFocusContext.Provider value={closeFocus}>
      <BasePopover.Root<Payload> {...props} onOpenChange={reportOpenChange} />
    </PopoverCloseFocusContext.Provider>
  );
}

function PopoverContent(props: PopoverContentProps) {
  const [portalRef, portalNode] = usePortalNode();
  return (
    <BasePopover.Portal ref={portalRef} container={usePortalContainer()}>
      {/* A modal popover aria-hides nodes outside its portal, so popups opened inside portal in here, and the scrub cursor with them */}
      <PortalContainerProvider value={portalNode}>
        {/* Mounts only while open, so it picks Motion or CSS each time the popover opens */}
        <PopoverContentPopup {...props} />
      </PortalContainerProvider>
    </BasePopover.Portal>
  );
}

function PopoverContentPopup({
  className,
  sideOffset = 8,
  side,
  align,
  alignOffset,
  arrowPadding,
  render: renderProp,
  ref,
  ...props
}: PopoverContentProps) {
  const [positioner, arrowPaddingByDefault, arrowChanged] = useArrowPadding();
  // Focus moves to the trigger as the popup starts to close, not at the unmount after the exit.
  // ponytail: inside is the popup alone. A popup portalled from in it (a Select in a
  // Popover.Content) is outside, so a close with focus there keeps Base UI's return at the unmount.
  const popupRef = useFocusOnClose(ref, useContext(PopoverCloseFocusContext), {
    finalFocus: props.finalFocus,
  });
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.popup,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <ArrowChangeProvider value={arrowChanged}>
      <BasePopover.Positioner
        ref={positioner}
        className="z-dropdowns"
        sideOffset={sideOffset}
        side={side}
        align={align}
        alignOffset={alignOffset}
        arrowPadding={arrowPadding ?? arrowPaddingByDefault}
      >
        <BasePopover.Popup
          ref={popupRef}
          render={render}
          className={cnState(
            "rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md",
            arrowPopupClasses,
            "origin-(--transform-origin)",
            !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
            !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
            // Only the fade and scale: `all` would also slide an arrow's margin when the side flips
            !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
            // Motion animates the popup: a list with no outline keeps a timing utility off the ring
            useSpring && RING_TRANSITION_MOTION,
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </ArrowChangeProvider>
  );
}

function PopoverArrow({ className, ...props }: PopoverArrowProps) {
  useArrowChange();
  return <BasePopover.Arrow className={cnState(arrowClasses, className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      className={cnState("font-heading font-semibold text-sm", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cnState("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export const Popover = {
  Root: PopoverRoot,
  Trigger: BasePopover.Trigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: BasePopover.Close,
};

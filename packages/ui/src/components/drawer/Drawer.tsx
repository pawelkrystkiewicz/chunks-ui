"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { PortalContainerProvider, usePortalContainer } from "../../lib/portal-container";
import { usePopupRender } from "../../lib/use-popup-render";
import {
  OverlayBody,
  type OverlayBodyProps,
  TitleIdProvider,
  useTitleId,
} from "../dialog/OverlayBody";
import { RING_TRANSITION_MOTION } from "../shared";
import {
  type DrawerSide,
  drawerBase,
  drawerPopupVariants,
  drawerSidePosition,
  drawerSlide,
} from "./Drawer.Variants";

export type DrawerProps = ComponentProps<typeof BaseDialog.Root>;
export type DrawerTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;
export type DrawerPortalProps = ComponentProps<typeof BaseDialog.Portal>;
export type DrawerPopupProps = ComponentProps<typeof BaseDialog.Popup> &
  Omit<VariantProps<typeof drawerPopupVariants>, "side"> & {
    /**
     * Which edge of the viewport the drawer slides in from.
     * @default "right"
     * @remarks `"left" | "right" | "bottom"`
     */
    side?: DrawerSide;
  };
export type DrawerBackdropProps = Omit<
  ComponentProps<typeof BaseDialog.Backdrop>,
  "forceRender"
> & {
  /**
   * Whether the backdrop renders when this drawer is opened from another dialog or drawer, so it dims that parent.
   * Base UI defaults this to `false`.
   * @default true
   */
  forceRender?: boolean;
};
export type DrawerTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DrawerBodyProps = OverlayBodyProps;
export type DrawerDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DrawerCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DrawerPortal({ className, children, ...props }: DrawerPortalProps) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal
      container={container}
      // The portal node carries the z-layer, not the popup: whatever opens from the drawer portals in here and stacks above it
      className={cnState("relative z-drawers", className)}
      {...props}
    >
      <PortalContainerProvider value={undefined}>{children}</PortalContainerProvider>
    </BaseDialog.Portal>
  );
}

function DrawerBackdrop({
  className,
  forceRender = true,
  render: renderProp,
  ...props
}: DrawerBackdropProps) {
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.overlay,
    from: { opacity: 0 },
    to: { opacity: 1 },
  });

  return (
    <BaseDialog.Backdrop
      render={render}
      forceRender={forceRender}
      className={cnState(
        "fixed inset-0 bg-black/50",
        !useSpring && "data-starting-style:opacity-0",
        !useSpring && "data-ending-style:opacity-0",
        !useSpring && "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function DrawerPopup({
  side = "right",
  className,
  children,
  render: renderProp,
  ...props
}: DrawerPopupProps) {
  const resolvedSide = side ?? "right";
  const dir = drawerSlide[resolvedSide];
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.overlay,
    from: dir.from,
    to: dir.to,
  });

  return (
    <BaseDialog.Popup
      render={render}
      className={cnState(
        useSpring && drawerBase,
        useSpring && drawerSidePosition[resolvedSide],
        // Motion slides the popup: a list with no outline keeps a timing utility off the ring
        useSpring && RING_TRANSITION_MOTION,
        !useSpring && drawerPopupVariants({ side }),
        className,
      )}
      {...props}
    >
      <TitleIdProvider>{children}</TitleIdProvider>
    </BaseDialog.Popup>
  );
}

function DrawerTitle({ className, id: idProp, ...props }: DrawerTitleProps) {
  const id = useTitleId(idProp);
  return (
    <BaseDialog.Title
      id={id}
      className={cnState("font-heading font-semibold text-lg", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cnState("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export const Drawer = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Portal: DrawerPortal,
  Backdrop: DrawerBackdrop,
  Popup: DrawerPopup,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: OverlayBody,
  Close: BaseDialog.Close,
};

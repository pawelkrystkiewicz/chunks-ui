"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { PortalContainerProvider, usePortalContainer } from "../../lib/portal-container";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { drawerPopupVariants } from "./Drawer.Variants";

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
    side?: "left" | "right" | "bottom";
  };
export type DrawerBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export type DrawerTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DrawerDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DrawerCloseProps = ComponentProps<typeof BaseDialog.Close>;

const slideDirections = {
  left: { from: { x: "-100%" }, to: { x: "0%" } },
  right: { from: { x: "100%" }, to: { x: "0%" } },
  bottom: { from: { y: "100%" }, to: { y: "0%" } },
} as const;

const motionPositionClasses = {
  left: "inset-y-0 left-0 w-80 border-r",
  right: "inset-y-0 right-0 w-80 border-l",
  bottom: "inset-x-0 bottom-0 h-auto border-t rounded-t-xl",
} as const;

function DrawerPortal({ keepMounted, className, children, ...props }: DrawerPortalProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal
      keepMounted={keepMounted ?? useSpring}
      container={container}
      // The portal node carries the z-layer, not the popup: whatever opens from the drawer portals in here and stacks above it
      className={(state) =>
        cn("relative z-drawers", typeof className === "function" ? className(state) : className)
      }
      {...props}
    >
      <PortalContainerProvider value={undefined}>{children}</PortalContainerProvider>
    </BaseDialog.Portal>
  );
}

function DrawerBackdrop({ className, ...props }: DrawerBackdropProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const render = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.overlay,
        from: { opacity: 0 },
        to: { opacity: 1 },
      })
    : undefined;

  return (
    <BaseDialog.Backdrop
      render={render}
      className={cn(
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

function DrawerPopup({ side = "right", className, ...props }: DrawerPopupProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const resolvedSide = side ?? "right";
  const dir = slideDirections[resolvedSide];
  const render = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.overlay,
        from: dir.from,
        to: dir.to,
      })
    : undefined;

  return (
    <BaseDialog.Popup
      render={render}
      className={cn(
        useSpring && "fixed border-border bg-background p-6 shadow-xl",
        useSpring && motionPositionClasses[resolvedSide],
        !useSpring && drawerPopupVariants({ side }),
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return (
    <BaseDialog.Title className={cn("font-heading font-semibold text-lg", className)} {...props} />
  );
}

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <BaseDialog.Description className={cn("text-muted-foreground text-sm", className)} {...props} />
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
  Close: BaseDialog.Close,
};

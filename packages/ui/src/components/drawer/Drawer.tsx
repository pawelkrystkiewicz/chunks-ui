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
export type DrawerDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DrawerCloseProps = ComponentProps<typeof BaseDialog.Close>;

// `transform` rather than x/y: Motion runs it as a browser animation, which Base UI waits for
// (element.getAnimations()) before it unmounts a closing popup, so the drawer can slide out
const slideDirections = {
  left: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0%)" } },
  right: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0%)" } },
  bottom: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0%)" } },
} as const;

const motionPositionClasses = {
  left: "inset-y-0 left-0 w-80 border-r",
  right: "inset-y-0 right-0 w-80 border-l",
  bottom: "inset-x-0 bottom-0 h-auto border-t rounded-t-xl",
} as const;

function DrawerPortal({ className, children, ...props }: DrawerPortalProps) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal
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

function DrawerBackdrop({ className, forceRender = true, ...props }: DrawerBackdropProps) {
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
      forceRender={forceRender}
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

"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { PortalContainerProvider, usePortalContainer } from "../../lib/portal-container";
import { useLoadedMotion, useReducedMotion } from "../../lib/use-motion";

export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>;
export type DialogTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;
export type DialogPortalProps = ComponentProps<typeof BaseDialog.Portal>;
export type DialogPopupProps = ComponentProps<typeof BaseDialog.Popup>;
export type DialogBackdropProps = Omit<
  ComponentProps<typeof BaseDialog.Backdrop>,
  "forceRender"
> & {
  /**
   * Whether the backdrop renders when this dialog is opened from another dialog or drawer, so it dims that parent.
   * Base UI defaults this to `false`.
   * @default true
   */
  forceRender?: boolean;
};
export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DialogDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DialogPortal({ className, children, ...props }: DialogPortalProps) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal
      container={container}
      // The portal node carries the z-layer, not the popup: whatever opens from the dialog portals in here and stacks above it
      className={cnState("relative z-modals", className)}
      {...props}
    >
      <PortalContainerProvider value={undefined}>{children}</PortalContainerProvider>
    </BaseDialog.Portal>
  );
}

function DialogBackdrop({ className, forceRender = true, ...props }: DialogBackdropProps) {
  const m = useLoadedMotion();
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

function DialogPopup({ className, ...props }: DialogPopupProps) {
  const m = useLoadedMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const render = useSpring
    ? createPopupRenderer({
        m,
        spring: springs.overlay,
        from: { opacity: 0, scale: 0.95 },
        to: { opacity: 1, scale: 1 },
      })
    : undefined;

  return (
    <BaseDialog.Popup
      render={render}
      className={cnState(
        "fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
        "rounded-xl border border-border bg-background p-6 shadow-lg",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        !useSpring && "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={cnState("font-heading font-semibold text-lg", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cnState("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export const Dialog = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: BaseDialog.Close,
};

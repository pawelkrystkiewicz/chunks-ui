"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import {
  PortalContainerProvider,
  usePortalContainer,
  usePortalNode,
} from "../../lib/portal-container";
import { usePopupRender } from "../../lib/use-popup-render";
import { FOCUS_RING, RING_TRANSITION_MOTION } from "../shared";
import { OverlayBody, type OverlayBodyProps, TitleIdProvider, useTitleId } from "./OverlayBody";

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
export type DialogBodyProps = OverlayBodyProps;
export type DialogDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DialogPortal({ className, children, ref, ...props }: DialogPortalProps) {
  const container = usePortalContainer();
  const [portalRef, portalNode] = usePortalNode(ref);
  return (
    <BaseDialog.Portal
      ref={portalRef}
      container={container}
      // The portal node carries the z-layer, not the popup: whatever opens from the dialog portals in here and stacks above it.
      // Popups from the dialog are placed against this box, which Floating UI does not watch: fixed across the top of the
      // viewport, it stays put when the page behind changes height (#664), scrolls or is scroll-locked, and as wide as the
      // viewport it lets a popup grow to fit its content
      className={cnState("fixed inset-x-0 top-0 z-modals", className)}
      {...props}
    >
      <PortalContainerProvider value={portalNode}>{children}</PortalContainerProvider>
    </BaseDialog.Portal>
  );
}

function DialogBackdrop({
  className,
  forceRender = true,
  render: renderProp,
  ...props
}: DialogBackdropProps) {
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

function DialogPopup({ className, children, render: renderProp, ...props }: DialogPopupProps) {
  const { useSpring, render } = usePopupRender(renderProp, {
    spring: springs.overlay,
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
  });

  return (
    <BaseDialog.Popup
      render={render}
      className={cnState(
        // A 1rem gutter on each side at any width, so the ring (4px outside the edge) stays on
        // the page; `max-w-*` in className replaces the cap (tailwind-merge)
        "fixed top-1/2 left-1/2 w-full max-w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2",
        "rounded-xl border border-border bg-background p-6 shadow-lg",
        // The popup takes focus when nothing inside is tabbable or `initialFocus` points at it
        FOCUS_RING,
        "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
        // With a Body, the parts before and after it keep their height and only the Body scrolls
        "has-[>.OverlayBody]:flex has-[>.OverlayBody]:flex-col",
        !useSpring && "data-starting-style:scale-95 data-starting-style:opacity-0",
        !useSpring && "data-ending-style:scale-95 data-ending-style:opacity-0",
        // Only the fade and scale, not the ring
        !useSpring && "micro-interactions [transition-property:opacity,scale] duration-300",
        // Motion animates the popup: a list with no outline keeps a timing utility off the ring
        useSpring && RING_TRANSITION_MOTION,
        className,
      )}
      {...props}
    >
      <TitleIdProvider>{children}</TitleIdProvider>
    </BaseDialog.Popup>
  );
}

function DialogTitle({ className, id: idProp, ...props }: DialogTitleProps) {
  const id = useTitleId(idProp);
  return (
    <BaseDialog.Title
      id={id}
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
  Body: OverlayBody,
  Close: BaseDialog.Close,
};

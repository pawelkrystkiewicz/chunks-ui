"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/popup-motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>;
export type DialogTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;
export type DialogPortalProps = ComponentProps<typeof BaseDialog.Portal>;
export type DialogPopupProps = ComponentProps<typeof BaseDialog.Popup>;
export type DialogBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DialogDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DialogPortal({ keepMounted, ...props }: DialogPortalProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;

  return <BaseDialog.Portal keepMounted={keepMounted ?? useSpring} {...props} />;
}

function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
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
        "fixed inset-0 z-overlays bg-black/50",
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
  const m = useMotion();
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
      className={cn(
        "fixed top-1/2 left-1/2 z-modals w-full max-w-md -translate-x-1/2 -translate-y-1/2",
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
  return <BaseDialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
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

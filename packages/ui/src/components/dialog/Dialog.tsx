import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type DialogRootProps = ComponentProps<typeof BaseDialog.Root>;
export type DialogTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;
export type DialogPopupProps = ComponentProps<typeof BaseDialog.Popup>;
export type DialogBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DialogDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-overlays bg-black/50",
        "data-starting-style:opacity-0",
        "data-ending-style:opacity-0",
        "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({ className, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Popup
      className={cn(
        "fixed top-1/2 left-1/2 z-modals w-full max-w-md -translate-x-1/2 -translate-y-1/2",
        "rounded-xl border border-border bg-background p-6 shadow-lg",
        "data-starting-style:scale-95 data-starting-style:opacity-0",
        "data-ending-style:scale-95 data-ending-style:opacity-0",
        "micro-interactions",
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
  Portal: BaseDialog.Portal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: BaseDialog.Close,
};

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { drawerPopupVariants } from "./Drawer.Variants";

export type DrawerProps = ComponentProps<typeof BaseDialog.Root>;
export type DrawerTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;
export type DrawerPopupProps = ComponentProps<typeof BaseDialog.Popup> &
  VariantProps<typeof drawerPopupVariants>;
export type DrawerBackdropProps = ComponentProps<typeof BaseDialog.Backdrop>;
export type DrawerTitleProps = ComponentProps<typeof BaseDialog.Title>;
export type DrawerDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DrawerCloseProps = ComponentProps<typeof BaseDialog.Close>;

function DrawerBackdrop({ className, ...props }: DrawerBackdropProps) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-drawers bg-black/50",
        "data-[starting-style]:opacity-0",
        "data-[ending-style]:opacity-0",
        "micro-interactions",
        className,
      )}
      {...props}
    />
  );
}

function DrawerPopup({ side, className, ...props }: DrawerPopupProps) {
  return <BaseDialog.Popup className={cn(drawerPopupVariants({ side }), className)} {...props} />;
}

function DrawerTitle({ className, ...props }: DrawerTitleProps) {
  return <BaseDialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: DrawerDescriptionProps) {
  return (
    <BaseDialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export const Drawer = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Portal: BaseDialog.Portal,
  Backdrop: DrawerBackdrop,
  Popup: DrawerPopup,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: BaseDialog.Close,
};

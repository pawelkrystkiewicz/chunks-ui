"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import type { ComponentProps, ComponentType } from "react";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../lib/use-motion";

/**
 * Module augmentation: add an optional `icon` slot to Base UI's ToastObject
 * interface so consumers can pass any React component (lucide, heroicons, a
 * custom SVG, etc.) via `add({ icon: MyIcon })` and have it rendered by
 * `Toast.Viewport`. Intentionally untyped beyond "any component" — chunks-ui
 * stays out of the icon ecosystem and lets callers choose.
 */
declare module "@base-ui/react/toast" {
  interface ToastObject<Data extends object> {
    /**
     * Optional icon component rendered in the toast's leading slot.
     * Receives no props — size and color are up to the caller.
     */
    icon?: ComponentType;
  }
}

export const createToastManager = BaseToast.createToastManager;

export type ToastProviderProps = ComponentProps<typeof BaseToast.Provider>;
export type ToastViewportProps = ComponentProps<typeof BaseToast.Viewport> & {
  /**
   * When `true`, renders a close (×) button on every toast rendered by this
   * viewport. Clicking it dismisses the toast via Base UI's `Toast.Close`.
   *
   * @default false
   */
  dissmissable?: boolean;
  /**
   * Optional click handler attached to the close button. Passing this prop
   * also implicitly renders the close button (no need to also set
   * `dissmissable`). Fires in addition to Base UI's built-in dismissal, so
   * use it for side effects (analytics, undo stacks, etc.) — not to prevent
   * the toast from closing.
   */
  onClose?: ToastCloseProps["onClick"];
};
export type ToastRootProps = ComponentProps<typeof BaseToast.Root>;
export type ToastTitleProps = ComponentProps<typeof BaseToast.Title>;
export type ToastDescriptionProps = ComponentProps<typeof BaseToast.Description>;
export type ToastCloseProps = ComponentProps<typeof BaseToast.Close>;
export type ToastActionProps = ComponentProps<typeof BaseToast.Action>;

function ToastViewport({ className, dissmissable, onClose, ...props }: ToastViewportProps) {
  const manager = BaseToast.useToastManager();

  return (
    <BaseToast.Viewport
      className={cn(
        "fixed right-4 bottom-4 z-toasts flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none",
        className,
      )}
      {...props}
    >
      {manager.toasts.map((toast) => {
        // extend type to support icon as JSX component
        const Icon = toast.icon;
        return (
          <ToastRoot key={toast.id} toast={toast}>
            {Icon && <Icon />}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {toast.title != null && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description != null && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
              {toast.actionProps != null && <ToastAction {...toast.actionProps} />}
            </div>
            {(dissmissable || onClose) && <ToastClose onClick={onClose} />}
          </ToastRoot>
        );
      })}
    </BaseToast.Viewport>
  );
}

function ToastRoot({ className, toast, ...props }: ToastRootProps) {
  const reduced = useReducedMotion();
  return (
    <BaseToast.Root
      toast={toast}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-sm border border-border bg-popover p-4 pr-10 shadow-lg",
        !reduced && [
          "micro-interactions",
          "data-starting-style:translate-x-full data-starting-style:opacity-0",
          "data-ending-style:translate-x-full data-ending-style:opacity-0",
          "transition-[transform,opacity] duration-300 ease-out",
        ],
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastTitleProps) {
  return (
    <BaseToast.Title
      className={cn("font-semibold text-foreground text-sm leading-tight", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return (
    <BaseToast.Description
      className={cn("text-muted-foreground text-sm leading-snug", className)}
      {...props}
    />
  );
}

function ToastClose({ className, children, ...props }: ToastCloseProps) {
  return (
    <BaseToast.Close
      aria-label="Close"
      className={cn(
        "micro-interactions absolute top-5 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-3.5" />}
    </BaseToast.Close>
  );
}

function ToastAction({ className, ...props }: ToastActionProps) {
  return (
    <BaseToast.Action
      className={cn(
        "micro-interactions mt-1 inline-flex h-7 items-center rounded-md border border-border px-3 font-medium text-xs hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export const Toast = {
  Provider: BaseToast.Provider,
  Viewport: ToastViewport,
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Close: ToastClose,
  Action: ToastAction,
  useToast: BaseToast.useToastManager,
  createToastManager,
};

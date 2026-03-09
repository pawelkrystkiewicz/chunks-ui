"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export type ToastProviderProps = ComponentProps<typeof BaseToast.Provider>;
export type ToastViewportProps = ComponentProps<typeof BaseToast.Viewport>;
export type ToastRootProps = ComponentProps<typeof BaseToast.Root>;
export type ToastTitleProps = ComponentProps<typeof BaseToast.Title>;
export type ToastDescriptionProps = ComponentProps<typeof BaseToast.Description>;
export type ToastCloseProps = ComponentProps<typeof BaseToast.Close>;
export type ToastActionProps = ComponentProps<typeof BaseToast.Action>;

function ToastViewport({ className, ...props }: ToastViewportProps) {
  const manager = BaseToast.useToastManager();

  return (
    <BaseToast.Viewport
      className={cn(
        "fixed right-4 bottom-4 z-toasts flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none",
        className,
      )}
      {...props}
    >
      {manager.toasts.map((toast) => (
        <ToastRoot key={toast.id} toast={toast}>
          {toast.title != null && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description != null && <ToastDescription>{toast.description}</ToastDescription>}
          {toast.actionProps != null && <ToastAction {...toast.actionProps} />}
          <ToastClose />
        </ToastRoot>
      ))}
    </BaseToast.Viewport>
  );
}

function ToastRoot({ className, ...props }: ToastRootProps) {
  return (
    <BaseToast.Root
      className={cn(
        "group relative flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-border bg-popover p-4 shadow-lg",
        "micro-interactions",
        "data-starting-style:translate-x-full data-starting-style:opacity-0",
        "data-ending-style:translate-x-full data-ending-style:opacity-0",
        "transition-[transform,opacity] duration-300 ease-out",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastTitleProps) {
  return <BaseToast.Title className={cn("font-semibold text-sm", className)} {...props} />;
}

function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return (
    <BaseToast.Description className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

function ToastClose({ className, ...props }: ToastCloseProps) {
  return (
    <BaseToast.Close
      className={cn(
        "micro-interactions absolute top-2 right-2 flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="14"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </BaseToast.Close>
  );
}

function ToastAction({ className, ...props }: ToastActionProps) {
  return (
    <BaseToast.Action
      className={cn(
        "micro-interactions mt-1 inline-flex h-7 items-center rounded-sm border border-border px-3 font-medium text-xs hover:bg-accent hover:text-accent-foreground",
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
};

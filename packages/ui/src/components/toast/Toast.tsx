"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { AlertTriangle, CheckCircle2, Info, type LucideIcon, X, XCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const createToastManager = BaseToast.createToastManager;

export type ToastProviderProps = ComponentProps<typeof BaseToast.Provider>;
export type ToastViewportProps = ComponentProps<typeof BaseToast.Viewport>;
export type ToastRootProps = ComponentProps<typeof BaseToast.Root>;
export type ToastTitleProps = ComponentProps<typeof BaseToast.Title>;
export type ToastDescriptionProps = ComponentProps<typeof BaseToast.Description>;
export type ToastCloseProps = ComponentProps<typeof BaseToast.Close>;
export type ToastActionProps = ComponentProps<typeof BaseToast.Action>;

type ToastType = "success" | "error" | "warning" | "info";

interface TypeStyle {
  icon: LucideIcon;
  accent: string;
  iconColor: string;
}

const TYPE_STYLES: Record<ToastType, TypeStyle> = {
  success: { icon: CheckCircle2, accent: "bg-success", iconColor: "text-success" },
  error: { icon: XCircle, accent: "bg-destructive", iconColor: "text-destructive" },
  warning: { icon: AlertTriangle, accent: "bg-warning", iconColor: "text-warning" },
  info: { icon: Info, accent: "bg-primary", iconColor: "text-primary" },
};

const DEFAULT_STYLE: TypeStyle = {
  icon: Info,
  accent: "bg-muted-foreground",
  iconColor: "text-muted-foreground",
};

function getTypeStyle(type: string | undefined): TypeStyle {
  if (type && type in TYPE_STYLES) {
    return TYPE_STYLES[type as ToastType];
  }
  return DEFAULT_STYLE;
}

function ToastViewport({ className, ...props }: ToastViewportProps) {
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
        const style = getTypeStyle(toast.type);
        const Icon = style.icon;
        return (
          <ToastRoot key={toast.id} toast={toast}>
            <span
              aria-hidden="true"
              className={cn("absolute inset-y-0 left-0 w-1", style.accent)}
            />
            <Icon
              aria-hidden="true"
              data-testid="toast-icon"
              className={cn("size-5 shrink-0 self-start", style.iconColor)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {toast.title != null && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description != null && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
              {toast.actionProps != null && <ToastAction {...toast.actionProps} />}
            </div>
            <ToastClose />
          </ToastRoot>
        );
      })}
    </BaseToast.Viewport>
  );
}

function ToastRoot({ className, toast, ...props }: ToastRootProps) {
  return (
    <BaseToast.Root
      toast={toast}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-popover p-4 pr-10 shadow-lg",
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
        "micro-interactions absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
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

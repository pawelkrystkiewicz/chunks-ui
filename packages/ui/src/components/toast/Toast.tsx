"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import type { HTMLProps } from "@base-ui/react/types";
import { type ComponentProps, type ComponentType, createContext, useContext } from "react";
import { cn, cnState } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";
import { useReducedMotion } from "../../lib/use-motion";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";
import { CloseIcon } from "../CloseIcon";
import { FOCUS_RING, RING_ANIMATION_CLASSES, TOAST_CONTENT_CLASS } from "../shared";
import { DEFAULT_TOAST_LABELS, type ToastLabels } from "./Toast.Labels";

/**
 * Per-toast slots added by chunks-ui on top of Base UI's `ToastObject`.
 * Pass any subset of these to `toast.add(...)` / `toast.promise(...)` /
 * `toast.update(...)`.
 *
 * All fields are intentionally additive and opinion-free — chunks-ui
 * stays out of the icon ecosystem and lets callers bring their own
 * icons, colors, per-type styling, and dismissal behaviour.
 */
export interface ToastStyleOptions {
  /**
   * Icon component rendered in the toast's leading slot. Receives a
   * `className` prop pre-populated with default sizing (`size-5
   * shrink-0 self-start`), merged with `iconClassName` if provided.
   * Pass a lucide/heroicons component directly, or a wrapper for
   * fully custom rendering.
   */
  icon?: ComponentType<{ className?: string }>;
  /**
   * Extra classes applied to the rendered `icon`. Use this for color
   * (e.g. `text-success-text`) without having to wrap the icon component.
   */
  iconClassName?: string;
  /**
   * Extra classes merged into `Toast.Root`'s className. Use this for
   * per-toast styling like accent bars, borders, or background tints
   * — typically driven off `type`.
   */
  className?: string;
  /**
   * When `true`, renders a close (×) button on this toast. Clicking it
   * dismisses the toast via Base UI's `Toast.Close`. Passing `onClose`
   * implicitly enables this, so you only need to set `dismissible` when
   * you want the button without a side-effect handler. `dismissible: false`
   * hides the button even when `onClose` is set.
   *
   * @default false
   */
  dismissible?: boolean;
  /**
   * Misspelled alias of `dismissible`.
   * @deprecated Use `dismissible`. Kept for compatibility; `dismissible` wins when both are set.
   */
  dissmissable?: boolean;
  /**
   * Called once when the toast closes, whichever way (close button, timeout, swipe, Escape with
   * focus inside the toast, `manager.close`). Passing this prop also implicitly renders the close
   * button (no need to also set `dismissible`).
   */
  onClose?: () => void;
  /**
   * Props for the built-in close button. `className` merges after the library classes;
   * `aria-label` overrides `labels.close`; `event.preventBaseUIHandler()` in `onClick` keeps
   * the toast open. Renders no button on its own: set `dismissible` or `onClose` to show it.
   */
  closeProps?: ToastCloseProps;
}

/**
 * Module augmentation: merge `ToastStyleOptions` into Base UI's
 * `ToastObject` interface so `add()`, `update()`, and `promise()` all
 * accept the chunks-ui per-toast fields at the top level.
 */
declare module "@base-ui/react/toast" {
  interface ToastObject<Data extends object> extends ToastStyleOptions {}
}

export const createToastManager = BaseToast.createToastManager;

export type ToastProviderProps = ComponentProps<typeof BaseToast.Provider>;
export type ToastViewportProps = ComponentProps<typeof BaseToast.Viewport> & {
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_TOAST_LABELS`. `aria-label` takes precedence over `labels.viewport`,
   * and a toast's `closeProps["aria-label"]` over `labels.close`.
   */
  labels?: Partial<ToastLabels>;
};
export type ToastRootProps = ComponentProps<typeof BaseToast.Root>;
export type ToastTitleProps = ComponentProps<typeof BaseToast.Title>;
export type ToastDescriptionProps = ComponentProps<typeof BaseToast.Description>;
export type ToastCloseProps = ComponentProps<typeof BaseToast.Close>;
export type ToastActionProps = ComponentProps<typeof BaseToast.Action>;

function ToastViewport({ className, labels, ...props }: ToastViewportProps) {
  const manager = BaseToast.useToastManager();
  const names = mergeLabels(DEFAULT_TOAST_LABELS, labels);

  return (
    <BaseToast.Viewport
      aria-label={names.viewport}
      className={cnState(
        "fixed end-4 bottom-4 z-toasts flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none",
        className,
      )}
      {...props}
    >
      {manager.toasts.map((toast) => {
        const Icon = toast.icon;
        // Canonical name is `dismissible`; `dissmissable` is a deprecated
        // alias kept for backwards compatibility. If both are set,
        // `dismissible` wins.
        const dismissible = toast.dismissible ?? toast.dissmissable;
        const { closeProps } = toast;
        return (
          <ToastRoot key={toast.id} toast={toast} className={toast.className}>
            {Icon && <Icon className={cn("size-5 shrink-0 self-start", toast.iconClassName)} />}
            <BaseToast.Content
              className={cn(TOAST_CONTENT_CLASS, "flex min-w-0 flex-1 flex-col gap-1")}
            >
              {toast.title != null && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description != null && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
              {toast.actionProps != null && (
                // Base UI's Toast.Action merges `toast.actionProps` itself, label and handlers
                // included: spreading them here too ran `onClick` twice. Only `className` is
                // passed, so it merges with the library classes and replaces a conflicting one.
                <ToastAction className={toast.actionProps.className} />
              )}
            </BaseToast.Content>
            {(dismissible ?? Boolean(toast.onClose)) && (
              // `aria-label` goes after the spread so `{ "aria-label": undefined }` falls back to
              // `labels.close` instead of clearing the label.
              <ToastClose {...closeProps} aria-label={closeProps?.["aria-label"] ?? names.close} />
            )}
          </ToastRoot>
        );
      })}
    </BaseToast.Viewport>
  );
}

/**
 * What Base UI aria-hides in a toast while leaving it in the tab order: the whole toast (high
 * priority, until keyboard focus enters the viewport), its close button alone (while the toasts
 * are collapsed), or nothing. Base UI also shows that button while it has focus; its tab stop
 * makes no difference then.
 */
const ToastHiddenContext = createContext<"toast" | "close" | null>(null);

function ToastRoot({ className, toast, render, ...props }: ToastRootProps) {
  const reduced = useReducedMotion();
  return (
    <BaseToast.Root
      toast={toast}
      // Base UI's default is down and right, whatever the direction. Left is the way off the
      // screen in RTL, and a swiped toast leaves the way it was swiped (below).
      swipeDirection={["down", "left", "right"]}
      className={cnState(
        "Toast",
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-sm border border-border bg-popover p-4 pe-10 shadow-lg",
        // Past the provider's `limit`, Base UI makes a toast inert: it takes no space until newer
        // ones close. The opt-in stack fades its own out in place (theme.css).
        "not-[.toast-stack]:data-limited:hidden",
        !reduced && [
          "micro-interactions",
          // In and out past the viewport's inline end. `:dir()` reads the toast's own direction,
          // `rtl:` would also match in an LTR section of an RTL page.
          "[--toast-slide-x:100%] [&:dir(rtl)]:[--toast-slide-x:-100%]",
          "data-starting-style:translate-x-(--toast-slide-x) data-starting-style:opacity-0",
          // A toast that leaves the limit gets no `data-starting-style`: it was `display: none`
          "starting:translate-x-(--toast-slide-x) starting:opacity-0",
          "data-ending-style:translate-x-(--toast-slide-x) data-ending-style:opacity-0",
          "data-[swipe-direction=left]:data-ending-style:-translate-x-full",
          "data-[swipe-direction=right]:data-ending-style:translate-x-full",
          "data-[swipe-direction=down]:data-ending-style:translate-x-0 data-[swipe-direction=down]:data-ending-style:translate-y-full",
          "transition-[translate,opacity] duration-300 ease-out",
        ],
        className,
      )}
      {...props}
      render={(rootProps, state) => (
        <ToastRootElement {...rootProps} state={state} render={render} />
      )}
    />
  );
}

// ponytail: Base UI 1.9 aria-hides a high-priority toast and a collapsed toast's close button but
// leaves both in the tab order. No state or data attribute carries the toast's aria-hidden, so the
// root reads it from Base UI's render props, and the root, Toast.Action and Toast.Close leave the
// tab order while hidden. The root and Toast.Action go once mui/base-ui#5659 is fixed (the
// high-priority toast, aria-hidden but focusable); Toast.Close goes once mui/base-ui#5731 stops
// aria-hiding it (`!expanded && !hasFocus`). A focusable element of yours inside the toast keeps
// its tab stop.
function ToastRootElement({
  state,
  render,
  ref,
  ...props
}: HTMLProps & { state: BaseToast.Root.State; render: PartRenderProp<BaseToast.Root.State> }) {
  const hidden = props["aria-hidden"] === true;
  const element = useRenderPart(
    render,
    state,
    ref ?? null,
    hidden ? { ...props, tabIndex: -1 } : props,
    "div",
  );
  return (
    <ToastHiddenContext.Provider value={hidden ? "toast" : state.expanded ? null : "close"}>
      {element}
    </ToastHiddenContext.Provider>
  );
}

function ToastTitle({ className, ...props }: ToastTitleProps) {
  return (
    <BaseToast.Title
      className={cnState("font-semibold text-foreground text-sm leading-tight", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return (
    <BaseToast.Description
      className={cnState("text-muted-foreground text-sm leading-snug", className)}
      {...props}
    />
  );
}

// An icon button: it keeps its aria-label whatever its content. Children replace the X; with
// `render` and no children, there is no X: the render element draws its own (#581).
function ToastClose({ className, children, ...props }: ToastCloseProps) {
  const hidden = useContext(ToastHiddenContext) !== null;
  return (
    <BaseToast.Close
      aria-label={DEFAULT_TOAST_LABELS.close}
      className={cnState(
        ...RING_ANIMATION_CLASSES,
        "absolute end-2 top-5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
        FOCUS_RING,
        className,
      )}
      {...props}
      // Only while hidden: `tabIndex: undefined` would also override Base UI's `tabIndex: 0`, and
      // take a `render` element that is not a button out of the tab order
      {...(hidden && { tabIndex: -1 })}
    >
      {children == null && !props.render ? <CloseIcon className="size-3.5" /> : children}
    </BaseToast.Close>
  );
}

function ToastAction({ className, ...props }: ToastActionProps) {
  const hidden = useContext(ToastHiddenContext) === "toast";
  return (
    <BaseToast.Action
      className={cnState(
        ...RING_ANIMATION_CLASSES,
        "mt-1 inline-flex h-7 w-fit items-center rounded-md border border-border px-3 font-medium text-xs hover:bg-accent hover:text-accent-foreground",
        FOCUS_RING,
        className,
      )}
      {...props}
      {...(hidden && { tabIndex: -1 })}
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

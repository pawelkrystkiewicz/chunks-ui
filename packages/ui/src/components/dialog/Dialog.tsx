"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  type ComponentProps,
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { cn, cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { createPopupRenderer } from "../../lib/PopupMotion";
import { PortalContainerProvider, usePortalContainer } from "../../lib/portal-container";
import { useLoadedMotion, useReducedMotion } from "../../lib/use-motion";
import { RING_TRANSITION, RING_TRANSITION_MOTION } from "../shared";

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
export type DialogBodyProps = ComponentProps<"section">;
export type DialogDescriptionProps = ComponentProps<typeof BaseDialog.Description>;
export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

/** The id of the Title mounted in this Popup, which names the Body, and its setter */
const TitleIdContext = createContext<{
  titleId?: string;
  setTitleId?: Dispatch<SetStateAction<string | undefined>>;
}>({});

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

function DialogPopup({ className, children, ...props }: DialogPopupProps) {
  const [titleId, setTitleId] = useState<string>();
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
        // A 1rem gutter on each side at any width, so the ring (4px outside the edge) stays on
        // the page; `max-w-*` in className replaces the cap (tailwind-merge)
        "fixed top-1/2 left-1/2 w-full max-w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2",
        "rounded-xl border border-border bg-background p-6 shadow-lg",
        // The popup takes focus when nothing inside is tabbable or `initialFocus` points at it
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
        // With a Body, the parts before and after it keep their height and only the Body scrolls
        "has-[>.DialogBody]:flex has-[>.DialogBody]:flex-col",
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
      <TitleIdContext.Provider value={{ titleId, setTitleId }}>{children}</TitleIdContext.Provider>
    </BaseDialog.Popup>
  );
}

function DialogTitle({ className, id: idProp, ...props }: DialogTitleProps) {
  const fallbackId = useId();
  const id = idProp ?? fallbackId;
  const { setTitleId } = useContext(TitleIdContext);
  // A layout effect, like Base UI's own title id: the Body is named before focus moves to it
  useLayoutEffect(() => {
    setTitleId?.(id);
    // Clear only our own id, so another Title still mounted in this Popup keeps naming the Body
    return () => setTitleId?.((current) => (current === id ? undefined : current));
  }, [id, setTitleId]);

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

/**
 * The scrolling middle of a tall dialog, between the Title and the actions. With a Body as its
 * child, the Popup is a flex column: the other children keep their height and only the Body
 * scrolls. The Body is a tab stop, so the keyboard can scroll it, and a region the Title names
 * (a named `<section>`).
 */
function DialogBody({ className, ...props }: DialogBodyProps) {
  const { titleId } = useContext(TitleIdContext);
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the keyboard scrolls a scroll container only once it has the focus
      tabIndex={0}
      aria-labelledby={props["aria-label"] ? undefined : titleId}
      className={cn(
        // The -m-1 p-1 gutter keeps the focus rings of full-width fields inside the scroll box, without moving them
        "DialogBody -m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        RING_TRANSITION,
        className,
      )}
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
  Body: DialogBody,
  Close: BaseDialog.Close,
};

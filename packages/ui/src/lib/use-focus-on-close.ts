"use client";

import { type Ref, type RefCallback, type RefObject, useLayoutEffect, useState } from "react";
import { useMergedRef } from "./use-merged-ref";

/** A popup's trigger and the last close Base UI went ahead with, shared by its Root and Popup */
export type CloseFocus = {
  trigger: RefObject<HTMLElement | null>;
  close: RefObject<{ event: Event; reason: string } | undefined>;
};

type OpenChangeDetails = {
  event: Event;
  reason: string;
  trigger?: Element | undefined;
  isCanceled: boolean;
};

/**
 * For a popup's Root: the state its Popup's `useFocusOnClose` reads, and the `onOpenChange` to
 * give Base UI's Root. The consumer's handler runs first. An open notes the trigger it came from;
 * a close that is not cancelled keeps its event until the end of its task, as a controlled parent
 * may ignore it.
 */
export function useCloseFocusRoot<Details extends OpenChangeDetails>(
  onOpenChange: ((open: boolean, details: Details) => void) | undefined,
) {
  const [closeFocus] = useState<CloseFocus>(() => ({
    trigger: { current: null },
    close: { current: undefined },
  }));
  const handleOpenChange = (open: boolean, details: Details) => {
    onOpenChange?.(open, details);
    if (details.isCanceled) return;
    if (open) {
      // A button, or the trigger's render element.
      // ponytail: a programmatic open keeps the last trigger, and a hover-opened Menu closed from
      // the keyboard gets it too, where Base UI's return at the unmount prefers the element focused
      // before the open. Accepted: the trigger is where APG returns focus.
      if (details.trigger) closeFocus.trigger.current = details.trigger as HTMLElement;
      return;
    }
    const close = { event: details.event, reason: details.reason };
    closeFocus.close.current = close;
    // ponytail: a parent that closes after the task (an await, a transition) loses the event, so
    // its close counts as one by the prop: focus inside goes to the trigger. Accepted.
    setTimeout(() => {
      if (closeFocus.close.current === close) closeFocus.close.current = undefined;
    });
  };
  return [closeFocus, handleOpenChange] as const;
}

type FocusOnCloseOptions = {
  /** The Popup's `finalFocus`: only unset or `true` hands focus over */
  finalFocus?: unknown;
  /** Where focus counts as inside, when it is more than the popup (a menu with its submenus) */
  scope?: HTMLElement | null;
  /** Whether this popup hands focus over at all; a stable function */
  when?: (popup: HTMLElement) => boolean;
};

/**
 * A popup's ref that moves focus to the trigger as the popup starts to close (`data-closed`), if
 * focus is still inside it. Base UI returns focus only at the unmount, after the exit, so a Tab
 * during the exit went to a focus guard, then <body>. It does nothing without `closeFocus`.
 *
 * ponytail: works around Base UI 1.9 returning focus only at the unmount; remove it once
 * mui/base-ui#5537 (or its successor), which returns focus as `open` turns false, ships.
 */
export function useFocusOnClose<T extends HTMLElement>(
  ref: Ref<T> | undefined,
  closeFocus: CloseFocus | null,
  { finalFocus, scope, when }: FocusOnCloseOptions = {},
): RefCallback<T> {
  const [popup, setPopup] = useState<T | null>(null);
  const defaultFinalFocus = finalFocus === undefined || finalFocus === true;
  useLayoutEffect(() => {
    if (!popup || !closeFocus || !defaultFinalFocus) return;
    const inside = scope ?? popup;
    const doc = popup.ownerDocument;
    const root = popup.getRootNode() as Document | ShadowRoot;
    // In WebKit, Base UI blurs a text field before `data-closed`: <body> then counts as inside
    let leftForNowhere = false;
    const onFocusOut = (event: FocusEvent) => {
      leftForNowhere = event.relatedTarget === null;
    };
    const onFocusIn = () => {
      leftForNowhere = false;
    };
    const focusInside = () =>
      inside.contains(root.activeElement) || (leftForNowhere && doc.activeElement === doc.body);
    const closing = () => popup.hasAttribute("data-closed") && (when?.(popup) ?? true);
    const stopWaiting = () => {
      doc.removeEventListener("keypress", handOff, true);
      doc.removeEventListener("keyup", handOff, true);
    };
    // Checks again after a wait: the popup may have reopened.
    // ponytail: a pick that opens a Dialog gives the trigger focus for a frame, until the Dialog
    // takes it (its focus and blur handlers fire). Accepted for now.
    const handOff = () => {
      stopWaiting();
      if (closing() && focusInside()) closeFocus.trigger.current?.focus({ preventScroll: true });
    };
    const observer = new MutationObserver(() => {
      if (!closing()) return;
      const close = closeFocus.close.current;
      closeFocus.close.current = undefined;
      const event = close?.event;
      // A mouse or pen press closes it before the browser moves focus to what was pressed, and a
      // touch outside (a tap or a scroll) would scroll the page to the trigger where `preventScroll`
      // is unsupported: leave focus to the browser and Base UI, not through the trigger (its focus
      // and blur handlers would fire). A hover close keeps Base UI's choice not to return focus.
      if (event?.type === "pointerdown" || event?.type === "mousedown") return;
      if (close?.reason === "outside-press" && event?.type !== "click") return;
      if (close?.reason === "trigger-hover") return;
      // Enter with nothing highlighted is not default-prevented: its keypress would click the
      // trigger and reopen the popup. A click made by Enter or Space (no click count) still has its
      // keyup to come, which a browser may turn into a click on the trigger. Wait for either.
      const keyClick = event?.type === "click" && "detail" in event && event.detail === 0;
      if ((event?.type === "keydown" && !event.defaultPrevented) || keyClick) {
        doc.addEventListener("keypress", handOff, true);
        doc.addEventListener("keyup", handOff, true);
      } else {
        handOff();
      }
    });
    observer.observe(popup, { attributeFilter: ["data-closed"] });
    inside.addEventListener("focusout", onFocusOut);
    inside.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      inside.removeEventListener("focusout", onFocusOut);
      inside.removeEventListener("focusin", onFocusIn);
      stopWaiting();
    };
  }, [popup, defaultFinalFocus, closeFocus, scope, when]);
  return useMergedRef(setPopup, ref);
}

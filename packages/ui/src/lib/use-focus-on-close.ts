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
      // before the open. Accepted: the trigger is where APG returns focus. Until an open carries a
      // trigger (`defaultOpen`, `open` true at mount, `handle.open()` without one) there is none,
      // and the popup hands nothing over: Base UI's return at the unmount stays.
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
    // Whether a key closed it: the trigger then shows its ring, as after Base UI's return
    let byKey = false;
    const stopWaiting = () => {
      doc.removeEventListener("keydown", onNextKeyDown, true);
      doc.removeEventListener("keypress", handOff, true);
      doc.removeEventListener("keyup", handOff, true);
    };
    // Checks again after a wait: the popup may have reopened.
    // ponytail: a pick that opens a Dialog gives the trigger focus for a frame, until the Dialog
    // takes it (its focus and blur handlers fire). Accepted for now.
    const handOff = () => {
      stopWaiting();
      if (!closing() || !focusInside()) return;
      // `focusVisible`, which lib.dom lacks
      const options = { preventScroll: true, ...(byKey && { focusVisible: true }) };
      closeFocus.trigger.current?.focus(options as FocusOptions);
    };
    // A held key repeats its keydown: only a new key ends the wait
    const onNextKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat) handOff();
    };
    const observer = new MutationObserver(() => {
      if (!closing()) return;
      const close = closeFocus.close.current;
      closeFocus.close.current = undefined;
      const event = close?.event;
      // A mouse or pen press closes it before the browser moves focus to what was pressed, and a
      // touch outside (a scroll, or a tap, which closes a Combobox on its click) would scroll the
      // page to the trigger where `preventScroll` is unsupported: leave focus to the browser and
      // Base UI, not through the trigger (its focus and blur handlers would fire). A hover close
      // keeps Base UI's choice not to return focus.
      if (event?.type === "pointerdown" || event?.type === "mousedown") return;
      const touch = event !== undefined && "pointerType" in event && event.pointerType === "touch";
      if (close?.reason === "outside-press" && (event?.type !== "click" || touch)) return;
      if (close?.reason === "trigger-hover") return;
      // Enter with nothing highlighted is not default-prevented: its keypress would click the
      // trigger and reopen the popup. After a click made by a key (no click count) that key's keyup
      // may be to come (a Base UI item clicks on the keydown), and a browser may turn it into a
      // click on the trigger. So wait for the keypress or the keyup, or for the next key's keydown:
      // a native button's Space clicks on its keyup, and with key rollover the Tab goes down before
      // Enter comes up. The Tab then leaves from the trigger. Any key's keypress or keyup ends the
      // wait, not only the closing key's: harmless, as the hazard is that key's own keypress, which
      // follows its keydown at once.
      // ponytail: an assistive technology's click or a script's `.click()` has no click count too;
      // its close waits for a key that may not come, and Base UI's return at the unmount moves
      // focus instead. Accepted.
      const keyClick = event?.type === "click" && "detail" in event && event.detail === 0;
      byKey = keyClick || event?.type.startsWith("key") === true;
      if ((event?.type === "keydown" && !event.defaultPrevented) || keyClick) {
        doc.addEventListener("keydown", onNextKeyDown, true);
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

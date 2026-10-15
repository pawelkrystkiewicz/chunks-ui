"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  type Dispatch,
  isValidElement,
  type ReactNode,
  type SetStateAction,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { cn } from "../../lib/cn";
import { FOCUS_RING, RING_TRANSITION } from "../shared";

/**
 * The props of `Dialog.Body` and `Drawer.Body`: a `<section>`'s, and Base UI's `render`, which
 * replaces the section with another element that keeps the scroll region and its name, such as
 * `render={<form id="new-task" onSubmit={…} />}` for a form that a button outside the Body submits.
 *
 * A name other than the Title's goes on the Body, or on the `render` element. With a function
 * `render`, put it on the Body: the Body reads the name from its own props and from a `render`
 * element, not from what a function returns, so the Title's `aria-labelledby` would win over an
 * `aria-label` set inside the function. A `render` element needs a role that takes a name (`form`,
 * or `role="region"`): a name on a generic element, such as a `<div>`, is not exposed.
 */
export type OverlayBodyProps = useRender.ComponentProps<"section">;

/** The id of the Title mounted in this Popup, which names the Body, and its setter */
const TitleIdContext = createContext<{
  titleId?: string;
  setTitleId?: Dispatch<SetStateAction<string | undefined>>;
}>({});

/** Holds the id of the Title for the Body. A Popup wraps its children in it. */
export function TitleIdProvider({ children }: { children: ReactNode }) {
  const [titleId, setTitleId] = useState<string>();
  // One value per id, so a render of the Popup does not render the Body and the Title again
  const value = useMemo(() => ({ titleId, setTitleId }), [titleId]);
  return <TitleIdContext.Provider value={value}>{children}</TitleIdContext.Provider>;
}

/** The Title's id, `idProp` or a generated one, registered with the Popup so the Body is named by it */
export function useTitleId(idProp?: string) {
  const fallbackId = useId();
  const id = idProp ?? fallbackId;
  const { setTitleId } = useContext(TitleIdContext);
  // A layout effect, like Base UI's own title id: the Body is named before focus moves to it
  useLayoutEffect(() => {
    setTitleId?.(id);
    // Clear only our own id, so another Title still mounted in this Popup keeps naming the Body
    return () => setTitleId?.((current) => (current === id ? undefined : current));
  }, [id, setTitleId]);
  return id;
}

/** Whether the element scrolls: its content is taller or wider than its box */
const scrolls = (node: HTMLElement) =>
  node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;

/**
 * Whether the Body has its node and its content fits, measured in layout effects: Base UI's initial
 * focus waits a microtask for them to set `tabIndex`. A popup shown or hidden (a `keepMounted`
 * popup, whose Body mounts with no box) is seen by a mutation observer, whose microtask is queued
 * in React's mutation phase, before the one Base UI queues in its layout effect, so a `flushSync`
 * there lands first. Returns whether it fits and the ref that gives the hook the node.
 */
function useFits(): [fits: boolean, ref: (node: HTMLElement | null) => void] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [overflows, setOverflows] = useState(false);

  // Once per node: measure, then again when the box resizes, a child resizes on its own, the
  // content changes, or the popup is shown
  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => setOverflows(scrolls(node));
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    // The node and each child: in a side drawer the Body is `flex-1`, so a child that grows on its
    // own (an image that loads, a list that fills in) changes the child's box, not the Body's
    const observe = () => {
      if (!resize) return;
      resize.disconnect();
      resize.observe(node);
      for (const child of node.children) resize.observe(child);
    };
    observe();
    // Content a child rendered without a render of the Body: observe the new children and measure.
    // Committed now, before Base UI's initial focus reads `tabIndex` in the next microtask
    const mutation = new MutationObserver(() => {
      observe();
      flushSync(measure);
    });
    mutation.observe(node, { childList: true, subtree: true, characterData: true });
    // A `keepMounted` popup is `hidden` until it opens, and the Body is its direct child
    if (node.parentElement) {
      mutation.observe(node.parentElement, { attributes: true, attributeFilter: ["hidden"] });
    }
    measure();
    return () => {
      resize?.disconnect();
      mutation.disconnect();
    };
  }, [node]);

  return [node !== null && !overflows, setNode];
}

/**
 * The scrolling middle of a tall dialog or drawer, between the Title and the actions. With a Body
 * as its child, the Popup is a flex column: the other children keep their height and only the
 * Body scrolls. It is a region the Title names (a named `<section>`), or the element `render`
 * gives it. A name of its own goes on the Body, or on a `render` element; see
 * {@link OverlayBodyProps}.
 */
export function OverlayBody({ className, render, ref: forwardedRef, ...props }: OverlayBodyProps) {
  const { titleId } = useContext(TitleIdContext);
  const [fits, ref] = useFits();
  // A name on the Body, or on the element `render` gives it (its props are merged over these),
  // wins over the Title: `aria-labelledby` would take precedence over its `aria-label` otherwise
  const renderProps = isValidElement<Record<string, unknown>>(render) ? render.props : undefined;
  const named =
    props["aria-label"] ??
    props["aria-labelledby"] ??
    renderProps?.["aria-label"] ??
    renderProps?.["aria-labelledby"];
  // Base UI's render: an element is cloned with these props, a function gets them
  return useRender({
    defaultTagName: "section",
    render,
    ref: [ref, forwardedRef ?? null],
    props: {
      // The keyboard scrolls a scroll container only once it has the focus. One that fits is skipped
      // by Tab, yet stays focusable: a focused Body whose content shrinks to fit keeps the focus.
      // Fails closed: with no node (the server render, the first client render, or a `ref` that
      // never arrives) the Body is a tab stop, so it never loses its keyboard scrolling
      tabIndex: fits ? -1 : 0,
      "aria-labelledby": named ? undefined : titleId,
      className: cn(
        // The class the Popup finds the Body by (`has-[>.OverlayBody]`)
        "OverlayBody",
        // The -m-1 p-1 gutter keeps the focus rings of full-width fields inside the scroll box, without moving them
        "-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1",
        FOCUS_RING,
        RING_TRANSITION,
        className,
      ),
      ...props,
    },
  });
}

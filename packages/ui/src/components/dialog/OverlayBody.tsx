"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { FOCUS_RING, RING_TRANSITION } from "../shared";

/**
 * The props of `Dialog.Body` and `Drawer.Body`: a `<section>`'s, and Base UI's `render`, which
 * replaces the section with another element that keeps the scroll region and its name, such as
 * `render={<form id="new-task" onSubmit={…} />}` for a form that a button outside the Body submits.
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

/** Whether the element scrolls: its content is taller than its box */
const scrolls = (node: HTMLElement) => node.scrollHeight > node.clientHeight;

/**
 * Whether the Body scrolls. Measured after every render of the Body, whenever its box or a child's
 * box resizes, and whenever its content changes. Layout effects, so Base UI's initial focus, which
 * waits a microtask for layout effects to set `tabIndex`, sees the result. Returns the state and
 * the ref that gives the hook the node; the observers are created once per node, not once per
 * render.
 */
function useOverflows(): [overflows: boolean, ref: (node: HTMLElement | null) => void] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [overflows, setOverflows] = useState(false);

  // After every render: the content may have changed
  useLayoutEffect(() => {
    if (node) setOverflows(scrolls(node));
  });

  // Once per node: the box resizes, a child resizes on its own, or the content changes
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
    if (typeof MutationObserver === "undefined") return () => resize?.disconnect();
    // Content a child rendered without a render of the Body: measure, and observe the new children
    const mutation = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList" && record.target === node)) {
        observe();
      }
      measure();
    });
    mutation.observe(node, { childList: true, subtree: true, characterData: true });
    return () => {
      resize?.disconnect();
      mutation.disconnect();
    };
  }, [node]);

  return [overflows, setNode];
}

/**
 * The scrolling middle of a tall dialog or drawer, between the Title and the actions. With a Body
 * as its child, the Popup is a flex column: the other children keep their height and only the
 * Body scrolls. While its content overflows, the Body is a tab stop, so the keyboard can scroll
 * it; a Body that fits is skipped. It is a region the Title names (a named `<section>`), or the
 * element `render` gives it. `marker` is the class the Popup finds the Body by (`has-[>.marker]`).
 */
export function OverlayBody({
  marker,
  className,
  render,
  ref: forwardedRef,
  ...props
}: OverlayBodyProps & { marker: string }) {
  const { titleId } = useContext(TitleIdContext);
  const [overflows, ref] = useOverflows();
  // Base UI's render: an element is cloned with these props, a function gets them
  return useRender({
    defaultTagName: "section",
    render,
    ref: [ref, forwardedRef ?? null],
    props: {
      // The keyboard scrolls a scroll container only once it has the focus; one that fits is skipped
      tabIndex: overflows ? 0 : undefined,
      "aria-labelledby": props["aria-label"] ? undefined : titleId,
      className: cn(
        // The -m-1 p-1 gutter keeps the focus rings of full-width fields inside the scroll box, without moving them
        marker,
        "-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1",
        FOCUS_RING,
        RING_TRANSITION,
        className,
      ),
      ...props,
    },
  });
}

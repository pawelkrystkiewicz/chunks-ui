"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
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
  return (
    <TitleIdContext.Provider value={{ titleId, setTitleId }}>{children}</TitleIdContext.Provider>
  );
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

/**
 * Whether the element scrolls: its content is taller than its box. Measured after every render,
 * for a change of content, and whenever the box resizes. A layout effect, so Base UI's initial
 * focus, which waits a microtask for layout effects to set `tabIndex`, sees the result.
 */
function useOverflows(ref: RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setOverflows(node.scrollHeight > node.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  });
  return overflows;
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
  const ref = useRef<HTMLElement>(null);
  const overflows = useOverflows(ref);
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

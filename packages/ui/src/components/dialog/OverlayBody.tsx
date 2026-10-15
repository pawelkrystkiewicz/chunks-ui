"use client";

import {
  type ComponentProps,
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { FOCUS_RING, RING_TRANSITION } from "../shared";

/** The props of `Dialog.Body` and `Drawer.Body`: a `<section>`'s */
export type OverlayBodyProps = ComponentProps<"section">;

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
 * The scrolling middle of a tall dialog or drawer, between the Title and the actions. With a Body
 * as its child, the Popup is a flex column: the other children keep their height and only the
 * Body scrolls. The Body is a tab stop, so the keyboard can scroll it, and a region the Title
 * names (a named `<section>`). `marker` is the class the Popup finds the Body by (`has-[>.marker]`).
 */
export function OverlayBody({
  marker,
  className,
  ...props
}: OverlayBodyProps & { marker: string }) {
  const { titleId } = useContext(TitleIdContext);
  return (
    <section
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the keyboard scrolls a scroll container only once it has the focus
      tabIndex={0}
      aria-labelledby={props["aria-label"] ? undefined : titleId}
      className={cn(
        // The -m-1 p-1 gutter keeps the focus rings of full-width fields inside the scroll box, without moving them
        marker,
        "-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1",
        FOCUS_RING,
        RING_TRANSITION,
        className,
      )}
      {...props}
    />
  );
}

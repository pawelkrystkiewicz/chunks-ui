"use client";

import {
  createContext,
  type Ref,
  type RefCallback,
  useCallback,
  useContext,
  useState,
} from "react";

const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * Renders every chunks-ui popup below it, and the `NumberField.ScrubAreaCursor`, into `value`
 * instead of `document.body`, e.g. to keep them inside an element that scopes theme variables.
 * `null` holds popups back until the element exists; the scrub cursor stays in `document.body`
 * until then, and so does a cursor with no provider, since it exists only during a scrub.
 * Inside `Dialog`, `Drawer`, `Popover` and `Combobox` content the value is that popup's own
 * portal node (see `usePortalNode`), so what opens there stacks above it.
 */
export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

/**
 * For a popup's Portal: the ref to give Base UI's Portal, and the portal node it renders, for the
 * `PortalContainerProvider` around the Portal's children. Base UI gives a nested popup with no
 * `container` the parent's portal node anyway, but the scrub cursor has no such fallback, so the
 * node is provided outright. It is held in state so the provider re-renders once the node exists;
 * until then it is `null`. The consumer's `ref` on the Portal is merged in.
 */
export function usePortalNode(
  consumer?: Ref<HTMLDivElement>,
): [ref: RefCallback<HTMLDivElement>, node: HTMLElement | null] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const ref = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      setNode(el);
      if (typeof consumer === "function") {
        const cleanup = consumer(el);
        // A React 19 callback ref may return a cleanup, run on detach instead of ref(null)
        if (typeof cleanup === "function") {
          return () => {
            setNode(null);
            cleanup();
          };
        }
      } else if (consumer) {
        consumer.current = el;
      }
    },
    [consumer],
  );
  return [ref, node];
}

"use client";

import { createContext, useContext } from "react";

const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * Renders every chunks-ui popup below it, and the `NumberField.ScrubAreaCursor`, into `value`
 * instead of `document.body`, e.g. to keep them inside an element that scopes theme variables.
 * `null` holds popups back until the element exists; the scrub cursor stays in `document.body`
 * until then, and so does a cursor with no provider, since it exists only during a scrub.
 */
export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

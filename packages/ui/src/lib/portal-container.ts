"use client";

import { createContext, useContext } from "react";

const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * Renders every chunks-ui popup below it into `value` instead of `document.body`,
 * e.g. to keep popups inside an element that scopes theme variables.
 * `null` holds popups back until the element exists.
 */
export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

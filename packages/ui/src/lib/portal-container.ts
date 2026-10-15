"use client";

import { createContext, useContext } from "react";

const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * Renders every chunks-ui popup below it, and the `NumberField.ScrubAreaCursor`, into `value`
 * instead of `document.body`, e.g. to keep them inside an element that scopes theme variables.
 * `null` holds popups back until the element exists; the scrub cursor stays in `document.body`
 * until then, and so does a cursor with no provider, since it exists only during a scrub.
 * Inside Dialog, Drawer, Popover and Combobox content the provider is reset to `undefined`, so a
 * scrub cursor there also renders in `document.body`. `value` must not establish a containing
 * block (no `transform`, `translate`, `rotate`, `scale`, `filter`, `backdrop-filter`,
 * `perspective`, `contain`, `content-visibility`, `will-change` or `container-type`): Base UI
 * positions the cursor with viewport coordinates (`position: fixed` and `translate3d`).
 */
export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

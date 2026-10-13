import { useLayoutEffect, useRef, useState } from "react";
import { arrowPaddingIn } from "./popup-arrow";

/**
 * The ref for a popup's `Positioner` and the default `arrowPadding` read from it: `undefined` on
 * the first render and wherever `arrowPaddingIn` has none, which leaves Base UI's own default.
 */
export function useArrowPadding() {
  const positioner = useRef<HTMLDivElement>(null);
  const [padding, setPadding] = useState<number>();
  // Once the popup and its arrow are in the page, before the first paint
  useLayoutEffect(() => {
    if (positioner.current) setPadding(arrowPaddingIn(positioner.current));
  }, []);
  return [positioner, padding] as const;
}

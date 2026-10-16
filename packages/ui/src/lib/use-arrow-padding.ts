"use client";

import { createContext, useContext, useLayoutEffect, useReducer, useRef, useState } from "react";
import { arrowPaddingIn } from "./arrow-padding";

const ArrowChangeContext = createContext<() => void>(() => {});

/**
 * Around a popup's `Positioner`, with the callback from `useArrowPadding`: an Arrow part inside
 * (`useArrowChange`) calls it when it mounts or unmounts.
 */
export const ArrowChangeProvider = ArrowChangeContext.Provider;

/**
 * The ref for a popup's `Positioner`, the default `arrowPadding` read from it, and the callback for
 * `ArrowChangeProvider`. The padding is `undefined` on the first render and wherever
 * `arrowPaddingIn` has none, which leaves Base UI's own default. It is read when the positioner
 * mounts, and again after each Arrow that mounts or unmounts inside it.
 */
export function useArrowPadding() {
  const positioner = useRef<HTMLDivElement>(null);
  const [padding, setPadding] = useState<number>();
  const [arrowChanges, arrowChanged] = useReducer((count: number) => count + 1, 0);
  // Once the popup and its arrow are in the page, or the arrow is out of it, before the next paint
  // biome-ignore lint/correctness/useExhaustiveDependencies: read again after each Arrow change
  useLayoutEffect(() => {
    if (positioner.current) setPadding(arrowPaddingIn(positioner.current));
  }, [arrowChanges]);
  return [positioner, padding, arrowChanged] as const;
}

/**
 * For an Arrow part: the positioner around it reads its default `arrowPadding` again once the arrow
 * mounts, and once it unmounts. Its layout effect runs before the arrow leaves the page, so it only
 * calls back, and the positioner reads after the commit.
 */
export function useArrowChange() {
  const arrowChanged = useContext(ArrowChangeContext);
  useLayoutEffect(() => {
    arrowChanged();
    return arrowChanged;
  }, [arrowChanged]);
}

"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { cn } from "../../lib/cn";
import { cssVarName, type PanelSize, parseSize } from "../../lib/resizable";
import { useMergedRef } from "../../lib/use-merged-ref";
import { useGroupContext, warnOnce } from "./context";
import { resizablePanelClasses } from "./Resizable.Variants";

export type ResizablePanelSize = PanelSize;

export type ResizablePanelProps = Omit<ComponentProps<"div">, "id"> & {
  /**
   * Names the panel in a layout and is its DOM `id`, so keep it stable and unique in the page.
   * `aria-controls` on the handles points at it.
   */
  id: string;
  /**
   * The starting size. A number is px; `"30%"` and `"240px"` carry their unit. The unit also
   * decides what this panel's value in a layout means. A % panel without one shares what the
   * others leave.
   */
  defaultSize?: ResizablePanelSize;
  /** The least the panel can be. Same forms as `defaultSize`; a % is of the group. */
  minSize?: ResizablePanelSize;
  /** The most the panel can be. Same forms as `defaultSize`; a % is of the group. */
  maxSize?: ResizablePanelSize;
};

/** What the panel's size is before the group has written its variable: the server's size too */
function fallbackOf(initial: number | undefined, declared: number | undefined, percent: boolean) {
  if (typeof initial === "number" && Number.isFinite(initial) && initial >= 0) return initial;
  return declared ?? (percent ? 1 : 0);
}

/**
 * One pane of a group. Its size is the CSS variable the group keeps for its `id`, with the panel's
 * own start size as the fallback, so the server's HTML already has the layout.
 */
export function ResizablePanel({
  id: idProp,
  defaultSize,
  minSize,
  maxSize,
  className,
  style,
  ref,
  ...props
}: ResizablePanelProps) {
  const group = useGroupContext("Resizable.Panel");
  const generated = useId();
  if (!idProp)
    warnOnce("Resizable.Panel needs a stable `id`: a layout can't name a panel without one");
  const id = idProp || generated;

  const elRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(elRef, ref);
  const { registerPanel } = group;
  useLayoutEffect(() => {
    const el = elRef.current;
    return el ? registerPanel({ id, defaultSize, minSize, maxSize }, el) : undefined;
  }, [registerPanel, id, defaultSize, minSize, maxSize]);

  const declared = parseSize(defaultSize);
  const percent = (declared?.unit ?? "%") === "%";
  const size = fallbackOf(group.initialLayout?.[id], declared?.value, percent);
  const variable = cssVarName(id);
  const flex = percent ? `var(${variable}, ${size}) 1 0%` : `0 0 var(${variable}, ${size}px)`;

  return (
    <div
      {...props}
      id={id}
      ref={mergedRef}
      style={{ flex, ...style }}
      className={cn(resizablePanelClasses, className)}
    />
  );
}

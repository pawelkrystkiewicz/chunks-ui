"use client";

import {
  cn,
  cssVarName,
  isPanelId,
  type PanelSize,
  parseSize,
  resizablePanelClasses,
  sizeIn,
} from "chunks-ui-core";
import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { useMergedRef } from "../../lib/use-merged-ref";
import { isDevelopment, useGroupContext, warnOnce } from "./context";

export type ResizablePanelSize = PanelSize;

export type ResizablePanelProps = Omit<ComponentProps<"div">, "id"> & {
  /**
   * Names the panel in a layout, so keep it stable and unique within its group. It is the layout
   * key only: the DOM `id` is generated, so two groups on a page can reuse a name. The panel
   * carries it as `data-panel-id`.
   */
  id: string;
  /**
   * The starting size. A number is px; `"30%"` and `"240px"` carry their unit. The unit also
   * decides what this panel's value in a layout means. A % panel without one shares what the
   * others leave.
   * @remarks `number | `${number}%` | `${number}px``
   */
  defaultSize?: ResizablePanelSize;
  /**
   * The least the panel can be. Same forms as `defaultSize`; a % is of the group.
   * @remarks `number | `${number}%` | `${number}px``
   */
  minSize?: ResizablePanelSize;
  /**
   * The most the panel can be. Same forms as `defaultSize`; a % is of the group.
   * @remarks `number | `${number}%` | `${number}px``
   */
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
  // An id a layout can't hold (none, or `__proto__`) is treated as none: the panel takes a
  // generated one and still renders and resizes, only its layout key is not one you chose
  const usable = isPanelId(idProp);
  if (!usable) {
    warnOnce(
      idProp === "__proto__"
        ? "Resizable.Panel can't use `__proto__` as its `id`: a layout can't name a panel by it. Give the panel another stable `id`"
        : "Resizable.Panel needs a stable `id`: a layout can't name a panel without one",
    );
  }
  const id = usable ? idProp : generated;

  const elRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(elRef, ref);
  const { registerPanel } = group;
  useLayoutEffect(() => {
    const el = elRef.current;
    return el ? registerPanel({ id, defaultSize, minSize, maxSize }, el) : undefined;
  }, [registerPanel, id, defaultSize, minSize, maxSize]);

  // A panel's padding and border are taken off before the space is shared, which skews the shares
  // and the drag. Development only.
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el || !isDevelopment()) return;
    const style = getComputedStyle(el);
    const taken = [
      style.paddingInlineStart,
      style.paddingInlineEnd,
      style.paddingBlockStart,
      style.paddingBlockEnd,
      style.borderInlineStartWidth,
      style.borderInlineEndWidth,
      style.borderBlockStartWidth,
      style.borderBlockEndWidth,
    ].some((edge) => Number.parseFloat(edge) > 0);
    if (taken) {
      warnOnce(
        `Panel "${id}" has padding or a border, which skews its size. Put them on an element inside the panel.`,
      );
    }
  }, [id]);

  const declared = parseSize(defaultSize);
  const percent = (declared?.unit ?? "%") === "%";
  const size = fallbackOf(sizeIn(group.initialLayout, id), declared?.value, percent);
  const variable = cssVarName(id);
  const flex = percent ? `var(${variable}, ${size}) 1 0%` : `0 0 var(${variable}, ${size}px)`;

  return (
    <div
      {...props}
      id={generated}
      data-panel-id={id}
      ref={mergedRef}
      style={{ flex, ...style }}
      className={cn(resizablePanelClasses, className)}
    />
  );
}

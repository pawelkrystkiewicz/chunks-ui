"use client";

import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { ariaValues } from "../../lib/resizable";
import { useMergedRef } from "../../lib/use-merged-ref";
import { type ResizeSession, useGroupContext } from "./context";
import { resizableHandleVariants } from "./Resizable.Variants";

export type ResizableHandleProps = ComponentProps<"div"> & {
  /**
   * Stops this handle from resizing. It drops out of the tab order and shows the not-allowed
   * cursor.
   * @default false
   */
  disabled?: boolean;
};

type Drag = { session: ResizeSession; pointerId: number; origin: number };

// While a drag runs the pointer leaves the thin handle, so the page takes over the cursor and
// selects text under it unless the body says otherwise. One drag at a time, so one saved state.
let saved: { userSelect: string; webkitUserSelect: string; cursor: string } | null = null;

function lockBody(cursor: string) {
  if (saved) return;
  const { style } = document.body;
  saved = {
    userSelect: style.userSelect,
    webkitUserSelect: style.getPropertyValue("-webkit-user-select"),
    cursor: style.cursor,
  };
  style.userSelect = "none";
  style.setProperty("-webkit-user-select", "none");
  style.cursor = cursor;
}

function unlockBody() {
  if (!saved) return;
  const { style } = document.body;
  style.userSelect = saved.userSelect;
  style.setProperty("-webkit-user-select", saved.webkitUserSelect);
  style.cursor = saved.cursor;
  saved = null;
}

/**
 * The draggable divider between two panels, a WAI-ARIA window splitter. It resizes the panel
 * before it and the panel after it, and no other. Keyboard: the arrows of the group's axis step
 * 1% (Shift 10%), Home and End go to the limits.
 */
export function ResizableHandle({
  disabled = false,
  className,
  ref,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: ResizableHandleProps) {
  const group = useGroupContext("Resizable.Handle");
  const elRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(elRef, ref);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);
  const [index, setIndex] = useState(-1);

  const { registerHandle, indexOfHandle, models, layout, size, orientation } = group;
  useLayoutEffect(() => {
    const el = elRef.current;
    return el ? registerHandle(el) : undefined;
  }, [registerHandle]);
  // Which panels are my neighbours is known once the group has seen them all
  // biome-ignore lint/correctness/useExhaustiveDependencies: `models` changes when a panel comes or goes
  useLayoutEffect(() => {
    const el = elRef.current;
    if (el) setIndex(indexOfHandle(el));
  }, [indexOfHandle, models]);

  // A drag ends cleanly if the handle goes away under the pointer
  useEffect(
    () => () => {
      drag.current?.session.end(false);
      drag.current = null;
      unlockBody();
    },
    [],
  );

  const horizontal = orientation === "horizontal";
  const values = index >= 0 ? ariaValues(models, layout, index, size) : undefined;
  const before = models[index];
  const after = models[index + 1];

  const finish = (commit: boolean) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    unlockBody();
    setDragging(false);
    current.session.end(commit);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable, adjustable splitter is not an <hr>
    <div
      {...props}
      ref={mergedRef}
      role="separator"
      tabIndex={disabled ? undefined : 0}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={values?.now}
      aria-valuemin={values?.min}
      aria-valuemax={values?.max}
      aria-controls={before && after ? `${before.id} ${after.id}` : undefined}
      aria-disabled={disabled || undefined}
      data-orientation={horizontal ? "vertical" : "horizontal"}
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        resizableHandleVariants({ orientation: horizontal ? "vertical" : "horizontal" }),
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const el = elRef.current;
        if (el && group.resizeByKey(el, event.key, event.shiftKey)) event.preventDefault();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        const el = elRef.current;
        if (event.defaultPrevented || disabled || event.button !== 0 || drag.current || !el) return;
        const session = group.startResize(el);
        if (!session) return;
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          // A pointer that is already gone has nothing to capture; the drag then ends on cancel
        }
        drag.current = {
          session,
          pointerId: event.pointerId,
          origin: horizontal ? event.clientX : event.clientY,
        };
        lockBody(horizontal ? "col-resize" : "row-resize");
        setDragging(true);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const current = drag.current;
        if (!current || event.pointerId !== current.pointerId) return;
        const at = horizontal ? event.clientX : event.clientY;
        current.session.move((at - current.origin) * current.session.sign);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (event.pointerId === drag.current?.pointerId) finish(true);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (event.pointerId === drag.current?.pointerId) finish(false);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (event.pointerId === drag.current?.pointerId) finish(false);
      }}
    />
  );
}

"use client";

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import {
  actionDelta,
  ariaValues,
  buildModels,
  cssVarName,
  fitLayout,
  formatCssValue,
  fromPixels,
  keyToAction,
  type Layout,
  limitsPx,
  type Orientation,
  type PanelConfig,
  type PanelModel,
  resizeBetween,
  sanitizeModels,
  toPixels,
} from "../../lib/resizable";
import { observeResize } from "../../lib/shared-resize";
import { useMergedRef } from "../../lib/use-merged-ref";
import { GroupContext, type GroupContextValue, type ResizeSession, warnOnce } from "./context";
import { resizableGroupVariants } from "./Resizable.Variants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResizableGroupProps = ComponentProps<"div"> & {
  /**
   * The axis the panels are laid out along. `"horizontal"` puts them side by side.
   * @default "horizontal"
   */
  orientation?: Orientation;
  /**
   * The layout to start from, a size per panel `id` in the unit that panel declares. Read once;
   * later changes are ignored. It works at the first render, on the server too.
   */
  defaultLayout?: Layout;
  /**
   * The layout, when you hold it yourself. A drag or key step is reported to `onLayoutChange`
   * and applied only when you pass the new layout back.
   */
  layout?: Layout;
  /**
   * Called with the whole layout once per change a user commits: on pointer release, and on
   * each key step. It is not called on mount, while dragging, or when the window resizes.
   */
  onLayoutChange?: (layout: Layout) => void;
};

type Registered = { config: PanelConfig; el: HTMLElement };

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * The size the panels share along the axis, in px: the group's box minus its padding and border
 * and minus its handles, which take space of their own.
 */
function measure(group: HTMLElement, orientation: Orientation, handles: ReadonlySet<HTMLElement>) {
  const horizontal = orientation === "horizontal";
  const box = group.getBoundingClientRect();
  const style = getComputedStyle(group);
  const edges = horizontal
    ? [
        style.paddingInlineStart,
        style.paddingInlineEnd,
        style.borderInlineStartWidth,
        style.borderInlineEndWidth,
      ]
    : [
        style.paddingBlockStart,
        style.paddingBlockEnd,
        style.borderBlockStartWidth,
        style.borderBlockEndWidth,
      ];
  let total = horizontal ? box.width : box.height;
  for (const edge of edges) total -= Number.parseFloat(edge) || 0;
  for (const handle of handles) {
    const rect = handle.getBoundingClientRect();
    total -= horizontal ? rect.width : rect.height;
  }
  return Math.max(0, Math.round(total * 100) / 100);
}

const sameConfig = (a: PanelConfig, b: PanelConfig) =>
  a.id === b.id &&
  a.defaultSize === b.defaultSize &&
  a.minSize === b.minSize &&
  a.maxSize === b.maxSize;

const sameLayout = (a: Layout, b: Layout) => {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Math.abs((a[key] ?? 0) - (b[key] ?? Number.NaN)) < 1e-9)
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A row or column of panels with a handle between each pair. The panels' sizes live in CSS
 * variables on this element: a drag writes them directly and React hears of it on release.
 */
export function ResizableGroup({
  orientation = "horizontal",
  defaultLayout,
  layout: layoutProp,
  onLayoutChange,
  className,
  children,
  ref,
  ...props
}: ResizableGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(groupRef, ref);

  const registry = useRef({
    panels: new Map<string, Registered>(),
    handles: new Set<HTMLElement>(),
    /** The panels' elements in document order, index for index with `models` */
    order: [] as HTMLElement[],
    /** The custom properties set on the group, to clear those of panels that left */
    written: new Set<string>(),
    /** True from the first pointer move until the session ends */
    resizing: false,
  });

  const [configs, setConfigs] = useState<PanelConfig[]>([]);
  const [initialDefault] = useState(defaultLayout);
  const [uncontrolled, setUncontrolled] = useState<Layout | undefined>();
  const [size, setSize] = useState(0);
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  const models = useMemo(() => buildModels(configs, warnOnce), [configs]);
  const committed = useMemo(
    () => sanitizeModels(layoutProp ?? uncontrolled ?? initialDefault, models),
    [layoutProp, uncontrolled, initialDefault, models],
  );
  const layout = useMemo(() => fitLayout(models, committed, size), [models, committed, size]);

  const latest = useRef({ models, layout, orientation, layoutProp, onLayoutChange });
  useLayoutEffect(() => {
    latest.current = { models, layout, orientation, layoutProp, onLayoutChange };
  });

  // -- Registry -----------------------------------------------------------

  const syncPanels = useCallback(() => {
    const entries = [...registry.current.panels.values()].sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    registry.current.order = entries.map((entry) => entry.el);
    const next = entries.map((entry) => entry.config);
    setConfigs((prev) =>
      prev.length === next.length &&
      prev.every((config, i) => sameConfig(config, next[i] ?? config))
        ? prev
        : next,
    );
  }, []);

  const remeasure = useCallback(() => {
    const group = groupRef.current;
    if (group) setSize(measure(group, orientation, registry.current.handles));
  }, [orientation]);

  const registerPanel = useCallback(
    (config: PanelConfig, el: HTMLElement) => {
      const { panels } = registry.current;
      const existing = panels.get(config.id);
      if (existing && existing.el !== el) {
        warnOnce(
          `Panel id "${config.id}" is a duplicate: the first panel keeps it, the rest are ignored`,
        );
        return () => {};
      }
      panels.set(config.id, { config, el });
      syncPanels();
      return () => {
        if (panels.get(config.id)?.el === el) {
          panels.delete(config.id);
          syncPanels();
        }
      };
    },
    [syncPanels],
  );

  const registerHandle = useCallback(
    (el: HTMLElement) => {
      const { handles } = registry.current;
      handles.add(el);
      remeasure();
      return () => {
        handles.delete(el);
        remeasure();
      };
    },
    [remeasure],
  );

  const indexOfHandle = useCallback((el: HTMLElement) => {
    const { order } = registry.current;
    let before = 0;
    for (const panel of order) {
      if (el.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_PRECEDING) before++;
    }
    const index = before - 1;
    return index >= 0 && index + 1 < order.length ? index : -1;
  }, []);

  // -- Measuring ----------------------------------------------------------

  useLayoutEffect(() => {
    remeasure();
    const group = groupRef.current;
    return group ? observeResize(group, "border-box", remeasure) : undefined;
  }, [remeasure]);

  // -- Writing the layout to the DOM ---------------------------------------

  const writeVars = useCallback((panels: readonly PanelModel[], next: Layout) => {
    const group = groupRef.current;
    if (!group) return;
    const { written } = registry.current;
    const names = new Set<string>();
    for (const model of panels) {
      const name = cssVarName(model.id);
      names.add(name);
      group.style.setProperty(name, formatCssValue(next[model.id] ?? 0, model.unit));
    }
    for (const name of written) if (!names.has(name)) group.style.removeProperty(name);
    registry.current.written = names;
  }, []);

  const writeAria = useCallback(
    (panels: readonly PanelModel[], next: Layout, available: number) => {
      for (const handle of registry.current.handles) {
        const values = ariaValues(panels, next, indexOfHandle(handle), available);
        if (!values) continue;
        handle.setAttribute("aria-valuenow", String(values.now));
        handle.setAttribute("aria-valuemin", String(values.min));
        handle.setAttribute("aria-valuemax", String(values.max));
      }
    },
    [indexOfHandle],
  );

  // Every render, unless a drag owns the DOM: the layout the props and the size give. This also
  // undoes a preview that a controlled parent did not accept, which React can't see in its props.
  useLayoutEffect(() => {
    if (registry.current.resizing) return;
    writeVars(models, layout);
    writeAria(models, layout, size);
  });

  // -- Resizing -------------------------------------------------------------

  const startResize = useCallback(
    (handle: HTMLElement): ResizeSession | null => {
      const group = groupRef.current;
      const state = latest.current;
      const index = indexOfHandle(handle);
      if (!group || index < 0 || registry.current.resizing) return null;
      const available = measure(group, state.orientation, registry.current.handles);
      if (!(available > 0)) return null;

      const { models: panels, layout: start } = state;
      const rtl = state.orientation === "horizontal" && getComputedStyle(group).direction === "rtl";
      const limits = limitsPx(panels, available);
      const startPx = toPixels(panels, start, available);
      let current = start;
      let over = false;
      registry.current.resizing = true;

      return {
        available,
        sign: rtl ? -1 : 1,
        move(delta) {
          if (over) return;
          const px = resizeBetween(startPx, limits, index, delta);
          current = px === startPx ? start : fromPixels(panels, px);
          writeVars(panels, current);
          writeAria(panels, current, available);
        },
        end(commit) {
          if (over) return;
          over = true;
          registry.current.resizing = false;
          if (commit && !sameLayout(current, start)) {
            if (state.layoutProp === undefined) setUncontrolled(current);
            latest.current.onLayoutChange?.(current);
          } else {
            writeVars(panels, start);
            writeAria(panels, start, available);
          }
          // A controlled parent that kept its layout gets its variables back in this render
          rerender();
        },
      };
    },
    [indexOfHandle, writeAria, writeVars],
  );

  const resizeByKey = useCallback(
    (handle: HTMLElement, key: string, shift: boolean) => {
      const group = groupRef.current;
      if (!group) return false;
      const { orientation: axis } = latest.current;
      const rtl = getComputedStyle(group).direction === "rtl";
      const action = keyToAction(key, { orientation: axis, rtl, shift });
      if (!action) return false;
      const session = startResize(handle);
      if (!session) return false;
      session.move(actionDelta(action, session.available));
      session.end(true);
      return true;
    },
    [startResize],
  );

  useEffect(() => {
    const { current } = registry;
    return () => {
      current.resizing = false;
    };
  }, []);

  const context = useMemo<GroupContextValue>(
    () => ({
      orientation,
      initialLayout: layoutProp ?? initialDefault,
      models,
      layout,
      size,
      registerPanel,
      registerHandle,
      indexOfHandle,
      startResize,
      resizeByKey,
    }),
    [
      orientation,
      layoutProp,
      initialDefault,
      models,
      layout,
      size,
      registerPanel,
      registerHandle,
      indexOfHandle,
      startResize,
      resizeByKey,
    ],
  );

  return (
    <GroupContext value={context}>
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset groups form controls, and brings its own border and layout */}
      <div
        role="group"
        data-orientation={orientation}
        {...props}
        ref={mergedRef}
        className={cn(resizableGroupVariants({ orientation }), className)}
      >
        {children}
      </div>
    </GroupContext>
  );
}

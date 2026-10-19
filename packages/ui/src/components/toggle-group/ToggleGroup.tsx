"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn, cnState } from "../../lib/cn";
import { notifyResize, observeResize } from "../../lib/shared-resize";
import { BOX_EDGES, type IndicatorBox, useIndicatorSlide } from "../../lib/use-indicator-slide";
import { useMergedRef } from "../../lib/use-merged-ref";
import { useReducedMotion } from "../../lib/use-motion";
import { useHeldWhileDriving, useMotionAnimate } from "../../lib/use-motion-animate";
import { FOCUS_RING, RING_ANIMATION_CLASSES } from "../shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** `Value` is one item's value, inferred from `value`, `defaultValue` or an annotated `onValueChange`; `string` otherwise. */
export type ToggleGroupRootProps<Value extends string = string> = BaseToggleGroup.Props<Value>;
export type ToggleGroupItemProps = ComponentProps<typeof BaseToggle>;

// ---------------------------------------------------------------------------
// Internal context – ref registry + mode
// ---------------------------------------------------------------------------

type ToggleGroupCtx = {
  registerItem: (value: string, el: HTMLElement | null) => void;
  multiple: boolean;
};

const ToggleGroupContext = createContext<ToggleGroupCtx | null>(null);

/** Watches an item, and stops, while the group shows an indicator */
type ItemWatcher = { watch: (item: HTMLElement) => void; unwatch: (item: HTMLElement) => void };

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function ToggleGroupRoot<Value extends string = string>({
  className,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  children,
  ref,
  ...props
}: ToggleGroupRootProps<Value>) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The indicator measures against the container, so a consumer's ref must not replace this one
  const mergedRef = useMergedRef(containerRef, ref);
  const itemsRef = useRef(new Map<string, HTMLElement>());
  // Set by the effect that watches the group while it shows an indicator
  const watcherRef = useRef<ItemWatcher | null>(null);
  const [trackedValue, setTrackedValue] = useState<readonly Value[]>(value ?? defaultValue ?? []);

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<ToggleGroupRootProps<Value>["onValueChange"]>>) => {
      onValueChange?.(...args);
      // Only uncontrolled mode tracks the value. A controlled group shows `value`, so a consumer
      // can reject a change (e.g. to prevent an empty selection) by not passing it on.
      // A cancelled change keeps Base UI's value, so the indicator stays where it is too.
      if (value === undefined && !args[1].isCanceled) {
        setTrackedValue(args[0]);
      }
    },
    [onValueChange, value],
  );

  const registerItem = useCallback((val: string, el: HTMLElement | null) => {
    const items = itemsRef.current;
    const previous = items.get(val);
    if (previous === el) return;
    if (previous) watcherRef.current?.unwatch(previous);
    if (el) {
      items.set(val, el);
      watcherRef.current?.watch(el);
    } else {
      items.delete(val);
    }
  }, []);

  // --- Single-select indicator bounds ---
  // Read in render, not synced in an effect, so the indicator never measures a value a render old
  const selected = value ?? trackedValue;
  const activeValue = !multiple && selected.length === 1 ? String(selected[0]) : null;

  const [bounds, setBounds] = useState<IndicatorBox | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const item = activeValue === null ? undefined : itemsRef.current.get(activeValue);
    const next = container && item ? boxWithin(container, item) : null;
    setBounds((current) => (sameBox(current, next) ? current : next));
  }, [activeValue]);

  // Items register in their layout effects, which run before this one, so the indicator is in
  // place in the first commit, and when <Activity> shows the group again
  useLayoutEffect(measure, [measure]);

  const latestMeasure = useRef(measure);
  useLayoutEffect(() => {
    latestMeasure.current = measure;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (multiple || !container) return;
    // The shared ResizeObserver runs this before paint, so the indicator is right in the frame
    // the group or an item changes in: a group shown again has it in its first frame.
    const measure = () => latestMeasure.current();
    // Padding moves the items without resizing them. It changes the content box of a group sized
    // from outside, and the border box of a group sized by its items: watch both.
    const stopContainer = [
      observeResize(container, "content-box", measure),
      observeResize(container, "border-box", measure),
    ];
    // The items too, by border box: the indicator covers it, and a padding change resizes that
    // box alone. In a group that keeps its size, an item can resize or show again alone.
    const stopItem = new Map<Node, () => void>();
    const watcher: ItemWatcher = {
      watch: (item) => stopItem.set(item, observeResize(item, "border-box", measure)),
      unwatch: (item) => {
        stopItem.get(item)?.();
        stopItem.delete(item);
      },
    };
    for (const item of itemsRef.current.values()) watcher.watch(item);
    watcherRef.current = watcher;
    // A change that moves the items without resizing them has the group measure again: a
    // class/style change on an element holding an item (gap, order), or a node added, removed or
    // moved beside them (an item unmounted, keyed items re-sorted). Not a change inside an item
    // (a Motion-animated icon writes every frame), whose resize is observed, nor the indicator's
    // own writes, mount or unmount. `stopItem` holds every item.
    const insideItem = (node: Node) => {
      if (node === container) return false;
      for (let up = node.parentNode; up && up !== container; up = up.parentNode) {
        if (stopItem.has(up)) return true;
      }
      return false;
    };
    const holdsItem = (node: Node) => {
      for (const item of stopItem.keys()) if (node.contains(item)) return true;
      return false;
    };
    const moves = ({ target, type, addedNodes, removedNodes }: MutationRecord) => {
      // Motion writes the indicator's style every frame
      if (indicators.has(target)) return false;
      if (insideItem(target)) return false;
      if (type !== "childList") return holdsItem(target);
      // A change of children counts unless it is an item's (its resize is observed) or only adds
      // or removes the indicator. A removal's target is the parent, so a removed item counts.
      if (stopItem.has(target)) return false;
      return holdsNonIndicator(addedNodes) || holdsNonIndicator(removedNodes);
    };
    const mutation = new MutationObserver((records) => {
      if (records.some(moves)) notifyResize(container, "border-box");
    });
    mutation.observe(container, {
      attributes: true,
      attributeFilter: ["class", "style"],
      childList: true,
      subtree: true,
    });
    return () => {
      mutation.disconnect();
      for (const stop of stopContainer) stop();
      for (const stop of stopItem.values()) stop();
      watcherRef.current = null;
    };
  }, [multiple]);

  // The single-select sliding indicator, once measured; until then the pressed item draws the pill
  const indicator = !multiple && bounds && (
    <ToggleGroupIndicator box={bounds} value={activeValue} />
  );

  return (
    <ToggleGroupContext.Provider value={{ registerItem, multiple }}>
      <BaseToggleGroup
        ref={mergedRef}
        className={cnState(
          "group/toggle-group relative inline-flex items-center gap-0.5 rounded-lg bg-muted p-1",
          "data-[orientation=vertical]:flex-col",
          className,
        )}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
        // After the props so a consumer cannot override it.
        data-indicator={indicator ? "" : undefined}
      >
        {indicator}
        {children}
      </BaseToggleGroup>
    </ToggleGroupContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Indicator
// ---------------------------------------------------------------------------

/**
 * The most the rect position and the summed offsets differ by when both are right. It adds up
 * to less than 2px: the item's rounded `offsetLeft`/`offsetTop` (at most 0.5px), the container's
 * own rounded offset when it is static (at most 0.5px more), and the residue of the division by
 * the scale. 2 keeps parity with Base UI's `MAX_LAYOUT_ROUNDING_ERROR`.
 */
const OFFSET_ROUNDING_PX = 2;

/** Chromium gives computed sizes to 6 significant digits: a size within this of its rect is it */
const COMPUTED_STYLE_PRECISION_PX = 0.01;

/** A rect size within this of the layout size is the layout size, scaled; further, a warped box */
const RECT_SIZE_TOLERANCE_PX = 1;

/**
 * The layout size of the border box of `el`: its computed size, or its offset size (whole px)
 * where the two differ, as with content-box sizing. Chromium gives the computed size to 6
 * significant digits only, so it can sit a hair off the true size.
 */
function layoutSize(el: HTMLElement) {
  const css = getComputedStyle(el);
  const width = Number.parseFloat(css.width) || 0;
  const height = Number.parseFloat(css.height) || 0;
  if (Math.round(width) !== el.offsetWidth || Math.round(height) !== el.offsetHeight) {
    return { width: el.offsetWidth, height: el.offsetHeight };
  }
  return { width, height };
}

/** `el`'s border edges in layout px, summed up its offset parent chain: no transform moves them */
function layoutOrigin(el: HTMLElement) {
  let left = 0;
  let top = 0;
  for (let node: Element | null = el; node instanceof HTMLElement; node = node.offsetParent) {
    left += node.offsetLeft;
    top += node.offsetTop;
    const parent = node.offsetParent;
    if (parent instanceof HTMLElement) {
      left += parent.clientLeft;
      top += parent.clientTop;
    }
  }
  return { left, top };
}

/**
 * The layout box of `item` within `container`'s padding box, or null while the item has no size.
 * Layout px, not screen rects: a scaled or zoomed ancestor (a Dialog opening from scale(0.95))
 * scales the rects but not the layout, and ends without a ResizeObserver callback. The rects
 * give sub-pixel precision; the offset chain places the box where they disagree, as under a
 * rotation. Base UI's TabsIndicator measures the same way.
 */
function boxWithin(container: HTMLElement, item: HTMLElement): IndicatorBox | null {
  const layout = layoutSize(item);
  if (layout.width === 0 || layout.height === 0) return null;
  const r = item.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const outer = layoutSize(container);
  const scaleOf = (rect: number, layoutPx: number) => {
    if (layoutPx <= 0 || Math.abs(rect - layoutPx) <= COMPUTED_STYLE_PRECISION_PX) return 1;
    // scale(0) gives 0, a collapsed box NaN: not divisors, so the offsets rule
    const scale = rect / layoutPx;
    return scale > 0 && scale < Number.POSITIVE_INFINITY ? scale : 1;
  };
  const scaleX = scaleOf(c.width, outer.width);
  const scaleY = scaleOf(c.height, outer.height);
  // The container's scroll moves the item's rect, not its layout slot, where the indicator sits
  const rectLeft = (r.left - c.left) / scaleX + container.scrollLeft - container.clientLeft;
  const rectTop = (r.top - c.top) / scaleY + container.scrollTop - container.clientTop;
  const origin = layoutOrigin(item);
  const base = layoutOrigin(container);
  const left = origin.left - base.left - container.clientLeft;
  const top = origin.top - base.top - container.clientTop;
  const agree =
    Math.abs(rectLeft - left) <= OFFSET_ROUNDING_PX &&
    Math.abs(rectTop - top) <= OFFSET_ROUNDING_PX;
  // Where the rect agrees with the layout, its size is the precise one, unless a rotation warped it
  const fromRect = (rectPx: number, scale: number, layoutPx: number) =>
    Math.abs(rectPx / scale - layoutPx) <= RECT_SIZE_TOLERANCE_PX ? rectPx / scale : undefined;
  const width = agree ? fromRect(r.width, scaleX, layout.width) : undefined;
  const height = agree ? fromRect(r.height, scaleY, layout.height) : undefined;
  // A size that fell back to the layout one (an item with its own transform) is whole px, from
  // the offsets: take the position from them too, so the box doesn't mix the two
  if (width === undefined || height === undefined) {
    return { left, top, ...layout, width: width ?? layout.width, height: height ?? layout.height };
  }
  return { left: rectLeft, top: rectTop, width, height };
}

const sameBox = (a: IndicatorBox | null, b: IndicatorBox | null) =>
  a === b || (a !== null && b !== null && BOX_EDGES.every((edge) => a[edge] === b[edge]));

/** Every indicator element mounted: a group doesn't measure again when one mounts or unmounts */
const indicators = new WeakSet<Node>();
const markIndicator = (node: HTMLSpanElement | null) => {
  if (node) indicators.add(node);
};
const holdsNonIndicator = (nodes: NodeList) => {
  for (const node of nodes) if (!indicators.has(node)) return true;
  return false;
};

/**
 * The pill behind the pressed item, at `box`. The same span with and without Motion, so it isn't
 * remounted when Motion loads.
 */
function ToggleGroupIndicator({ box, value }: { box: IndicatorBox; value: string | null }) {
  // Only pressing another item slides the indicator; a resize of the group or of an item moves
  // it at once
  const { element, sliding, transition, endSlide } = useIndicatorSlide<HTMLSpanElement>(value, box);
  // Runs again when <Activity> shows the group: like a group shown after display:none, the
  // indicator jumps to the item, also to one pressed while the group was hidden
  useLayoutEffect(() => endSlide(), [endSlide]);

  const [indicatorRef, driven] = useMotionAnimate<HTMLSpanElement>(
    box,
    { transition },
    useMergedRef(element, markIndicator),
  );
  // Motion writes a jump in its next frame. A change committed after this frame's animation
  // callbacks (a group resized, or shown again by <Activity>) would paint the old box first, so
  // the jump is written now too, and Motion writes the same values.
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !driven || sliding) return;
    for (const edge of BOX_EDGES) node.style[edge] = `${box[edge]}px`;
  }, [box, driven, sliding, element]);
  // While Motion drives it, the box it mounted with: a span mounted as the group shows again
  // paints over the item before Motion writes anything
  const style = useHeldWhileDriving(driven, box);
  // micro-interactions already turns the CSS fallback's transition off under reduced motion.
  // This is for Motion's hand-off: reduced motion turned on finishes a slide and hands the
  // indicator back to the fallback, but `sliding` ends a frame later. Meanwhile the fallback
  // renders the classes a settled indicator has.
  const reduced = useReducedMotion();

  return (
    <span
      ref={indicatorRef}
      className={cn(
        "absolute z-0 rounded-md bg-background shadow-sm",
        // Dimmed as the pressed item is, and the pill it draws before hydration with it. Only the
        // items of its own group, the parent, count: one that is the group's child, or one in
        // another element of it while no group inside holds a pressed, disabled item. The
        // `:where()` keeps the specificity a consumer's documented `:has(…) > span` rule beats.
        // ponytail: a group inside that holds one keeps this pill bright under a disabled item of
        // this group that sits in an element of its own
        "[:has(>[data-pressed]:disabled)>&]:opacity-50",
        "[:has([data-pressed]:disabled):where(:not(:has([class~='group/toggle-group']_[data-pressed]:disabled)))>&]:opacity-50",
        // The CSS fallback slides the indicator to another item with a transition
        !driven && "micro-interactions",
        // `opacity` is listed after `all`, so the item's 300ms default-curve fade wins over the
        // slide's 200ms snappy one, and outside a slide only `opacity` fades
        !driven && sliding && !reduced
          ? [
              "[transition-property:all,opacity]",
              "[transition-duration:200ms,300ms]",
              "[transition-timing-function:var(--ease-snappy),var(--default-transition-timing-function)]",
            ]
          : "transition-opacity duration-300 motion-reduce:transition-none",
      )}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function ToggleGroupItem({ className, value, ref, ...props }: ToggleGroupItemProps) {
  const ctx = useContext(ToggleGroupContext);
  const itemRef = useRef<HTMLButtonElement>(null);
  // The root finds the item through this ref, so a consumer's ref must not replace it
  const mergedRef = useMergedRef(itemRef, ref);

  // A layout effect, so the item is registered when the root measures in its own layout effect.
  // The callback is stable; the context object is new on every render of the root.
  const registerItem = ctx?.registerItem;
  useLayoutEffect(() => {
    if (value === undefined || !registerItem) return;
    const key = String(value);
    registerItem(key, itemRef.current);
    return () => registerItem(key, null);
  }, [value, registerItem]);

  return (
    <BaseToggle
      ref={mergedRef}
      value={value}
      className={cnState(
        "relative z-[1] inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm",
        ...RING_ANIMATION_CLASSES,
        "text-muted-foreground hover:text-foreground disabled:not-data-pressed:hover:text-muted-foreground",
        "data-pressed:text-foreground",
        FOCUS_RING,
        // The ring reaches 2px past the 2px gap, under a later sibling at the same z-index; in a
        // `multiple` group a pressed one has an opaque background, which covered that side of it
        "focus-visible:z-[2]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        ctx?.multiple && "data-pressed:bg-background data-pressed:shadow-sm",
        // Until the group has an indicator the pressed item draws the pill in a ::before: the
        // item's own background transitions, so it would fade. Disabled, it takes the item's 50%
        // opacity, as the indicator does. A consumer ::before merges with it before hydration.
        // `group-not-data-indicator` matches any group around the item; the parent's indicator
        // wins, so an item of a group nested in one without an indicator draws no second pill.
        // ponytail: an item in an element of its own inside such a nested group still draws it
        ctx?.multiple === false && [
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:absolute",
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:inset-0",
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:-z-10",
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:rounded-md",
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:bg-background",
          "group-not-data-indicator/toggle-group:[:not([data-indicator])>&]:data-pressed:before:shadow-sm",
        ],
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const ToggleGroup = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
};

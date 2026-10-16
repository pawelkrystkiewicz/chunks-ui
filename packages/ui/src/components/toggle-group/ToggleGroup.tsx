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
import { flushSync } from "react-dom";
import { cn, cnState } from "../../lib/cn";
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

/**
 * The indicator covers an item's border box. A padding change resizes that box alone, and in a
 * group that keeps its size it moves the other items too.
 */
const ITEM_BOX: ResizeObserverOptions = { box: "border-box" };

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
  // Watches the container and the items while the group shows an indicator
  const observerRef = useRef<ResizeObserver | null>(null);
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
    if (previous) observerRef.current?.unobserve(previous);
    if (el) {
      items.set(val, el);
      observerRef.current?.observe(el, ITEM_BOX);
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
    // The browser runs ResizeObserver callbacks after layout and before it paints. Measuring
    // there, and committing at once rather than in React's next task, paints the indicator in
    // the frame the group or item changes in: a group shown again has it in its first frame.
    const measureNow = () => flushSync(() => latestMeasure.current());
    // Padding moves the items without resizing them. It changes the content box of a group sized
    // from outside, and the border box of a group sized by its items: watch both.
    const observer = new ResizeObserver(measureNow);
    const borderBox = new ResizeObserver(measureNow);
    observer.observe(container);
    borderBox.observe(container, { box: "border-box" });
    // The items too: in a group that keeps its size, an item can resize or show again alone
    for (const item of itemsRef.current.values()) observer.observe(item, ITEM_BOX);
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      borderBox.disconnect();
      observerRef.current = null;
    };
  }, [multiple]);

  return (
    <ToggleGroupContext.Provider value={{ registerItem, multiple }}>
      <BaseToggleGroup
        ref={mergedRef}
        className={cnState(
          "relative inline-flex items-center gap-0.5 rounded-lg bg-muted p-1",
          "data-[orientation=vertical]:flex-col",
          className,
        )}
        multiple={multiple}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        {/* Single-select sliding indicator */}
        {!multiple && bounds && <ToggleGroupIndicator box={bounds} value={activeValue} />}
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
 * The layout box of `item` within `container`'s padding box, from which the indicator's
 * `left`/`top` run. Null while the item has no size, as while the group or the item isn't
 * rendered (display:none): no box to show. The indicator then unmounts, and the one that mounts
 * once the item has a size again starts over it.
 *
 * Layout px, not the rects as they are: a transform on an ancestor scales the rects, not the
 * layout, and fires no ResizeObserver when it ends. A Dialog opens from scale(0.95) with the
 * group inside it. The rects over the container's layout size give that scale, and their deltas
 * divided by it are layout px with sub-pixel precision. The offset parent chain gives layout px
 * too, immune to any transform, but whole px: it places the indicator where the two disagree by
 * more than rounding, as a rotation, skew or flip warps the rects past what the scale undoes.
 */
function boxWithin(container: HTMLElement, item: HTMLElement): IndicatorBox | null {
  const layout = layoutSize(item);
  if (layout.width === 0 || layout.height === 0) return null;
  const r = item.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const outer = layoutSize(container);
  const scaleOf = (rect: number, layoutPx: number) => {
    if (layoutPx <= 0 || Math.abs(rect - layoutPx) <= COMPUTED_STYLE_PRECISION_PX) return 1;
    // scale(0) gives 0 and a collapsed box can give NaN: not a divisor, so the offsets rule
    const scale = rect / layoutPx;
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
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
  if (!agree) return { left, top, ...layout };
  // Where the rect agrees with the layout, its size is the precise one, unless a rotation warped it
  const fromRect = (rectPx: number, scale: number, layoutPx: number) =>
    Math.abs(rectPx / scale - layoutPx) <= RECT_SIZE_TOLERANCE_PX ? rectPx / scale : undefined;
  const width = fromRect(r.width, scaleX, layout.width);
  const height = fromRect(r.height, scaleY, layout.height);
  // A size that fell back to the layout one (an item with its own transform) is whole px, from
  // the offsets: take the position from them too, so the box doesn't mix the two
  if (width === undefined || height === undefined)
    return { left, top, ...layout, width: width ?? layout.width, height: height ?? layout.height };
  return { left: rectLeft, top: rectTop, width, height };
}

const sameBox = (a: IndicatorBox | null, b: IndicatorBox | null) =>
  a === b || (a !== null && b !== null && BOX_EDGES.every((edge) => a[edge] === b[edge]));

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

  const [indicatorRef, driven] = useMotionAnimate<HTMLSpanElement>(box, { transition }, element);
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
        // The CSS fallback slides with a transition, which is off unless the indicator slides to
        // another item
        !driven && "micro-interactions duration-200 ease-snappy",
        !driven && (!sliding || reduced) && "transition-none",
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

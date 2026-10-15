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
import { springs } from "../../lib/motion";
import { useMergedRef } from "../../lib/use-merged-ref";
import { useReducedMotion } from "../../lib/use-motion";
import { useHeldWhileDriving, useMotionAnimate } from "../../lib/use-motion-animate";
import { FOCUS_RING, RING_ANIMATION_CLASSES } from "../shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToggleGroupRootProps = ComponentProps<typeof BaseToggleGroup>;
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

function ToggleGroupRoot({
  className,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  children,
  ref,
  ...props
}: ToggleGroupRootProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The indicator measures against the container, so a consumer's ref must not replace this one
  const mergedRef = useMergedRef(containerRef, ref);
  const itemsRef = useRef(new Map<string, HTMLElement>());
  // Watches the container and the items while the group shows an indicator
  const observerRef = useRef<ResizeObserver | null>(null);
  const [trackedValue, setTrackedValue] = useState<readonly unknown[]>(value ?? defaultValue ?? []);

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<ToggleGroupRootProps["onValueChange"]>>) => {
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

const BOX_EDGES = ["left", "top", "width", "height"] as const;
type IndicatorBox = Record<(typeof BOX_EDGES)[number], number>;

/**
 * The box of `item` within `container`. Null while the item measures 0×0, as it does while the
 * group or the item isn't rendered (display:none): no box to show. The indicator then unmounts,
 * and the one that mounts once the item is measured again starts over it.
 */
function boxWithin(container: HTMLElement, item: HTMLElement): IndicatorBox | null {
  const r = item.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  const c = container.getBoundingClientRect();
  return { left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height };
}

const sameBox = (a: IndicatorBox | null, b: IndicatorBox | null) =>
  a === b || (a !== null && b !== null && BOX_EDGES.every((edge) => a[edge] === b[edge]));

/** Moves the indicator at once: Motion writes the values in its next frame */
const SNAP = { duration: 0 };

/**
 * Whether the indicator is still sliding: the CSS fallback runs a transition, or Motion has not
 * written `box` inline yet. A Motion spring ends exactly on its target.
 */
function isSliding(node: HTMLElement, box: IndicatorBox) {
  if (typeof node.getAnimations === "function" && typeof CSSTransition !== "undefined") {
    if (node.getAnimations().some((animation) => animation instanceof CSSTransition)) return true;
  }
  return BOX_EDGES.some((edge) => {
    const written = node.style[edge];
    return written !== "" && Math.abs(Number.parseFloat(written) - box[edge]) > 0.5;
  });
}

/**
 * The pill behind the pressed item, at `box`. The same span with and without Motion, so it isn't
 * remounted when Motion loads.
 */
function ToggleGroupIndicator({ box, value }: { box: IndicatorBox; value: string | null }) {
  // Only pressing another item slides the indicator. A resize of the group or of an item (a font
  // or padding change, a narrower container) moves it at once instead of trailing behind. A
  // resize during a slide retargets the slide.
  const [slideTarget, setSlideTarget] = useState(value);
  const [sliding, setSliding] = useState(false);
  if (value !== slideTarget) {
    setSlideTarget(value);
    setSliding(true);
  }
  const element = useRef<HTMLSpanElement | null>(null);
  const latestBox = useRef(box);
  const latestSliding = useRef(sliding);
  useLayoutEffect(() => {
    latestBox.current = box;
    latestSliding.current = sliding;
  });
  // Runs again when <Activity> shows the group: like a group shown after display:none, the
  // indicator jumps to the item, also to one pressed while the group was hidden. Only while it
  // slides: at mount, setSliding(false) changes nothing, yet React applied that update again
  // after the first press and cancelled its slide.
  useLayoutEffect(() => {
    if (latestSliding.current) setSliding(false);
  }, []);
  useEffect(() => {
    if (!sliding) return;
    let frame = requestAnimationFrame(function settle() {
      const node = element.current;
      if (node && isSliding(node, latestBox.current)) frame = requestAnimationFrame(settle);
      else setSliding(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [sliding]);

  const [indicatorRef, driven] = useMotionAnimate<HTMLSpanElement>(
    box,
    { transition: sliding ? springs.indicator : SNAP },
    element,
  );
  // Motion writes a jump in its next frame. A change committed after this frame's animation
  // callbacks (a group resized, or shown again by <Activity>) would paint the old box first, so
  // the jump is written now too, and Motion writes the same values.
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !driven || sliding) return;
    for (const edge of BOX_EDGES) node.style[edge] = `${box[edge]}px`;
  }, [box, driven, sliding]);
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
        "text-muted-foreground enabled:hover:text-foreground",
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

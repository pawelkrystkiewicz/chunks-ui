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
    // The shared ResizeObserver runs this after layout and before paint, and commits every
    // notified group's measure in one synchronous render, so the indicator paints in the frame
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
    const stopItem = new Map<HTMLElement, () => void>();
    const watcher: ItemWatcher = {
      watch: (item) => stopItem.set(item, observeResize(item, "border-box", measure)),
      unwatch: (item) => {
        stopItem.get(item)?.();
        stopItem.delete(item);
      },
    };
    for (const item of itemsRef.current.values()) watcher.watch(item);
    watcherRef.current = watcher;
    // A class or inline style change on the group or an item can move the items without
    // resizing anything (gap, order). The observer then notifies the container again before the
    // next paint, and the group measures. Only a change to an element that holds an item counts:
    // the indicator holds none, and its box and Motion's values are written as inline style.
    const items = itemsRef.current;
    const holdsItem = (node: Node) => [...items.values()].some((item) => node.contains(item));
    const mutation = new MutationObserver((records) => {
      if (records.some(({ target }) => holdsItem(target))) notifyResize(container, "border-box");
    });
    mutation.observe(container, {
      attributes: true,
      attributeFilter: ["class", "style"],
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
        // Until the group has an indicator the pressed item draws the pill in a ::before: the
        // item's own background transitions, so it would fade. Disabled, it takes the item's 50%
        // opacity and the indicator does not. A consumer ::before merges with it before hydration.
        ctx?.multiple === false && [
          "group-not-data-indicator/toggle-group:data-pressed:before:absolute",
          "group-not-data-indicator/toggle-group:data-pressed:before:inset-0",
          "group-not-data-indicator/toggle-group:data-pressed:before:-z-10",
          "group-not-data-indicator/toggle-group:data-pressed:before:rounded-md",
          "group-not-data-indicator/toggle-group:data-pressed:before:bg-background",
          "group-not-data-indicator/toggle-group:data-pressed:before:shadow-sm",
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

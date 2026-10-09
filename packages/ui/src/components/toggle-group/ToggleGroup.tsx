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
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMergedRef } from "../../lib/use-merged-ref";
import { useHeldWhileDriving, useMotionAnimate } from "../../lib/use-motion-animate";

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
  const [trackedValue, setTrackedValue] = useState<readonly unknown[]>(value ?? defaultValue ?? []);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) setTrackedValue(value);
  }, [value]);

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<ToggleGroupRootProps["onValueChange"]>>) => {
      onValueChange?.(...args);
      // Only update internal state for uncontrolled mode.
      // In controlled mode, trackedValue syncs via useEffect when value prop changes.
      // This allows users to reject changes (e.g., prevent empty selection).
      // A cancelled change keeps Base UI's value, so the indicator stays where it is too.
      if (value === undefined && !args[1].isCanceled) {
        setTrackedValue(args[0]);
      }
    },
    [onValueChange, value],
  );

  const registerItem = useCallback((val: string, el: HTMLElement | null) => {
    if (el) itemsRef.current.set(val, el);
    else itemsRef.current.delete(val);
  }, []);

  // --- Single-select indicator bounds ---
  const activeValue = !multiple && trackedValue.length === 1 ? String(trackedValue[0]) : null;

  const [bounds, setBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const measureBounds = useCallback(() => {
    if (!activeValue || !containerRef.current) {
      setBounds(null);
      return;
    }
    const el = itemsRef.current.get(activeValue);
    if (!el) {
      setBounds(null);
      return;
    }
    const c = containerRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setBounds({
      left: r.left - c.left,
      top: r.top - c.top,
      width: r.width,
      height: r.height,
    });
  }, [activeValue]);

  useLayoutEffect(measureBounds, [measureBounds]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(measureBounds));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureBounds]);

  // The same span with and without Motion, so it isn't remounted when Motion loads
  const [indicatorRef, driven] = useMotionAnimate<HTMLSpanElement>(bounds, {
    transition: springs.indicator,
  });
  const indicatorStyle = useHeldWhileDriving(driven, bounds);

  return (
    <ToggleGroupContext.Provider value={{ registerItem, multiple }}>
      <BaseToggleGroup
        ref={mergedRef}
        className={cn(
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
        {!multiple && bounds && (
          <span
            ref={indicatorRef}
            className={
              driven
                ? "absolute z-0 rounded-md bg-background shadow-sm"
                : "micro-interactions absolute z-0 rounded-md bg-background shadow-sm duration-200 ease-snappy"
            }
            style={indicatorStyle ?? undefined}
          />
        )}
        {children}
      </BaseToggleGroup>
    </ToggleGroupContext.Provider>
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

  useEffect(() => {
    if (value === undefined || !ctx) return;
    ctx.registerItem(String(value), itemRef.current);
    return () => ctx.registerItem(String(value), null);
  }, [value, ctx]);

  return (
    <BaseToggle
      ref={mergedRef}
      value={value}
      className={cn(
        "relative z-[1] inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm",
        "micro-interactions text-muted-foreground",
        "hover:text-foreground",
        "data-pressed:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
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

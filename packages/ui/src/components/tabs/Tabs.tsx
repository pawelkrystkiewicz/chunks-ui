"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { useMotion, useReducedMotion } from "../../lib/use-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>;

export type TabsListProps = ComponentProps<typeof BaseTabs.List>;

export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>;

export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>;

export type TabsIndicatorProps = ComponentProps<typeof BaseTabs.Indicator>;

export type TabsContentsProps = Omit<ComponentProps<"div">, "children"> & {
  /** The `<Tabs.Content>` elements to animate between. */
  children: ReactNode;
  /** Custom spring transition config passed to Motion.
   * @default springs.content
   */
  transition?: Record<string, unknown>;
};

export type TabsContentProps = ComponentProps<"div"> & {
  /** Tab value that must match a corresponding `<Tabs.Tab value>`. */
  value: unknown;
};

// ---------------------------------------------------------------------------
// Internal context – tracks active value for <Tabs.Contents>
// ---------------------------------------------------------------------------

type TabsContextValue = { value: unknown };
const TabsContext = createContext<TabsContextValue | null>(null);

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TabsRoot({ className, value, defaultValue, onValueChange, ...props }: TabsRootProps) {
  const [trackedValue, setTrackedValue] = useState(value ?? defaultValue);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) setTrackedValue(value);
  }, [value]);

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<TabsRootProps["onValueChange"]>>) => {
      setTrackedValue(args[0]);
      onValueChange?.(...args);
    },
    [onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: trackedValue }}>
      <BaseTabs.Root
        className={cn(className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <BaseTabs.List
      className={cn(
        "relative flex items-center rounded-lg bg-muted p-1",
        "data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      className={cn(
        "relative z-[1] inline-flex items-center justify-center px-4 py-2 font-medium text-sm",
        "micro-interactions text-muted-foreground",
        "hover:text-foreground",
        "data-active:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={cn("mt-2 focus-visible:outline-2 focus-visible:outline-ring", className)}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;

  return (
    <BaseTabs.Indicator
      render={
        useSpring
          ? (renderProps, state) => {
              const style = { ...((renderProps.style ?? {}) as Record<string, unknown>) };

              delete style.left;
              delete style.top;
              delete style.width;
              delete style.height;

              return (
                <m.motion.span
                  {...(renderProps as Record<string, unknown>)}
                  style={style}
                  animate={{
                    left: state.activeTabPosition?.left ?? 0,
                    top: state.activeTabPosition?.top ?? 0,
                    width: state.activeTabSize?.width ?? 0,
                    height: state.activeTabSize?.height ?? 0,
                  }}
                  transition={springs.indicator}
                />
              );
            }
          : undefined
      }
      className={cn(
        "absolute rounded-md bg-background shadow-sm",
        !useSpring && "micro-interactions duration-200 ease-snappy",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Animated content container  –  slides between panels + animates height
// ---------------------------------------------------------------------------

function TabsContents({ className, children, transition, ...props }: TabsContentsProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  const useSpring = !!m && !reduced;
  const ctx = useContext(TabsContext);

  const childrenArray = Children.toArray(children);
  const childValue = (child: ReactNode) =>
    isValidElement(child) ? (child.props as { value?: unknown }).value : undefined;
  const activeIndex = childrenArray.findIndex((child) => childValue(child) === ctx?.value);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  // --- height measurement ---
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number | "auto">("auto");

  const measure = useCallback((index: number) => {
    const pane = itemRefs.current[index];
    if (!pane) return 0;
    return pane.getBoundingClientRect().height;
  }, []);

  useEffect(() => {
    const pane = itemRefs.current[safeIndex];
    if (!pane) return;
    setHeight(measure(safeIndex));
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => setHeight(measure(safeIndex)));
    });
    ro.observe(pane);
    return () => ro.disconnect();
  }, [safeIndex, measure]);

  // Set initial height before paint
  useLayoutEffect(() => {
    if (height === "auto") {
      const h = measure(safeIndex);
      if (h > 0) setHeight(h);
    }
  }, [safeIndex, height, measure]);

  const springTransition = transition ?? springs.content;

  // --- CSS-only fallback ---
  if (!useSpring || !m) {
    return (
      <div className={cn("overflow-hidden", className)} {...props}>
        {childrenArray.map((child, i) => (
          <div
            key={String(childValue(child) ?? i)}
            style={i !== safeIndex ? { display: "none" } : undefined}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  // --- Motion-powered slide + height ---
  return (
    <m.motion.div
      ref={containerRef}
      className={cn("overflow-hidden", className)}
      initial={false}
      animate={{ height }}
      transition={springTransition}
      {...(props as Record<string, unknown>)}
    >
      <m.motion.div
        className="flex"
        initial={false}
        animate={{ x: `${safeIndex * -100}%` }}
        transition={springTransition}
      >
        {childrenArray.map((child, i) => (
          <div
            key={String(childValue(child) ?? i)}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="w-full shrink-0"
            inert={i !== safeIndex || undefined}
          >
            {child}
          </div>
        ))}
      </m.motion.div>
    </m.motion.div>
  );
}

// ---------------------------------------------------------------------------
// Content panel for use inside <Tabs.Contents>
// ---------------------------------------------------------------------------

function TabsContent({ className, value: _value, ...props }: TabsContentProps) {
  return <div role="tabpanel" className={cn("outline-none", className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
  Indicator: TabsIndicator,
  Contents: TabsContents,
  Content: TabsContent,
};

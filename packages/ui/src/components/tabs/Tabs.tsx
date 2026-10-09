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
import { useMergedRef } from "../../lib/use-merged-ref";
import { useMotion, useReducedMotion } from "../../lib/use-motion";
import { useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>;

export type TabsListProps = ComponentProps<typeof BaseTabs.List>;

export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>;

export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>;

export type TabsIndicatorProps = ComponentProps<typeof BaseTabs.Indicator>;

type MotionTransition = {
  type?: "spring" | "tween" | "inertia";
  stiffness?: number;
  damping?: number;
  bounce?: number;
  mass?: number;
  restDelta?: number;
  restSpeed?: number;
  duration?: number;
};

export type TabsContentsProps = Omit<ComponentProps<"div">, "children"> & {
  /** The `<Tabs.Content>` elements to animate between. */
  children: ReactNode;
  /** Custom spring transition config passed to Motion.
   * @default springs.content
   */
  transition?: MotionTransition;
};

export type TabsContentProps = ComponentProps<"div"> & {
  /** Tab value that must match a corresponding `<Tabs.Tab value>`. */
  value: unknown;
};

/** Loose target type for motion `initial` / `animate` — keeps `Tabs.Animate` decoupled
 *  from motion's exported types since motion is an optional peer. */
type MotionTarget = Record<string, unknown>;

export type TabsAnimateProps = ComponentProps<"div"> & {
  children: ReactNode;
  /** Motion `initial` state. @default { y: 8, opacity: 0 } */
  initial?: MotionTarget;
  /** Motion `animate` state. @default { y: 0, opacity: 1 } */
  animate?: MotionTarget;
  /** Motion transition config. @default springs.content */
  transition?: MotionTransition;
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

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<TabsRootProps["onValueChange"]>>) => {
      setTrackedValue(args[0]);
      onValueChange?.(...args);
    },
    [onValueChange],
  );

  // Derive context value directly so controlled updates are synchronous.
  // Using useEffect to sync would cause useTabsValue()/Tabs.Animate to lag one render.
  const contextValue = value !== undefined ? value : trackedValue;

  return (
    <TabsContext.Provider value={{ value: contextValue }}>
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

function TabsIndicator({ className, render, ...props }: TabsIndicatorProps) {
  return (
    <BaseTabs.Indicator
      {...props}
      render={(renderProps, state) => (
        <TabsIndicatorElement
          {...renderProps}
          state={state}
          render={render}
          className={typeof className === "function" ? className(state) : className}
        />
      )}
    />
  );
}

// The same element with and without Motion, so it isn't remounted when Motion loads
function TabsIndicatorElement({
  state,
  render,
  className,
  ref,
  ...props
}: ComponentProps<"span"> & {
  state: BaseTabs.Indicator.State;
  render: PartRenderProp<BaseTabs.Indicator.State>;
}) {
  const { activeTabPosition: position, activeTabSize: size } = state;
  const [indicatorRef, driven] = useMotionAnimate<HTMLElement>(
    position && size
      ? { left: position.left, top: position.top, width: size.width, height: size.height }
      : null,
    { transition: springs.indicator, clear: ["left", "top", "width", "height"] },
    ref,
  );
  return useRenderPart(render, state, indicatorRef, {
    ...props,
    className: cn(
      "absolute rounded-md bg-background shadow-sm",
      // The CSS fallback places the indicator from the variables Base UI sets on it. Motion
      // writes inline values instead, and they are removed when it hands back.
      !driven &&
        "top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) micro-interactions",
      className,
    ),
  });
}

// ---------------------------------------------------------------------------
// Animated content container  –  slides between panels + animates height
// ---------------------------------------------------------------------------

function TabsContents({ className, children, transition, ref, ...props }: TabsContentsProps) {
  const m = useMotion();
  const reduced = useReducedMotion();
  // Motion drives the plain elements below instead of replacing them with motion.div, so its
  // loading never remounts the panels and loses their state
  const motion = reduced ? null : m;
  const ctx = useContext(TabsContext);

  const childrenArray = Children.toArray(children);
  const childValue = (child: ReactNode) =>
    isValidElement(child) ? (child.props as { value?: unknown }).value : undefined;
  const activeIndex = childrenArray.findIndex((child) => childValue(child) === ctx?.value);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  // --- height measurement ---
  const containerRef = useRef<HTMLDivElement>(null);
  const mergedContainerRef = useMergedRef(containerRef, ref);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number | "auto">("auto");

  // Layout height: getBoundingClientRect() would include an ancestor's transform (a Dialog
  // mounts at scale(0.95)), and a transform ending doesn't trigger the ResizeObserver below
  const measure = useCallback((index: number) => {
    const pane = itemRefs.current[index];
    if (!pane) return 0;
    return Number.parseFloat(getComputedStyle(pane).height) || 0;
  }, []);

  useEffect(() => {
    const pane = itemRefs.current[safeIndex];
    if (!pane) return;
    setHeight(measure(safeIndex));
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHeight(measure(safeIndex)));
    });
    ro.observe(pane);
    return () => {
      ro.disconnect();
      // A re-measure queued for the previous panel would set its height after a switch
      cancelAnimationFrame(frame);
    };
  }, [safeIndex, measure]);

  // Set initial height before paint
  useLayoutEffect(() => {
    if (height === "auto") {
      const h = measure(safeIndex);
      if (h > 0) setHeight(h);
    }
  }, [safeIndex, height, measure]);

  // --- Motion-powered slide + height ---
  const springTransition = transition ?? springs.content;
  const transitionRef = useRef(springTransition);
  useLayoutEffect(() => {
    transitionRef.current = springTransition;
  });
  const trackRef = useRef<HTMLDivElement>(null);
  // The first animation jumps to the current state, as initial={false} did; without Motion
  // the inline style it set is cleared so the CSS layout applies again. stop() writes the value
  // it stopped at in Motion's next render step, so the style is cleared again in that step.
  // That relies on our callback being queued after Motion's own write; the reduced-motion
  // test in Tabs.motion.visual.spec.tsx guards it.
  const slide = useRef<{ stop(): void } | null>(null);
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!motion) {
      if (slide.current) {
        slide.current.stop();
        slide.current = null;
        m?.frame.render(() => {
          track.style.transform = "";
        });
      }
      track.style.transform = "";
      return;
    }
    const options = slide.current ? transitionRef.current : { duration: 0 };
    slide.current = motion.animate(track, { x: `${safeIndex * -100}%` }, options);
  }, [m, motion, safeIndex]);

  const resize = useRef<{ stop(): void } | null>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!motion) {
      if (resize.current) {
        resize.current.stop();
        resize.current = null;
        m?.frame.render(() => {
          container.style.height = "";
        });
      }
      container.style.height = "";
      return;
    }
    if (height === "auto") return;
    const options = resize.current ? transitionRef.current : { duration: 0 };
    resize.current = motion.animate(container, { height }, options);
  }, [m, motion, height]);

  // Stop on unmount, or Motion keeps writing to the detached elements until it settles
  useLayoutEffect(
    () => () => {
      slide.current?.stop();
      resize.current?.stop();
    },
    [],
  );

  return (
    <div
      ref={mergedContainerRef}
      // With Motion the track can be taller than the container. overflow:hidden would leave it
      // scrollable, so scrollIntoView or focus could scroll the active panel's top out of view.
      className={cn(motion ? "overflow-clip" : "overflow-hidden", className)}
      {...props}
    >
      {/* items-start: each panel keeps its own height, so the container can follow the active one */}
      <div ref={trackRef} className={motion ? "flex items-start" : undefined}>
        {childrenArray.map((child, i) => (
          <div
            key={String(childValue(child) ?? i)}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={motion ? "w-full shrink-0" : undefined}
            style={!motion && i !== safeIndex ? { display: "none" } : undefined}
            inert={motion && i !== safeIndex ? true : undefined}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content panel for use inside <Tabs.Contents>
// ---------------------------------------------------------------------------

function TabsContent({ className, value: _value, ...props }: TabsContentProps) {
  return <div role="tabpanel" className={cn("outline-none", className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Hook – read the active tab value from context (escape hatch for custom motion)
// ---------------------------------------------------------------------------

export function useTabsValue(): unknown {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabsValue must be used inside <Tabs.Root>");
  return ctx.value;
}

// ---------------------------------------------------------------------------
// Animate – single-child wrapper that re-keys + animates on tab value change.
// For routed tabs (single <Outlet>) where <Tabs.Contents>'s multi-panel slide
// doesn't apply. Bring-your-own initial/animate/transition with a fade+rise default.
// ---------------------------------------------------------------------------

const DEFAULT_ANIMATE_INITIAL: MotionTarget = { y: 8, opacity: 0 };
const DEFAULT_ANIMATE_TARGET: MotionTarget = { y: 0, opacity: 1 };

function TabsAnimate({
  children,
  initial = DEFAULT_ANIMATE_INITIAL,
  animate = DEFAULT_ANIMATE_TARGET,
  transition,
  className,
  ...props
}: TabsAnimateProps) {
  const value = useTabsValue();
  const m = useMotion();
  const reduced = useReducedMotion();
  const enter =
    m && !reduced ? { m, initial, animate, transition: transition ?? springs.content } : null;

  return (
    <TabsAnimatePane
      key={String(value ?? "")}
      enter={enter}
      reduced={reduced}
      className={cn(className)}
      {...props}
    >
      {children}
    </TabsAnimatePane>
  );
}

type TabsAnimateEnter = {
  m: NonNullable<ReturnType<typeof useMotion>>;
  initial: MotionTarget;
  animate: MotionTarget;
  transition: MotionTransition;
};

// One pane per tab value. It animates in only if Motion was ready when it mounted; Motion
// arriving later leaves a showing pane alone rather than swapping in a motion.div
function TabsAnimatePane({
  enter,
  reduced,
  ref: consumerRef,
  ...props
}: ComponentProps<"div"> & { enter: TabsAnimateEnter | null; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, consumerRef);
  const [enterOnMount] = useState(enter);
  const entry = useRef<{ complete(): void } | null>(null);
  useLayoutEffect(() => {
    const pane = ref.current;
    if (!enterOnMount || !pane) return;
    const { m, initial, animate, transition } = enterOnMount;
    // From each `initial` value to its `animate` value, like motion.div's initial/animate
    const keyframes = Object.fromEntries(
      Object.entries(animate).map(([name, to]) => [
        name,
        name in initial ? [initial[name], to] : to,
      ]),
    );
    const controls = m.animate(pane, keyframes as never, transition);
    entry.current = controls;
    // Stop on unmount, or Motion keeps writing to the detached pane until it settles
    return () => controls.stop();
  }, [enterOnMount]);

  // Reduced motion turned on mid-entry: finish it now. Turning it off again doesn't replay it.
  useLayoutEffect(() => {
    if (reduced) entry.current?.complete();
  }, [reduced]);

  return <div ref={mergedRef} {...props} />;
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
  Animate: TabsAnimate,
};

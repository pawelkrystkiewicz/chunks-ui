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
  useReducer,
  useRef,
  useState,
} from "react";
import { cn, cnState } from "../../lib/cn";
import { springs } from "../../lib/motion";
import { releaseValues, renderNow } from "../../lib/render-now";
import { notifyResize, observeResize } from "../../lib/shared-resize";
import { BOX_EDGES, useIndicatorSlide } from "../../lib/use-indicator-slide";
import { useMergedRef } from "../../lib/use-merged-ref";
import {
  type MotionOptions,
  onMainThread,
  useMotion,
  useReducedMotion,
} from "../../lib/use-motion";
import { useMotionAnimate } from "../../lib/use-motion-animate";
import { type PartRenderProp, useRenderPart } from "../../lib/use-render-part";
import { FOCUS_RING, RING_ANIMATION_CLASSES, RING_TRANSITION } from "../shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>;

export type TabsListProps = ComponentProps<typeof BaseTabs.List>;

export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>;

export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>;

export type TabsIndicatorProps = ComponentProps<typeof BaseTabs.Indicator>;

type MotionTransition = MotionOptions;

export type TabsContentsProps = Omit<ComponentProps<"div">, "children"> & {
  /** The `<Tabs.Content>` elements to animate between. */
  children: ReactNode;
  /** Custom spring transition config passed to Motion.
   * @default springs.content
   */
  transition?: MotionTransition;
};

export type TabsContentProps = Omit<TabsPanelProps, "keepMounted" | "hidden">;

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
  // A tab value can be a function, which React would call as a state initializer or updater,
  // so it is stored as is, as Base UI stores it
  const [trackedValue, setTrackedValue] = useState(() => value ?? defaultValue);

  const handleValueChange = useCallback(
    (...args: Parameters<NonNullable<TabsRootProps["onValueChange"]>>) => {
      onValueChange?.(...args);
      const [next, details] = args;
      // Base UI drops a cancelled change from a tab. Its automatic fallbacks (initial, disabled,
      // missing tab) go through even when cancelled, so the tracked value follows them too.
      if (!details.isCanceled || details.reason !== "none") setTrackedValue(() => next);
    },
    [onValueChange],
  );

  // Derive context value directly so controlled updates are synchronous.
  // Using useEffect to sync would cause useTabsValue()/Tabs.Animate to lag one render.
  const contextValue = value !== undefined ? value : trackedValue;

  return (
    <TabsContext.Provider value={{ value: contextValue }}>
      <BaseTabs.Root
        className={cnState(className)}
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
      className={cnState(
        "group/tabs-list relative flex items-center rounded-lg bg-muted p-1",
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
      className={cnState(
        // `rounded-md`, as the indicator: a square ring would stick past the list's `rounded-lg` corners
        "relative z-[1] inline-flex items-center justify-center rounded-md px-4 py-2 font-medium text-sm",
        ...RING_ANIMATION_CLASSES,
        "text-muted-foreground hover:text-foreground",
        "data-active:text-foreground",
        FOCUS_RING,
        // Base UI keeps a disabled tab focusable: aria-disabled, never the disabled attribute
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={cnState("mt-2", FOCUS_RING, RING_TRANSITION, className)}
      {...props}
    />
  );
}

function TabsIndicator({
  className,
  render,
  // Base UI's script places the indicator over the active tab in server HTML, so a
  // server-rendered page shows it before React hydrates
  renderBeforeHydration = true,
  ...props
}: TabsIndicatorProps) {
  // Base UI measures the active tab when it renders, and renders again when the list or a tab
  // changes content-box size. A padding change of a tab changes only its border box: the element
  // below watches that, and this render has Base UI measure the active tab again.
  const [, remeasure] = useReducer((count: number) => count + 1, 0);
  return (
    <BaseTabs.Indicator
      {...props}
      renderBeforeHydration={renderBeforeHydration}
      render={(renderProps, state) => (
        <TabsIndicatorElement
          {...renderProps}
          state={state}
          render={render}
          className={typeof className === "function" ? className(state) : className}
          onTabResize={remeasure}
        />
      )}
    />
  );
}

/** Every indicator element mounted: a list doesn't observe its tabs again when one mounts or unmounts */
const indicators = new WeakSet<Node>();
const holdsNonIndicator = (nodes: NodeList) => {
  for (const node of nodes) if (!indicators.has(node)) return true;
  return false;
};

// The same element with and without Motion, so it isn't remounted when Motion loads
function TabsIndicatorElement({
  state,
  render,
  className,
  ref,
  onTabResize,
  ...props
}: ComponentProps<"span"> & {
  state: BaseTabs.Indicator.State;
  render: PartRenderProp<BaseTabs.Indicator.State>;
  onTabResize: () => void;
}) {
  const { activeTabPosition: position, activeTabSize: size } = state;
  // While the tabs aren't rendered (display:none), Base UI measures the active tab as 0×0 and
  // hides the indicator. That is no box to animate to: shown again, it jumps to the tab.
  const box =
    position && size && size.width > 0 && size.height > 0
      ? { left: position.left, top: position.top, width: size.width, height: size.height }
      : null;

  // Only a change of the selected tab slides the indicator; Base UI measures the tab again when
  // it or the list resizes, and the indicator then jumps to it
  const selected = useContext(TabsContext)?.value;
  const { element, sliding, transition } = useIndicatorSlide<HTMLElement>(selected, box);
  const ownRef = useCallback(
    (node: HTMLElement | null) => {
      element.current = node;
      if (node) indicators.add(node);
    },
    [element],
  );
  // Observes each tab's border box and the list's border and content boxes (Base UI watches
  // content boxes only), so the indicator renders in the frame a resize happens in.
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const indicator = element.current;
    const list = indicator?.closest('[role="tablist"]');
    if (!indicator || !list) return;
    let stops: (() => void)[] = [];
    // not the tabs of a nested Tabs list
    let ownTabs: Element[] = [];
    // A new observation's first notification measures every tab: this catches tabs that mount
    // or remount
    const observeTabs = () => {
      for (const stop of stops) stop();
      ownTabs = Array.from(list.querySelectorAll('[role="tab"]')).filter(
        (tab) => tab.closest('[role="tablist"]') === list,
      );
      stops = [
        observeResize(list, "border-box", onTabResize),
        // Padding on a list sized from outside changes its content box alone
        observeResize(list, "content-box", onTabResize),
        ...ownTabs.map((tab) => observeResize(tab, "border-box", onTabResize)),
      ];
    };
    observeTabs();
    // A selection or a class/style change on the list, a tab or an element holding one measures
    // again (gap, order), and a node added or removed beside the tabs observes them again (a tab
    // mounts or unmounts). Not a change inside a tab, such as a swapped icon (its resize is
    // observed), or to the indicator, nor an indicator mounting or unmounting.
    const holdsTab = (node: Node) => node === list || ownTabs.some((tab) => node.contains(tab));
    const insideTab = (node: Node) => {
      const tab = node instanceof Element ? node.closest('[role="tab"]') : null;
      // A list inside a tab of another list has that tab above it
      return tab !== null && list.contains(tab);
    };
    const mutation = new MutationObserver((records) => {
      const outside = records.filter(({ target, type, addedNodes, removedNodes }) =>
        type === "childList"
          ? !indicator.contains(target) &&
            !insideTab(target) &&
            (holdsNonIndicator(addedNodes) || holdsNonIndicator(removedNodes))
          : // short-circuit: the indicator's own style writes are most records
            !indicator.contains(target) && holdsTab(target),
      );
      if (outside.length === 0) return;
      if (outside.some((record) => record.type === "childList")) observeTabs();
      else notifyResize(list, "border-box");
    });
    mutation.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected", "class", "style"],
    });
    return () => {
      mutation.disconnect();
      for (const stop of stops) stop();
    };
  }, [onTabResize, element]);

  const [indicatorRef, driven] = useMotionAnimate<HTMLElement>(
    box,
    { transition, clear: [...BOX_EDGES] },
    useMergedRef(ownRef, ref),
  );
  // Motion applies a jump a frame late from a ResizeObserver callback; write the box now so the
  // frame doesn't paint the old one.
  useLayoutEffect(() => {
    const node = element.current;
    if (!node || !box || !driven || sliding) return;
    for (const edge of BOX_EDGES) node.style[edge] = `${box[edge]}px`;
  }, [box, driven, sliding, element]);
  return useRenderPart(render, state, indicatorRef, {
    ...props,
    className: cn(
      "absolute rounded-md bg-background shadow-sm",
      // Dimmed as the selected tab is when disabled, in server HTML too. A controlled value or an
      // explicit defaultValue keeps a disabled tab selected.
      "group-has-[[data-active][aria-disabled=true]]/tabs-list:opacity-50",
      // The CSS fallback places the indicator from the variables Base UI sets on it, and slides
      // it to another tab with a transition. Motion writes inline values instead, and they are
      // removed when it hands back.
      !driven &&
        "top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) micro-interactions",
      // Outside a slide only the opacity fades, as the tab's does; the box jumps
      (driven || !sliding) && "transition-opacity duration-300 motion-reduce:transition-none",
      className,
    ),
  });
}

// ---------------------------------------------------------------------------
// Keys for tab values
// ---------------------------------------------------------------------------

// A React key per tab value: primitives by type and text, objects and functions by identity.
// Two symbols with the same description share a key.
const identityKeys = new WeakMap<object, number>();
let nextIdentityKey = 0;

function keyOf(value: unknown): string {
  if ((typeof value === "object" && value !== null) || typeof value === "function") {
    let id = identityKeys.get(value);
    if (id === undefined) {
      id = nextIdentityKey++;
      identityKeys.set(value, id);
    }
    return `id:${id}`;
  }
  return `${typeof value}:${String(value)}`;
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
  const safeIndex = Math.max(activeIndex, 0);

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
    const jump = !slide.current;
    if (jump) releaseValues(motion, track);
    const x = `${safeIndex * -100}%`;
    // A jump gives both keyframes, so Motion sets the value without reading the element first
    slide.current = motion.animate(
      track,
      { x: jump ? [x, x] : x },
      onMainThread(jump ? { duration: 0 } : transitionRef.current),
    );
    // On a jump, render all values, so a transform the CSS fallback removed while Motion still
    // held it comes back (reduced motion turned off at rest)
    if (jump) renderNow(motion, track);
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
    const jump = !resize.current;
    if (jump) releaseValues(motion, container);
    resize.current = motion.animate(
      container,
      { height: jump ? [height, height] : height },
      onMainThread(jump ? { duration: 0 } : transitionRef.current),
    );
    // As for the slide: a height the CSS fallback removed comes back
    if (jump) renderNow(motion, container);
  }, [m, motion, height]);

  // Stop on unmount, or Motion keeps writing to the detached elements until it settles.
  // StrictMode and <Activity> run the effects above again after this cleanup, so forget the
  // animations too: the re-run must jump to the current state like the first run, not spring.
  useLayoutEffect(
    () => () => {
      slide.current?.stop();
      resize.current?.stop();
      slide.current = null;
      resize.current = null;
    },
    [],
  );

  return (
    <div
      ref={mergedContainerRef}
      // With Motion the track can be taller than the container, and the other panels sit beside
      // it, so the container clips them. overflow:hidden would leave it scrollable, so
      // scrollIntoView or focus could scroll the active panel's top out of view. The clip margin
      // keeps a focus ring of up to 4px around the content whole; Safari has no
      // overflow-clip-margin and clips it at the edge. Without Motion only the active panel shows,
      // so nothing needs clipping. flow-root keeps a panel child's margins inside, as the Motion
      // path's flex track does, so the content doesn't move when Motion loads.
      className={cn(
        motion ? "overflow-clip [overflow-clip-margin:--spacing(1)]" : "flow-root",
        className,
      )}
      {...props}
    >
      {/* items-start: each panel keeps its own height, so the container can follow the active one.
          -mx-1 with the panels' px-1 puts 8px between panels and keeps each panel's content where
          the container is, so the clip margin shows none of the panels beside it. */}
      <div ref={trackRef} className={motion ? "-mx-1 flex items-start" : undefined}>
        {childrenArray.map((child, i) => (
          <div
            key={childValue(child) == null ? `index:${i}` : keyOf(childValue(child))}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={motion ? "w-full shrink-0 px-1" : undefined}
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

// A Base UI panel, so it is a tabpanel labelled by its tab, and the tab's aria-controls points
// to it. Tabs.Contents keeps every panel mounted and decides which shows, so the panel never
// gets the `hidden` attribute: Motion slides the inactive ones into view.
function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <BaseTabs.Panel
      className={cnState(
        // Inset, so Tabs.Contents never clips it, in browsers without overflow-clip-margin too
        "focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
        RING_TRANSITION,
        className,
      )}
      {...props}
      keepMounted
      hidden={false}
    />
  );
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
// Animate – re-keys and animates its children on tab value change (fade+rise
// default, bring-your-own initial/animate/transition). For routed tabs or around
// several <Tabs.Panel>s; a `keepMounted` panel inside remounts on every change.
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
      key={keyOf(value ?? null)}
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
  // Whether Motion has rendered a frame of the entry
  const entryShown = useRef(false);
  useLayoutEffect(() => {
    const pane = ref.current;
    if (!enterOnMount || !pane) return;
    const { m, initial, animate, transition } = enterOnMount;
    if (entryShown.current) {
      // <Activity> shows the pane again after hiding it, once Motion has rendered a frame of the entry:
      // finish the entry, don't play it again. A pane hidden before that first frame plays
      // the entry again, on purpose, as StrictMode's re-run does.
      const controls = m.animate(pane, animate as never, onMainThread({ duration: 0 }));
      return () => controls.stop();
    }
    // From each `initial` value to its `animate` value, like motion.div's initial/animate
    const keyframes = Object.fromEntries(
      Object.entries(animate).map(([name, to]) => [
        name,
        name in initial ? [initial[name], to] : to,
      ]),
    );
    const controls = m.animate(pane, keyframes as never, onMainThread(transition));
    entry.current = controls;
    const shown = () => {
      entryShown.current = true;
    };
    m.frame.postRender(shown);
    return () => {
      // StrictMode cleans up before the first frame, so its re-run still plays the entry
      m.cancelFrame(shown);
      // Stop on unmount, or Motion keeps writing to the detached pane until it settles
      controls.stop();
    };
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

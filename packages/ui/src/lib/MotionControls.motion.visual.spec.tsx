import type { HTMLProps } from "@base-ui/react/types";
import { render } from "@testing-library/react";
import { frame, type HTMLMotionProps, motion } from "motion/react";
import { Activity, Profiler, type ReactElement, type ReactNode, StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Checkbox } from "../components/checkbox";
import { Radio } from "../components/radio";
import { Switch } from "../components/switch";
import { Tabs } from "../components/tabs";
import { ToggleGroup } from "../components/toggle-group";
import {
  emulateReducedMotion,
  offBy,
  SETTLE_TIMEOUT_MS,
  untilChanged,
  waitForStable,
} from "../VisualTest.utils";
import { reloadMotion } from "./use-motion";

// Runs with reduced motion off. These controls stay mounted, so Motion must animate their
// element in place: swapping in a motion.* element when Motion loads would remount it.

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const byTestId = () => document.querySelector<HTMLElement>('[data-testid="moving"]');
const click = (selector: string) => document.querySelector<HTMLElement>(selector)?.click();
const left = (element: HTMLElement | null) => element?.getBoundingClientRect().left ?? Number.NaN;
const opacity = (element: HTMLElement | null) =>
  element ? Number(getComputedStyle(element).opacity) : Number.NaN;

// An absence window, as an animation stopped at unmount leaves nothing to wait for. One left
// running goes on writing to the detached element in Motion's frame loop, once a frame, and its
// spring has only just started, so the style changes in the first frame. 5 frames leave margin
const ABSENCE_WINDOW_FRAMES = 5;

/** A consumer's `render` prop for the part Motion animates */
type ConsumerRender = (props: HTMLProps) => ReactElement;

type Control = {
  ui: (consumerRender?: ConsumerRender) => ReactNode;
  element: () => HTMLElement | null;
  /** Changes the control with a plain DOM click, so it happens before any await */
  change: () => void;
  /** The value Motion animates, read from layout or computed style */
  measure: (element: HTMLElement | null) => number;
  /** A class the CSS fallback adds for its transition and Motion's path drops */
  fallbackClass?: string;
  /**
   * An inline property Motion writes when it takes the element and the CSS fallback removes.
   * None for ToggleGroup: React writes its box inline on both paths.
   */
  motionStyle?: string;
  /** The CSS fallback animates the change with a transition */
  cssTransition?: boolean;
  /** A class the element always has, also under a consumer's `render` */
  baseClass: string;
  /**
   * For indicators that start checked: checks the element again after `change()` unchecked
   * it, so a test can catch it animating in
   */
  toChecked?: () => void;
  /** For indicators placed by the CSS fallback: the element the indicator sits over */
  over?: () => Element | null;
};

const controls: Record<string, Control> = {
  Switch: {
    ui: (consumerRender) => (
      <Switch.Root aria-label="Notifications">
        <Switch.Thumb data-testid="moving" render={consumerRender} />
      </Switch.Root>
    ),
    element: byTestId,
    change: () => click('[role="switch"]'),
    measure: left,
    fallbackClass: "micro-interactions",
    motionStyle: "transform",
    cssTransition: true,
    baseClass: "rounded-full",
  },
  ToggleGroup: {
    ui: () => (
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>
    ),
    element: () => document.querySelector<HTMLElement>('[role="group"] > span'),
    change: () => click('[role="group"] > button:last-of-type'),
    measure: left,
    fallbackClass: "micro-interactions",
    cssTransition: true,
    baseClass: "rounded-md",
  },
  "Tabs.Indicator": {
    ui: (consumerRender) => (
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta, a longer tab</Tabs.Tab>
          <Tabs.Indicator data-testid="moving" render={consumerRender} />
        </Tabs.List>
      </Tabs.Root>
    ),
    element: byTestId,
    change: () => click('[role="tab"]:last-of-type'),
    measure: left,
    fallbackClass: "micro-interactions",
    motionStyle: "left",
    cssTransition: true,
    baseClass: "rounded-md",
    over: () => document.querySelector('[role="tab"][aria-selected="true"]'),
  },
  Radio: {
    ui: (consumerRender) => (
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator data-testid="moving" render={consumerRender} />
        </Radio.Root>
        <Radio.Root value="b" aria-label="B">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>
    ),
    element: byTestId,
    change: () => click('[aria-label="B"]'),
    measure: opacity,
    motionStyle: "opacity",
    baseClass: "justify-center",
    toChecked: () => click('[aria-label="A"]'),
  },
  Checkbox: {
    ui: (consumerRender) => (
      <Checkbox.Root aria-label="Subscribe" defaultChecked>
        <Checkbox.Indicator data-testid="moving" render={consumerRender} />
      </Checkbox.Root>
    ),
    element: byTestId,
    change: () => click('[role="checkbox"]'),
    measure: opacity,
    motionStyle: "opacity",
    baseClass: "justify-center",
    toChecked: () => click('[role="checkbox"]'),
  },
};

const names = Object.keys(controls);
const control = (name: string) => controls[name] as Control;
const transitioned = names.filter((name) => control(name).cssTransition);
const withRenderProp = names.filter((name) => name !== "ToggleGroup");

async function sample(measure: () => number, frames: number) {
  const values: number[] = [];
  for (let frame = 0; frame < frames; frame++) {
    await nextFrame();
    values.push(measure());
  }
  return values;
}

/** Some sampled values lie strictly between where the change started and where it ended */
function expectInBetween(start: number, values: number[]) {
  const end = values.at(-1) ?? start;
  expect(Math.abs(end - start)).toBeGreaterThan(0.5);
  expect(values.some((value) => (value - start) * (value - end) < 0)).toBe(true);
}

/**
 * The value once three reads in a row, a frame apart, match, so one stalled frame mid-spring
 * can't pass for settled
 */
async function settled(read: () => number) {
  let previous = read();
  let same = 0;
  for (let frame = 0; frame < 120; frame++) {
    await nextFrame();
    const value = read();
    same = value === previous ? same + 1 : 0;
    if (same === 2) return value;
    previous = value;
  }
  throw new Error(`Still changing after 120 frames, at ${previous}`);
}

/**
 * The hook handed the element back to the CSS fallback: its class is back, or the inline opacity
 * is gone. That lands after the media query's change event, so poll for it.
 */
function handedBack({ element, fallbackClass }: Control) {
  const node = element();
  if (!node) return false;
  return fallbackClass ? node.classList.contains(fallbackClass) : node.style.opacity === "";
}

/**
 * Motion drives the element and has written its values: the fallback class is gone and the
 * inline property Motion sets is there. A control mounted after Motion loaded drops the class
 * on its first render; Motion's first write lands a frame later.
 */
function driven({ element, fallbackClass, motionStyle }: Control) {
  const node = element();
  if (!node) return false;
  if (fallbackClass && node.classList.contains(fallbackClass)) return false;
  return !motionStyle || node.style.getPropertyValue(motionStyle) !== "";
}

/** The element covers the one it sits over, every edge within a pixel */
function expectOver({ element, over }: Control) {
  if (!over) return;
  expect(offBy(over() as Element, element() as Element)).toBeLessThanOrEqual(1);
}

/** What the CSS fallback leaves on the element, compared between two renders */
function snapshot({ element, measure }: Control) {
  const node = element();
  return {
    present: node !== null,
    // An emptied style attribute and no style attribute render the same
    style: node?.getAttribute("style") || null,
    className: node?.className ?? null,
    position: measure === left ? measure(node) : null,
  };
}

afterEach(() => emulateReducedMotion(false));

// Holds Motion back until the test lets it arrive
function motionLoading() {
  let arrive = () => {};
  const loaded = reloadMotion(
    new Promise<void>((resolve) => {
      arrive = resolve;
    }),
  );
  return {
    async arrive() {
      arrive();
      await loaded;
    },
  };
}

describe("controls when Motion loads", () => {
  it.each(names)("keeps the %s element and animates it once Motion arrives", async (name) => {
    const subject = control(name);
    const { ui, element, change, measure } = subject;
    const motion = motionLoading();
    render(ui());
    await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
    const before = element();

    await motion.arrive();
    await expect.poll(() => driven(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
    expect(element()).toBe(before);
    // Motion took over: a change now animates
    const start = measure(element());
    change();
    expectInBetween(start, await sample(() => measure(element()), 40));
  });

  // Changed just before Motion arrives: the CSS transition runs to the end before Motion takes over
  it.each(transitioned)("slides a %s changed while Motion loads", async (name) => {
    const { ui, element, change, measure, fallbackClass } = control(name);
    const motion = motionLoading();
    render(ui());
    await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
    // At rest on the CSS fallback before the change
    const start = await settled(() => measure(element()));
    change();
    // The CSS transition has started, so Motion arrives mid-way through it
    await untilChanged(() => measure(element()));
    // Read before Motion arrives, so a jump back in the commit Motion arrives in is a step back
    const moving = measure(element());
    await motion.arrive();
    const values = await sample(() => measure(element()), 40);
    const end = values.at(-1) ?? start;
    expect(Math.abs(end - start)).toBeGreaterThan(4);
    // It slides on from where it was when Motion arrived: a frame shows it between there and the
    // end, where a jump to the end shows none. No bound on one frame's step: ToggleGroup's slide
    // covers 41% of the way in its first two frames and 61% in three, so one late frame passed
    // for a jump (#625)
    expectInBetween(moving, values);
    // Only ever toward the end: a jump back is a step the other way
    const path = [start, moving, ...values];
    expect(path).toEqual([...path].sort((a, b) => (a - b) * Math.sign(end - start)));
    if (fallbackClass) expect(element()).not.toHaveClass(fallbackClass);
  });

  // Motion never arrives: the CSS transition alone brings the indicator over the new tab
  it("places a Tabs.Indicator over the new tab with the CSS transition alone", async () => {
    const subject = control("Tabs.Indicator");
    motionLoading();
    render(subject.ui());
    await expect.poll(subject.element, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
    const start = left(subject.element());
    subject.change();
    await expect
      .poll(() => left(subject.element()), { timeout: SETTLE_TIMEOUT_MS })
      .not.toBe(start);
    await settled(() => left(subject.element()));
    expect(subject.element()).toHaveClass("micro-interactions");
    expectOver(subject);
  });

  it("hands N controls over to Motion in one commit", async () => {
    const motion = motionLoading();
    const onFallback = () =>
      document.querySelectorAll('[data-testid="thumb"].micro-interactions').length;
    let commits = 0;
    render(
      <Profiler id="switches" onRender={() => commits++}>
        {Array.from({ length: 20 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
          <Switch.Root key={i} aria-label={`Switch ${i}`}>
            <Switch.Thumb data-testid="thumb" />
          </Switch.Root>
        ))}
      </Profiler>,
    );
    // All mounted on the CSS fallback, and their mount commits done
    await expect.poll(onFallback, { timeout: SETTLE_TIMEOUT_MS }).toBe(20);
    await settled(() => commits);
    commits = 0;
    await motion.arrive();
    await expect.poll(onFallback, { timeout: SETTLE_TIMEOUT_MS }).toBe(0);
    // Every switch handed over, in one commit for Motion arriving and one for the hand-off
    expect(await settled(() => commits)).toBeLessThanOrEqual(2);
  });
});

describe("controls once Motion has loaded", () => {
  /** Renders `ui` with Motion loaded; resolves once Motion drives `subject` and it rests */
  async function renderSettled(ui: ReactNode, subject: Control) {
    await reloadMotion();
    const result = render(ui);
    await expect.poll(() => driven(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
    await settled(() => subject.measure(subject.element()));
    return result;
  }

  it.each(names)("animates a %s change through in-between values", async (name) => {
    const subject = control(name);
    const { ui, element, change, measure } = subject;
    await renderSettled(ui(), subject);
    const start = measure(element());
    change();
    expectInBetween(start, await sample(() => measure(element()), 40));
  });

  it.each(withRenderProp)(
    "keeps the %s classes and animation under a consumer's render prop",
    async (name) => {
      const subject = control(name);
      const { ui, element, change, measure, baseClass } = subject;
      await renderSettled(
        ui((props) => <span {...props} data-consumer="" />),
        subject,
      );
      expect(element()).toHaveAttribute("data-consumer");
      expect(element()).toHaveClass(baseClass);
      const start = measure(element());
      change();
      expectInBetween(start, await sample(() => measure(element()), 40));
    },
  );

  it.each(names)("stops writing to a %s element unmounted mid-animation", async (name) => {
    const subject = control(name);
    const { ui, element, change, measure } = subject;
    const { unmount } = await renderSettled(ui(), subject);
    change();
    // Mid-animation: Motion has moved it from where it rested
    await untilChanged(() => measure(element()));
    const moving = element() as HTMLElement;
    unmount();
    // Stopping may write the value it stopped at once; after that nothing changes
    await nextFrame();
    const style = moving.getAttribute("style");
    for (let frame = 0; frame < ABSENCE_WINDOW_FRAMES; frame++) {
      await nextFrame();
      expect(moving.getAttribute("style")).toBe(style);
    }
  });

  it.each(names)(
    "finishes a %s animation when reduced motion turns on, as the CSS fallback renders it",
    async (name) => {
      const subject = control(name);
      const { unmount } = await renderSettled(subject.ui(), subject);
      subject.change();
      if (subject.toChecked) {
        // Radio and Checkbox: once faded out, animate the indicator in, so it is still there
        // at the end
        await expect.poll(() => opacity(subject.element()), { timeout: SETTLE_TIMEOUT_MS }).toBe(0);
        subject.toChecked();
      }
      // Mid-animation: Motion has moved it from where it rested
      await untilChanged(() => subject.measure(subject.element()));
      await emulateReducedMotion(true);
      await expect.poll(() => handedBack(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
      const finished = snapshot(subject);
      expect(finished.present).toBe(true);
      expectOver(subject);
      unmount();

      render(subject.ui());
      subject.change();
      subject.toChecked?.();
      expect(await waitForStable(() => snapshot(subject))).toEqual(finished);
    },
  );

  // <Activity> cleans the effects up while hidden, and the hook forgets the element it animated
  it.each(["Switch", "Tabs.Indicator"])(
    "shows a %s as the CSS fallback renders it when reduced motion turned on while hidden",
    async (name) => {
      const subject = control(name);
      const { element, measure } = subject;
      const ui = (mode: "visible" | "hidden") => <Activity mode={mode}>{subject.ui()}</Activity>;
      const { rerender, unmount } = await renderSettled(ui("visible"), subject);
      const start = measure(element());
      subject.change();
      // Hidden only once Motion has moved it and come to rest
      await expect.poll(() => measure(element()), { timeout: SETTLE_TIMEOUT_MS }).not.toBe(start);
      await settled(() => measure(element()));
      rerender(ui("hidden"));
      await emulateReducedMotion(true);
      rerender(ui("visible"));
      await expect.poll(() => handedBack(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
      const shown = await waitForStable(() => snapshot(subject));
      expectOver(subject);
      unmount();

      render(subject.ui());
      subject.change();
      expect(await waitForStable(() => snapshot(subject))).toEqual(shown);
    },
  );

  it.each(["Radio", "Checkbox"])(
    "keeps an unchecked %s indicator mounted only while Motion drives it",
    async (name) => {
      const subject = control(name);
      const { ui, element, change } = subject;
      await renderSettled(ui(), subject);
      change();
      // Motion fades the indicator out and keeps it mounted at opacity 0 (NaN once unmounted)
      await expect.poll(() => opacity(element()), { timeout: SETTLE_TIMEOUT_MS }).toBe(0);

      await emulateReducedMotion(true);
      await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).toBeNull();

      await emulateReducedMotion(false);
      await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
      expect(await waitForStable(() => opacity(element()))).toBe(0);
    },
  );

  it("morphs the Checkbox mark between check and minus", async () => {
    const checkbox = (indeterminate: boolean) => (
      <Checkbox.Root aria-label="Subscribe" checked indeterminate={indeterminate}>
        <Checkbox.Indicator data-testid="moving" />
      </Checkbox.Root>
    );
    const { rerender } = await renderSettled(checkbox(false), control("Checkbox"));
    const path = document.querySelector("path") as SVGPathElement;
    const check = path.getAttribute("d");

    rerender(checkbox(true));
    const shapes = new Set<string | null>();
    for (let frame = 0; frame < 30; frame++) {
      await nextFrame();
      shapes.add(path.getAttribute("d"));
    }
    shapes.delete(check);
    // In-between shapes before the minus, not a single swap
    expect(shapes.size).toBeGreaterThan(1);
  });

  // StrictMode (and <Activity> hide/show) runs effects, cleans them up and runs them again.
  // The re-run must jump to the values like the first run, not animate into them.
  it.each([
    ["a checked Switch", "Switch", true, left],
    ["an unchecked Checkbox", "Checkbox", false, opacity],
  ] as const)("shows %s at rest under StrictMode", async (_, name, checked, measure) => {
    const subject = control(name);
    await reloadMotion();
    render(
      <StrictMode>
        {name === "Switch" ? (
          <Switch.Root aria-label="Notifications" defaultChecked={checked}>
            <Switch.Thumb data-testid="moving" />
          </Switch.Root>
        ) : (
          <Checkbox.Root aria-label="Subscribe" defaultChecked={checked}>
            <Checkbox.Indicator data-testid="moving" />
          </Checkbox.Root>
        )}
      </StrictMode>,
    );
    // Motion has written the values the re-run must keep
    await expect.poll(() => driven(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
    const values = await sample(() => measure(byTestId()), 10);
    expect(new Set(values).size).toBe(1);
  });

  // Turning reduced motion off again hands the element back to Motion, which must put back
  // the values it removed when the CSS fallback took over. Only these two lose their place
  // without those values, as Motion's path drops the classes that place them: Radio and
  // Checkbox end at the fallback's opacity, and React keeps ToggleGroup's style.
  it.each(["Switch", "Tabs.Indicator"])(
    "puts a %s back when reduced motion turns off again",
    async (name) => {
      const subject = control(name);
      const { ui, element, change, measure, fallbackClass = "" } = subject;
      await renderSettled(ui(), subject);
      const start = measure(element());
      change();
      await expect.poll(() => measure(element()), { timeout: SETTLE_TIMEOUT_MS }).not.toBe(start);
      // To the pixel: a spring at rest can be a fraction short
      const before = Math.round(await settled(() => measure(element())));

      await emulateReducedMotion(true);
      await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).toHaveClass(fallbackClass);
      expectOver(subject);
      await emulateReducedMotion(false);
      await expect.poll(element, { timeout: SETTLE_TIMEOUT_MS }).not.toHaveClass(fallbackClass);
      expect(Math.round(await settled(() => measure(element())))).toBe(before);
    },
  );

  // A consumer's motion.* element shares its VisualElement with the hook: going back to the
  // CSS fallback and to Motion again must leave that element animating
  it("keeps a consumer's motion.span animating after reduced motion turns on and off", async () => {
    const ui = (faded: boolean) => (
      <Switch.Root aria-label="Notifications" defaultChecked>
        <Switch.Thumb
          data-testid="moving"
          render={(props) => (
            <motion.span
              {...(props as HTMLMotionProps<"span">)}
              animate={{ opacity: faded ? 0.3 : 1 }}
              transition={{ duration: 0 }}
            />
          )}
        />
      </Switch.Root>
    );
    const subject = control("Switch");
    const { rerender } = await renderSettled(ui(false), subject);
    const before = left(byTestId());

    await emulateReducedMotion(true);
    await expect.poll(() => handedBack(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
    await emulateReducedMotion(false);
    await expect.poll(() => driven(subject), { timeout: SETTLE_TIMEOUT_MS }).toBe(true);
    expect(left(byTestId())).toBe(before);
    rerender(ui(true));
    await expect.poll(() => opacity(byTestId()), { timeout: SETTLE_TIMEOUT_MS }).toBe(0.3);
  });

  // <Activity> hidden and shown again in the frame Motion arrives: the first hand-off is
  // cancelled and a second one starts before Motion writes
  it("keeps a Switch thumb in place when its hand-off is cancelled and restarted", async () => {
    const motion = motionLoading();
    const ui = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <Switch.Root aria-label="Notifications" defaultChecked>
          <Switch.Thumb data-testid="moving" />
        </Switch.Root>
      </Activity>
    );
    const { rerender } = render(ui("visible"));
    await expect.poll(byTestId, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
    const resting = await settled(() => left(byTestId()));

    await motion.arrive();
    rerender(ui("hidden"));
    rerender(ui("visible"));
    await expect
      .poll(byTestId, { timeout: SETTLE_TIMEOUT_MS })
      .not.toHaveClass("micro-interactions");
    expect(await settled(() => left(byTestId()))).toBe(resting);
  });

  // Shown again from a post-render callback that runs before the cancelled hand-off's undo in
  // the same step: cancelling the undo is too late there, so it must see it is stale and skip
  it("keeps a Switch thumb in place when a cancelled hand-off's undo runs after the next one", async () => {
    const motion = motionLoading();
    const ui = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <Switch.Root aria-label="Notifications" defaultChecked>
          <Switch.Thumb data-testid="moving" />
        </Switch.Root>
      </Activity>
    );
    const { rerender } = render(ui("visible"));
    await expect.poll(byTestId, { timeout: SETTLE_TIMEOUT_MS }).not.toBeNull();
    const resting = await settled(() => left(byTestId()));

    await motion.arrive();
    frame.postRender(() => rerender(ui("visible")));
    rerender(ui("hidden"));
    const values = await sample(() => left(byTestId()), 20);
    expect(byTestId()).not.toHaveClass("micro-interactions");
    expect(new Set(values)).toEqual(new Set([resting]));
  });
});

import type { HTMLProps } from "@base-ui/react/types";
import { render } from "@testing-library/react";
import { Activity, Profiler, type ReactElement, type ReactNode, StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Checkbox } from "../components/checkbox";
import { Radio } from "../components/radio";
import { Switch } from "../components/switch";
import { Tabs } from "../components/tabs";
import { ToggleGroup } from "../components/toggle-group";
import { reloadMotion } from "./use-motion";

// Runs with reduced motion off. These controls stay mounted, so Motion must animate their
// element in place: swapping in a motion.* element when Motion loads would remount it.

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const byTestId = () => document.querySelector<HTMLElement>('[data-testid="moving"]');
const click = (selector: string) => document.querySelector<HTMLElement>(selector)?.click();
const left = (element: HTMLElement | null) => element?.getBoundingClientRect().left ?? Number.NaN;
const opacity = (element: HTMLElement | null) =>
  element ? Number(getComputedStyle(element).opacity) : Number.NaN;

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
  /** The CSS fallback animates the change with a transition */
  cssTransition?: boolean;
  /** A class the element always has, also under a consumer's `render` */
  baseClass: string;
  /**
   * For indicators that start checked: checks the element again after `change()` unchecked
   * it, so a test can catch it animating in
   */
  toChecked?: () => void;
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
    baseClass: "rounded-md",
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

const reducedMotion = async (reduce: boolean) => {
  await commands.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
  // Motion and the components read the preference from the media query's change event
  await nextFrame();
  await nextFrame();
};

afterEach(() => reducedMotion(false));

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
    const { ui, element, change, measure, fallbackClass } = control(name);
    const motion = motionLoading();
    render(ui());
    await expect.poll(element).not.toBeNull();
    const before = element();

    await motion.arrive();
    await wait(100);
    expect(element()).toBe(before);
    if (fallbackClass) expect(element()).not.toHaveClass(fallbackClass);
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
    await expect.poll(element).not.toBeNull();
    await wait(100);
    const start = measure(element());
    change();
    await nextFrame();
    await motion.arrive();
    const values = await sample(() => measure(element()), 40);
    const end = values.at(-1) ?? start;
    const travel = Math.abs(end - start);
    expect(travel).toBeGreaterThan(4);
    const steps = values.map((value, i) =>
      Math.abs(value - (i === 0 ? start : (values[i - 1] ?? 0))),
    );
    expect(Math.max(...steps)).toBeLessThan(travel / 2);
    expect(element()).not.toHaveClass(fallbackClass ?? "");
  });

  it("hands N controls over to Motion in one commit", async () => {
    const motion = motionLoading();
    let commits = 0;
    render(
      <Profiler id="switches" onRender={() => commits++}>
        {Array.from({ length: 20 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
          <Switch.Root key={i} aria-label={`Switch ${i}`}>
            <Switch.Thumb />
          </Switch.Root>
        ))}
      </Profiler>,
    );
    await wait(100);
    commits = 0;
    await motion.arrive();
    await wait(100);
    // One commit for Motion arriving, one for the hand-off; not one per switch
    expect(commits).toBeLessThanOrEqual(2);
  });
});

describe("controls once Motion has loaded", () => {
  async function renderSettled(ui: ReactNode) {
    await reloadMotion();
    const result = render(ui);
    await wait(300);
    return result;
  }

  it.each(names)("animates a %s change through in-between values", async (name) => {
    const { ui, element, change, measure } = control(name);
    await renderSettled(ui());
    const start = measure(element());
    change();
    expectInBetween(start, await sample(() => measure(element()), 40));
  });

  it.each(withRenderProp)(
    "keeps the %s classes and animation under a consumer's render prop",
    async (name) => {
      const { ui, element, change, measure, baseClass } = control(name);
      await renderSettled(ui((props) => <span {...props} data-consumer="" />));
      expect(element()).toHaveAttribute("data-consumer");
      expect(element()).toHaveClass(baseClass);
      const start = measure(element());
      change();
      expectInBetween(start, await sample(() => measure(element()), 40));
    },
  );

  it.each(names)("stops writing to a %s element unmounted mid-animation", async (name) => {
    const { ui, element, change } = control(name);
    const { unmount } = await renderSettled(ui());
    change();
    await nextFrame();
    await nextFrame();
    const moving = element() as HTMLElement;
    unmount();
    // Stopping may write the value it stopped at once; after that nothing changes
    await nextFrame();
    const style = moving.getAttribute("style");
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(moving.getAttribute("style")).toBe(style);
    }
  });

  it.each(names)(
    "finishes a %s animation when reduced motion turns on, as the CSS fallback renders it",
    async (name) => {
      const subject = control(name);
      const { unmount } = await renderSettled(subject.ui());
      subject.change();
      await nextFrame();
      await nextFrame();
      await reducedMotion(true);
      const finished = snapshot(subject);
      unmount();

      render(subject.ui());
      subject.change();
      await wait(100);
      expect(finished).toEqual(snapshot(subject));
    },
  );

  it.each(["Radio", "Checkbox"])(
    "keeps an unchecked %s indicator mounted only while Motion drives it",
    async (name) => {
      const { ui, element, change } = control(name);
      await renderSettled(ui());
      change();
      await wait(300);
      expect(element()).not.toBeNull();
      expect(opacity(element())).toBe(0);

      await reducedMotion(true);
      expect(element()).toBeNull();

      await reducedMotion(false);
      await wait(100);
      expect(element()).not.toBeNull();
      expect(opacity(element())).toBe(0);
    },
  );

  it("morphs the Checkbox mark between check and minus", async () => {
    const checkbox = (indeterminate: boolean) => (
      <Checkbox.Root aria-label="Subscribe" checked indeterminate={indeterminate}>
        <Checkbox.Indicator />
      </Checkbox.Root>
    );
    const { rerender } = await renderSettled(checkbox(false));
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
    await nextFrame();
    const values = await sample(() => measure(byTestId()), 10);
    expect(new Set(values).size).toBe(1);
  });

  // Turning reduced motion off again hands the element back to Motion, which must put back
  // the values it removed when the CSS fallback took over
  it.each(names)("puts a %s back when reduced motion turns off again", async (name) => {
    const subject = control(name);
    await renderSettled(subject.ui());
    // Radio and Checkbox start checked; move the others off their starting place
    if (!subject.toChecked) subject.change();
    await wait(400);
    // To the pixel, or the hundredth of opacity: a spring at rest can be a fraction short
    const at = () => ({
      present: subject.element() !== null,
      value: Number(subject.measure(subject.element()).toFixed(subject.measure === left ? 0 : 2)),
    });
    const before = at();

    await reducedMotion(true);
    await reducedMotion(false);
    await wait(400);
    expect(at()).toEqual(before);
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
    await wait(100);
    const resting = left(byTestId());

    await motion.arrive();
    rerender(ui("hidden"));
    rerender(ui("visible"));
    await wait(300);
    expect(byTestId()).not.toHaveClass("micro-interactions");
    expect(left(byTestId())).toBe(resting);
  });
});

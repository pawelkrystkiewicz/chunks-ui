import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Radio } from "../components/radio";
import { Switch } from "../components/switch";
import { Tabs } from "../components/tabs";
import { ToggleGroup } from "../components/toggle-group";
import { reloadMotion } from "./use-motion";

// Runs with reduced motion off. These controls stay mounted, so Motion must animate their
// element in place: swapping in a motion.* element when Motion loads would remount it.

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const byTestId = () => document.querySelector<HTMLElement>('[data-testid="moving"]');
const click = (selector: string) => document.querySelector<HTMLElement>(selector)?.click();
const left = (element: HTMLElement | null) => element?.getBoundingClientRect().left ?? Number.NaN;
const opacity = (element: HTMLElement | null) =>
  element ? Number(getComputedStyle(element).opacity) : Number.NaN;

type Control = {
  ui: ReactNode;
  element: () => HTMLElement | null;
  /** Changes the control with a plain DOM click, so it happens before any await */
  change: () => void;
  /** The value Motion animates, read from layout or computed style */
  measure: (element: HTMLElement | null) => number;
  /** The CSS fallback animates the change with a transition */
  cssTransition?: boolean;
};

const controls: Record<string, Control> = {
  Switch: {
    ui: (
      <Switch.Root aria-label="Notifications">
        <Switch.Thumb data-testid="moving" />
      </Switch.Root>
    ),
    element: byTestId,
    change: () => click('[role="switch"]'),
    measure: left,
    cssTransition: true,
  },
  ToggleGroup: {
    ui: (
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>
    ),
    element: () => document.querySelector<HTMLElement>('[role="group"] > span'),
    change: () => click('[role="group"] > button:last-of-type'),
    measure: left,
    cssTransition: true,
  },
  "Tabs.Indicator": {
    ui: (
      <Tabs.Root defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta, a longer tab</Tabs.Tab>
          <Tabs.Indicator data-testid="moving" />
        </Tabs.List>
      </Tabs.Root>
    ),
    element: byTestId,
    change: () => click('[role="tab"]:last-of-type'),
    measure: left,
  },
  Radio: {
    ui: (
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="A">
          <Radio.Indicator data-testid="moving" />
        </Radio.Root>
        <Radio.Root value="b" aria-label="B">
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>
    ),
    element: byTestId,
    change: () => click('[aria-label="B"]'),
    measure: opacity,
  },
};

const names = Object.keys(controls);
const control = (name: string) => controls[name] as Control;
const transitioned = names.filter((name) => control(name).cssTransition);

async function sample(measure: () => number, frames: number) {
  const values: number[] = [];
  for (let frame = 0; frame < frames; frame++) {
    await nextFrame();
    values.push(measure());
  }
  return values;
}

afterEach(async () => {
  await commands.emulateMedia({ reducedMotion: "no-preference" });
  // Motion reads the preference from the media query's change event
  await nextFrame();
});

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
  it.each(names)("keeps the %s element when Motion finishes loading", async (name) => {
    const { ui, element } = control(name);
    const motion = motionLoading();
    render(ui);
    await expect.poll(element).not.toBeNull();
    const before = element();

    await motion.arrive();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(element()).toBe(before);
  });

  // Changed just before Motion arrives: the CSS transition runs to the end before Motion takes over
  it.each(transitioned)("slides a %s changed while Motion loads", async (name) => {
    const { ui, element, change, measure } = control(name);
    const motion = motionLoading();
    render(ui);
    await expect.poll(element).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 100));
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
  });
});

describe("controls once Motion has loaded", () => {
  async function renderSettled(name: string) {
    await reloadMotion();
    const result = render(control(name).ui);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return result;
  }

  it.each(names)("animates a %s change through in-between values", async (name) => {
    const { element, change, measure } = control(name);
    await renderSettled(name);
    const start = measure(element());
    change();
    const values = await sample(() => measure(element()), 40);
    const end = values.at(-1) ?? start;
    expect(Math.abs(end - start)).toBeGreaterThan(0.5);
    const between = (value: number) => (value - start) * (value - end) < 0;
    expect(values.some(between)).toBe(true);
  });

  it.each(transitioned)("stops writing to a %s element unmounted mid-animation", async (name) => {
    const { element, change } = control(name);
    const { unmount } = await renderSettled(name);
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

  it.each(transitioned)(
    "finishes a %s animation at once when reduced motion turns on",
    async (name) => {
      const { element, change, measure } = control(name);
      await renderSettled(name);
      change();
      await nextFrame();
      await nextFrame();
      const midway = measure(element());
      await commands.emulateMedia({ reducedMotion: "reduce" });
      await nextFrame();
      await nextFrame();
      const settled = measure(element());
      expect(settled).not.toBe(midway);
      // At rest: nothing moves in the frames after
      expect(await sample(() => measure(element()), 5)).toEqual([
        settled,
        settled,
        settled,
        settled,
        settled,
      ]);
    },
  );
});

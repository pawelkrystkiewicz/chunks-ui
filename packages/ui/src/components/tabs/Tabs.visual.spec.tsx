import { DirectionProvider } from "@base-ui/react/direction-provider";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import {
  insetsWithin,
  renderFixture,
  SMALL_FEATURE_SCREENSHOT,
  waitForStable,
} from "../../VisualTest.utils";
import { Tabs } from "./index";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const activeTab = () => document.querySelector('[role="tab"][aria-selected="true"]') as Element;
const indicator = () => document.querySelector('[data-testid="indicator"]') as Element;
/** The largest distance between an edge of the indicator and the same edge of the active tab */
const offset = () =>
  Math.max(...Object.values(insetsWithin(activeTab(), indicator())).map(Math.abs));

/** Waits for the indicator to come to rest, then checks it covers the active tab within 1px */
async function expectIndicatorOverActiveTab() {
  await waitForStable(offset);
  expect(offset()).toBeLessThanOrEqual(1);
}

describe("Tabs", () => {
  it("horizontal", async () => {
    const { fixture } = await renderFixture(
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Account</Tabs.Tab>
          <Tabs.Tab value="tab-2">Security</Tabs.Tab>
          <Tabs.Tab value="tab-3">Notifications</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">Account settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Security settings content.</p>
          </Tabs.Content>
          <Tabs.Content value="tab-3">
            <p className="p-4">Notification preferences.</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  it("vertical", async () => {
    const { fixture } = await renderFixture(
      <Tabs.Root defaultValue="tab-1" orientation="vertical">
        <Tabs.List>
          <Tabs.Tab value="tab-1">General</Tabs.Tab>
          <Tabs.Tab value="tab-2">Advanced</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Contents>
          <Tabs.Content value="tab-1">
            <p className="p-4">General settings</p>
          </Tabs.Content>
          <Tabs.Content value="tab-2">
            <p className="p-4">Advanced settings</p>
          </Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  // Runs with reduced motion, so the indicator renders the CSS fallback without a transition
  it.each(["horizontal", "vertical"] as const)(
    "places the indicator over the active tab, %s",
    async (orientation) => {
      await renderFixture(
        <Tabs.Root defaultValue="tab-1" orientation={orientation}>
          <Tabs.List>
            <Tabs.Tab value="tab-1">General</Tabs.Tab>
            <Tabs.Tab value="tab-2">Advanced settings</Tabs.Tab>
            <Tabs.Indicator data-testid="indicator" />
          </Tabs.List>
        </Tabs.Root>,
      );
      await expect.poll(offset).toBeLessThanOrEqual(1);

      const clicked = document.querySelector('[role="tab"]:last-of-type') as HTMLElement;
      clicked.click();
      await nextFrame();
      expect(clicked).toHaveAttribute("aria-selected", "true");
      expect(indicator().getAnimations()).toHaveLength(0);
      expect(offset()).toBeLessThanOrEqual(1);
    },
  );
});

const PATHS = [
  // Motion is a dev dependency of this package. With no reduced-motion preference it drives the
  // indicator and writes `left`, `top`, `width` and `height` inline.
  { path: "Motion", reducedMotion: false },
  // With reduced motion the indicator keeps the CSS fallback, as it does without Motion
  { path: "CSS fallback", reducedMotion: true },
] as const;

/** Waits until the indicator is on the path: Motion drops the CSS fallback's transition class */
const onPath = (reducedMotion: boolean) =>
  expect
    .poll(() => indicator().classList.contains("micro-interactions"), { timeout: 5000 })
    .toBe(reducedMotion);

/** Where the indicator's `::after` line is drawn, in viewport px */
function underline() {
  const box = indicator().getBoundingClientRect();
  const line = getComputedStyle(indicator(), "::after");
  const left = box.left + Number.parseFloat(line.left);
  const top = box.top + Number.parseFloat(line.top);
  const width = Number.parseFloat(line.width);
  const height = Number.parseFloat(line.height);
  return { content: line.content, left, right: left + width, bottom: top + height, height };
}

async function expectUnderlineBelowActiveTab() {
  await expectIndicatorOverActiveTab();
  // The pill is gone: only the line shows
  expect(getComputedStyle(indicator()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  const tab = activeTab().getBoundingClientRect();
  const line = underline();
  expect(line.content).not.toBe("none");
  expect(line.height).toBe(2);
  expect(Math.abs(line.left - tab.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(line.right - tab.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(line.bottom - tab.bottom)).toBeLessThanOrEqual(1);
}

// The underline recipe in tabs.mdx. Motion's inline values override position and size classes
// on the indicator, so the recipe keeps the indicator box and draws the line inside it.
describe.each(PATHS)("Tabs.Indicator restyled as an underline, $path", ({ reducedMotion }) => {
  beforeAll(() =>
    commands.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" }),
  );
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it("draws a line along the bottom of the active tab", async () => {
    await renderFixture(
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List className="rounded-none border-border border-b bg-transparent p-0">
          <Tabs.Tab value="tab-1">General</Tabs.Tab>
          <Tabs.Tab value="tab-2">Advanced settings</Tabs.Tab>
          <Tabs.Indicator
            data-testid="indicator"
            className="rounded-none bg-transparent shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
          />
        </Tabs.List>
      </Tabs.Root>,
    );
    await onPath(reducedMotion);
    await expectUnderlineBelowActiveTab();

    (document.querySelector('[role="tab"]:last-of-type') as HTMLElement).click();
    await expect.poll(() => activeTab().textContent).toBe("Advanced settings");
    await expectUnderlineBelowActiveTab();
  });
});

// Wide enough together to overflow the 240px list below
const MANY_TABS = ["Overview", "Analytics", "Reports", "Notifications", "Integrations", "Billing"];

describe.each(PATHS)("Tabs.Indicator over the active tab, $path", ({ reducedMotion }) => {
  beforeAll(() =>
    commands.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" }),
  );
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  // Base UI measures `--active-tab-left` from physical rects. Placing the indicator with an
  // inline-start property, or from `--active-tab-right`, would mirror it here.
  it("covers it in a right-to-left list", async () => {
    const { getByRole } = await renderFixture(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Tabs.Root defaultValue="tab-1">
            <Tabs.List>
              <Tabs.Tab value="tab-1">General</Tabs.Tab>
              <Tabs.Tab value="tab-2">Advanced settings</Tabs.Tab>
              <Tabs.Indicator data-testid="indicator" />
            </Tabs.List>
          </Tabs.Root>
        </div>
      </DirectionProvider>,
    );
    const first = getByRole("tab", { name: "General" });
    const second = getByRole("tab", { name: "Advanced settings" });
    // Right to left: the first tab is on the right
    expect(first.getBoundingClientRect().left).toBeGreaterThan(second.getBoundingClientRect().left);
    await onPath(reducedMotion);
    await expectIndicatorOverActiveTab();

    await userEvent.click(second);
    await expect.poll(activeTab).toBe(second);
    await expectIndicatorOverActiveTab();
  });

  // The indicator sits inside the scrolling list, so it has to be placed in the list's scrolled
  // content, not where the tab shows in the viewport
  it("covers it in a scrolled list, after scrollIntoView and after a click", async () => {
    const { getByRole } = await renderFixture(
      <Tabs.Root defaultValue={MANY_TABS[0]} style={{ width: 240 }}>
        <Tabs.List className="overflow-x-auto">
          {MANY_TABS.map((name) => (
            <Tabs.Tab key={name} value={name}>
              {name}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>,
    );
    const list = getByRole("tablist");
    const last = getByRole("tab", { name: MANY_TABS.at(-1) });
    // Off-screen: past the list's right edge
    expect(last.getBoundingClientRect().left).toBeGreaterThan(list.getBoundingClientRect().right);
    await onPath(reducedMotion);
    await expectIndicatorOverActiveTab();

    last.scrollIntoView({ block: "nearest", inline: "nearest" });
    await expect.poll(() => list.scrollLeft).toBeGreaterThan(0);
    // The first tab, still active, scrolled out of view with the indicator over it
    await expectIndicatorOverActiveTab();

    await userEvent.click(last);
    await expect.poll(activeTab).toBe(last);
    expect(list.scrollLeft).toBeGreaterThan(0);
    await expectIndicatorOverActiveTab();
  });
});

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import {
  boxOf,
  emulateReducedMotion,
  expectDimmed,
  focusVisible,
  offBy,
  renderFixture,
  waitForStable,
} from "../../VisualTest.utils";
import { Tabs, type TabsRootProps } from "./index";

const activeTab = () => document.querySelector('[role="tab"][aria-selected="true"]') as Element;
const indicator = () => document.querySelector('[data-testid="indicator"]') as Element;
/** The largest distance between an edge of the indicator and the same edge of the active tab */
const offset = () => offBy(activeTab(), indicator());

/** Waits for the indicator to come to rest, then checks it covers the active tab within 1px */
async function expectIndicatorOverActiveTab() {
  await waitForStable(offset);
  expect(offset()).toBeLessThanOrEqual(1);
}

const opacityOf = (el: Element) => getComputedStyle(el).opacity;

/** Two tabs, the second disabled unless `disabled` is false; `root` selects one */
const disabledSelected = ({
  disabled = true,
  ...root
}: Pick<TabsRootProps, "value" | "defaultValue"> & { disabled?: boolean }) => (
  <Tabs.Root {...root}>
    <Tabs.List>
      <Tabs.Tab value="tab-1">Enabled</Tabs.Tab>
      <Tabs.Tab value="tab-2" disabled={disabled}>
        Disabled
      </Tabs.Tab>
      <Tabs.Indicator data-testid="indicator" />
    </Tabs.List>
  </Tabs.Root>
);

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
    await expect(fixture).toMatchScreenshot();
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
    await expect(fixture).toMatchScreenshot();
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
      const before = boxOf(indicator());
      clicked.click();
      // The indicator has moved. A transition would still be running at the checks below
      await expect.poll(() => boxOf(indicator())).not.toEqual(before);
      expect(clicked).toHaveAttribute("aria-selected", "true");
      expect(indicator().getAnimations()).toHaveLength(0);
      expect(offset()).toBeLessThanOrEqual(1);
    },
  );

  // Base UI keeps a disabled tab focusable, so it is aria-disabled and never :disabled
  it("dims a disabled tab", async () => {
    const { getByRole } = await renderFixture(
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Enabled</Tabs.Tab>
          <Tabs.Tab value="tab-2" disabled>
            Disabled
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    expectDimmed(getByRole("tab", { name: "Disabled" }), getByRole("tab", { name: "Enabled" }));
  });

  // A controlled value or an explicit defaultValue keeps a disabled tab selected: the indicator
  // under it dims as the tab does
  it.each([
    ["a controlled value", { value: "tab-2" }],
    ["an explicit defaultValue", { defaultValue: "tab-2" }],
  ] as const)("dims the indicator under a disabled tab selected by %s", async (_, root) => {
    const { getByRole } = await renderFixture(disabledSelected(root));
    expect(getByRole("tab", { name: "Disabled" })).toHaveAttribute("aria-selected", "true");
    await expectIndicatorOverActiveTab();
    expect(opacityOf(activeTab())).toBe("0.5");
    expect(opacityOf(indicator())).toBe("0.5");
  });

  // Disabled while selected, a controlled root keeps the tab; an uncontrolled one moves to the
  // first enabled tab, and the indicator with it at full opacity
  it.each([
    ["a controlled", { value: "tab-2" }, "Disabled", "0.5"],
    ["an uncontrolled", { defaultValue: "tab-2" }, "Enabled", "1"],
  ] as const)(
    "follows the selected tab disabled at runtime in %s root",
    async (_, root, selected, opacity) => {
      const { rerender } = render(disabledSelected({ ...root, disabled: false }));
      await expectIndicatorOverActiveTab();
      expect(opacityOf(indicator())).toBe("1");

      rerender(disabledSelected(root));
      await expect.poll(() => activeTab().textContent).toBe(selected);
      await expectIndicatorOverActiveTab();
      expect(opacityOf(indicator())).toBe(opacity);
    },
  );

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the tab, which reaches into the
  // list's 4px padding and over the indicator under the tab
  it("active tab focus-visible", async () => {
    const { fixture } = await renderFixture(
      <Tabs.Root defaultValue="tab-1">
        <Tabs.List>
          <Tabs.Tab value="tab-1">Account</Tabs.Tab>
          <Tabs.Tab value="tab-2">Security</Tabs.Tab>
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>,
    );
    await expectIndicatorOverActiveTab();
    const tab = activeTab() as HTMLElement;
    focusVisible(tab);
    await expect(fixture).toMatchScreenshot();
  });
});

// The indicator is the same element before and after hydration. Base UI's script, which places
// and shows it in server HTML, is a stub in browser bundles and sets no opacity: the classes do.
describe("Tabs.Indicator under a selected disabled tab, in server HTML", () => {
  let host: HTMLDivElement | null = null;
  let app: Root | null = null;
  afterEach(() => {
    app?.unmount();
    host?.remove();
    app = null;
    host = null;
  });

  it.each([
    ["a controlled value", { value: "tab-2" }],
    ["an explicit defaultValue", { defaultValue: "tab-2" }],
  ] as const)("dims before and after hydration, selected by %s", async (_, root) => {
    const page = disabledSelected(root);
    host = document.createElement("div");
    host.innerHTML = renderToString(page);
    document.body.append(host);
    const serverIndicator = indicator();
    expect(serverIndicator).not.toBeNull();
    expect(opacityOf(activeTab())).toBe("0.5");
    expect(opacityOf(serverIndicator)).toBe("0.5");

    app = hydrateRoot(host, page);
    await expect.poll(() => indicator().hasAttribute("hidden")).toBe(false);
    expect(indicator()).toBe(serverIndicator);
    await expectIndicatorOverActiveTab();
    expect(opacityOf(indicator())).toBe("0.5");
  });
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
  beforeAll(() => emulateReducedMotion(reducedMotion));
  afterAll(() => emulateReducedMotion(true));

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
  beforeAll(() => emulateReducedMotion(reducedMotion));
  afterAll(() => emulateReducedMotion(true));

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
  // content, not where the tab shows in the viewport. Right to left, a list scrolled toward its
  // end has a negative `scrollLeft`; treating that offset as positive would misplace the indicator.
  it.each([{ dir: "ltr" as const }, { dir: "rtl" as const }])(
    "covers it in a $dir list scrolled to a tab that was offscreen, after scrollIntoView and after a click",
    async ({ dir }) => {
      const rtl = dir === "rtl";
      const { getByRole } = await renderFixture(
        <DirectionProvider direction={dir}>
          <div dir={dir}>
            <Tabs.Root defaultValue={MANY_TABS[0]} style={{ width: 240 }}>
              <Tabs.List className="overflow-x-auto">
                {MANY_TABS.map((name) => (
                  <Tabs.Tab key={name} value={name}>
                    {name}
                  </Tabs.Tab>
                ))}
                <Tabs.Indicator data-testid="indicator" />
              </Tabs.List>
            </Tabs.Root>
          </div>
        </DirectionProvider>,
      );
      const list = getByRole("tablist");
      const last = getByRole("tab", { name: MANY_TABS.at(-1) });
      const scrolled = () => (rtl ? list.scrollLeft < 0 : list.scrollLeft > 0);
      // Off-screen: past the list's right edge, or its left edge right to left
      if (rtl) {
        expect(last.getBoundingClientRect().right).toBeLessThan(list.getBoundingClientRect().left);
      } else {
        expect(last.getBoundingClientRect().left).toBeGreaterThan(
          list.getBoundingClientRect().right,
        );
      }
      await onPath(reducedMotion);
      await expectIndicatorOverActiveTab();

      last.scrollIntoView({ block: "nearest", inline: "nearest" });
      await expect.poll(scrolled).toBe(true);
      // The first tab, still active, scrolled out of view with the indicator over it
      await expectIndicatorOverActiveTab();

      await userEvent.click(last);
      await expect.poll(activeTab).toBe(last);
      expect(scrolled()).toBe(true);
      await expectIndicatorOverActiveTab();
    },
  );
});

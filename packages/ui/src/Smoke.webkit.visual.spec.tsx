import { render, screen, within } from "@testing-library/react";
import type { CSSProperties } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { Button } from "./components/button";
import { Card } from "./components/card";
import { Checkbox } from "./components/checkbox";
import { Combobox } from "./components/combobox";
import { Input } from "./components/input";
import { Popover } from "./components/popover";
import { Select } from "./components/select";
import { Switch } from "./components/switch";
import { Tabs } from "./components/tabs";
import { Textarea } from "./components/textarea";
import { Tooltip } from "./components/tooltip";
import {
  emulateReducedMotion,
  enterMotionPath,
  exited,
  insetsWithin,
  isShown,
  outlineTransitions,
  type PixelBox,
  paintedPixels,
  ringColor,
  waitForStable,
  withViewport,
} from "./VisualTest.utils";

/*
 * WebKit smoke set (vitest.webkit.config.ts): geometry and paint checks, no screenshot
 * baselines. "Painted" is read from a screenshot: the pixels in an element's box that change
 * when the element is hidden. 0 means WebKit laid the element out but painted none of it in its
 * box.
 */

/** Waits until `el` stops moving, resizing and fading */
const settle = (el: Element) =>
  waitForStable(() => {
    const { left, top, width, height } = el.getBoundingClientRect();
    return [left, top, width, height, getComputedStyle(el).opacity];
  });

/** Waits for `el`'s CSS transitions, e.g. a colour change on check */
const finishTransitions = (el: Element) =>
  Promise.allSettled(el.getAnimations().map((animation) => animation.finished));

/** Waits until Tabs.Contents stops sliding and resizing */
const settleContents = (contents: HTMLElement) =>
  waitForStable(() => {
    const track = contents.firstElementChild as HTMLElement;
    return [contents.getBoundingClientRect().height, track.getBoundingClientRect().left];
  });

// Wide enough for two columns beside a sidebar; it fits the runner window, so a screenshot is
// one px per CSS px
withViewport(1000, 700);

// Safari users mostly have no reduced-motion preference: Motion drives the springs here
beforeEach(() => enterMotionPath(true));

describe("The browser time zone", () => {
  // Canary for the `timezoneId` pin in vitest.visual.config.ts: January in Europe/Warsaw is UTC+1
  it("is the pinned time zone", () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
  });
});

describe("The paint probe", () => {
  it("counts a child that paints although its parent is hidden", async () => {
    render(
      <div style={{ padding: 40 }}>
        <div data-testid="parent" style={{ width: 80, height: 40 }}>
          <div style={{ width: 80, height: 40, background: "red", visibility: "visible" }} />
        </div>
        <div data-testid="empty" style={{ width: 80, height: 40 }} />
      </div>,
    );
    expect(await paintedPixels(screen.getByTestId("parent"))).toBe(80 * 40);
    expect(await paintedPixels(screen.getByTestId("empty"))).toBe(0);
    expect(document.head.querySelector("style[data-paint-probe]")).toBeNull();
  });
});

describe("Tabs.Contents in WebKit", () => {
  it("slides to the last panel, sizes to it, and paints it", async () => {
    render(
      <div style={{ padding: 40, width: 400 }}>
        <Tabs.Root defaultValue="a">
          <Tabs.List>
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="c">C</Tabs.Tab>
            <Tabs.Indicator />
          </Tabs.List>
          <Tabs.Contents data-testid="contents">
            <Tabs.Content value="a">
              <p style={{ height: 120 }}>Panel A</p>
            </Tabs.Content>
            <Tabs.Content value="c" data-testid="c">
              <Textarea aria-label="Note" placeholder="Write a note" />
            </Tabs.Content>
          </Tabs.Contents>
        </Tabs.Root>
      </div>,
    );
    const contents = screen.getByTestId("contents");
    await settleContents(contents);
    await userEvent.click(screen.getByRole("tab", { name: "C" }));
    await settleContents(contents);

    const panel = screen.getByTestId("c");
    const insets = insetsWithin(contents, panel);
    // Panel C where the container is, and the container as tall as it
    expect(insets.left).toBeCloseTo(0, 0);
    expect(insets.right).toBeCloseTo(0, 0);
    expect(contents.getBoundingClientRect().height).toBeCloseTo(
      panel.getBoundingClientRect().height,
      0,
    );
    expect(await paintedPixels(screen.getByRole("textbox", { name: "Note" }))).toBeGreaterThan(0);
  });

  /*
   * W80 (#341, https://bugs.webkit.org/show_bug.cgi?id=327820): WebKit paints a composited
   * element in a later CSS column at column 1's x, below the grid, not in its own box. Here the
   * slid track reaches over the sidebar (two panels to the left), and `will-change` composites the
   * sidebar. Full detail: TESTING_STRATEGY.md, WebKit Smoke Tests.
   */
  const masonry = (columns: CSSProperties) => (
    <div style={{ display: "flex", gap: 24, padding: 24, alignItems: "flex-start" }}>
      <aside data-testid="sidebar" style={{ willChange: "transform", width: 240, height: 400 }}>
        Sidebar
      </aside>
      <div style={{ flex: 1, overflow: "hidden", borderRadius: 14 }}>
        <div data-testid="columns" style={{ columnCount: 2, columnGap: 20, ...columns }}>
          <Card.Root className="mb-5 break-inside-avoid p-6">
            <div style={{ height: 300 }}>First column</div>
          </Card.Root>
          <Card.Root data-testid="card" className="mb-5 break-inside-avoid p-6">
            <Tabs.Root defaultValue="overview" className="flex flex-col gap-5">
              <Tabs.List>
                <Tabs.Tab value="overview">Overview</Tabs.Tab>
                <Tabs.Tab value="activity">Activity</Tabs.Tab>
                <Tabs.Tab value="notes">Notes</Tabs.Tab>
                <Tabs.Indicator />
              </Tabs.List>
              <Tabs.Contents data-testid="contents">
                <Tabs.Content value="overview">
                  <p style={{ height: 100 }}>Overview</p>
                </Tabs.Content>
                <Tabs.Content value="activity">Activity</Tabs.Content>
                <Tabs.Content value="notes">
                  <Textarea aria-label="Note" placeholder="Write a note" className="min-h-24" />
                </Tabs.Content>
              </Tabs.Contents>
            </Tabs.Root>
          </Card.Root>
        </div>
      </div>
    </div>
  );

  /** Renders the masonry, opens Notes and returns the Note field once the slide has settled */
  async function openNotes(columns: CSSProperties = {}) {
    render(masonry(columns));
    await userEvent.click(screen.getByRole("tab", { name: "Notes" }));
    await settleContents(screen.getByTestId("contents"));
    return screen.getByRole("textbox", { name: "Note" });
  }

  describe("in the second CSS column, next to an earlier composited layer (W80)", () => {
    // A WebKit bug: Chromium paints the panel in place. The bug spec and the workaround spec below
    // form a pair: `toBe(0)` proves a bug only because the workaround spec uses the same layout
    // and paints more than 0. Change them together. If the bug spec fails, WebKit paints the panel
    // in place now: flip it to `toBeGreaterThan(0)` and rename it. Keep the workaround spec:
    // users' Safari lags behind, and #295 depends on it.
    it("paints nothing in the Note field's box: WebKit bug (W80); when this fails, WebKit is fixed", async () => {
      const note = await openNotes();
      // Preconditions: the panel is laid out in place, so 0 pixels painted there means a bug
      const columns = screen.getByTestId("columns").getBoundingClientRect();
      const card = screen.getByTestId("card").getBoundingClientRect();
      expect(card.left, "the card is in the second column").toBeGreaterThan(
        columns.left + columns.width / 2,
      );
      const track = screen.getByTestId("contents").firstElementChild as HTMLElement;
      const sidebar = screen.getByTestId("sidebar").getBoundingClientRect();
      expect(
        track.getBoundingClientRect().left,
        "the slid track reaches over the sidebar",
      ).toBeLessThan(sidebar.right);
      const box = note.getBoundingClientRect();
      expect(box.width * box.height, "the field has a box").toBeGreaterThan(0);
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit, "hit testing finds the field where it is laid out").toBe(note);
      expect(await paintedPixels(note)).toBe(0);
    });

    // With the columns container on its own composited layer the track needs none of its own, and
    // WebKit paints the panel in place: a page with columns can work around the bug (#295).
    it("paints the panel in place when the columns container is composited", async () => {
      const note = await openNotes({ willChange: "opacity" });
      expect(await paintedPixels(note)).toBeGreaterThan(0);
    });
  });
});

describe("Popups in WebKit", () => {
  it("opens a Popover below its trigger, centred, and paints it", async () => {
    render(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Popover description</Popover.Description>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    await userEvent.click(trigger);
    const popup = await screen.findByRole("dialog");
    await settle(popup);

    const at = trigger.getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    // sideOffset 8 below the trigger, and centred on it
    expect(box.top - at.bottom).toBeCloseTo(8, 0);
    expect(box.left + box.width / 2).toBeCloseTo(at.left + at.width / 2, 0);
    expect(await paintedPixels(popup)).toBeGreaterThan(0);
  });

  it("opens a Select with the selected item over the trigger's value, and paints it", async () => {
    render(
      // The padding leaves room around the popup; the inner div gives the trigger its width
      <div style={{ padding: 160 }}>
        <div style={{ width: 200 }}>
          <Select.Root defaultValue="cherry">
            <Select.Trigger aria-label="Fruit">
              <Select.Value data-testid="value" />
              <Select.Icon />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup data-testid="popup">
                  {["Apple", "Banana", "Cherry", "Date"].map((fruit) => (
                    <Select.Item key={fruit} value={fruit.toLowerCase()}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{fruit}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>,
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Fruit" }));
    const popup = await screen.findByTestId("popup");
    await settle(popup);

    // Base UI lays the selected item's text over the trigger's value, to the pixel it rounds to
    const value = screen.getByTestId("value").getBoundingClientRect();
    const option = screen.getByRole("option", { name: "Cherry" });
    const selected = within(option).getByText("Cherry").getBoundingClientRect();
    expect(Math.abs(selected.left - value.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(selected.top - value.top)).toBeLessThanOrEqual(1);
    expect(await paintedPixels(popup)).toBeGreaterThan(0);
  });

  /*
   * The default `arrowPadding` is read from computed styles: the popup's corner radii and the
   * arrow's width. A keepMounted tooltip reads them while its positioner is hidden, so WebKit must
   * resolve them there, as Chromium does (TooltipGeometry.visual.spec.tsx). Unresolved, the arrow
   * gets Base UI's 5px and its foot stands in the corner.
   */
  it("holds a keepMounted Tooltip's arrow foot off the popup's rounded corner", async () => {
    // Below a 20px trigger, aligned to its start: the trigger's centre is nearer the popup's start
    // than the padding lets the arrow come
    const tooltip = (open: boolean) => (
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Tooltip.Root open={open}>
          <Tooltip.Trigger aria-label="Trigger" style={{ width: 20, height: 20, padding: 0 }} />
          <Tooltip.Portal keepMounted>
            <Tooltip.Positioner side="bottom" align="start" data-testid="positioner">
              <Tooltip.Popup data-testid="popup">
                <Tooltip.Arrow data-testid="arrow" />
                Tooltip content
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    );
    const { rerender } = render(tooltip(false));
    expect(screen.getByTestId("positioner").hidden).toBe(true);
    rerender(tooltip(true));
    const popup = screen.getByTestId("popup");
    const arrow = screen.getByTestId("arrow");
    await settle(popup);

    // From the popup's start to the arrow's foot (its widest point): the corner curves this far
    // along the edge, and the padding starts the foot there
    const foot = await waitForStable(
      () => arrow.getBoundingClientRect().left - popup.getBoundingClientRect().left,
    );
    const radius = Number.parseFloat(getComputedStyle(popup).borderTopLeftRadius);
    expect(radius).toBeGreaterThan(0);
    expect(foot).toBeCloseTo(radius, 0);
  });
});

describe("Form controls in WebKit", () => {
  it("sizes an Input to the control height, and paints it", async () => {
    render(
      <div style={{ padding: 40, width: 300 }}>
        <Input aria-label="Name" />
      </div>,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
    const controlHeight = getComputedStyle(document.documentElement).getPropertyValue(
      "--spacing-ui-height",
    );
    expect(input.getBoundingClientRect().height).toBeCloseTo(Number.parseFloat(controlHeight), 1);
    await userEvent.click(input);
    await userEvent.keyboard("Ada Lovelace");
    expect(input.value).toBe("Ada Lovelace");
    expect(await paintedPixels(input)).toBeGreaterThan(0);
  });

  it("checks a Checkbox and paints its indicator inside it", async () => {
    render(
      <div style={{ padding: 40 }}>
        <Checkbox.Root aria-label="Accept">
          <Checkbox.Indicator data-testid="indicator" />
        </Checkbox.Root>
      </div>,
    );
    const box = screen.getByRole("checkbox", { name: "Accept" });
    await userEvent.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    const indicator = await screen.findByTestId("indicator");
    await settle(indicator);
    await finishTransitions(box);

    for (const inset of Object.values(insetsWithin(box, indicator))) {
      expect(inset).toBeGreaterThanOrEqual(-0.5);
    }
    expect(await paintedPixels(indicator)).toBeGreaterThan(0);
  });

  it("moves a Switch's thumb to the trailing edge, and paints it", async () => {
    render(
      <div style={{ padding: 40 }}>
        <Switch.Root aria-label="Notify">
          <Switch.Thumb data-testid="thumb" />
        </Switch.Root>
      </div>,
    );
    const track = screen.getByRole("switch", { name: "Notify" });
    const thumb = screen.getByTestId("thumb");
    await userEvent.click(track);
    expect(track).toHaveAttribute("aria-checked", "true");
    await settle(thumb);
    await finishTransitions(track);

    const insets = insetsWithin(track, thumb);
    expect(insets.left).toBeGreaterThan(insets.right);
    expect(await paintedPixels(thumb)).toBeGreaterThan(0);
  });
});

// #627: Base UI blurs the input of a closing popup in WebKit. The next field is a text field, as
// WebKit's Tab skips buttons: Tab reaches it from the trigger, not from <body>.
describe("Combobox focus as its popup closes, in WebKit", () => {
  const openInPopup = async () => {
    render(
      <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
        <Input aria-label="Previous field" />
        <Combobox.Root items={["Apple", "Banana", "Cherry"]}>
          <Combobox.Trigger aria-label="Fruit" className="static h-ui-height w-full border px-3">
            <Combobox.Value placeholder="Pick a fruit" />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup aria-label="Fruits" data-testid="popup">
                <Combobox.Input aria-label="Search fruits" className="pe-3" />
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Input aria-label="Next field" />
      </div>,
    );
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await userEvent.click(trigger);
    const input = await screen.findByRole("combobox", { name: "Search fruits" });
    await expect.poll(() => document.activeElement).toBe(input);
    const popup = screen.getByTestId("popup");
    await settle(popup);
    return { trigger, popup };
  };

  // The spring takes about 0.5s, so the popup is still leaving when the key press returns
  it("keeps focus on the trigger while the popup leaves after Escape", async () => {
    const { trigger, popup } = await openInPopup();
    await userEvent.keyboard("{Escape}");
    expect(popup.isConnected, "the popup is still leaving").toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("moves a Tab pressed while the popup leaves after a pick to the next field", async () => {
    const { popup } = await openInPopup();
    await userEvent.click(screen.getByRole("option", { name: "Banana" }));
    await userEvent.keyboard("{Tab}");
    await exited(popup);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Next field" }));
  });
});

// #633: as Combobox's, for Select and Popover. A click in WebKit focuses no button, so the field in
// the Popover goes to <body> before the close: the hand-off counts that as inside.
describe("Select and Popover focus as the popup closes, in WebKit", () => {
  const select = () =>
    render(
      <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
        <Select.Root defaultValue="apple">
          <Select.Trigger aria-label="Fruit">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup data-testid="popup">
                {["Apple", "Banana", "Cherry"].map((fruit) => (
                  <Select.Item key={fruit} value={fruit.toLowerCase()}>
                    <Select.ItemText>{fruit}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Input aria-label="Next field" />
      </div>,
    );

  const openSelect = async () => {
    select();
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    await userEvent.click(trigger);
    const popup = screen.getByTestId("popup");
    await expect.poll(() => popup.contains(document.activeElement)).toBe(true);
    await settle(popup);
    return { trigger, popup };
  };

  it("moves a Tab pressed while the Select popup leaves after a pick to the next field", async () => {
    const { popup } = await openSelect();
    await userEvent.click(screen.getByRole("option", { name: "Banana" }));
    await userEvent.keyboard("{Tab}");
    const next = screen.getByRole("textbox", { name: "Next field" });
    expect(document.activeElement).toBe(next);
    await exited(popup, { stillClosing: isShown });
    expect(document.activeElement).toBe(next);
  });

  it("moves a Tab pressed while the Popover leaves after a click on Popover.Close to the next field", async () => {
    render(
      <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
        <Popover.Root>
          <Popover.Trigger>Settings</Popover.Trigger>
          <Popover.Content data-testid="popup">
            <Input aria-label="Name" />
            <Popover.Close>Done</Popover.Close>
          </Popover.Content>
        </Popover.Root>
        <Input aria-label="Next field" />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    const name = await screen.findByRole("textbox", { name: "Name" });
    await expect.poll(() => document.activeElement).toBe(name);
    const popup = screen.getByTestId("popup");
    await settle(popup);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    await userEvent.keyboard("{Tab}");
    const next = screen.getByRole("textbox", { name: "Next field" });
    expect(document.activeElement).toBe(next);
    await exited(popup);
    expect(document.activeElement).toBe(next);
  });
});

describe("Focus rings in WebKit", () => {
  /*
   * W122 (#383): with an arrow, the ring moves to an `::after` overlay that takes the popup's
   * border box, centred on it with `place-self: unsafe center` (popup-arrow.ts). Chromium's
   * PopupArrow spec checks it; this checks WebKit's layout and paint of it. The `border-2` class
   * is the case: with the default 1px border the overlay's `-inset-px` alone lands on the border
   * box, so the 1px case cannot exercise `place-self`.
   */
  it("centres a Popover's ring overlay on its border box, with an arrow and a 2px border, and paints it", async () => {
    // Opens after the key press and takes focus, as when a shortcut opens it
    await userEvent.keyboard("{Shift}");
    render(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root defaultOpen>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content className="border-2">
            <Popover.Arrow />
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Popover description</Popover.Description>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    const popup = await screen.findByRole("dialog");
    await expect.poll(() => popup.matches(":focus-visible")).toBe(true);
    await settle(popup);

    // The overlay's border box: its content box is the popup's padding box (`size-full`,
    // `box-content`), and it takes the popup's border widths
    const own = getComputedStyle(popup);
    const overlay = getComputedStyle(popup, "::after");
    expect(own.outlineStyle).toBe("none");
    expect(overlay.outlineStyle).toBe("solid");
    expect(overlay.outlineColor).toBe(ringColor());
    expect(Number.parseFloat(own.borderLeftWidth)).toBe(2);
    const box = popup.getBoundingClientRect();
    const width =
      Number.parseFloat(overlay.width) +
      Number.parseFloat(overlay.borderLeftWidth) +
      Number.parseFloat(overlay.borderRightWidth);
    const height =
      Number.parseFloat(overlay.height) +
      Number.parseFloat(overlay.borderTopWidth) +
      Number.parseFloat(overlay.borderBottomWidth);
    expect(Math.abs(width - box.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(height - box.height)).toBeLessThanOrEqual(1);
    // No top or left check: WebKit reports the computed -1px whatever the layout; the bands do

    // The ring paints 2px outside the border box, 2px wide: every pixel of that band changes
    // when the overlay is hidden, on each side. A band off by a pixel keeps a column or row.
    // Bands stop clear of the rounded corners, and the top and bottom ones of the arrow.
    const [left, top, right, bottom, w, h] = [
      box.left,
      box.top,
      box.right,
      box.bottom,
      box.width,
      box.height,
    ].map(Math.round) as [number, number, number, number, number, number];
    const gap = 2;
    const thick = 2;
    const inset = 16;
    const sideHeight = h - 2 * inset;
    const bands: Record<string, PixelBox> = {
      left: { x: left - gap - thick, y: top + inset, width: thick, height: sideHeight },
      right: { x: right + gap, y: top + inset, width: thick, height: sideHeight },
      top: { x: left + inset, y: top - gap - thick, width: w / 4 - inset, height: thick },
      bottom: { x: left + inset, y: bottom + gap, width: w / 4 - inset, height: thick },
    };
    for (const [side, band] of Object.entries(bands)) {
      const area = Math.floor(band.width) * band.height;
      expect(area, side).toBeGreaterThan(0);
      expect(await paintedPixels(popup, "::after", band), side).toBe(area);
    }
  });

  // The ring parts' `[transition-property:…]` list has no outline and sorts after `transition-*`
  // utilities: WebKit must agree with Chromium
  it.each(["", "duration-500", "transition-all"])(
    "shows a Tabs.Tab's ring at once with motion on, with '%s' in className",
    async (utility) => {
      // The project's own preference, put back after the test
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      await emulateReducedMotion(false);
      try {
        render(
          <>
            <button type="button">Before</button>
            <Tabs.Root defaultValue="a">
              <Tabs.List>
                <Tabs.Tab value="a">First</Tabs.Tab>
                <Tabs.Tab value="b" className={utility}>
                  Target
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.Root>
          </>,
        );
        await userEvent.tab();
        const tab = screen.getByRole("tab", { name: "Target" });
        tab.focus();
        expect(tab.matches(":focus-visible")).toBe(true);
        // Read in the same task as the focus: a transition would still be at its start
        expect(getComputedStyle(tab).outlineColor).toBe(ringColor());
        expect(outlineTransitions(tab)).toEqual([]);
      } finally {
        await emulateReducedMotion(reduced);
      }
    },
  );
});

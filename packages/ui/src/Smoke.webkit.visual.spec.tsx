import { render, screen, within } from "@testing-library/react";
import type { CSSProperties } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { Button } from "./components/button";
import { Card } from "./components/card";
import { Checkbox } from "./components/checkbox";
import { Input } from "./components/input";
import { Popover } from "./components/popover";
import { Select } from "./components/select";
import { Switch } from "./components/switch";
import { Tabs } from "./components/tabs";
import { Textarea } from "./components/textarea";
import {
  enterMotionPath,
  insetsWithin,
  outlineTransitions,
  ringColor,
  waitForStable,
  withViewport,
} from "./VisualTest.utils";

/*
 * WebKit smoke set (vitest.webkit.config.ts): geometry and paint checks, no screenshot
 * baselines. "Painted" is read from a screenshot: the pixels in an element's box that change
 * when the element is hidden. 0 means WebKit laid the element out but painted none of it.
 */

type PixelBox = { x: number; y: number; width: number; height: number };

/** The viewport px `el` covers, cut to the viewport */
function pixelBox(el: Element): PixelBox {
  const box = el.getBoundingClientRect();
  const x = Math.max(0, Math.floor(box.left));
  const y = Math.max(0, Math.floor(box.top));
  const width = Math.min(window.innerWidth, Math.ceil(box.right)) - x;
  const height = Math.min(window.innerHeight, Math.ceil(box.bottom)) - y;
  expect(width > 0 && height > 0, "the element is in the viewport").toBe(true);
  return { x, y, width, height };
}

/** The RGBA pixels the page paints in `box`, from a screenshot */
async function capture({ x, y, width, height }: PixelBox) {
  const image = new Image();
  image.src = `data:image/png;base64,${await page.screenshot({ save: false })}`;
  await image.decode();
  // One image px per CSS px, so a box in CSS px reads the same pixels
  expect(image.naturalWidth).toBe(window.innerWidth);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(x, y, width, height).data;
}

/** How many pixels differ between two captures of the same box */
function changedPixels(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
  }
  return changed;
}

/**
 * How many pixels of its box `el` paints: those that change when it and everything inside it is
 * hidden. Hiding `el` alone leaves a descendant that sets its own `visibility: visible` painting.
 */
async function paintedPixels(el: HTMLElement) {
  const box = pixelBox(el);
  const shown = await capture(box);
  // micro-interactions transitions every property, visibility included: hide at once
  const attribute = "data-paint-probe";
  const probe = document.createElement("style");
  probe.textContent = `[${attribute}], [${attribute}] * { transition: none !important; visibility: hidden !important; }`;
  document.head.append(probe);
  el.setAttribute(attribute, "");
  try {
    return changedPixels(shown, await capture(box));
  } finally {
    el.removeAttribute(attribute);
    probe.remove();
  }
}

/**
 * How many pixels of `box` the `::after` overlay of `el` paints: those that change when only the
 * overlay is hidden, by a temporary rule
 */
async function overlayPaintedPixels(el: HTMLElement, box: PixelBox) {
  const shown = await capture(box);
  const attribute = "data-overlay-probe";
  const probe = document.createElement("style");
  probe.textContent = `[${attribute}]::after { display: none !important; }`;
  document.head.append(probe);
  el.setAttribute(attribute, "");
  try {
    return changedPixels(shown, await capture(box));
  } finally {
    el.removeAttribute(attribute);
    probe.remove();
  }
}

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
   * W80 (#341): WebKit paints nothing of a panel in a CSS column after the first when the slid
   * track reaches over a composited layer that paints before it. Slid to its third panel, the
   * track reaches two panels to the left, over the sidebar. On /create that is the sticky theme
   * sidebar, composited while the page scrolls; `will-change` composites this one.
   */
  const masonry = (columns: CSSProperties) => (
    <div style={{ display: "flex", gap: 24, padding: 24, alignItems: "flex-start" }}>
      <aside data-testid="sidebar" style={{ willChange: "transform", width: 240, height: 400 }}>
        Sidebar
      </aside>
      <div data-testid="columns" style={{ flex: 1, columnCount: 2, columnGap: 20, ...columns }}>
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
  );

  /** Renders the masonry, opens Notes and returns the Note field once the slide has settled */
  async function openNotes(columns: CSSProperties = {}) {
    render(masonry(columns));
    await userEvent.click(screen.getByRole("tab", { name: "Notes" }));
    await settleContents(screen.getByTestId("contents"));
    return screen.getByRole("textbox", { name: "Note" });
  }

  describe("in the second CSS column, next to an earlier composited layer (W80)", () => {
    // A WebKit bug: Chromium paints the panel. The bug spec and the workaround spec below form a
    // pair: `toBe(0)` proves a bug only because the workaround spec uses the same layout and
    // paints more than 0. Change them together. If the bug spec fails, WebKit paints the panel
    // now: flip it to `toBeGreaterThan(0)` and rename it. Keep the workaround spec: users'
    // Safari lags behind, and #295 depends on it.
    it("paints none of the panel: WebKit bug (W80); when this fails, WebKit is fixed", async () => {
      const note = await openNotes();
      // Preconditions: the panel is laid out in place, so 0 painted pixels means a bug
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

    // With the columns container on its own composited layer WebKit paints the panel, so a page
    // with columns can work around the bug (#295)
    it("paints the panel when the columns container is composited", async () => {
      const note = await openNotes({ willChange: "transform" });
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
      <div style={{ padding: 160, width: 200 }}>
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

describe("Focus rings in WebKit", () => {
  /*
   * W122 (#383): with an arrow, the ring moves to an `::after` overlay that takes the popup's
   * border box, centred on it with `place-self: unsafe center` (popup-arrow.ts). Chromium's
   * PopupArrow spec checks it; this checks WebKit's layout and paint of it.
   */
  it("centres a Popover's ring overlay on its border box, with an arrow, and paints it", async () => {
    // Opens after the key press and takes focus, as when a shortcut opens it
    await userEvent.keyboard("{Shift}");
    render(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root defaultOpen>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content>
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
    const border = Number.parseFloat(own.borderLeftWidth);
    expect(border).toBeGreaterThan(0);
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
    // Inset by the border width from the padding box: at the border box's edges
    expect(Math.abs(Number.parseFloat(overlay.top) + border)).toBeLessThanOrEqual(1);
    expect(Math.abs(Number.parseFloat(overlay.left) + border)).toBeLessThanOrEqual(1);

    // The ring paints 2px outside the border box, 2px wide: every pixel of that band changes
    // when the overlay is hidden, on each side. A band off by a pixel keeps a column or row.
    // Bands stop clear of the rounded corners, and the top and bottom ones of the arrow.
    const ring = { offset: 2, width: 2 };
    const inset = 16;
    const bands: Record<string, PixelBox> = {
      left: {
        x: Math.round(box.left) - ring.offset - ring.width,
        y: Math.round(box.top) + inset,
        width: ring.width,
        height: Math.round(box.height) - 2 * inset,
      },
      right: {
        x: Math.round(box.right) + ring.offset,
        y: Math.round(box.top) + inset,
        width: ring.width,
        height: Math.round(box.height) - 2 * inset,
      },
      top: {
        x: Math.round(box.left) + inset,
        y: Math.round(box.top) - ring.offset - ring.width,
        width: Math.round(box.width) / 4 - inset,
        height: ring.width,
      },
      bottom: {
        x: Math.round(box.left) + inset,
        y: Math.round(box.bottom) + ring.offset,
        width: Math.round(box.width) / 4 - inset,
        height: ring.width,
      },
    };
    for (const [side, band] of Object.entries(bands)) {
      const area = Math.floor(band.width) * band.height;
      expect(area, side).toBeGreaterThan(0);
      expect(await overlayPaintedPixels(popup, band), side).toBe(area);
    }
  });

  // The ring parts' `[transition-property:…]` list has no outline and sorts after `transition-*`
  // utilities: WebKit must agree with Chromium
  it.each(["", "duration-500", "transition-all"])(
    "shows a Tabs.Tab's ring at once with motion on, with '%s' in className",
    async (utility) => {
      await commands.emulateMedia({ reducedMotion: "no-preference" });
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
        await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
        await userEvent.tab();
        const tab = screen.getByRole("tab", { name: "Target" });
        tab.focus();
        expect(tab.matches(":focus-visible")).toBe(true);
        // Read in the same task as the focus: a transition would still be at its start
        expect(getComputedStyle(tab).outlineColor).toBe(ringColor());
        expect(outlineTransitions(tab)).toEqual([]);
      } finally {
        await commands.emulateMedia({ reducedMotion: "reduce" });
      }
    },
  );
});

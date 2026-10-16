import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { Button } from "../components/button";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import {
  applyTheme,
  arrowOverhang,
  describeMotionPaths,
  eachPaintedFrame,
  emulateReducedMotion,
  LAYOUT_ROUNDING_PX,
  resetTheme,
  ringColor,
  systemColour,
  THEMES,
  waitForStable,
} from "../VisualTest.utils";
import { PortalContainerProvider } from "./portal-container";
import { reloadMotion } from "./use-motion";

/*
 * Popover.Arrow and Menu.Arrow draw the same arrow: a square in the popup's colours, turned so
 * one corner points at the trigger. It must reach out of the popup toward the trigger, end
 * `sideOffset` from it, and line up with the trigger's centre.
 */

const PHYSICAL_SIDES = ["top", "right", "bottom", "left"] as const;
const LOGICAL_SIDES = ["inline-start", "inline-end"] as const;
type PhysicalSide = (typeof PHYSICAL_SIDES)[number];
type Side = PhysicalSide | (typeof LOGICAL_SIDES)[number];
type Direction = "ltr" | "rtl";
type Kind = "Popover" | "Menu";

/** The popup's direction, and the page's: they differ in a section of the other direction */
type Layout = { layout: string; dir: Direction; page: Direction };
const LTR: Layout = { layout: "ltr", dir: "ltr", page: "ltr" };
const RTL: Layout = { layout: "rtl", dir: "rtl", page: "rtl" };
// An `rtl:` variant would also match in here, and turn the arrow the RTL way
const LTR_IN_RTL: Layout = { layout: "ltr section on an rtl page", dir: "ltr", page: "rtl" };

/** Physical sides once, logical sides in each layout (they resolve differently in each). */
const SIDES = [
  ...PHYSICAL_SIDES.map((side) => ({ side, ...LTR })),
  ...LOGICAL_SIDES.flatMap((side) => [LTR, RTL, LTR_IN_RTL].map((l) => ({ side, ...l }))),
];

const KINDS: Kind[] = ["Popover", "Menu"];

const CASES = KINDS.flatMap((kind) => SIDES.map((c) => ({ kind, ...c })));

/** Where a side renders: `inline-start` is the left in LTR and the right in RTL. */
function physicalSide(side: Side, dir: Direction): PhysicalSide {
  if (side === "inline-start") return dir === "ltr" ? "left" : "right";
  if (side === "inline-end") return dir === "ltr" ? "right" : "left";
  return side;
}

/** Floating UI rounds the popup position to whole device pixels (DPR 1 here). */
const POSITION_ROUNDING_PX = 0.5;

/** The documented default `sideOffset` of each popup. */
const SIDE_OFFSET_PX: Record<Kind, number> = { Popover: 8, Menu: 8 };

/** At the default `--spacing` of 4px: the popup moves out 1.75 units for the arrow. */
const REACH_PX = 1.75 * 4;

/**
 * Past the popup's edge, the arrow (a 2.5-unit square on its corner, centred on the inside of the
 * 1px border) reaches half its diagonal less the border. The popup's move rounds that up, so the
 * tip ends this much further from the trigger than `sideOffset`.
 */
const TIP_GAP_PAST_OFFSET_PX = REACH_PX - ((2.5 * 4) / Math.SQRT2 - 1);

/** A section in `dir` that keeps the popups opened in it inside it, so they take its direction */
function Section({ dir, children }: { dir: Direction; children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <div dir={dir}>
      <PortalContainerProvider value={container}>{children}</PortalContainerProvider>
      <div ref={setContainer} />
    </div>
  );
}

/**
 * An arrowed popup of `kind` on `side`, opened by default or by clicking "Trigger". On a `page`
 * of the other direction, it sits in a section in `dir`.
 */
function arrowed(
  kind: Kind,
  side: Side,
  dir: Direction,
  defaultOpen: boolean,
  page: Direction = dir,
): ReactNode {
  const trigger = <Button variant="outlined" />;
  const popup =
    kind === "Popover" ? (
      <Popover.Root defaultOpen={defaultOpen}>
        <Popover.Trigger data-testid="trigger" render={trigger}>
          Trigger
        </Popover.Trigger>
        <Popover.Content side={side} data-testid="popup">
          <Popover.Arrow data-testid="arrow" />
          Popover
        </Popover.Content>
      </Popover.Root>
    ) : (
      <Menu.Root defaultOpen={defaultOpen}>
        <Menu.Trigger data-testid="trigger" render={trigger}>
          Trigger
        </Menu.Trigger>
        <Menu.Content side={side} data-testid="popup">
          <Menu.Arrow data-testid="arrow" />
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    );
  // Base UI needs the direction to resolve logical sides, and the CSS needs it on the root
  // element, because the popup is portalled to <body>.
  document.documentElement.dir = page;
  const centred = (
    <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>{popup}</div>
  );
  return (
    <DirectionProvider direction={dir}>
      {page === dir ? centred : <Section dir={dir}>{centred}</Section>}
    </DirectionProvider>
  );
}

/** The gap between the arrow's tip and the trigger. */
function tipGap(side: PhysicalSide, arrow: DOMRect, trigger: DOMRect) {
  switch (side) {
    case "top":
      return trigger.top - arrow.bottom;
    case "bottom":
      return arrow.top - trigger.bottom;
    case "left":
      return trigger.left - arrow.right;
    case "right":
      return arrow.left - trigger.right;
  }
}

/** Cross-axis distance between the arrow's centre and the trigger's centre. */
function offCentre(side: PhysicalSide, arrow: DOMRect, trigger: DOMRect) {
  const vertical = side === "top" || side === "bottom";
  return vertical
    ? arrow.left + arrow.width / 2 - (trigger.left + trigger.width / 2)
    : arrow.top + arrow.height / 2 - (trigger.top + trigger.height / 2);
}

/**
 * Whether the page shows the arrow halfway from its centre toward `side`'s trigger (`toward`) or
 * away from it. Only the tip half is drawn, and nothing may clip it.
 */
function arrowShows(arrow: Element, side: PhysicalSide, toward: boolean) {
  const box = arrow.getBoundingClientRect();
  // From the centre, a quarter of the box toward the trigger
  const step = {
    top: { x: 0, y: box.height / 4 },
    bottom: { x: 0, y: -box.height / 4 },
    left: { x: box.width / 4, y: 0 },
    right: { x: -box.width / 4, y: 0 },
  }[side];
  const sign = toward ? 1 : -1;
  const x = box.left + box.width / 2 + sign * step.x;
  const y = box.top + box.height / 2 + sign * step.y;
  return document.elementFromPoint(x, y) === arrow;
}

async function measure(kind: Kind, side: Side, dir: Direction, page: Direction) {
  render(arrowed(kind, side, dir, true, page));
  const physical = physicalSide(side, dir);
  const arrow = await screen.findByTestId("arrow");
  const measured = await waitForStable(() => {
    const a = arrow.getBoundingClientRect();
    const t = screen.getByTestId("trigger").getBoundingClientRect();
    return { tipGap: tipGap(physical, a, t), offCentre: offCentre(physical, a, t) };
  });
  expect(arrow.getAttribute("data-side")).toBe(side);
  return measured;
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe.each(CASES)("$kind arrow, side $side ($layout)", ({ kind, side, dir, page }) => {
  it("keeps `sideOffset` as the gap between the trigger and the tip", async () => {
    const { tipGap } = await measure(kind, side, dir, page);
    const sideOffset = SIDE_OFFSET_PX[kind];
    expect(tipGap).toBeGreaterThanOrEqual(sideOffset);
    expect(Math.abs(tipGap - sideOffset - TIP_GAP_PAST_OFFSET_PX)).toBeLessThanOrEqual(
      POSITION_ROUNDING_PX,
    );
  });

  it("points at the trigger's centre", async () => {
    const { offCentre } = await measure(kind, side, dir, page);
    expect(Math.abs(offCentre)).toBeLessThanOrEqual(POSITION_ROUNDING_PX);
  });

  it("draws its tip half, toward the trigger, and not the half inside the popup", async () => {
    await measure(kind, side, dir, page);
    const arrow = screen.getByTestId("arrow");
    const physical = physicalSide(side, dir);
    expect(arrowShows(arrow, physical, true)).toBe(true);
    expect(arrowShows(arrow, physical, false)).toBe(false);
  });
});

describe.each(KINDS)("%s.Arrow colours", (kind) => {
  it("fills with the popup's background and edges two sides with its border", async () => {
    render(arrowed(kind, "bottom", "ltr", true));
    const arrow = getComputedStyle(await screen.findByTestId("arrow"));
    const popup = getComputedStyle(screen.getByTestId("popup"));
    expect(arrow.backgroundColor).toBe(popup.backgroundColor);

    const edges = (["Top", "Right", "Bottom", "Left"] as const)
      .filter((edge) => arrow[`border${edge}Width`] !== "0px")
      .map((edge) => ({
        width: arrow[`border${edge}Width`],
        color: arrow[`border${edge}Color`],
      }));
    // The other two sides face into the popup, where a line would cut the arrow off from it
    expect(edges).toEqual([
      { width: popup.borderTopWidth, color: popup.borderTopColor },
      { width: popup.borderTopWidth, color: popup.borderTopColor },
    ]);
  });
});

type Align = "start" | "end";

type NearCornerOptions = {
  /** Passed to the popup's `Content` */
  arrowPadding?: number;
  /** The arrow mounts once the open popup has settled without it */
  lateArrow?: boolean;
};

/**
 * A popup of `kind` on `side` of a 20px trigger, aligned to its `align` edge. The trigger's centre
 * is nearer that end of the popup than the arrow may come, so Base UI holds the arrow
 * `arrowPadding` from the end. A fixed popup width, so no fraction of a pixel moves the arrow, in
 * px, so it still fits beside the trigger at a larger `--spacing`.
 */
function nearCorner(
  kind: Kind,
  side: PhysicalSide,
  align: Align,
  arrowPadding: number | undefined,
  withArrow: boolean,
) {
  const trigger = { width: 20, height: 20, padding: 0 };
  const content = { side, align, arrowPadding, "data-testid": "popup" };
  const popup =
    kind === "Popover" ? (
      <Popover.Root defaultOpen>
        <Popover.Trigger aria-label="Trigger" style={trigger} />
        <Popover.Content {...content} className="w-[160px]">
          {withArrow && <Popover.Arrow data-testid="arrow" />}
          Popover
        </Popover.Content>
      </Popover.Root>
    ) : (
      <Menu.Root defaultOpen>
        <Menu.Trigger aria-label="Trigger" style={trigger} />
        <Menu.Content {...content}>
          {withArrow && <Menu.Arrow data-testid="arrow" />}
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    );
  return <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>{popup}</div>;
}

/**
 * Renders `nearCorner` and measures, along the edge the arrow stands on, the distance from the
 * popup's `align` end to the nearer corner of the arrow's foot (its widest point, on the inner edge
 * of the popup's border). Also returns the popup's corner radius and the arrow's overhang.
 */
async function footNearCorner(
  kind: Kind,
  side: PhysicalSide,
  align: Align,
  { arrowPadding, lateArrow = false }: NearCornerOptions = {},
) {
  const { rerender, unmount } = render(nearCorner(kind, side, align, arrowPadding, !lateArrow));
  if (lateArrow) {
    const popup = await screen.findByTestId("popup");
    await waitForStable(() => JSON.stringify(popup.getBoundingClientRect()));
    rerender(nearCorner(kind, side, align, arrowPadding, true));
  }
  const arrow = await screen.findByTestId("arrow");
  const popup = screen.getByTestId("popup");
  const foot = await waitForStable(() => {
    const a = arrow.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    if (side === "top" || side === "bottom") {
      return align === "start" ? a.left - p.left : p.right - a.right;
    }
    return align === "start" ? a.top - p.top : p.bottom - a.bottom;
  });
  const radius = Number.parseFloat(getComputedStyle(popup).borderTopLeftRadius);
  const overhang = arrowOverhang(arrow);
  unmount();
  return { foot, radius, overhang };
}

// Menu on one side is enough to show it passes `arrowPadding` too
const NEAR_CORNER = KINDS.flatMap((kind) =>
  PHYSICAL_SIDES.flatMap((side) =>
    (["start", "end"] as const).flatMap((align) =>
      THEMES.map((theme) => ({ kind, side, align, ...theme })),
    ),
  ),
).filter(({ kind, side }) => kind === "Popover" || side === "bottom");

describe.each(NEAR_CORNER)(
  "$kind arrow, side $side, align $align, small trigger, $theme",
  ({ kind, side, align, vars }) => {
    afterEach(() => resetTheme(vars));

    it("keeps its foot off the popup's rounded corner", async () => {
      applyTheme(vars);
      const { foot, radius } = await footNearCorner(kind, side, align);
      // The corner curves this far along the edge; past it, the edge is straight. The foot starts
      // there, and no further: the popup's 1px border and the arrow's -1px margin add up to 0 at
      // the start, and to 2px at the end, where the margin moves the arrow away from the end.
      const slack = align === "end" ? 2 : 0;
      expect(foot).toBeGreaterThanOrEqual(radius - LAYOUT_ROUNDING_PX);
      expect(foot).toBeLessThanOrEqual(radius + slack + LAYOUT_ROUNDING_PX);
    });
  },
);

describe.each(KINDS)("%s.Content arrowPadding", (kind) => {
  it("holds an arrow near the corner the padding it is given from the popup's end", async () => {
    const { foot, overhang } = await footNearCorner(kind, "bottom", "start", { arrowPadding: 16 });
    expect(Math.abs(foot - (16 - overhang))).toBeLessThanOrEqual(LAYOUT_ROUNDING_PX);
  });
});

const LATE_ARROW = KINDS.flatMap((kind) => THEMES.map((theme) => ({ kind, ...theme })));

describe.each(LATE_ARROW)(
  "$kind arrow mounted after the popup opened, $theme",
  ({ kind, vars }) => {
    afterEach(() => resetTheme(vars));

    // The positioner reads the default padding again when an Arrow mounts in it later
    it("gets the same default padding as one mounted with the popup", async () => {
      applyTheme(vars);
      const withPopup = await footNearCorner(kind, "bottom", "start");
      const late = await footNearCorner(kind, "bottom", "start", { lateArrow: true });
      expect(Math.abs(late.foot - withPopup.foot)).toBeLessThanOrEqual(LAYOUT_ROUNDING_PX);
    });
  },
);

type Ring = Pick<
  CSSStyleDeclaration,
  "outlineStyle" | "outlineWidth" | "outlineColor" | "outlineOffset"
>;

const ringOf = ({ outlineStyle, outlineWidth, outlineColor, outlineOffset }: Ring): Ring => ({
  outlineStyle,
  outlineWidth,
  outlineColor,
  outlineOffset,
});

/** The library's focus ring, as on a Button: 2px of `--ring`, 2px outside the edge */
const libraryRing = (): Ring => ({
  outlineStyle: "solid",
  outlineWidth: "2px",
  outlineColor: ringColor(),
  outlineOffset: "2px",
});

describe.each(KINDS)("%s focused from the keyboard", (kind) => {
  // The arrow, a positioned child, would paint over the popup's own ring where they meet. The
  // screenshots in Popover.visual.spec.tsx and Menu.visual.spec.tsx show the overlay's ring above it.
  it("draws the library ring on its overlay, and none on the popup itself", async () => {
    // Opens after the key press and takes focus, as when a shortcut opens it
    await userEvent.keyboard("{Shift}");
    render(arrowed(kind, "bottom", "ltr", true));
    const popup = await screen.findByTestId("popup");
    await expect.poll(() => popup.matches(":focus-visible")).toBe(true);

    expect(getComputedStyle(popup).outlineStyle).toBe("none");
    expect(ringOf(getComputedStyle(popup, "::after"))).toEqual(libraryRing());
  });
});

/** An open popup of `kind`, arrowed unless `arrow` is false, whose content takes `className` */
function popupWith(kind: Kind, className: string, arrow = true): ReactNode {
  return kind === "Popover" ? (
    <Popover.Root defaultOpen>
      <Popover.Trigger>Trigger</Popover.Trigger>
      <Popover.Content data-testid="popup" className={className}>
        {arrow && <Popover.Arrow />}
        Popover
      </Popover.Content>
    </Popover.Root>
  ) : (
    <Menu.Root defaultOpen>
      <Menu.Trigger>Trigger</Menu.Trigger>
      <Menu.Content data-testid="popup" className={className}>
        {arrow && <Menu.Arrow />}
        <Menu.Item>Item</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}

describe.each(KINDS)("%s with an arrow, restyling the ring", (kind) => {
  // A colour utility, and an arbitrary property, which tailwind-merge does not match to it.
  // Whole class names: Tailwind generates only the classes it finds in the source.
  it.each([
    "has-[.PopupArrow]:focus-visible:after:outline-[rgb(255,0,0)]",
    "has-[.PopupArrow]:focus-visible:after:[outline-color:rgb(255,0,0)]",
  ])(
    "takes a colour from the same `has-[.PopupArrow]:focus-visible:after:` prefix: `%s`",
    async (colour) => {
      render(popupWith(kind, colour));
      const popup = await screen.findByTestId("popup");
      await userEvent.keyboard("{Shift}");
      await expect.poll(() => popup.matches(":focus-visible")).toBe(true);

      expect(getComputedStyle(popup, "::after").outlineColor).toBe("rgb(255, 0, 0)");
    },
  );

  it("removes the overlay, and so the ring, with `focus-visible:after:hidden`", async () => {
    render(popupWith(kind, "focus-visible:after:hidden"));
    const popup = await screen.findByTestId("popup");
    await userEvent.keyboard("{Shift}");
    await expect.poll(() => popup.matches(":focus-visible")).toBe(true);

    expect(getComputedStyle(popup, "::after").display).toBe("none");
  });
});

/**
 * Offsets from a popup's edge, outward (negative) to inward, that cover the ring (2px, 2px out),
 * the page past it and the border
 */
const ACROSS_EDGE = [-5, -4, -3, -2, -1, 0, 1, 2, 3];

/**
 * The colours the page paints across each edge of `popup`, at `ACROSS_EDGE` from it: through the
 * middle of the left and right edges, and a quarter of the way along the top and bottom, clear of
 * an arrow at the centre. Read from a screenshot, one image pixel per CSS pixel.
 */
async function acrossEdges(popup: Element) {
  const base64 = await page.screenshot({ save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  expect(image.naturalWidth).toBe(window.innerWidth);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  ctx.drawImage(image, 0, 0);
  const at = (x: number, y: number) =>
    ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data.slice(0, 3).join();
  // The edges' first pixels inside the popup; its position is whole pixels
  const p = popup.getBoundingClientRect();
  const middle = p.top + p.height / 2;
  const quarter = p.left + p.width / 4;
  return {
    left: ACROSS_EDGE.map((i) => at(p.left + i, middle)),
    right: ACROSS_EDGE.map((i) => at(p.right - 1 - i, middle)),
    top: ACROSS_EDGE.map((i) => at(quarter, p.top + i)),
    bottom: ACROSS_EDGE.map((i) => at(quarter, p.bottom - 1 - i)),
  };
}

/** Opens a popup of `kind` with `className` from the keyboard, and reads `acrossEdges` */
async function focusedEdges(kind: Kind, className: string, arrow: boolean) {
  await userEvent.keyboard("{Shift}");
  const { unmount } = render(
    <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
      {popupWith(kind, className, arrow)}
    </div>,
  );
  const popup = await screen.findByTestId("popup");
  await expect.poll(() => popup.matches(":focus-visible")).toBe(true);
  await waitForStable(() => JSON.stringify(popup.getBoundingClientRect()));
  const edges = await acrossEdges(popup);
  unmount();
  return edges;
}

describe.each(KINDS)("%s with an arrow and a consumer's border width", (kind) => {
  it.each(["border-0", "border-2"])(
    "with `%s`, draws its overlay's ring where a popup without an arrow draws its own",
    async (border) => {
      const own = await focusedEdges(kind, border, false);
      const overlay = await focusedEdges(kind, border, true);
      expect(overlay).toEqual(own);
    },
  );
});

describe.each(KINDS)("%s focused from the keyboard, without an arrow", (kind) => {
  // An overlay would be clipped by a consumer's `overflow`, so such a popup draws the ring itself
  it("draws the library ring on the popup itself, and has no overlay", async () => {
    await userEvent.keyboard("{Shift}");
    const content = { "data-testid": "popup", className: "overflow-auto" };
    render(
      kind === "Popover" ? (
        <Popover.Root defaultOpen>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Content {...content}>Popover</Popover.Content>
        </Popover.Root>
      ) : (
        <Menu.Root defaultOpen>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Content {...content}>
            <Menu.Item>Item</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      ),
    );
    const popup = await screen.findByTestId("popup");
    await expect.poll(() => popup.matches(":focus-visible")).toBe(true);

    expect(ringOf(getComputedStyle(popup))).toEqual(libraryRing());
    expect(getComputedStyle(popup, "::after").content).toBe("none");
  });
});

describe.each(KINDS)("%s in forced colours", (kind) => {
  afterEach(() => commands.emulateMedia({ forcedColors: "none" }));

  // Forced colours revert the `--ring` colour: on the focused popup to the browser's focus
  // colour, on the overlay, which has no focus, to CanvasText, so the overlay names `Highlight`
  it.each([
    { arrow: true, drawn: "::after" },
    { arrow: false, drawn: null },
  ])("with arrow $arrow, draws the ring in the system focus colour", async ({ arrow, drawn }) => {
    await commands.emulateMedia({ forcedColors: "active" });
    await expect.poll(() => matchMedia("(forced-colors: active)").matches).toBe(true);
    render(popupWith(kind, "", arrow));
    const popup = await screen.findByTestId("popup");
    await userEvent.keyboard("{Shift}");
    await expect.poll(() => popup.matches(":focus-visible")).toBe(true);

    expect(getComputedStyle(popup, drawn).outlineColor).toBe(systemColour("Highlight"));
  });
});

/**
 * Records, on each painted frame from the click on, whether the arrow's tip shows. Frames before
 * Base UI has placed the arrow (no inline position yet) are left out.
 */
async function tipOnEachFrame(kind: Kind) {
  render(arrowed(kind, "bottom", "ltr", false));
  const frames = eachPaintedFrame(() => {
    const arrow = document.querySelector<HTMLElement>('[data-testid="arrow"]');
    if (!arrow?.style.left) return null;
    return arrowShows(arrow, "bottom", true);
  }, 40);
  await userEvent.click(screen.getByTestId("trigger"));
  return (await frames).filter((shows) => shows !== null);
}

describe.each(KINDS)("%s.Arrow while the popup opens", (kind) => {
  describeMotionPaths(kind, () => {
    it("shows the tip on every frame", async () => {
      const shows = await tipOnEachFrame(kind);
      expect(shows.length).toBeGreaterThan(0);
      expect(shows).not.toContain(false);
    });
  });

  describe("without Motion", () => {
    afterEach(async () => {
      await emulateReducedMotion(true);
      await reloadMotion();
    });

    it("shows the tip on every frame of the CSS transition", async () => {
      // Motion never arrives, and reduced motion is off
      void reloadMotion(new Promise(() => {}));
      await emulateReducedMotion(false);
      const shows = await tipOnEachFrame(kind);
      expect(shows.length).toBeGreaterThan(0);
      expect(shows).not.toContain(false);
    });
  });
});

// Menu already transitioned only its fade and scale
describe("Popover with an arrow, without Motion", () => {
  afterEach(async () => {
    await emulateReducedMotion(true);
    await reloadMotion();
  });

  it("moves straight to a new side, without sliding its margin across", async () => {
    // CSS transition fallback: Motion never arrives, and reduced motion is off
    void reloadMotion(new Promise(() => {}));
    await emulateReducedMotion(false);
    const { rerender } = render(arrowed("Popover", "bottom", "ltr", true));
    const popup = await screen.findByTestId("popup");
    // The opening fade and scale have finished
    await waitForStable(() => JSON.stringify(popup.getBoundingClientRect()));

    rerender(arrowed("Popover", "top", "ltr", true));
    const margins = await eachPaintedFrame(() => getComputedStyle(popup).marginBottom, 20);

    expect(margins.at(-1)).toBe(`${REACH_PX}px`);
    expect(margins.filter((margin) => margin !== "0px" && margin !== `${REACH_PX}px`)).toEqual([]);
  });
});

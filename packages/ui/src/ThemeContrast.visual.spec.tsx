import { render } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./components/button";
import { Calendar } from "./components/calendar";
import { Chip } from "./components/chip";
import { Field } from "./components/field";
import { IconButton } from "./components/icon-button";

/*
 * WCAG 2 contrast of the default theme, read from the colours the browser computes for the
 * components in light and dark mode. Normal text needs 4.5:1, the focus ring 3:1.
 */

type Mode = "light" | "dark";
type Rgb = [number, number, number];

const COLORS = ["primary", "destructive", "success", "warning"] as const;
const MODES: Mode[] = ["light", "dark"];

/**
 * Paints CSS colours onto a 1×1 canvas, bottom layer first, and returns the pixel. The canvas
 * converts any computed colour (`oklch()`, `oklab()`, `color(srgb …)`) to sRGB and blends
 * translucent layers the way the page does.
 */
function paint(...layers: string[]): Rgb {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  for (const color of layers) {
    // An unparsable colour leaves fillStyle unchanged; catch that instead of painting nothing.
    ctx.fillStyle = "#010203";
    ctx.fillStyle = color;
    if (ctx.fillStyle === "#010203") throw new Error(`Canvas can't parse "${color}"`);
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** The colour behind `element`: the page canvas, then every background from the root down. */
function backgroundOf(element: Element): string[] {
  const layers: string[] = [];
  for (let el: Element | null = element; el; el = el.parentElement) {
    layers.unshift(getComputedStyle(el).backgroundColor);
  }
  return ["#fff", ...layers];
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

function ratio(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2 contrast of an element's text colour against what is painted behind it. */
function textContrast(element: Element) {
  const background = backgroundOf(element);
  return ratio(paint(...background, getComputedStyle(element).color), paint(...background));
}

function renderIn(mode: Mode, ui: ReactNode) {
  return render(
    <div className={mode === "dark" ? "dark bg-background p-4" : "bg-background p-4"}>{ui}</div>,
  );
}

const Icon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
    <circle cx="8" cy="8" r="6" fill="currentColor" />
  </svg>
);

describe.each(MODES)("theme contrast, %s mode", (mode) => {
  it("contained buttons: foreground on the fill ≥ 4.5", () => {
    const { getByRole } = renderIn(
      mode,
      COLORS.map((c) => (
        <Button key={c} color={c}>
          {c}
        </Button>
      )),
    );
    for (const c of COLORS) {
      expect.soft(textContrast(getByRole("button", { name: c })), c).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("outlined and text Button and IconButton ≥ 4.5 on the background", () => {
    const variants = ["outlined", "text"] as const;
    const { getByRole } = renderIn(
      mode,
      variants.flatMap((v) =>
        COLORS.flatMap((c) => [
          <Button key={`b-${v}-${c}`} variant={v} color={c}>
            {`${v} ${c}`}
          </Button>,
          <IconButton key={`i-${v}-${c}`} variant={v} color={c} aria-label={`icon ${v} ${c}`}>
            <Icon />
          </IconButton>,
        ]),
      ),
    );
    for (const v of variants) {
      for (const c of COLORS) {
        for (const name of [`${v} ${c}`, `icon ${v} ${c}`]) {
          expect
            .soft(textContrast(getByRole("button", { name })), name)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("chips ≥ 4.5 on their /10 tint and on the background", () => {
    const variants = ["contained", "outlined"] as const;
    const { getByText } = renderIn(
      mode,
      variants.flatMap((v) =>
        COLORS.map((c) => (
          <Chip key={`${v}-${c}`} variant={v} color={c}>
            {`${v} ${c}`}
          </Chip>
        )),
      ),
    );
    for (const v of variants) {
      for (const c of COLORS) {
        const name = `${v} ${c}`;
        expect.soft(textContrast(getByText(name)), name).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("Field.Error ≥ 4.5", () => {
    const { getByText } = renderIn(
      mode,
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Field.Control />
        <Field.Error match>This field is required.</Field.Error>
      </Field.Root>,
    );
    expect(textContrast(getByText("This field is required."))).toBeGreaterThanOrEqual(4.5);
  });

  it("Calendar today ≥ 4.5", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
    try {
      const { container } = renderIn(mode, <Calendar />);
      const today = container.querySelector('[aria-current="date"]');
      if (!today) throw new Error("No today cell");
      expect(textContrast(today)).toBeGreaterThanOrEqual(4.5);
    } finally {
      vi.useRealTimers();
    }
  });

  it("muted-foreground on muted ≥ 4.5 and the ring on the background ≥ 3", () => {
    const { getByText } = renderIn(
      mode,
      <>
        <p className="bg-muted text-muted-foreground">muted</p>
        <p className="text-ring">ring</p>
      </>,
    );
    expect.soft(textContrast(getByText("muted")), "muted").toBeGreaterThanOrEqual(4.5);
    expect.soft(textContrast(getByText("ring")), "ring").toBeGreaterThanOrEqual(3);
  });
});

describe("text shades follow the fill", () => {
  // Light mode caps the fill's lightness at 0.51, dark mode raises it to at least 0.63.
  it.each([
    ["light", "oklch(0.7 0.15 150)", "oklch(0.51 0.15 150)"],
    ["dark", "oklch(0.45 0.15 150)", "oklch(0.63 0.15 150)"],
  ] as const)("a --primary set on a nested element, %s mode", (mode, primary, expected) => {
    const { getByRole } = renderIn(
      mode,
      <div style={{ "--primary": primary } as CSSProperties}>
        <Button variant="text">Nested</Button>
      </div>,
    );
    const color = getComputedStyle(getByRole("button", { name: "Nested" })).color;
    expect(paint(color)).toEqual(paint(expected));
  });

  it("uses --primary-text when it is set", () => {
    const { getByRole } = renderIn(
      "light",
      <div style={{ "--primary-text": "oklch(0.4 0.1 30)" } as CSSProperties}>
        <Button variant="text">Pinned</Button>
      </div>,
    );
    const color = getComputedStyle(getByRole("button", { name: "Pinned" })).color;
    expect(paint(color)).toEqual(paint("oklch(0.4 0.1 30)"));
  });
});

import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { ELEMENT_COLOR, ELEMENT_VARIANTS } from "../../types";
import { pauseAnimations, renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
import { IconButton } from "../icon-button";
import { Button } from "./index";

const variants = ELEMENT_VARIANTS;
const colors = ELEMENT_COLOR;

const icon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <title>icon</title>
    <path d="M8 0a8 8 0 110 16A8 8 0 018 0z" />
  </svg>
);

describe("Button", () => {
  for (const variant of variants) {
    for (const color of colors) {
      it(`[${color}] [${variant}]`, async () => {
        const { fixture } = await renderFixture(
          <Button variant={variant} color={color}>
            {color} {variant}
          </Button>,
        );
        // A border shade 3:1 instead of 2:1 on white is under the default 0.1 threshold
        await expect(fixture).toMatchScreenshot(
          variant === "outlined" ? SMALL_FEATURE_SCREENSHOT : undefined,
        );
      });
    }
  }

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        {variants.map((v) => (
          <Button key={v} variant={v} disabled>
            Disabled
          </Button>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with icon", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        <Button startIcon={icon}>Start</Button>
        <Button endIcon={icon}>End</Button>
        <Button startIcon={icon} endIcon={icon}>
          Both
        </Button>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("loading", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        <Button loading>Loading</Button>
        <Button variant="outlined" loading>
          Loading
        </Button>
      </div>,
    );
    pauseAnimations();
    await expect(fixture).toMatchScreenshot();
  });
});

type Rgb = [number, number, number];

/** A CSS colour as the 8-bit sRGB the page paints, with out-of-gamut channels clipped. */
function srgb(color: string): Rgb {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  // An unparsable colour leaves fillStyle unchanged; catch that instead of painting nothing.
  ctx.fillStyle = "#010203";
  ctx.fillStyle = color;
  if (ctx.fillStyle === "#010203") throw new Error(`Canvas can't parse "${color}"`);
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG 2 contrast of two opaque colours. */
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(srgb(a)), luminance(srgb(b))].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

type BorderCase = {
  name: string;
  color: "success" | "warning";
  mode: "light" | "dark";
  style?: Record<string, string>;
  expected: string;
};

/** Outlined Button and IconButton, which share the border classes, inside a themed wrapper. */
function renderOutlined({ color, mode, style }: Pick<BorderCase, "color" | "mode" | "style">) {
  const { getByRole, getByTestId } = render(
    <div
      data-testid="surface"
      className={mode === "dark" ? "dark bg-background" : "bg-background"}
      style={style as CSSProperties}
    >
      <Button variant="outlined" color={color}>
        Button
      </Button>
      <IconButton variant="outlined" color={color} aria-label="IconButton">
        {icon}
      </IconButton>
    </div>,
  );
  return {
    borders: ["Button", "IconButton"].map(
      (name) => getComputedStyle(getByRole("button", { name })).borderTopColor,
    ),
    background: getComputedStyle(getByTestId("surface")).backgroundColor,
  };
}

describe("outlined success and warning borders", () => {
  // Light mode caps the fill's lightness at 0.64 (success) and 0.67 (warning), dark mode keeps it.
  it.each<BorderCase>([
    {
      name: "success, light mode: darkened to 0.64",
      color: "success",
      mode: "light",
      expected: "oklch(0.64 0.1514 166.5)",
    },
    {
      name: "warning, light mode: darkened to 0.67",
      color: "warning",
      mode: "light",
      expected: "oklch(0.67 0.1665 72.45)",
    },
    {
      name: "success, dark mode: the fill",
      color: "success",
      mode: "dark",
      expected: "oklch(0.7514 0.1514 166.5)",
    },
    {
      name: "warning, dark mode: the fill",
      color: "warning",
      mode: "dark",
      expected: "oklch(0.7797 0.1665 72.45)",
    },
    {
      name: "a lighter custom fill is darkened",
      color: "success",
      mode: "light",
      style: { "--success": "oklch(0.8 0.1 150)" },
      expected: "oklch(0.64 0.1 150)",
    },
    {
      name: "a darker custom fill is kept",
      color: "warning",
      mode: "light",
      style: { "--warning": "oklch(0.5 0.12 60)" },
      expected: "oklch(0.5 0.12 60)",
    },
    {
      name: "--success-border when it is set",
      color: "success",
      mode: "light",
      style: { "--success-border": "oklch(0.4 0.1 30)" },
      expected: "oklch(0.4 0.1 30)",
    },
  ])("$name", ({ expected, ...props }) => {
    for (const border of renderOutlined(props).borders) {
      expect(srgb(border)).toEqual(srgb(expected));
    }
  });

  it.each(["success", "warning"] as const)("%s reaches 3:1 on the light background", (color) => {
    const { borders, background } = renderOutlined({ color, mode: "light" });
    for (const border of borders) {
      expect(contrast(border, background)).toBeGreaterThanOrEqual(3);
    }
  });
});

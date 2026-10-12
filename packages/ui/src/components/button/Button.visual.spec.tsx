import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { ELEMENT_COLOR, ELEMENT_VARIANTS } from "../../types";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
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
        await expect(fixture).toMatchScreenshot();
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

// Keyboard focus shows the ring. The default colour only: the ring is `--ring` in every colour,
// and the variant decides what borders the gap between the ring and the button
describe("Button focus-visible", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const variant of variants) {
      it(`[${mode}] [${variant}]`, async () => {
        await renderFixture(
          <div
            data-testid="mode"
            className={mode === "dark" ? "dark bg-background p-4" : "bg-background p-4"}
          >
            <Button variant={variant}>Focused</Button>
          </div>,
        );
        await userEvent.tab();
        const button = screen.getByRole("button");
        expect(button.matches(":focus-visible")).toBe(true);
        await expect(page.getByTestId("mode")).toMatchScreenshot();
      });
    }
  }
});

/** `--ring` as the browser computes it for an outline colour */
function ringColor() {
  const probe = document.createElement("span");
  probe.style.outlineColor = "var(--ring)";
  document.body.append(probe);
  const color = getComputedStyle(probe).outlineColor;
  probe.remove();
  return color;
}

describe("Button focus ring with no reduced-motion preference", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(variants)(
    "has the ring colour from the moment it takes keyboard focus (%s)",
    async (variant) => {
      render(
        <>
          <button type="button">Before</button>
          <Button variant={variant}>Target</Button>
        </>,
      );
      await userEvent.tab();
      const target = screen.getByRole("button", { name: "Target" });
      // Focus moves on from a keyboard-focused element, so the target matches :focus-visible.
      // Moved in the page, so the style below is read in the same task: a transition would
      // still be at its start.
      target.focus();
      expect(target.matches(":focus-visible")).toBe(true);
      expect(getComputedStyle(target).outlineColor).toBe(ringColor());
    },
  );

  // The ring is left out, not the rest: hover and press still transition
  it("still fades its colours and scales when pressed", () => {
    render(<Button>Target</Button>);
    const properties = getComputedStyle(screen.getByRole("button")).transitionProperty.split(", ");
    expect(properties).toEqual(
      expect.arrayContaining(["color", "background-color", "border-color", "scale"]),
    );
    expect(properties.filter((p) => p === "all" || p.startsWith("outline"))).toEqual([]);
  });
});

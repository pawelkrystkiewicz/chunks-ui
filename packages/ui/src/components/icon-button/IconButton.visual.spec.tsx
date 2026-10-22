import { render, screen } from "@testing-library/react";
import { ELEMENT_COLOR, ELEMENT_VARIANTS } from "chunks-ui-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { emulateReducedMotion, renderFixture, ringColor } from "../../VisualTest.utils";
import { IconButton } from "./index";

const variants = ELEMENT_VARIANTS;
const colors = ELEMENT_COLOR;

const icon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8 3v10M3 8h10" />
  </svg>
);

describe("IconButton", () => {
  for (const variant of variants) {
    for (const color of colors) {
      it(`[${color}] [${variant}]`, async () => {
        const { fixture } = await renderFixture(
          <IconButton variant={variant} color={color} aria-label={`${color} ${variant}`}>
            {icon}
          </IconButton>,
        );
        await expect(fixture).toMatchScreenshot();
      });
    }
  }

  // Primary, so the dimmed fill shows: secondary's 0.97 fill moves only 5 grey levels at half
  // opacity, under even the 0.02 threshold
  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 12 }}>
        {variants.map((v) => (
          <IconButton key={v} variant={v} color="primary" disabled aria-label={`Disabled ${v}`}>
            {icon}
          </IconButton>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});

// Keyboard focus shows the ring. The default colour only: the ring is `--ring` in every colour,
// and the variant decides what borders the gap between the ring and the button
describe("IconButton focus-visible", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const variant of variants) {
      it(`[${mode}] [${variant}]`, async () => {
        await renderFixture(
          <div
            data-testid="mode"
            className={mode === "dark" ? "dark bg-background p-4" : "bg-background p-4"}
          >
            <IconButton variant={variant} aria-label="Focused">
              {icon}
            </IconButton>
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

describe("IconButton focus ring with no reduced-motion preference", () => {
  beforeAll(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  // One variant: the ring colour does not depend on it
  it("has the ring colour from the moment it takes keyboard focus", async () => {
    render(
      <>
        <button type="button">Before</button>
        <IconButton variant="contained" color="primary" aria-label="Target">
          {icon}
        </IconButton>
      </>,
    );
    await userEvent.tab();
    const target = screen.getByRole("button", { name: "Target" });
    // Focus moves on from a keyboard-focused element, so the target matches :focus-visible.
    // Moved in the page, so the style below is read in the same task: a transition would
    // still be at its start.
    target.focus();
    expect(target.matches(":focus-visible")).toBe(true);
    const style = getComputedStyle(target);
    // Not reduced motion: otherwise the colour would pass without any transition to test
    expect(style.transitionProperty).not.toBe("none");
    expect(style.outlineColor).toBe(ringColor());
  });
});

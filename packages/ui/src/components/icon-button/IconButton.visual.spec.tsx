import { describe, expect, it } from "vitest";
import { ELEMENT_COLOR, ELEMENT_VARIANTS } from "../../types";
import { renderFixture } from "../../VisualTest.utils";
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

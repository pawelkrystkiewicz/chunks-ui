import { describe, it } from "vitest";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
import { Button } from "./index";

const variants = ["contained", "outlined", "ghost", "link"] as const;
const colors = ["primary", "destructive", "success", "warning", "secondary"] as const;

const icon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <title>icon</title>
    <path d="M8 0a8 8 0 110 16A8 8 0 018 0z" />
  </svg>
);

describe("Button", () => {
  it("variant matrix", async () => {
    const { fixture } = await renderFixture(
      <div
        style={{ display: "grid", gridTemplateColumns: `repeat(${colors.length}, auto)`, gap: 12 }}
      >
        {variants.map((v) =>
          colors.map((c) => (
            <Button key={`${v}-${c}`} variant={v} color={c}>
              {v}
            </Button>
          )),
        )}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

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

import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { commands } from "vitest/browser";
import { renderFixture } from "../../VisualTest.utils";
import { Switch } from "./index";

describe("Switch", () => {
  it("states", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root>
            <Switch.Thumb />
          </Switch.Root>
          Off
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          On
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root disabled>
            <Switch.Thumb />
          </Switch.Root>
          Disabled
        </span>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("keeps a visible track edge in forced-colors mode", async () => {
    // Forced colors replace backgrounds, so only a border can show where the track is.
    await commands.emulateMedia({ forcedColors: "active" });
    try {
      const { getByRole } = render(
        <Switch.Root aria-label="Forced colors">
          <Switch.Thumb />
        </Switch.Root>,
      );
      const track = getComputedStyle(getByRole("switch"));
      expect(track.borderTopStyle).toBe("solid");
      expect(track.borderTopWidth).not.toBe("0px");
    } finally {
      await commands.emulateMedia({ forcedColors: "none" });
    }
  });
});

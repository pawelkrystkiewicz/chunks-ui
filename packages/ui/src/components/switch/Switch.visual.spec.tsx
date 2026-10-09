import { render } from "@testing-library/react";
import { afterEach, describe, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
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
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });
});

describe("Switch in forced-colors mode", () => {
  // Forced colours replace backgrounds with the page colour, so the track edge and the thumb
  // need system colours to stay visible.
  afterEach(() => commands.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" }));

  it("keeps a visible track edge", async () => {
    await commands.emulateMedia({ forcedColors: "active" });
    const { getByRole } = render(
      <Switch.Root aria-label="Forced colors">
        <Switch.Thumb />
      </Switch.Root>,
    );
    const edge = getComputedStyle(getByRole("switch"), "::before");
    expect(edge.borderTopStyle).toBe("solid");
    expect(edge.borderTopWidth).not.toBe("0px");
  });

  it.each([
    { path: "Motion spring", reducedMotion: false },
    { path: "CSS fallback", reducedMotion: true },
  ])("shows the thumb in both states, $path", async ({ reducedMotion }) => {
    await commands.emulateMedia({
      forcedColors: "active",
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    });
    const { getByRole, getByTestId } = render(
      <Switch.Root aria-label="Forced colors">
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    );
    const track = getByRole("switch");
    const thumb = () => getByTestId("thumb");
    await expect
      .poll(() => thumb().classList.contains("micro-interactions"), { timeout: 5000 })
      .toBe(reducedMotion);
    const colours = () => ({
      thumb: getComputedStyle(thumb()).backgroundColor,
      track: getComputedStyle(track).backgroundColor,
    });

    const off = colours();
    await userEvent.click(track);
    expect(track.getAttribute("aria-checked")).toBe("true");
    const on = colours();

    for (const { thumb, track } of [off, on]) {
      expect(thumb).not.toBe("rgba(0, 0, 0, 0)");
      expect(thumb).not.toBe(track);
    }
    // Position already tells the states apart; colour is a second cue.
    expect(on.thumb).not.toBe(off.thumb);
  });
});

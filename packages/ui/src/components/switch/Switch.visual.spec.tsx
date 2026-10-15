import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
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
});

describe("Switch disabled", () => {
  it("shows a not-allowed cursor on the root and the thumb, and a click does not switch it on", async () => {
    const { getByRole, getByTestId } = render(
      <div>
        <input aria-label="Name" />
        <Switch.Root aria-label="Enabled">
          <Switch.Thumb />
        </Switch.Root>
        <Switch.Root aria-label="Disabled" disabled>
          <Switch.Thumb data-testid="thumb" />
        </Switch.Root>
      </div>,
    );
    const root = getByRole("switch", { name: "Disabled" });
    const { cursor, pointerEvents } = getComputedStyle(root);
    expect({ cursor, pointerEvents }).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
    expect(getComputedStyle(getByRole("switch", { name: "Enabled" })).cursor).not.toBe(
      "not-allowed",
    );
    // The thumb ignores the pointer, so the root under it supplies the cursor
    const box = getByTestId("thumb").getBoundingClientRect();
    expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(root);

    const input = getByRole("textbox", { name: "Name" });
    input.focus();
    // force: Playwright refuses to click a disabled element, a user can
    await page.elementLocator(root).click({ force: true });
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(document.activeElement).toBe(input);
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

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { renderFixture, systemColour } from "../../VisualTest.utils";
import { Calendar } from "./index";

// Freeze time for deterministic visual snapshots
const FROZEN_DATE = new Date(2026, 2, 15, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Calendar", () => {
  // Canary for the `timezoneId` pin in vitest.visual.config.ts: January in Europe/Warsaw is UTC+1
  it("runs in the pinned time zone", () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
  });

  it("with selected date", async () => {
    const { fixture } = await renderFixture(<Calendar value={new Date(2026, 2, 15)} />);
    await expect(fixture).toMatchScreenshot();
  });

  it("no selection", async () => {
    const { fixture } = await renderFixture(<Calendar />);
    await expect(fixture).toMatchScreenshot();
  });

  // March 2026 from Monday: February 23–28 lead, April 1–5 trail. Today is the 15th.
  it.each(["light", "dark"])("with outside days, %s", async (mode) => {
    const { getByTestId } = await renderFixture(
      <div data-testid="theme" className={`${mode} bg-background text-foreground`}>
        <Calendar value={new Date(2026, 2, 18)} weekStartsOn={1} showOutsideDays />
      </div>,
    );
    await expect(getByTestId("theme")).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the day, which reaches 2px over the
  // neighbouring cells (2px padding each); the grid clips nothing
  it("selected day focus-visible", async () => {
    const { fixture } = await renderFixture(<Calendar value={new Date(2026, 2, 15)} />);
    const day = screen.getByLabelText("Sunday, March 15, 2026", { selector: "button" });
    day.focus();
    expect(day.matches(":focus-visible")).toBe(true);
    await expect(fixture).toMatchScreenshot();
  });
});

describe("Calendar in forced-colors mode", () => {
  // Forced colours replace author colours, so the muted text of outside days needs a system colour
  afterEach(() => commands.emulateMedia({ forcedColors: "none" }));

  it("tells outside days from the shown month's days", async () => {
    await commands.emulateMedia({ forcedColors: "active" });
    await expect.poll(() => matchMedia("(forced-colors: active)").matches).toBe(true);
    render(<Calendar value={new Date(2026, 2, 18)} weekStartsOn={1} showOutsideDays />);
    const colour = (name: string) =>
      getComputedStyle(screen.getByLabelText(name, { selector: "button" })).color;
    const outside = colour("Monday, February 23, 2026");
    expect(outside).toBe(systemColour("GrayText"));
    expect(outside).not.toBe(colour("Monday, March 2, 2026"));
  });
});

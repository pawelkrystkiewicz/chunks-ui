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
});

// The number's `<span>` inside a day's button
function dayNumber(name: string) {
  const span = screen.getByLabelText(name, { selector: "button" }).querySelector("span");
  if (!span) throw new Error(`The day "${name}" has no number element`);
  return span;
}

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

  // Forced colours drop author backgrounds and box shadows: the selected day's fill and today's
  // ring go with them. System colours and text decorations survive.
  it("keeps the selected day, today, outside days and disabled days apart", async () => {
    await commands.emulateMedia({ forcedColors: "active" });
    await expect.poll(() => matchMedia("(forced-colors: active)").matches).toBe(true);
    const { fixture } = await renderFixture(
      <Calendar
        value={new Date(2026, 2, 18)}
        weekStartsOn={1}
        showOutsideDays
        isDateDisabled={(date) => date.getMonth() === 2 && date.getDate() === 20}
      />,
    );
    const style = (name: string) =>
      getComputedStyle(screen.getByLabelText(name, { selector: "button" }));
    const numberStyle = (name: string) => getComputedStyle(dayNumber(name));
    const selected = style("Wednesday, March 18, 2026");
    expect(selected.backgroundColor).toBe(systemColour("Highlight"));
    expect(selected.color).toBe(systemColour("HighlightText"));
    // Today's underline is on the number's span, so a strike on the button does not replace it
    expect(numberStyle("Sunday, March 15, 2026").textDecorationLine).toBe("underline");
    const outside = style("Monday, February 23, 2026");
    expect(outside.color).toBe(systemColour("GrayText"));
    expect(outside.textDecorationLine).toBe("none");
    // Dimmed by colour alone and struck through, so it differs from an outside day at full contrast
    const disabled = style("Friday, March 20, 2026");
    expect(disabled.color).toBe(systemColour("GrayText"));
    expect(disabled.textDecorationLine).toBe("line-through");
    expect(disabled.opacity).toBe("1");
    await expect(fixture).toMatchScreenshot();
  });

  // Today is the 15th. The strike is on the button and the underline on the number's span: both
  // set `text-decoration-line`, so on one element the strike would drop the underline.
  it("underlines today when it is disabled, and strikes it through", async () => {
    await commands.emulateMedia({ forcedColors: "active" });
    await expect.poll(() => matchMedia("(forced-colors: active)").matches).toBe(true);
    render(
      <Calendar
        value={new Date(2026, 2, 18)}
        weekStartsOn={1}
        isDateDisabled={(date) => date.getMonth() === 2 && date.getDate() === 15}
      />,
    );
    const name = "Sunday, March 15, 2026";
    expect(
      getComputedStyle(screen.getByLabelText(name, { selector: "button" })).textDecorationLine,
    ).toBe("line-through");
    expect(getComputedStyle(dayNumber(name)).textDecorationLine).toBe("underline");
  });
});

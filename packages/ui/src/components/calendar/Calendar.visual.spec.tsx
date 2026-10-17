import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  emulateForcedColors,
  expectNotAllowed,
  focusVisible,
  renderFixture,
  systemColour,
} from "../../VisualTest.utils";
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

// Renders a Calendar whose March 20 is disabled, and returns that day's button
function renderDisabledDay() {
  render(
    <Calendar
      value={new Date(2026, 2, 18)}
      isDateDisabled={(date) => date.getMonth() === 2 && date.getDate() === 20}
    />,
  );
  return screen.getByLabelText("Friday, March 20, 2026", { selector: "button" });
}

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
    focusVisible(day);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on a disabled day", () => {
    expectNotAllowed(renderDisabledDay());
  });

  // The day receives the pointer now, so the hover fill of an enabled day must stay off it
  it("keeps a disabled day at its rest colours under the pointer", async () => {
    const day = renderDisabledDay();
    const looks = () => {
      const { backgroundColor, color } = getComputedStyle(day);
      return { backgroundColor, color };
    };
    const rest = looks();
    await userEvent.hover(day);
    expect(looks()).toEqual(rest);
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
  afterEach(() => emulateForcedColors(false));

  it("tells outside days from the shown month's days", async () => {
    await emulateForcedColors(true);
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
    await emulateForcedColors(true);
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
    const selected = style("Wednesday, March 18, 2026");
    expect(selected.backgroundColor).toBe(systemColour("Highlight"));
    expect(selected.color).toBe(systemColour("HighlightText"));
    // The number's span, which the text sits in, is left to the system
    expect(getComputedStyle(dayNumber("Wednesday, March 18, 2026")).forcedColorAdjust).toBe("none");
    expect(style("Monday, February 23, 2026").textDecorationLine).toBe("none");
    // Dimmed by colour alone and struck through, so it differs from an outside day at full contrast
    const disabled = style("Friday, March 20, 2026");
    expect(disabled.color).toBe(systemColour("GrayText"));
    expect(disabled.textDecorationLine).toBe("line-through");
    expect(disabled.opacity).toBe("1");
    await expect(fixture).toMatchScreenshot();
  });

  it("underlines today when it is disabled, and strikes it through", async () => {
    await emulateForcedColors(true);
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

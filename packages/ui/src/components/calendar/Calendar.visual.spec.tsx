import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
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
  it("with selected date", async () => {
    const { fixture } = await renderFixture(<Calendar value={new Date(2026, 2, 15)} />);
    await expect(fixture).toMatchScreenshot();
  });

  it("no selection", async () => {
    const { fixture } = await renderFixture(<Calendar />);
    await expect(fixture).toMatchScreenshot();
  });
});

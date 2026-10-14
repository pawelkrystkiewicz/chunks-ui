import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  buildWeekRows,
  createDate,
  FIRST_DAY,
  getKeyTarget,
  isDateOutOfRange,
  isSameDay,
  isSameMonth,
  monthOf,
  startOfDay,
  toIsoDate,
  validDate,
  weekdayIndex,
} from "./date";

const NO_MODIFIERS = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

describe("validDate", () => {
  it("returns a valid date as it is", () => {
    const date = createDate(2026, 2, 15);
    expect(validDate(date)).toBe(date);
  });

  it("counts null and undefined as no date", () => {
    expect(validDate(null)).toBeNull();
    expect(validDate(undefined)).toBeNull();
  });

  it("counts an Invalid Date as no date", () => {
    expect(validDate(new Date(Number.NaN))).toBeNull();
  });

  it("counts a date before year 1 as no date", () => {
    expect(validDate(createDate(0, 5, 15))).toBeNull();
    expect(validDate(createDate(1, 0, 1))).not.toBeNull();
  });
});

describe("createDate", () => {
  it("keeps the years 0-99, which the Date constructor reads as 1900-1999", () => {
    expect(createDate(50, 0, 5).getFullYear()).toBe(50);
    expect(new Date(50, 0, 5).getFullYear()).toBe(1950);
  });

  it("is local midnight", () => {
    const date = createDate(2026, 2, 15);
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 15]);
    expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual(
      [0, 0, 0, 0],
    );
  });

  it("rolls a month or day out of range over, as the constructor does", () => {
    expect(createDate(2026, 12, 1)).toEqual(createDate(2027, 0, 1));
    expect(createDate(2026, 0, 0)).toEqual(createDate(2025, 11, 31));
    expect(createDate(2026, 0, 32)).toEqual(createDate(2026, 1, 1));
  });
});

describe("toIsoDate", () => {
  it("writes the local calendar date as YYYY-MM-DD", () => {
    expect(toIsoDate(createDate(2026, 2, 5))).toBe("2026-03-05");
    expect(toIsoDate(createDate(2026, 11, 31))).toBe("2026-12-31");
  });

  it("pads a year before 1000 to four digits", () => {
    expect(toIsoDate(createDate(999, 0, 5))).toBe("0999-01-05");
    expect(toIsoDate(createDate(50, 11, 31))).toBe("0050-12-31");
    expect(toIsoDate(createDate(1, 0, 1))).toBe("0001-01-01");
  });

  it("uses the local date, whatever the time of day", () => {
    // 00:30 in Europe/Warsaw (vitest.config.ts pins TZ) is the previous day in UTC
    expect(toIsoDate(new Date(2026, 2, 15, 0, 30))).toBe("2026-03-15");
  });
});

describe("isSameDay", () => {
  it("compares the calendar day, not the time", () => {
    expect(isSameDay(new Date(2026, 2, 15, 8), new Date(2026, 2, 15, 20))).toBe(true);
    expect(isSameDay(createDate(2026, 2, 15), createDate(2026, 2, 16))).toBe(false);
    expect(isSameDay(createDate(2026, 2, 15), createDate(2025, 2, 15))).toBe(false);
  });
});

describe("monthOf and isSameMonth", () => {
  it("read the year and month of a date", () => {
    expect(monthOf(createDate(2026, 2, 15))).toEqual({ year: 2026, month: 2 });
  });

  it("compare year and month", () => {
    expect(isSameMonth({ year: 2026, month: 2 }, monthOf(createDate(2026, 2, 31)))).toBe(true);
    expect(isSameMonth({ year: 2026, month: 2 }, { year: 2025, month: 2 })).toBe(false);
    expect(isSameMonth({ year: 2026, month: 2 }, { year: 2026, month: 3 })).toBe(false);
  });
});

describe("startOfDay", () => {
  it("drops the time of day", () => {
    expect(startOfDay(new Date(2026, 2, 15, 13, 45, 30, 500))).toEqual(createDate(2026, 2, 15));
  });
});

describe("addDays", () => {
  it("crosses month and year ends in both directions", () => {
    expect(addDays(createDate(2026, 0, 31), 1)).toEqual(createDate(2026, 1, 1));
    expect(addDays(createDate(2026, 0, 1), -1)).toEqual(createDate(2025, 11, 31));
  });
});

describe("addMonths", () => {
  it("moves to the same day in another month", () => {
    expect(addMonths(createDate(2026, 0, 15), 1)).toEqual(createDate(2026, 1, 15));
    expect(addMonths(createDate(2026, 5, 15), -3)).toEqual(createDate(2026, 2, 15));
  });

  it("crosses a year end in both directions", () => {
    expect(addMonths(createDate(2025, 11, 15), 1)).toEqual(createDate(2026, 0, 15));
    expect(addMonths(createDate(2026, 0, 15), -1)).toEqual(createDate(2025, 11, 15));
  });

  it("clamps the 31st to the target month's length", () => {
    expect(addMonths(createDate(2026, 0, 31), 1)).toEqual(createDate(2026, 1, 28));
    expect(addMonths(createDate(2026, 2, 31), -1)).toEqual(createDate(2026, 1, 28));
    expect(addMonths(createDate(2026, 2, 31), 1)).toEqual(createDate(2026, 3, 30));
    expect(addMonths(createDate(2025, 11, 31), -1)).toEqual(createDate(2025, 10, 30));
  });

  it("clamps 29 February to the 28th a year later", () => {
    expect(addMonths(createDate(2024, 1, 29), 12)).toEqual(createDate(2025, 1, 28));
    expect(addMonths(createDate(2024, 1, 29), -12)).toEqual(createDate(2023, 1, 28));
  });
});

describe("weekdayIndex", () => {
  it("is the column of the day in a week that starts on weekStartsOn", () => {
    const sunday = createDate(2026, 2, 15);
    const monday = createDate(2026, 2, 16);
    expect(weekdayIndex(sunday, 0)).toBe(0);
    expect(weekdayIndex(monday, 0)).toBe(1);
    expect(weekdayIndex(sunday, 1)).toBe(6);
    expect(weekdayIndex(monday, 1)).toBe(0);
    expect(weekdayIndex(sunday, 6)).toBe(1);
  });
});

describe("getKeyTarget", () => {
  // Wednesday
  const date = createDate(2026, 2, 18);
  const target = (key: string, modifiers: Partial<typeof NO_MODIFIERS> = {}, weekStartsOn = 0) =>
    getKeyTarget({ key, ...NO_MODIFIERS, ...modifiers }, date, weekStartsOn);

  it.each([
    ["ArrowLeft", createDate(2026, 2, 17)],
    ["ArrowRight", createDate(2026, 2, 19)],
    ["ArrowUp", createDate(2026, 2, 11)],
    ["ArrowDown", createDate(2026, 2, 25)],
    ["Home", createDate(2026, 2, 15)],
    ["End", createDate(2026, 2, 21)],
    ["PageUp", createDate(2026, 1, 18)],
    ["PageDown", createDate(2026, 3, 18)],
  ])("moves on %s", (key, expected) => {
    expect(target(key)).toEqual(expected);
  });

  it("keeps arrows and Home/End working with Shift", () => {
    expect(target("ArrowLeft", { shiftKey: true })).toEqual(createDate(2026, 2, 17));
    expect(target("Home", { shiftKey: true })).toEqual(createDate(2026, 2, 15));
  });

  it("moves a year on Shift+PageUp and Shift+PageDown", () => {
    expect(target("PageUp", { shiftKey: true })).toEqual(createDate(2025, 2, 18));
    expect(target("PageDown", { shiftKey: true })).toEqual(createDate(2027, 2, 18));
  });

  it("moves Home and End to the ends of a week that starts on weekStartsOn", () => {
    expect(target("Home", {}, 1)).toEqual(createDate(2026, 2, 16));
    expect(target("End", {}, 1)).toEqual(createDate(2026, 2, 22));
  });

  it("leaves a key with Alt, Ctrl or Meta to the browser", () => {
    expect(target("ArrowLeft", { altKey: true })).toBeNull();
    expect(target("ArrowLeft", { ctrlKey: true })).toBeNull();
    expect(target("ArrowLeft", { metaKey: true })).toBeNull();
    expect(target("PageUp", { ctrlKey: true, shiftKey: true })).toBeNull();
  });

  it("ignores other keys", () => {
    expect(target("Enter")).toBeNull();
    expect(target(" ")).toBeNull();
    expect(target("a")).toBeNull();
  });
});

describe("buildWeekRows", () => {
  const days = (cells: { date: Date | null }[]) =>
    cells.map((cell) => (cell.date ? [cell.date.getMonth(), cell.date.getDate()] : null));

  it("leaves the cells before and after the month empty without outside days", () => {
    // February 2024: 29 days, starts on a Thursday
    const rows = buildWeekRows(2024, 1, 0, false);
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.length === 7)).toBe(true);
    expect(days(rows[0] ?? [])).toEqual([null, null, null, null, [1, 1], [1, 2], [1, 3]]);
    expect(days(rows[4] ?? [])).toEqual([[1, 25], [1, 26], [1, 27], [1, 28], [1, 29], null, null]);
    expect(rows.flat().filter((cell) => cell.date !== null)).toHaveLength(29);
  });

  it("fills those cells with the neighbouring months' days with outside days", () => {
    const rows = buildWeekRows(2024, 1, 0, true);
    expect(rows).toHaveLength(5);
    expect(days(rows[0] ?? [])).toEqual([
      [0, 28],
      [0, 29],
      [0, 30],
      [0, 31],
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
    expect(days(rows[4] ?? [])).toEqual([
      [1, 25],
      [1, 26],
      [1, 27],
      [1, 28],
      [1, 29],
      [2, 1],
      [2, 2],
    ]);
  });

  it("needs no padding for a month that starts on the week's first day", () => {
    // February 2026: 28 days, starts on a Sunday
    const rows = buildWeekRows(2026, 1, 0, false);
    expect(rows).toHaveLength(4);
    expect(rows.flat().every((cell) => cell.date !== null)).toBe(true);
    expect(days(rows[0] ?? [])[0]).toEqual([1, 1]);
    expect(days(rows[3] ?? [])[6]).toEqual([1, 28]);
  });

  it("starts the week on weekStartsOn", () => {
    const rows = buildWeekRows(2026, 1, 1, false);
    expect(rows).toHaveLength(5);
    expect(days(rows[0] ?? [])).toEqual([null, null, null, null, null, null, [1, 1]]);
    expect(days(rows[4] ?? [])).toEqual([
      [1, 23],
      [1, 24],
      [1, 25],
      [1, 26],
      [1, 27],
      [1, 28],
      null,
    ]);
  });

  it("gives every cell its own key, outside days and empty cells included", () => {
    for (const showOutsideDays of [false, true]) {
      const keys = buildWeekRows(2024, 1, 0, showOutsideDays)
        .flat()
        .map((cell) => cell.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("isDateOutOfRange", () => {
  const min = createDate(2026, 2, 10);
  const max = createDate(2026, 2, 20);

  it("is false without bounds", () => {
    expect(isDateOutOfRange(createDate(2026, 2, 15))).toBe(false);
    expect(isDateOutOfRange(createDate(9999, 11, 31))).toBe(false);
  });

  it("includes min and max", () => {
    expect(isDateOutOfRange(min, min, max)).toBe(false);
    expect(isDateOutOfRange(max, min, max)).toBe(false);
    expect(isDateOutOfRange(addDays(min, -1), min, max)).toBe(true);
    expect(isDateOutOfRange(addDays(max, 1), min, max)).toBe(true);
  });

  it("takes either bound alone", () => {
    expect(isDateOutOfRange(createDate(2026, 0, 1), min)).toBe(true);
    expect(isDateOutOfRange(createDate(2030, 0, 1), min)).toBe(false);
    expect(isDateOutOfRange(createDate(2030, 0, 1), undefined, max)).toBe(true);
    expect(isDateOutOfRange(createDate(2026, 0, 1), undefined, max)).toBe(false);
  });

  it("compares days, not times", () => {
    expect(isDateOutOfRange(new Date(2026, 2, 20, 23, 59), min, max)).toBe(false);
    expect(isDateOutOfRange(createDate(2026, 2, 10), new Date(2026, 2, 10, 12), max)).toBe(false);
  });

  it("is true before year 1, which the calendar never shows", () => {
    expect(isDateOutOfRange(createDate(0, 11, 31))).toBe(true);
    expect(isDateOutOfRange(FIRST_DAY)).toBe(false);
  });
});

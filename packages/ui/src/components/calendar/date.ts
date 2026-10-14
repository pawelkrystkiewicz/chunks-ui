// The Calendar and DatePicker date helpers: local calendar days, no React, no DOM.

/**
 * `date`, or null when it is missing, an Invalid Date, or before year 1 (no 4-digit ISO form):
 * all count as no date.
 */
export function validDate(date: Date | null | undefined): Date | null {
  return date && !Number.isNaN(date.getTime()) && date.getFullYear() >= 1 ? date : null;
}

/**
 * Local midnight of a day. Unlike `new Date(y, m, d)`, it keeps the years 0–99, which the
 * constructor reads as 1900–1999. Months and days out of range roll over as in the constructor.
 */
export function createDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}

/** The first day the calendar shows. Earlier years (0 and below) have no 4-digit ISO form. */
export const FIRST_DAY = createDate(1, 0, 1);

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** A year and month: the view's state. */
export type YearMonth = { year: number; month: number };

/** The year and month of `date`, the view's state. */
export function monthOf(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

export function startOfDay(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Same day `months` later, clamped to the target month's length (Mar 31 − 1 month = Feb 28). */
export function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const daysInMonth = createDate(year, month + 1, 0).getDate();
  return createDate(year, month, Math.min(date.getDate(), daysInMonth));
}

/** Column of `date` in a week that starts on `weekStartsOn` (0 = first column). */
export function weekdayIndex(date: Date, weekStartsOn: number): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

/** The modifier keys `getKeyTarget` reads, as a keyboard event carries them. */
export type KeyModifiers = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

/** Day that a grid navigation key moves focus to (WAI-ARIA APG date grid), or null. */
export function getKeyTarget(
  key: string,
  modifiers: KeyModifiers,
  date: Date,
  weekStartsOn: number,
): Date | null {
  if (modifiers.altKey || modifiers.ctrlKey || modifiers.metaKey) return null;
  switch (key) {
    case "ArrowLeft":
      return addDays(date, -1);
    case "ArrowRight":
      return addDays(date, 1);
    case "ArrowUp":
      return addDays(date, -7);
    case "ArrowDown":
      return addDays(date, 7);
    case "Home":
      return addDays(date, -weekdayIndex(date, weekStartsOn));
    case "End":
      return addDays(date, 6 - weekdayIndex(date, weekStartsOn));
    case "PageUp":
      return addMonths(date, modifiers.shiftKey ? -12 : -1);
    case "PageDown":
      return addMonths(date, modifiers.shiftKey ? 12 : 1);
    default:
      return null;
  }
}

export type CalendarCell = { key: string; date: Date | null };

export function buildWeekRows(
  year: number,
  month: number,
  weekStartsOn: number,
  showOutsideDays: boolean,
): CalendarCell[][] {
  const firstDay = createDate(year, month, 1);
  const lastDay = createDate(year, month + 1, 0);
  const startPad = weekdayIndex(firstDay, weekStartsOn);
  const totalDays = lastDay.getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i++) {
    const date = createDate(year, month, i - startPad + 1);
    cells.push({ key: date.toISOString(), date: showOutsideDays ? date : null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const date = createDate(year, month, d);
    cells.push({ key: date.toISOString(), date });
  }
  // Pad to complete the last row
  for (let d = 1; cells.length % 7 !== 0; d++) {
    const date = createDate(year, month + 1, d);
    cells.push({ key: date.toISOString(), date: showOutsideDays ? date : null });
  }

  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function isDateOutOfRange(date: Date, min?: Date, max?: Date): boolean {
  const d = startOfDay(date);
  if (d < FIRST_DAY) return true;
  if (min && d < startOfDay(min)) return true;
  if (max && d > startOfDay(max)) return true;
  return false;
}

// Local calendar date, not toISOString(), which shifts to UTC and can change the day. The year
// has 4 digits, as ISO 8601 and <input type="date"> need: 0999, not 999.
export function toIsoDate(date: Date): string {
  const pad = (n: number, length = 2) => String(n).padStart(length, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

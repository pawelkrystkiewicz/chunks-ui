const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * The built-in English strings of `Calendar`. The functions get the date they describe, at local
 * midnight: format it in the local time zone, not with `timeZone: "UTC"`, which east of UTC gives
 * the day before. A React Server Component can't pass functions to `Calendar`, a client component.
 */
export type CalendarLabels = {
  /**
   * Name of the button that shows the previous month.
   * @default "Previous month"
   */
  previousMonth: string;
  /**
   * Name of the button that shows the next month.
   * @default "Next month"
   */
  nextMonth: string;
  /**
   * The heading above the days, which also names the grid. Gets the first day of the shown month,
   * at local midnight.
   * @default (date) => "March 2026"
   */
  heading: (date: Date) => string;
  /**
   * The column header of a weekday. Gets a date that falls on that weekday, at local midnight.
   * @default (date) => "Su" … "Sa"
   */
  weekday: (date: Date) => string;
  /**
   * Accessible name of a day button. Gets its day, at local midnight.
   * @default (date) => "Sunday, March 15, 2026"
   */
  day: (date: Date) => string;
};

export const DEFAULT_CALENDAR_LABELS: Readonly<CalendarLabels> = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  heading: (date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
  weekday: (date) => DAY_NAMES[date.getDay()] ?? "",
  day: (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
};

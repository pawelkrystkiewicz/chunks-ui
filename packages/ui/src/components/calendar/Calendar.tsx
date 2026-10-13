"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { cn } from "../../lib/cn";
import { mergeLabels } from "../../lib/labels";

export type CalendarProps = {
  /** Controlled selected date. An Invalid Date counts as no date. */
  value?: Date | null;
  /** Initial selected date for uncontrolled usage. An Invalid Date counts as no date. */
  defaultValue?: Date | null;
  /** Called when the selected date changes. */
  onValueChange?: (date: Date | null) => void;
  /**
   * The shown month (controlled): any date in it. The arrows, the keys and a click on an outside
   * day then call `onMonthChange` and wait for a new `month`, and a new `value` does not move the
   * view. An Invalid Date, or one before year 1, shows the selected day's month, else today's.
   * Without it, the calendar opens on the selected day's month, else today's, and moves by itself.
   */
  month?: Date;
  /**
   * Called with the first day of a month, at local midnight, when the user moves to that month:
   * the previous or next month arrow, a key that moves focus out of the shown month, or a click
   * on an outside day. A new `value` that moves the view does not call it.
   */
  onMonthChange?: (month: Date) => void;
  /** Dates to disable — return true to disable a given date. */
  isDateDisabled?: (date: Date) => boolean;
  /** Minimum selectable date (inclusive). */
  min?: Date;
  /** Maximum selectable date (inclusive). */
  max?: Date;
  /**
   * First day of the week: `0` = Sunday, `1` = Monday, up to `6` = Saturday.
   * @default 0
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Fill leading and trailing cells with dimmed days from the neighbouring months.
   * @default false
   */
  showOutsideDays?: boolean;
  /**
   * Replaces the built-in English strings, e.g. to translate them. Keys you leave out keep the
   * default from `DEFAULT_CALENDAR_LABELS`.
   */
  labels?: Partial<CalendarLabels>;
  className?: string;
};

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
const FIRST_DAY = createDate(1, 0, 1);

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** A year and month: the view's state. */
type YearMonth = { year: number; month: number };

/** The year and month of `date`, the view's state. */
function monthOf(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() };
}

function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

function startOfDay(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Same day `months` later, clamped to the target month's length (Mar 31 − 1 month = Feb 28). */
function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const daysInMonth = createDate(year, month + 1, 0).getDate();
  return createDate(year, month, Math.min(date.getDate(), daysInMonth));
}

/** Column of `date` in a week that starts on `weekStartsOn` (0 = first column). */
function weekdayIndex(date: Date, weekStartsOn: number): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

/** Day that a grid navigation key moves focus to (WAI-ARIA APG date grid), or null. */
function getKeyTarget(event: KeyboardEvent, date: Date, weekStartsOn: number): Date | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  switch (event.key) {
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
      return addMonths(date, event.shiftKey ? -12 : -1);
    case "PageDown":
      return addMonths(date, event.shiftKey ? 12 : 1);
    default:
      return null;
  }
}

type CalendarCell = { key: string; date: Date | null };

function buildWeekRows(
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

function isDateOutOfRange(date: Date, min?: Date, max?: Date): boolean {
  const d = startOfDay(date);
  if (d < FIRST_DAY) return true;
  if (min && d < startOfDay(min)) return true;
  if (max && d > startOfDay(max)) return true;
  return false;
}

export function Calendar({
  value,
  defaultValue,
  onValueChange,
  month,
  onMonthChange,
  isDateDisabled,
  min,
  max,
  weekStartsOn = 0,
  showOutsideDays = false,
  labels,
  className,
}: CalendarProps) {
  const names = mergeLabels(DEFAULT_CALENDAR_LABELS, labels);
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null);

  const selectedDate = validDate(isControlled ? value : internalValue);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Year and month live in one state, so a move to another month is one update.
  const [internalView, setInternalView] = useState(() => monthOf(selectedDate ?? today));
  const isMonthControlled = month !== undefined;
  const view = isMonthControlled
    ? monthOf(validDate(month) ?? selectedDate ?? today)
    : internalView;
  const { year: viewYear, month: viewMonth } = view;

  // Show the month of a controlled value when it moves to another day. Keyed by the day, not
  // the Date object: an inline `value={new Date()}` is a new object on every render. A controlled
  // `month` stays where the parent puts it.
  const controlledDay = isControlled && selectedDate ? startOfDay(selectedDate).getTime() : null;
  useEffect(() => {
    if (controlledDay === null || isMonthControlled) return;
    const next = monthOf(new Date(controlledDay));
    setInternalView((v) => (isSameMonth(v, next) ? v : next));
  }, [controlledDay, isMonthControlled]);

  // The month on screen after the last commit, which the key handler reads after a flushSync
  const shownMonthRef = useRef(view);
  useLayoutEffect(() => {
    shownMonthRef.current = view;
  });

  // Roving tabindex: the last focused day, if still in view, keeps the grid's single tab stop.
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  // A key that left a controlled `month` the parent has not changed yet: the day it moved to, and
  // the month it left. A parent that sets `month` later, in a transition or a timeout, removes the
  // focused day, so focus then moves to the new grid: to that day, if it is in view.
  const [pendingFocus, setPendingFocus] = useState<{ target: Date; from: YearMonth } | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const isInView = (date: Date | null): date is Date =>
    date !== null && date.getFullYear() === viewYear && date.getMonth() === viewMonth;
  const tabStop =
    [pendingFocus?.target ?? null, focusedDate, selectedDate, today].find(isInView) ??
    createDate(viewYear, viewMonth, 1);

  useLayoutEffect(() => {
    if (!pendingFocus || isSameMonth(pendingFocus.from, { year: viewYear, month: viewMonth })) {
      return;
    }
    setPendingFocus(null);
    // Unless the user has moved focus out of the grid in the meantime. Focus on the body was on
    // the removed day.
    const grid = gridRef.current;
    const active = grid?.ownerDocument.activeElement;
    if (grid && (active === grid.ownerDocument.body || grid.contains(active ?? null))) {
      grid.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    }
  }, [pendingFocus, viewYear, viewMonth]);

  const monthYearLabel = names.heading(createDate(viewYear, viewMonth, 1));
  const monthYearLabelId = useId();

  /** Moves the view to the month of `date`, or asks the parent to, with a controlled `month`. */
  const showMonth = (date: Date) => {
    const next = monthOf(date);
    if (!isMonthControlled) setInternalView(next);
    onMonthChange?.(createDate(next.year, next.month, 1));
  };

  const atFirstMonth = viewYear === 1 && viewMonth === 0;
  const prevMonth = () => {
    if (!atFirstMonth) showMonth(createDate(viewYear, viewMonth - 1, 1));
  };
  const nextMonth = () => showMonth(createDate(viewYear, viewMonth + 1, 1));

  const weekRows = useMemo(
    () => buildWeekRows(viewYear, viewMonth, weekStartsOn, showOutsideDays),
    [viewYear, viewMonth, weekStartsOn, showOutsideDays],
  );
  // A date for each column header: the first row of the shown month, outside days included
  const firstOfMonth = createDate(viewYear, viewMonth, 1);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(firstOfMonth, i - weekdayIndex(firstOfMonth, weekStartsOn)),
  );

  const handleDayClick = (date: Date) => {
    if (!isControlled) {
      setInternalValue(date);
    }
    if (!isInView(date)) showMonth(date);
    onValueChange?.(date);
  };

  const isDayDisabled = useCallback(
    (date: Date): boolean => {
      if (isDateOutOfRange(date, min, max)) return true;
      if (isDateDisabled?.(date)) return true;
      return false;
    },
    [isDateDisabled, min, max],
  );

  const handleDayKeyDown = (event: KeyboardEvent, date: Date) => {
    const target = getKeyTarget(event, date, weekStartsOn);
    if (!target) return;
    event.preventDefault();
    if (target < FIRST_DAY) return;
    const before = shownMonthRef.current;
    // Render the target's month synchronously so its button exists before it takes focus. A
    // parent that sets `month` in onMonthChange renders in the same flush. A new key replaces a
    // pending focus move.
    if (!isInView(target)) {
      flushSync(() => {
        setPendingFocus(null);
        showMonth(target);
      });
    }
    const shown = shownMonthRef.current;
    if (isSameMonth(shown, monthOf(target))) {
      flushSync(() => {
        setPendingFocus(null);
        setFocusedDate(target);
      });
    } else if (isSameMonth(shown, before)) {
      // The parent kept a controlled `month`, for now: focus stays on the day it is on
      setPendingFocus({ target, from: before });
      return;
    }
    // The target's day, or the tab stop of another month the parent showed, whose grid no
    // longer has the focused day
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  };

  return (
    <div className={cn("w-fit p-3", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label={names.previousMonth}
          aria-disabled={atFirstMonth || undefined}
          onClick={prevMonth}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-sm",
            "micro-interactions text-foreground/70",
            "focus-visible:outline-2 focus-visible:outline-ring",
            atFirstMonth
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span id={monthYearLabelId} className="font-medium text-sm">
          {monthYearLabel}
        </span>
        <button
          type="button"
          aria-label={names.nextMonth}
          onClick={nextMonth}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-sm",
            "micro-interactions text-foreground/70",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-2 focus-visible:outline-ring",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day grid */}
      <table
        ref={gridRef}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA in HTML allows role="grid" on <table>, as in the APG date picker
        role="grid"
        aria-labelledby={monthYearLabelId}
        className="border-collapse"
      >
        <thead>
          <tr>
            {weekdays.map((date) => (
              <th
                key={date.getDay()}
                scope="col"
                className="w-8 py-1 text-center font-normal text-muted-foreground text-xs"
              >
                {names.weekday(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekRows.map((week) => {
            const rowKey = week.find((c) => c.date !== null)?.key ?? week[0]?.key ?? "empty";
            return (
              <tr key={rowKey}>
                {week.map(({ key, date }) => {
                  if (date === null) {
                    return <td key={key} aria-hidden="true" className="p-0.5" />;
                  }

                  const isToday = isSameDay(date, today);
                  const isSelected = selectedDate !== null && isSameDay(date, selectedDate);
                  const isCurrentMonth = date.getMonth() === viewMonth;
                  const disabled = isDayDisabled(date);

                  const ariaLabel = names.day(date);

                  return (
                    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a <td> in a role="grid" table is a gridcell, which supports aria-selected
                    <td key={key} aria-selected={isSelected || undefined} className="p-0.5">
                      <button
                        type="button"
                        aria-label={ariaLabel}
                        aria-current={isToday ? "date" : undefined}
                        aria-disabled={disabled || undefined}
                        data-selected={isSelected || undefined}
                        tabIndex={isSameDay(date, tabStop) ? 0 : -1}
                        onClick={disabled ? undefined : () => handleDayClick(date)}
                        onFocus={() => setFocusedDate(date)}
                        onKeyDown={(event) => handleDayKeyDown(event, date)}
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-md text-sm",
                          "micro-interactions focus-visible:outline-2 focus-visible:outline-ring",
                          !isSelected && !isToday && "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-primary text-primary-foreground",
                          isToday &&
                            !isSelected &&
                            "font-medium text-primary-text ring-1 ring-primary",
                          // Forced colours replace the muted colour, so name the system's dimmed one
                          !isCurrentMonth &&
                            !isSelected &&
                            "text-muted-foreground forced-colors:text-[GrayText]",
                          disabled && "pointer-events-none opacity-40",
                        )}
                      >
                        {date.getDate()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { cn } from "../../lib/cn";

export type CalendarProps = {
  /** Controlled selected date. */
  value?: Date | null;
  /** Initial selected date for uncontrolled usage. */
  defaultValue?: Date | null;
  /** Called when the selected date changes. */
  onValueChange?: (date: Date | null) => void;
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Same day `months` later, clamped to the target month's length (Mar 31 − 1 month = Feb 28). */
function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), daysInMonth));
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
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = weekdayIndex(firstDay, weekStartsOn);
  const totalDays = lastDay.getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i++) {
    const date = new Date(year, month, i - startPad + 1);
    cells.push({ key: date.toISOString(), date: showOutsideDays ? date : null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    cells.push({ key: date.toISOString(), date });
  }
  // Pad to complete the last row
  for (let d = 1; cells.length % 7 !== 0; d++) {
    const date = new Date(year, month + 1, d);
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
  if (min && d < startOfDay(min)) return true;
  if (max && d > startOfDay(max)) return true;
  return false;
}

export function Calendar({
  value,
  defaultValue,
  onValueChange,
  isDateDisabled,
  min,
  max,
  weekStartsOn = 0,
  showOutsideDays = false,
  className,
}: CalendarProps) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null);

  const selectedDate = isControlled ? (value ?? null) : internalValue;

  const initialViewDate = selectedDate ?? new Date();
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  // Sync visible month when controlled value changes to a different month
  useEffect(() => {
    if (isControlled && value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [isControlled, value]);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Roving tabindex: the last focused day, if still in view, keeps the grid's single tab stop.
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const isInView = (date: Date | null): date is Date =>
    date !== null && date.getFullYear() === viewYear && date.getMonth() === viewMonth;
  const tabStop =
    [focusedDate, selectedDate, today].find(isInView) ?? new Date(viewYear, viewMonth, 1);

  const monthYearLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  const monthYearLabelId = useId();

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const weekRows = useMemo(
    () => buildWeekRows(viewYear, viewMonth, weekStartsOn, showOutsideDays),
    [viewYear, viewMonth, weekStartsOn, showOutsideDays],
  );
  const dayNames = [...DAY_NAMES.slice(weekStartsOn), ...DAY_NAMES.slice(0, weekStartsOn)];

  const handleDayClick = useCallback(
    (date: Date) => {
      if (!isControlled) {
        setInternalValue(date);
      }
      if (date.getMonth() !== viewMonth || date.getFullYear() !== viewYear) {
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth());
      }
      onValueChange?.(date);
    },
    [isControlled, onValueChange, viewMonth, viewYear],
  );

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
    // Render the target's month synchronously so its button exists before it takes focus.
    flushSync(() => {
      setFocusedDate(target);
      setViewYear(target.getFullYear());
      setViewMonth(target.getMonth());
    });
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  };

  return (
    <div className={cn("w-fit p-3", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={prevMonth}
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span id={monthYearLabelId} className="font-medium text-sm">
          {monthYearLabel}
        </span>
        <button
          type="button"
          aria-label="Next month"
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
            {dayNames.map((d) => (
              <th
                key={d}
                scope="col"
                className="w-8 py-1 text-center font-normal text-muted-foreground text-xs"
              >
                {d}
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
                  const isSelected =
                    selectedDate !== null &&
                    selectedDate !== undefined &&
                    isSameDay(date, selectedDate);
                  const isCurrentMonth = date.getMonth() === viewMonth;
                  const disabled = isDayDisabled(date);

                  const ariaLabel = date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

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
                          isToday && !isSelected && "font-medium text-primary ring-1 ring-primary",
                          !isCurrentMonth && !isSelected && "text-muted-foreground opacity-50",
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

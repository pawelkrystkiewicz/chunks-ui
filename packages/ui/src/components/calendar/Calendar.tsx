"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";

export type CalendarProps = {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
  /** Dates to disable — return true to disable a given date */
  isDateDisabled?: (date: Date) => boolean;
  /** Minimum selectable date */
  min?: Date;
  /** Maximum selectable date */
  max?: Date;
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

type CalendarCell = { key: string; date: Date | null };

function buildWeekRows(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0 = Sunday
  const totalDays = lastDay.getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ key: `before-${i}`, date: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    cells.push({ key: date.toISOString(), date });
  }
  // Pad to complete the last row
  let afterIndex = 0;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `after-${afterIndex++}`, date: null });
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
  className,
}: CalendarProps) {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null);

  const selectedDate = isControlled ? (value ?? null) : internalValue;

  const initialViewDate = selectedDate ?? new Date();
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  const today = useMemo(() => startOfDay(new Date()), []);

  const monthYearLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

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

  const weekRows = useMemo(() => buildWeekRows(viewYear, viewMonth), [viewYear, viewMonth]);

  const handleDayClick = useCallback(
    (date: Date) => {
      if (!isControlled) {
        setInternalValue(date);
      }
      onValueChange?.(date);
    },
    [isControlled, onValueChange],
  );

  const isDayDisabled = useCallback(
    (date: Date): boolean => {
      if (isDateOutOfRange(date, min, max)) return true;
      if (isDateDisabled?.(date)) return true;
      return false;
    },
    [isDateDisabled, min, max],
  );

  return (
    <div className={cn("w-fit p-3", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={prevMonth}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded",
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
        <span className="font-medium text-sm">{monthYearLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={nextMonth}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded",
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
      <table className="border-collapse">
        <thead>
          <tr>
            {DAY_NAMES.map((d) => (
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
                    <td key={key} className="p-0.5">
                      <button
                        type="button"
                        aria-label={ariaLabel}
                        aria-current={isToday ? "date" : undefined}
                        data-selected={isSelected || undefined}
                        disabled={disabled}
                        onClick={() => handleDayClick(date)}
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded text-sm",
                          "micro-interactions focus-visible:outline-2 focus-visible:outline-ring",
                          !isSelected && !isToday && "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-primary text-primary-foreground",
                          isToday && !isSelected && "font-medium text-primary ring-1 ring-primary",
                          !isCurrentMonth && "text-muted-foreground opacity-50",
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

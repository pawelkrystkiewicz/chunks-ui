import { type CalendarLabels, DEFAULT_CALENDAR_LABELS } from "../calendar/Calendar.Labels";

/**
 * The built-in English strings of `DatePicker`: those of its trigger and of its calendar. A React
 * Server Component can't pass the functions to `DatePicker`, a client component.
 */
export type DatePickerLabels = CalendarLabels & {
  /**
   * Trigger text while no date is selected. The `placeholder` prop takes precedence.
   * @default "Pick a date"
   */
  placeholder: string;
  /**
   * Trigger text for the selected date. Gets a picked date at local midnight, and `value` as you
   * pass it: format it in the local time zone, not with `timeZone: "UTC"`.
   * @default (date) => "March 15, 2026"
   */
  selectedDate: (date: Date) => string;
};

export const DEFAULT_DATE_PICKER_LABELS: Readonly<DatePickerLabels> = {
  ...DEFAULT_CALENDAR_LABELS,
  placeholder: "Pick a date",
  selectedDate: (date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
};

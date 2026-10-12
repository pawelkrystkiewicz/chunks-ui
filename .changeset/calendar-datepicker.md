---
"chunks-ui": patch
---

Fixed: a controlled `Calendar` went back to the month of `value` whenever its parent re-rendered with a new `Date` object for the same day, for example an inline `value={new Date()}`, which undid the user's month navigation. It now follows `value` only when the day changes.

Fixed: `DatePicker` submitted years before 1000 with fewer than 4 digits (`999-01-05`), which is not an ISO date. It now submits `0999-01-05`. `Calendar` showed the days of 1900–1999 for the years 0–99, which the `Date` constructor reads as 19xx; it now shows the right year.

Fixed: an Invalid Date in `value` or `defaultValue` showed "Invalid Date" in the `DatePicker` trigger, submitted `NaN-NaN-NaN`, and left the calendar without days. It now counts as no date.

Fixed: a required, empty `DatePicker` inside `Field.Root` was never `valueMissing` in the field's validity, because the field read the validity of the trigger button, which cannot be required. The field now validates the form input that carries `required`, so Base UI's `Form` blocks the submit, `Field.Error` with `match="valueMissing"` shows, and the trigger gets `aria-invalid` and the focus.

Fixed: resetting the form left an uncontrolled `DatePicker` on the date the user picked. A form reset now restores `defaultValue`, or no date, also for a picker linked to its form by `form`. A controlled picker keeps `value`.

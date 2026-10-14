---
"chunks-ui": patch
---

Fixed: a controlled `Calendar` went back to the month of `value` whenever its parent re-rendered with a new `Date` object for the same day, for example an inline `value={new Date()}`, which undid the user's month navigation. It now follows `value` only when the day changes.

Fixed: `Calendar` showed the days of 1900–1999 for the years 1–99, which the `Date` constructor reads as 19xx; it now shows the right year. The calendar stops at January of year 1: the month buttons and the keyboard do not go to earlier dates, which have no 4-digit ISO form, and a `value` or `defaultValue` before year 1 counts as no date. Years 1–99 work.

Fixed: an Invalid Date in `value` or `defaultValue` showed "Invalid Date" in the `DatePicker` trigger and left the calendar without days. It now counts as no date.

Fixed: resetting the form left an uncontrolled `DatePicker` on the date the user picked. A form reset, also in a form inside a shadow root, now restores `defaultValue`, or no date. This holds for a picker that `form` links to a form too, with or without `name` or `required`, and when that form mounts after the picker or remounts. A reset that `onReset` cancels leaves the picker as it is. A controlled picker keeps `value`.

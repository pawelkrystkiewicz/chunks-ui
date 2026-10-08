---
"chunks-ui": minor
---

`Calendar` (and the calendar inside `DatePicker`) now supports keyboard navigation. The day grid has one Tab stop: the selected day, else today, else the 1st of the month. Arrow keys move by day and week, Home and End go to the start and end of the week (following `weekStartsOn`), PageUp and PageDown change the month, and Shift+PageUp and Shift+PageDown change the year. Moving past the shown month changes the view. Enter and Space select the focused day.

Disabled days (`min`, `max`, `isDateDisabled`) now use `aria-disabled` instead of the `disabled` attribute, so the keyboard can reach them and screen readers announce them as unavailable. They still cannot be selected. If your tests check these days with `toBeDisabled()`, check `aria-disabled="true"` instead.

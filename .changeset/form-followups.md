---
"chunks-ui": minor
---

`Calendar` can take the shown month as a controlled prop: `month`, any date in that month, and `onMonthChange`, which gets the first day of the month the user moves to with the arrows, the keys or a click on an outside day. With `month`, the view waits for a new `month`, and a new `value` no longer moves it. A key that leaves the month keeps focus in the grid when the parent shows another month, or sets `month` later. Without `month`, `onMonthChange` reports the user's moves. `DatePicker` passes both props to its calendar.

`DatePicker` registers its `name` with `Field.Root`, so the `errors` of a Base UI `Form` show on the picker and its `onFormSubmit` values include the date.

---
"chunks-ui": minor
---

Added: `DatePicker` takes `open`, `defaultOpen` and `onOpenChange`, with the names and the `onOpenChange(open, eventDetails)` signature of Base UI's `Popover.Root`, so you can open the calendar from another control, open it on mount, or follow it opening and closing. A trigger press, a pick, Escape, an outside press and focus leaving the calendar (`focus-out`) call `onOpenChange` with Base UI's event details; a pick closes the calendar with the reason `close-press`. A controlled calendar opens and closes only when you change `open`. Without `open`, `eventDetails.cancel()` keeps the calendar as it is. However the calendar opened, a pick or Escape that closes it returns focus to the trigger if focus is still in the calendar. A disabled picker (its `disabled` prop, a disabled `Field.Root` or `Fieldset`, or a `<fieldset disabled>`) stays closed whatever `open` says, and ignores a pick.

---
"chunks-ui": minor
---

Added: `DatePicker` takes `open`, `defaultOpen` and `onOpenChange`, with the names and the `onOpenChange(open, eventDetails)` signature of Base UI's `Popover.Root`, so you can open the calendar from another control, open it on mount, or follow it opening and closing. A pick closes the calendar with the reason `close-press`. A Tab pressed while the calendar closes after a pick or Escape can make Base UI call `onOpenChange` again, with the reason `focus-out`. A disabled picker (its `disabled` prop, a disabled `Field.Root`, Base UI's `Fieldset` or a `<fieldset disabled>`) stays closed whatever `open` says, and ignores a pick. The `disabled` prop takes effect at once; the others take effect when the picker next renders, but a pick is ignored at once. See "Open State" in the DatePicker docs.

Changed: a `DatePicker` that is disabled while its calendar is open now closes the calendar, without calling `onOpenChange`, and ignores a pick. In 0.2.0 the calendar stayed open, and a pick changed the value.

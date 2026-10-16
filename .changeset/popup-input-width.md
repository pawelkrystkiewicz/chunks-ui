---
"chunks-ui": patch
---

Fixed: a `Select` popup is as wide as its trigger, both over the trigger (Base UI's default `alignItemWithTrigger`) and below it. Before, it shrank to its longest item, so a full-width trigger opened a narrow popup. A `DatePicker` popup is at least as wide as its trigger, with the calendar in its centre; below the calendar's own width, the popup keeps that width. In `Select` and `Combobox`, a word longer than the popup now breaks onto the next line (`wrap-anywhere` on the item) instead of running past the popup's edge. To size a `Select` popup by its items again, pass `w-auto` in `Select.Positioner`'s `className`.

---
"chunks-ui": patch
---

Fixed: a `Select` popup is as wide as its trigger, both over the trigger (Base UI's default `alignItemWithTrigger`) and below it. Before, it shrank to its longest item, so a full-width trigger opened a narrow popup. A `DatePicker` popup is at least as wide as its trigger, with the calendar in its centre; below the calendar's own width, the popup keeps that width. In `Combobox`, a word longer than the popup now breaks onto the next line instead of running past its edge; `Select` items wrap the same way at the trigger's width, in `Select.ItemText`. For a trigger sized by its value, pass `w-auto min-w-[var(--anchor-width)]` in `Select.Positioner`'s `className`; bare `w-auto` sizes the popup by its items. Set a width on `Select.Positioner`, not on `Select.Popup`: a width on the popup spills out of the positioner, and Floating UI's collision handling measures the positioner.

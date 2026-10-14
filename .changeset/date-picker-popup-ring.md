---
"chunks-ui": patch
---

Fixed: when the `DatePicker` popup itself had keyboard focus, it showed the browser's default outline. It now draws the library focus ring, as `Popover.Content` does, and transitions only its opening fade and scale.

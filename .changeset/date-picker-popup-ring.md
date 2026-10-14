---
"chunks-ui": patch
---

Fixed: when the `DatePicker` popup itself had keyboard focus, for example after a click on its padding followed by a key press, it showed the browser's default outline. It now draws the library focus ring, as `Popover.Content` does: 2px of `--ring`, 2px outside its edge, shown at once. The popup now transitions only its opening fade and scale, instead of every property.

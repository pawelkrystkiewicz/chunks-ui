---
"chunks-ui": patch
---

Fixed: when the `DatePicker` popup itself took keyboard focus (its `initialFocus` found no day to open on), it showed the browser's default outline. It now draws the library focus ring, as `Popover.Content` does: 2px of `--ring`, 2px outside its edge, shown at once. The popup now transitions only its opening fade and scale, instead of every property.

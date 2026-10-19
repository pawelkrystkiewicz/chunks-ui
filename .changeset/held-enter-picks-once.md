---
"chunks-ui": patch
---

Fixed: in Chrome and other Chromium browsers, holding Enter on a `DatePicker` day or a `Popover.Close` button could activate it twice. The key's first repeat, when it came while the popup was closing, clicked the same button again after focus had moved to the trigger, so `onValueChange` or the button's `onClick` ran a second time. That repeat no longer acts inside the closing popup.

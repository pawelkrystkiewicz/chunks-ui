---
"chunks-ui": patch
---

Fixed: `Popover` and `DatePicker` report a close once. Base UI closed a popup that was already closing when focus left the trigger during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`.

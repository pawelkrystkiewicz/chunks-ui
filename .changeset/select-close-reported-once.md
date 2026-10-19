---
"chunks-ui": patch
---

Fixed: `Select` reports a close once. Base UI closed a popup that was already closing when focus left during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`.

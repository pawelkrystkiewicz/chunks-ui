---
"chunks-ui": patch
---

Fixed: `Select` reports a close once. Base UI closed a popup that was already closing when focus left the trigger during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`. Also, after a quick click or tap opened the `Select`, the next press outside it no longer reports an extra close with reason `"cancel-open"`.

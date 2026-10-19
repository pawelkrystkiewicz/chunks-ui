---
"chunks-ui": patch
---

Fixed: `Select` reports a close once. Base UI closed a popup that was already closing when focus left the trigger during the exit, so `onOpenChange(false)` fired a second time, with reason `"focus-out"`. It also keeps a consumer's `preventUnmountOnClose()` choice when Base UI re-sends the close for a popup that is kept mounted.

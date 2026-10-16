---
"chunks-ui": patch
---

Changed: `ToggleGroup` and `Tabs` indicators share one resize observer per box, so a resize reaching many of them costs at most one synchronous render per box per frame instead of one per group.

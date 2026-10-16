---
"chunks-ui": patch
---

Changed: all `ToggleGroup` and `Tabs` indicators on a page share one resize observer per box (border-box, content-box), so a resize that reaches many of them costs at most one synchronous render per box per frame for all groups, instead of one per group.

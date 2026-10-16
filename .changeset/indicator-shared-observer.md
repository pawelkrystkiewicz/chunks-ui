---
"chunks-ui": patch
---

Changed: all `ToggleGroup` and `Tabs` indicators on a page share one resize observer, so a resize that reaches many of them costs one synchronous render per frame instead of one per group. A `Tabs` selection measures the tabs again with one notification instead of two.
